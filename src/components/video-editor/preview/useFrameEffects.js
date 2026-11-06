import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../../../store/useVideoEditorStore';
import { effectsFor, hasEffects, processFrame } from './frameEffects';
import { loadPersonSegmenter, personSegmenterReady } from '../../../utils/personSegmenter';

// A clip's green screen, background removal and colour filter in the preview (the processing itself is shared with
// the export, in frameEffects). Returns `effectImage`, the canvas to show instead of the source
// once a frame has been processed (null otherwise), and `drawEffects(src)`, which processes the
// source's current frame (the video calls it per frame).
export function useFrameEffects(item, image, imageRef) {
  const effects = effectsFor(item);
  const { chromaKey, cutout, css } = effects;
  const effectsRef = useRef(effects);
  effectsRef.current = effects;
  // Background removal may reuse a recent mask while playing (`live`).
  const canvasesRef = useRef({ canvas: null, scratch: null, cutout: { live: true } });
  // Background removal's model, once loaded (the frame shows as it is until then).
  const [cutoutReady, setCutoutReady] = useState(personSegmenterReady);
  useEffect(() => {
    if (!cutout || cutoutReady) return undefined;
    let alive = true;
    loadPersonSegmenter().then(() => alive && setCutoutReady(true)).catch((e) => console.warn('[background removal]', e));
    return () => { alive = false; };
  }, [cutout, cutoutReady]);
  const softness = cutout ? cutout.softness : null;
  const [keyed, setKeyed] = useState(false);
  const keyedRef = useRef(false);
  // Show the canvas only once a frame has actually been processed (the video may not have loaded yet).
  const syncKeyed = (ok) => {
    if (ok !== keyedRef.current) { keyedRef.current = ok; setKeyed(ok); }
  };

  // Callers (and the effect below) use the latest version through this ref.
  const processRef = useRef(null);
  processRef.current = (src) => {
    const { ok, sampledKey } = processFrame(src, effectsRef.current, canvasesRef.current);
    if (sampledKey) {
      // Remember the sampled screen colour, so later frames (and the export) use it.
      effectsRef.current = { ...effectsRef.current, chromaKey: sampledKey };
      useEditorStore.getState().updateItem(item.id, { chromaKey: sampledKey });
    }
    syncKeyed(ok);
  };
  const drawEffectsRef = useRef((src) => {
    if (hasEffects(effectsRef.current)) processRef.current(src);
  });

  // Photos (and a video's first frame): process whenever the source or the effects change.
  // GIF stickers draw their own frames; a GIF's canvas has no naturalWidth.
  useEffect(() => {
    if ((item.type !== 'video' && item.type !== 'image') || !image) return;
    // A new softness needs a new mask, not the last one again.
    canvasesRef.current.cutout.maskAt = undefined;
    processRef.current(image);
    imageRef.current?.getLayer()?.batchDraw();
  }, [image, chromaKey, css, softness, cutoutReady, item.type, imageRef]);

  return { effectImage: keyed && (chromaKey || cutout || css) ? canvasesRef.current.canvas : null, drawEffects: drawEffectsRef.current };
}
