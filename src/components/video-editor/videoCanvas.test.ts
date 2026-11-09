import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { aspectLabel, canvasAspectFor, canvasIsEmpty, fitCanvasToVideo, originalAspect } from './videoCanvas';

const state = () => useEditorStore.getState() as unknown as { canvasAspectRatio: number; setLayoutSlots: (s: unknown[]) => void; clearItems: () => void };

describe('videoCanvas', () => {
  beforeEach(() => {
    state().clearItems();
    state().setLayoutSlots([]);
    useEditorStore.setState({ canvasAspectRatio: 4 / 3 } as never);
  });

  it('snaps a video to the common shape it is in, else keeps its own', () => {
    expect(canvasAspectFor(1280, 720)).toBe(16 / 9);
    expect(canvasAspectFor(720, 1280)).toBe(9 / 16);
    expect(canvasAspectFor(1080, 1350)).toBe(4 / 5);
    expect(canvasAspectFor(1000, 700)).toBeCloseTo(1000 / 700);
    expect(canvasAspectFor(4000, 1000)).toBe(2.4);
    expect(canvasAspectFor(0, 720)).toBeNull();
    expect(canvasAspectFor(undefined, undefined)).toBeNull();
  });

  it('names shapes', () => {
    expect(aspectLabel(4 / 5)).toBe('4:5');
    expect(aspectLabel(2.35)).toBe('2.35:1');
    expect(aspectLabel(1000 / 700)).toBe('10:7');
  });

  it('fits the canvas to a video, but not a canvas split into panels', () => {
    fitCanvasToVideo(720, 1280);
    expect(state().canvasAspectRatio).toBe(9 / 16);
    state().setLayoutSlots([{ x: 0, y: 0, width: 400, height: 600 }]);
    fitCanvasToVideo(1280, 720);
    expect(state().canvasAspectRatio).toBe(9 / 16);
  });

  it('knows an empty canvas and the first video\'s shape', () => {
    expect(canvasIsEmpty()).toBe(true);
    expect(originalAspect([{ type: 'text' }, { type: 'video', width: 1080, height: 1350 }, { type: 'video', width: 1280, height: 720 }])).toBe(4 / 5);
    expect(originalAspect([{ type: 'audio' }])).toBeNull();
  });
});
