// Green screen, background removal, colour filters and effects (utils/clipFx) for videos, drawn through an offscreen
// canvas: keying first, then the background, then filtering (the FFmpeg export keys and filters in
// the same order; it can't remove backgrounds). Shared by the live preview (useFrameEffects) and the
// frame-by-frame export (sceneRenderer).
import type { ChromaKey, Clip } from '../../../model/videoProject';
import { applyChromaKey, sampleKeyColor, suggestTolerance } from '../../../utils/chromaKey';
import { filterCss, resolveFilter } from '../../../utils/clipFilters';
import { applyClipFx, isClipFx } from '../../../utils/clipFx';
import type { ClipFxId } from '../../../utils/clipFx';
import { loadPersonSegmenter, personSegmenterReady, removeBackground } from '../../../utils/personSegmenter';
import type { CutoutHolder, PersonCutout } from '../../../utils/personSegmenter';
import { effectCanvasSize } from './previewMath';

export interface FrameEffects {
  chromaKey: ChromaKey | null;
  // Background removal (people kept).
  cutout: PersonCutout | null;
  // A CSS filter string, or '' for none.
  css: string;
  // An effect drawn over the filtered frame (utils/clipFx), or null.
  fx: ClipFxId | null;
}

// The canvases a clip's processed frames are drawn into (created on first use), and what
// background removal keeps between frames.
export interface EffectCanvases {
  canvas: HTMLCanvasElement | null;
  scratch: HTMLCanvasElement | null;
  cutout?: CutoutHolder;
  // The effect's own scratch canvas.
  fx?: HTMLCanvasElement | null;
}

export const effectsFor = (item: Clip): FrameEffects => ({
  chromaKey: item.type === 'video' && item.chromaKey ? item.chromaKey : null,
  cutout: item.type === 'video' && item.bgRemoval ? item.bgRemoval : null,
  // A photo's filter is the image editor's, drawn into its picture (utils/photoLook).
  css: item.type === 'video' ? filterCss(resolveFilter(item.filter)) : '',
  fx: item.type === 'video' && isClipFx(item.filter?.fx) ? item.filter.fx : null,
});

export const hasEffects = (effects: FrameEffects): boolean => Boolean(effects.chromaKey || effects.cutout || effects.css || effects.fx);

type FrameSource = HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;

// Draws the source's current frame with its effects into canvases.canvas. `ok` is false if there
// is nothing to do or it couldn't (e.g. a cross-origin video that can't be read back). With a key
// colour of 'auto', the screen colour is sampled from this frame and returned as `sampledKey`.
// Background removal waits for its model, which starts loading here (the frame shows as it is
// until then).
export function processFrame(src: FrameSource | null | undefined, effects: FrameEffects, canvases: EffectCanvases): { ok: boolean; sampledKey?: ChromaKey } {
  const { chromaKey, css, fx } = effects;
  if (effects.cutout && !personSegmenterReady()) loadPersonSegmenter().catch(() => {});
  const cutout = effects.cutout && personSegmenterReady() ? effects.cutout : null;
  const video = src as HTMLVideoElement | null | undefined;
  const image = src as HTMLImageElement | null | undefined;
  const sw = video?.videoWidth || image?.naturalWidth || 0;
  const sh = video?.videoHeight || image?.naturalHeight || 0;
  if ((!chromaKey && !cutout && !css && !fx) || !src || !sw) return { ok: false };
  // Where the footage is, for effects that move (a video's own time; a still's is 0).
  const ms = (video?.currentTime || 0) * 1000;
  const { width: w, height: h } = effectCanvasSize(sw, sh, Boolean(video?.videoWidth));
  const canvas = canvases.canvas || (canvases.canvas = document.createElement('canvas'));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { ok: false };
  try {
    ctx.filter = 'none';
    ctx.clearRect(0, 0, w, h);
    if (!chromaKey && !cutout) {
      ctx.filter = css || 'none';
      ctx.drawImage(src, 0, 0, w, h);
      ctx.filter = 'none';
      if (fx) applyClipFx(ctx, w, h, fx, ms, canvases);
      return { ok: true };
    }
    ctx.drawImage(src, 0, 0, w, h);
    let sampledKey: ChromaKey | undefined;
    if (chromaKey) {
      const frame = ctx.getImageData(0, 0, w, h);
      let key = chromaKey;
      if (key.color === 'auto') {
        // First keyed frame: pick the actual screen colour from the corners and tune the tolerances to it.
        const color = sampleKeyColor(frame.data, w, h);
        key = sampledKey = { ...key, color, ...suggestTolerance(color) };
      }
      applyChromaKey(frame.data, key);
      ctx.putImageData(frame, 0, 0);
    }
    // The model looks at the frame as it came, not the keyed one.
    if (cutout) removeBackground(ctx, src, w, h, cutout, canvases.cutout || (canvases.cutout = {}));
    if (css) {
      // Filter the keyed pixels: copy them aside, then draw them back through the filter.
      const scratch = canvases.scratch || (canvases.scratch = document.createElement('canvas'));
      if (scratch.width !== w || scratch.height !== h) { scratch.width = w; scratch.height = h; }
      const sctx = scratch.getContext('2d');
      if (!sctx) return { ok: false };
      sctx.clearRect(0, 0, w, h);
      sctx.drawImage(canvas, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.filter = css;
      ctx.drawImage(scratch, 0, 0);
      ctx.filter = 'none';
    }
    if (fx) applyClipFx(ctx, w, h, fx, ms, canvases);
    return { ok: true, sampledKey };
  } catch (e) {
    // A cross-origin video without CORS headers can't be read back; show it unkeyed.
    console.warn('[frame effects] could not process this video', e);
    return { ok: false };
  }
}
