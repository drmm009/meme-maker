import { useEffect, useRef } from 'react';
import { useEditorStore } from '../../../store/useVideoEditorStore';
import { REST_FRAME, animationLengthMs, applyTextFrame, textAnimFrame } from '../../../utils/textAnimation';
import { isOnScreen } from './previewMath';

// A text clip's life on the preview, outside React renders: shown only during its time on the
// timeline, and animated (pop, shake, typewriter) while playing. Paused text rests, so a pop-in
// doesn't make text invisible while you edit it. Picking an animation in the tools fires
// 'vt-preview-text-animation', which plays it once from the start.
export function useTextPlayback(item, { itemRef, groupRef, textRef, bgRectRef, trRef }) {
  const lastFrameRef = useRef(REST_FRAME);
  const previewingRef = useRef(false);

  // Applies an animation frame to the group (text plus its background); skips repeat rests.
  const applyFrameRef = useRef(null);
  applyFrameRef.current = (frame) => {
    const group = groupRef.current;
    const node = textRef.current;
    if (!group || !node || (frame === REST_FRAME && lastFrameRef.current === REST_FRAME)) return;
    applyTextFrame(group, node, frame);
    lastFrameRef.current = frame;
    group.getLayer()?.batchDraw();
  };

  useEffect(() => {
    return useEditorStore.subscribe((state) => {
      const latest = state.items.find((i) => i.id === itemRef.current.id) || itemRef.current;
      const visible = isOnScreen(latest, state.playhead);
      const node = textRef.current;
      if (node && node.visible() !== visible) {
        node.visible(visible);
        if (bgRectRef.current) bgRectRef.current.visible(visible);
        if (trRef.current) trRef.current.visible(visible);
        node.getLayer()?.batchDraw();
      }
      if (previewingRef.current) return;
      applyFrameRef.current(state.isPlaying && latest.animation
        ? textAnimFrame(latest, state.playhead - latest.startMs)
        : REST_FRAME);
    });
  }, [item.startMs, item.endMs, itemRef, textRef, bgRectRef, trRef]);

  // A one-off run of the animation from the start, when it is picked from the tools.
  useEffect(() => {
    let frameId = null;
    const onPreview = (e) => {
      if (e.detail?.id !== itemRef.current.id) return;
      const latest = useEditorStore.getState().items.find((i) => i.id === itemRef.current.id);
      if (!latest?.animation) return;
      cancelAnimationFrame(frameId);
      previewingRef.current = true;
      const runMs = Math.min(1400, animationLengthMs(latest)) + 300;
      const t0 = performance.now();
      const tick = (now) => {
        const t = now - t0;
        if (t > runMs) {
          previewingRef.current = false;
          applyFrameRef.current(REST_FRAME);
          return;
        }
        applyFrameRef.current(textAnimFrame(latest, t));
        frameId = requestAnimationFrame(tick);
      };
      frameId = requestAnimationFrame(tick);
    };
    window.addEventListener('vt-preview-text-animation', onPreview);
    return () => {
      window.removeEventListener('vt-preview-text-animation', onPreview);
      cancelAnimationFrame(frameId);
      previewingRef.current = false;
    };
  }, [itemRef]);
}
