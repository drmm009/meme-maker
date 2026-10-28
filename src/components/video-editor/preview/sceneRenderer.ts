// The preview's scene, drawn offscreen at any moment, for the frame-by-frame export. It builds the
// same Konva nodes as CanvasPreview from the same shared pieces (mediaAttrs, textLayer, applyMotion,
// frameEffects, GIF frames, text animation, grid lines), in the same 800-wide stage units, and
// scales the stage to the output size. renderAt(ms) seeks every video and draws that moment into
// `canvas`.
import Konva from 'konva';
import type { Clip, ImageClip, LayoutSlot, StickerClip, TextClip, VideoClip } from '../../../model/videoProject';
import { drawOrder } from '../../../utils/layerOrder';
import { gridLines } from '../../../utils/gridLines';
import { hasTextBox, textAttrs, textBoxAttrs } from '../../../utils/textLayer';
import { REST_FRAME, applyTextFrame, textAnimFrame } from '../../../utils/textAnimation';
import { decodeGif, isGifUrl } from '../../../utils/gif';
import { STAGE_WIDTH, isOnScreen, mediaAttrs, videoTimeSec } from './previewMath';
import { applyMotion } from './nodeMotion';
import { effectsFor, hasEffects, processFrame } from './frameEffects';
import type { EffectCanvases, FrameEffects } from './frameEffects';
import { drawGifFrame } from './useGifFrames';

export interface SceneOptions {
  items: Clip[];
  // Output size in pixels.
  width: number;
  height: number;
  aspect: number;
  backgroundColor?: string;
  layoutId?: string | null;
  layoutSlots?: LayoutSlot[];
}

export interface SceneRenderer {
  // The canvas each rendered frame is drawn into (width x height).
  canvas: HTMLCanvasElement;
  renderAt(ms: number): Promise<void>;
  destroy(): void;
}

interface Gif {
  frames: ImageBitmap[];
  durations: number[];
  canvas: HTMLCanvasElement;
  index: number;
}

interface MediaEntry {
  item: VideoClip | ImageClip | StickerClip;
  node: Konva.Image;
  video?: HTMLVideoElement;
  gif?: Gif | null;
  effects: FrameEffects;
  canvases: EffectCanvases;
}

interface TextEntry {
  item: TextClip;
  group: Konva.Group;
  text: Konva.Text;
}

const SEEK_TIMEOUT_MS = 4000;

// Resolves once `el` fires one of `events` (or rejects on `error` / after a timeout).
const once = (el: HTMLElement, events: string[], timeoutMs: number, what: string) => new Promise<void>((resolve, reject) => {
  const done = (fn: () => void) => () => { clearTimeout(timer); events.forEach((e) => el.removeEventListener(e, ok)); el.removeEventListener('error', fail); fn(); };
  const ok = done(resolve);
  const fail = done(() => reject(new Error(`${what} failed to load`)));
  const timer = setTimeout(done(() => reject(new Error(`${what} timed out`))), timeoutMs);
  events.forEach((e) => el.addEventListener(e, ok));
  el.addEventListener('error', fail);
});

const needsCors = (url: string) => !url.startsWith('blob:') && !url.startsWith('data:');

const loadImage = async (url: string): Promise<HTMLImageElement> => {
  const img = new Image();
  if (needsCors(url)) img.crossOrigin = 'anonymous';
  const loaded = once(img, ['load'], 20000, 'An image');
  img.src = url;
  await loaded;
  return img;
};

const loadVideo = async (url: string): Promise<HTMLVideoElement> => {
  const video = document.createElement('video');
  if (needsCors(url)) video.crossOrigin = 'anonymous';
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  const loaded = once(video, ['loadeddata'], 30000, 'A video');
  video.src = url;
  await loaded;
  return video;
};

// Shows the video's frame at `sec` (clamped to its length).
const seekTo = async (video: HTMLVideoElement, sec: number) => {
  const end = Number.isFinite(video.duration) ? Math.max(0, video.duration - 0.001) : sec;
  const target = Math.min(Math.max(0, sec), end);
  if (Math.abs(video.currentTime - target) < 0.0005) return;
  const seeked = once(video, ['seeked'], SEEK_TIMEOUT_MS, 'Seeking a video');
  video.currentTime = target;
  await seeked;
};

