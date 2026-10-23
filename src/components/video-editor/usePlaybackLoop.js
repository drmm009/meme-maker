import { useEffect } from 'react';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { getContentEnd } from './timeline/timelineMath';

// Advances the playhead in real time while playing and stops at the end of the last clip.
export function usePlaybackLoop() {
  const isPlaying = useEditorStore((s) => s.isPlaying);

  useEffect(() => {
    if (!isPlaying) return undefined;
    let last = performance.now();
    let frame;
    const tick = (now) => {
      const delta = now - last;
      last = now;
      useEditorStore.setState((state) => {
        if (!state.isPlaying) return {};
        const end = getContentEnd(state.items, state.duration);
        const next = state.playhead + delta;
        return next >= end ? { playhead: end, isPlaying: false } : { playhead: next };
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying]);
}

// Play/pause that restarts from 0 when the playhead is already at the end.
export function togglePlayback() {
  const state = useEditorStore.getState();
  if (state.isPlaying) {
    state.setIsPlaying(false);
    return;
  }
  if (state.playhead >= getContentEnd(state.items, state.duration) - 10) state.setPlayhead(0);
  state.setIsPlaying(true);
}
