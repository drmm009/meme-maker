// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { attachPreviewVideo } from './previewVideo';
import { useEditorStore } from '../../../store/useVideoEditorStore';

// jsdom's <video> can't play or seek: give it a working paused flag, currentTime, play and pause.
beforeEach(() => {
  const proto = HTMLMediaElement.prototype;
  vi.spyOn(proto, 'play').mockImplementation(function play() { this._paused = false; return Promise.resolve(); });
  vi.spyOn(proto, 'pause').mockImplementation(function pause() { this._paused = true; });
  vi.spyOn(proto, 'load').mockImplementation(() => {});
  Object.defineProperty(proto, 'paused', { configurable: true, get() { return this._paused ?? true; } });
  Object.defineProperty(proto, 'currentTime', { configurable: true, get() { return this._t ?? 0; }, set(v) { this._t = v; } });
});

let cleanup = null;
afterEach(() => {
  cleanup?.();
  cleanup = null;
  vi.restoreAllMocks();
});

// A stand-in for the clip's Konva image node.
const fakeNode = () => {
  const a = { visible: true, opacity: 1, x: 0 };
  const layer = { batchDraw: vi.fn() };
  return {
    a,
    layer,
    visible: (v) => (v === undefined ? a.visible : (a.visible = v)),
    opacity: (v) => (v === undefined ? a.opacity : (a.opacity = v)),
    x: (v) => (v === undefined ? a.x : (a.x = v)),
    getAttr: () => false,
    setAttr: () => {},
    image: () => null,
    getLayer: () => layer,
  };
};

const clip = { id: 'v', type: 'video', url: 'blob:clip', startMs: 1000, endMs: 3000, trimStartMs: 500 };
const S = () => useEditorStore.getState();

// Attach a preview video for the clip, paused at the playhead, and settle the start-up play().
const attach = async (playhead = 0) => {
  useEditorStore.setState({ items: [clip], playhead, isPlaying: false, duration: 7000 });
  const node = fakeNode();
  const itemRef = { current: clip };
  const onMetadata = vi.fn();
  cleanup = attachPreviewVideo({ item: clip, itemRef, imageRef: { current: node }, trRef: { current: null }, setImage: vi.fn(), onMetadata, drawEffects: vi.fn() });
  await Promise.resolve();
  await Promise.resolve();
  const vid = document.querySelector('#video-sink video, body > video');
  return { node, vid, onMetadata };
};

describe('attachPreviewVideo', () => {
  it('adds a muted, inline video for the clip and reports its size', async () => {
    const { vid, onMetadata } = await attach();
    expect(vid.src).toBe('blob:clip');
    expect(vid.playsInline).toBe(true);
    expect(vid.paused).toBe(true); // the start-up play() is undone while the editor is paused
    Object.defineProperty(vid, 'videoWidth', { value: 640 });
    Object.defineProperty(vid, 'videoHeight', { value: 360 });
    vid.onloadedmetadata();
    expect(onMetadata).toHaveBeenCalledWith(640, 360);
  });

  it('shows the clip only during its time and follows scrubs into the footage', async () => {
    const { node, vid } = await attach();
    S().setPlayhead(2000);
    expect(node.visible()).toBe(true);
    expect(vid.currentTime).toBe(1.5); // 0.5s trim + 1s into the clip
    S().setPlayhead(3500);
    expect(node.visible()).toBe(false);
    S().setPlayhead(1000);
    expect(node.visible()).toBe(true);
    expect(vid.currentTime).toBe(0.5);
  });

  it('hides and shows the clip while paused', async () => {
    const { node } = await attach();
    S().setPlayhead(2000);
    S().updateItem('v', { hidden: true });
    expect(node.visible()).toBe(false);
    S().updateItem('v', { hidden: false });
    expect(node.visible()).toBe(true);
  });

  it('plays while on screen during playback and pauses after its end', async () => {
    const { vid } = await attach();
    S().setIsPlaying(true);
    S().setPlayhead(1500);
    expect(vid.paused).toBe(false);
    await Promise.resolve();
    S().setPlayhead(3200);
    expect(vid.paused).toBe(true);
  });

  it('follows speed, volume and mute during playback', async () => {
    const { vid } = await attach();
    S().setIsPlaying(true);
    S().updateItem('v', { playbackRate: 2, volume: 0.5 });
    S().setPlayhead(2000);
    expect(vid.playbackRate).toBe(2);
    expect(vid.volume).toBeCloseTo(0.5);
    expect(vid.muted).toBe(false);
    S().updateItem('v', { muted: true });
    expect(vid.muted).toBe(true);
  });

  it('removes the video when detached', async () => {
    await attach();
    cleanup();
    cleanup = null;
    expect(document.querySelector('video')).toBeNull();
  });
});