export async function createSceneRenderer({ items, width, height, aspect, backgroundColor, layoutId, layoutSlots = [] }: SceneOptions): Promise<SceneRenderer> {
  const stageHeight = STAGE_WIDTH / aspect;
  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;left:-99999px;top:0;';
  document.body.appendChild(container);
  const stage = new Konva.Stage({ container, width, height, listening: false });
  stage.scale({ x: width / STAGE_WIDTH, y: width / STAGE_WIDTH });
  const layer = new Konva.Layer({ listening: false });
  stage.add(layer);
  // One canvas pixel per output pixel, whatever the screen's density.
  layer.getCanvas().setPixelRatio(1);
  layer.add(new Konva.Rect({ x: 0, y: 0, width: STAGE_WIDTH, height: stageHeight, fill: backgroundColor || '#ffffff' }));

  const media: MediaEntry[] = [];
  const texts: TextEntry[] = [];
  const cleanup = () => {
    for (const m of media) {
      if (m.video) { m.video.pause(); m.video.removeAttribute('src'); m.video.load(); }
      m.gif?.frames.forEach((f) => f.close());
    }
    stage.destroy();
    container.remove();
  };

  try {
    for (const item of drawOrder(items)) {
      // Hidden clips never show (transitions still see them, through `items`).
      if (item.hidden) continue;
      if (item.type === 'text') {
        const group = new Konva.Group();
        const text = new Konva.Text(textAttrs(item));
        if (hasTextBox(item)) {
          group.add(new Konva.Rect(textBoxAttrs(item, { x: text.x(), y: text.y(), width: text.width(), height: text.height() })));
        }
        group.add(text);
        layer.add(group);
        texts.push({ item, group, text });
        continue;
      }
      if (item.type === 'audio' || !item.url) continue;
      const node = new Konva.Image({ ...mediaAttrs(item), image: undefined });
      layer.add(node);
      const entry: MediaEntry = { item, node, effects: effectsFor(item), canvases: { canvas: null, scratch: null } };
      if (item.type === 'video') {
        entry.video = await loadVideo(item.url);
        node.image(entry.video);
      } else if (item.type === 'sticker' && (item.isGif || isGifUrl(item.url))) {
        const gif = await decodeGif(item.url).catch(() => null);
        if (gif) {
          const canvas = document.createElement('canvas');
          canvas.width = gif.width;
          canvas.height = gif.height;
          entry.gif = { ...gif, canvas, index: -1 };
          node.image(canvas);
        } else {
          node.image(await loadImage(item.url));
        }
      } else {
        const img = await loadImage(item.url);
        // Photos with a filter are processed once.
        const { ok } = hasEffects(entry.effects) ? processFrame(img, entry.effects, entry.canvases) : { ok: false };
        node.image(ok && entry.canvases.canvas ? entry.canvases.canvas : img);
      }
      media.push(entry);
    }

    if (layoutId === 'custom-grid') {
      for (const s of layoutSlots) layer.add(new Konva.Rect({ ...s, stroke: '#000000', strokeWidth: 4 }));
    } else if (layoutId && layoutId !== '1-panel') {
      for (const points of gridLines(layoutId, STAGE_WIDTH, stageHeight)) layer.add(new Konva.Line({ points, stroke: '#000000', strokeWidth: 4 }));
    }
  } catch (e) {
    cleanup();
    throw e;
  }

  const state = { items, playhead: 0 };

  return {
    canvas: layer.getNativeCanvasElement(),

    async renderAt(ms) {
      state.playhead = ms;
      for (const m of media) {
        const visible = isOnScreen(m.item, ms);
        m.node.visible(visible);
        if (!visible) continue;
        if (m.video) {
          await seekTo(m.video, videoTimeSec(m.item as VideoClip, ms));
          if (hasEffects(m.effects)) {
            const { ok, sampledKey } = processFrame(m.video, m.effects, m.canvases);
            if (sampledKey) m.effects = { ...m.effects, chromaKey: sampledKey };
            m.node.image(ok && m.canvases.canvas ? m.canvases.canvas : m.video);
          }
        }
        if (m.gif) drawGifFrame(m.gif, ms, m.item);
        if (m.item.type === 'video' || (m.item.type === 'image' && m.item.isFreeze)) applyMotion(m.node, m.item, state);
      }
      for (const t of texts) {
        const visible = isOnScreen(t.item, ms);
        t.group.visible(visible);
        if (visible) applyTextFrame(t.group, t.text, t.item.animation ? textAnimFrame(t.item, ms - t.item.startMs) : REST_FRAME);
      }
      layer.draw();
    },

    destroy: cleanup,
  };
}
