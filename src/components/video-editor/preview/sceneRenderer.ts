// The preview's scene, drawn offscreen at any moment, for the frame-by-frame export. It builds the
// same Konva nodes as CanvasPreview from the same shared pieces (mediaAttrs, textLayer, applyMotion,
// frameEffects, GIF frames, text animation, grid lines), in the same 800-wide stage units, and
// scales the stage to the output size. renderAt(ms) seeks every video and draws that moment into
// `canvas`.
import Konva from 'konva';
import type { Clip, ImageClip, LayoutSlot, StickerClip, TextClip, VideoClip } from '../../../model/videoProject';
import { clipOpacity } from '../../../model/videoProject';
import { drawOrder } from '../../../utils/layerOrder';
import { gridLines } from '../../../utils/gridLines';
import { applyTextFrame, loadTextFonts, textBitmap, textImageAttrs } from '../../../utils/textBitmap';
import type { TextBitmap } from '../../../utils/textBitmap';
import { REST_FRAME, textAnimFrame } from '../../../utils/textAnimation';
import { decodeGif, isGifUrl } from '../../../utils/gif';
import { STAGE_WIDTH, isOnScreen, mediaAttrs, videoTimeSec } from './previewMath';
import { applyMotion, applyPunch } from './nodeMotion';
import { clipCrop } from '../../../utils/clipCrop';
import { effectsFor, hasEffects, processFrame } from './frameEffects';
import type { EffectCanvases, FrameEffects } from './frameEffects';
import { drawGifFrame } from './useGifFrames';
import { hasStickerLook, stickerLookImage } from '../../../utils/stickerLook';
import { blurSubjectUrl, hasPhotoPicture, photoNodeAttrs, photoPicture } from '../../../utils/photoLook';

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
  node: Konva.Image;
  whole: TextBitmap;
  chars: number;
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
  // Text pictures at the output's own scale.
  const textScale = width / STAGE_WIDTH;
  await loadTextFonts(items.filter((i): i is TextClip => i.type === 'text'));
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
        const whole = textBitmap(item, textScale);
        const node = new Konva.Image(textImageAttrs(item, whole));
        group.add(node);
        // Its opacity outside the group the animation fades, as in the preview.
        const holder = new Konva.Group({ opacity: clipOpacity(item) });
        holder.add(group);
        layer.add(holder);
        texts.push({ item, group, node, whole, chars: Infinity });
        continue;
      }
      if (item.type === 'audio' || !item.url) continue;
      // A photo's frame is drawn by its node, as in the preview.
      const node = new Konva.Image({ ...mediaAttrs(item), ...(item.type === 'image' ? photoNodeAttrs(item) : {}), image: undefined });
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
        // A sticker's die-cut border and shadow, and a photo's filter and background blur, as in the preview.
        const subjectUrl = item.type === 'image' ? blurSubjectUrl(item) : null;
        const subject = subjectUrl ? await loadImage(subjectUrl).catch(() => null) : null;
        node.image(hasStickerLook(item) ? stickerLookImage(img, item)
          : hasPhotoPicture(item) ? photoPicture(img, item, subject)
            : ok && entry.canvases.canvas ? entry.canvases.canvas : img);
      }
      // Its crop (videos and freeze frames set it each frame, with their zooms).
      applyPunch(node, 1, clipCrop(item));
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
        if (m.item.type === 'video' || (m.item.type === 'image' && (m.item.isFreeze || m.item.motion))) applyMotion(m.node, m.item, state);
      }
      for (const t of texts) {
        const visible = isOnScreen(t.item, ms);
        t.group.visible(visible);
        if (!visible) continue;
        const frame = t.item.animation ? textAnimFrame(t.item, ms - t.item.startMs) : REST_FRAME;
        applyTextFrame(t.group, t.whole, t.node, frame);
        if (frame.chars !== t.chars) {
          t.node.setAttrs(textImageAttrs(t.item, textBitmap(t.item, textScale, frame.chars)));
          t.chars = frame.chars;
        }
      }
      layer.draw();
    },

    destroy: cleanup,
  };
}
