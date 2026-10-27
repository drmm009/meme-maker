import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../../../store/useVideoEditorStore';
import { applyChromaKey, sampleKeyColor, suggestTolerance } from '../../../utils/chromaKey';
import { filterCss, resolveFilter } from '../../../utils/clipFilters';
import { effectCanvasSize } from './previewMath';

// Green screen (videos) and colour filters (videos and photos), drawn through an offscreen canvas:
// keying first, then filtering, the same order as the export. Returns `effectImage`, the canvas
// to show instead of the source once a frame has been processed (null otherwise), and
// `drawEffects(src)`, which processes the source's current frame (the video calls it per frame).
export function useFrameEffects(item, image, imageRef) {
  const chromaKey = item.type === 'video' && item.chromaKey ? item.chromaKey : null;
  const chromaRef = useRef(chromaKey);
  chromaRef.current = chromaKey;
  const css = item.type === 'video' || item.type === 'image' ? filterCss(resolveFilter(item.filter)) : '';
  const cssRef = useRef(css);
  cssRef.current = css;
  const canvasRef = useRef(null);
  const scratchRef = useRef(null);
  const [keyed, setKeyed] = useState(false);
  const keyedRef = useRef(false);
  // Show the canvas only once a frame has actually been processed (the video may not have loaded yet).
  const syncKeyed = (ok) => {
    if (ok !== keyedRef.current) { keyedRef.current = ok; setKeyed(ok); }
  };

  // Draws the current frame (video) or the picture (photo) with its effects into the offscreen
  // canvas. Returns false if there is nothing to do or it couldn't.
  const keyFrame = (src) => {
    const key = chromaRef.current;
    const filter = cssRef.current;
    const sw = src?.videoWidth || src?.naturalWidth || 0;
    const sh = src?.videoHeight || src?.naturalHeight || 0;
    if ((!key && !filter) || !sw) return false;
    const { width: w, height: h } = effectCanvasSize(sw, sh, Boolean(src.videoWidth));
    const canvas = canvasRef.current || (canvasRef.current = document.createElement('canvas'));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    try {
      ctx.filter = 'none';
      ctx.clearRect(0, 0, w, h);
      if (!key) {
        ctx.filter = filter;
        ctx.drawImage(src, 0, 0, w, h);
        ctx.filter = 'none';
        return true;
      }
      ctx.drawImage(src, 0, 0, w, h);
      const frame = ctx.getImageData(0, 0, w, h);
      if (key.color === 'auto') {
        // First keyed frame: pick the actual screen colour from the corners, tune the tolerances to it, and remember both.
        const color = sampleKeyColor(frame.data, w, h);
        chromaRef.current = { ...key, color, ...suggestTolerance(color) };
        useEditorStore.getState().updateItem(item.id, { chromaKey: chromaRef.current });
      }
      applyChromaKey(frame.data, chromaRef.current);
      ctx.putImageData(frame, 0, 0);
      if (filter) {
        // Filter the keyed pixels: copy them aside, then draw them back through the filter.
        const scratch = scratchRef.current || (scratchRef.current = document.createElement('canvas'));
        if (scratch.width !== w || scratch.height !== h) { scratch.width = w; scratch.height = h; }
        const sctx = scratch.getContext('2d');
        sctx.clearRect(0, 0, w, h);
        sctx.drawImage(canvas, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.filter = filter;
        ctx.drawImage(scratch, 0, 0);
        ctx.filter = 'none';
      }
      return true;
    } catch (e) {
      // A cross-origin video without CORS headers can't be read back; show it unkeyed.
      console.warn('[green screen] could not key this video', e);
      return false;
    }
  };

  // Callers (and the effect below) use the latest version through this ref.
  const processRef = useRef(null);
  processRef.current = (src) => syncKeyed(keyFrame(src));
  const drawEffectsRef = useRef((src) => {
    if (chromaRef.current || cssRef.current) processRef.current(src);
  });

  // Photos (and a video's first frame): process whenever the source or the effects change.
  // GIF stickers draw their own frames; a GIF's canvas has no naturalWidth.
  useEffect(() => {
    if ((item.type !== 'video' && item.type !== 'image') || !image) return;
    processRef.current(image);
    imageRef.current?.getLayer()?.batchDraw();
  }, [image, chromaKey, css, item.type, imageRef]);

  return { effectImage: keyed && (chromaKey || css) ? canvasRef.current : null, drawEffects: drawEffectsRef.current };
}
