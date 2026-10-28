// Green screen (videos) and colour filters (videos and photos), drawn through an offscreen canvas:
// keying first, then filtering, the same order as the FFmpeg export. Shared by the live preview
// (useFrameEffects) and the frame-by-frame export (sceneRenderer).
import type { ChromaKey, Clip } from '../../../model/videoProject';
import { applyChromaKey, sampleKeyColor, suggestTolerance } from '../../../utils/chromaKey';
import { filterCss, resolveFilter } from '../../../utils/clipFilters';
import { effectCanvasSize } from './previewMath';

export interface FrameEffects {
  chromaKey: ChromaKey | null;
  // A CSS filter string, or '' for none.
  css: string;
}

// The canvases a clip's processed frames are drawn into (created on first use).
export interface EffectCanvases {
  canvas: HTMLCanvasElement | null;
  scratch: HTMLCanvasElement | null;
}

export const effectsFor = (item: Clip): FrameEffects => ({
  chromaKey: item.type === 'video' && item.chromaKey ? item.chromaKey : null,
  css: item.type === 'video' || item.type === 'image' ? filterCss(resolveFilter(item.filter)) : '',
});

export const hasEffects = (effects: FrameEffects): boolean => Boolean(effects.chromaKey || effects.css);

type FrameSource = HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;

// Draws the source's current frame with its effects into canvases.canvas. `ok` is false if there
// is nothing to do or it couldn't (e.g. a cross-origin video that can't be read back). With a key
// colour of 'auto', the screen colour is sampled from this frame and returned as `sampledKey`.
export function processFrame(src: FrameSource | null | undefined, effects: FrameEffects, canvases: EffectCanvases): { ok: boolean; sampledKey?: ChromaKey } {
  const { chromaKey, css } = effects;
  const video = src as HTMLVideoElement | null | undefined;
  const image = src as HTMLImageElement | null | undefined;
  const sw = video?.videoWidth || image?.naturalWidth || 0;
  const sh = video?.videoHeight || image?.naturalHeight || 0;
  if ((!chromaKey && !css) || !src || !sw) return { ok: false };
  const { width: w, height: h } = effectCanvasSize(sw, sh, Boolean(video?.videoWidth));
  const canvas = canvases.canvas || (canvases.canvas = document.createElement('canvas'));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { ok: false };
  try {
    ctx.filter = 'none';
    ctx.clearRect(0, 0, w, h);
    if (!chromaKey) {
      ctx.filter = css;
      ctx.drawImage(src, 0, 0, w, h);
      ctx.filter = 'none';
      return { ok: true };
    }
    ctx.drawImage(src, 0, 0, w, h);
    const frame = ctx.getImageData(0, 0, w, h);
    let key = chromaKey;
    let sampledKey: ChromaKey | undefined;
    if (key.color === 'auto') {
      // First keyed frame: pick the actual screen colour from the corners and tune the tolerances to it.
      const color = sampleKeyColor(frame.data, w, h);
      key = sampledKey = { ...key, color, ...suggestTolerance(color) };
    }
    applyChromaKey(frame.data, key);
    ctx.putImageData(frame, 0, 0);
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
    return { ok: true, sampledKey };
  } catch (e) {
    // A cross-origin video without CORS headers can't be read back; show it unkeyed.
    console.warn('[green screen] could not key this video', e);
    return { ok: false };
  }
}
