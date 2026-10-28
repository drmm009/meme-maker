// The frame-by-frame MP4 picture: every frame is drawn by the preview's own scene (sceneRenderer)
// and encoded by the browser's video encoder (WebCodecs, through Mediabunny). ffmpegExport mixes
// the sound onto it afterwards, or uses it as is when the project is silent.
import type { Clip, LayoutSlot } from '../model/videoProject';
import { createSceneRenderer } from '../components/video-editor/preview/sceneRenderer';
import { ExportCancelledError } from './exportProgress';

export const EXPORT_FPS = 30;

// Can this browser encode an H.264 MP4 of this size with WebCodecs?
export async function canEncodeMp4(width: number, height: number): Promise<boolean> {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') return false;
  try {
    const { getFirstEncodableVideoCodec } = await import('mediabunny');
    return (await getFirstEncodableVideoCodec(['avc'], { width, height })) === 'avc';
  } catch {
    return false;
  }
}

export interface EncodeOptions {
  items: Clip[];
  width: number;
  height: number;
  aspect: number;
  durationMs: number;
  backgroundColor?: string;
  layoutId?: string | null;
  layoutSlots?: LayoutSlot[];
  // Called once every clip's media has loaded, then after each frame with (done, total).
  onLoaded?: () => void;
  onFrame?: (done: number, total: number) => void;
  isCancelled?: () => boolean;
}

// The project's picture as a silent MP4 (H.264, EXPORT_FPS frames a second).
export async function encodeProjectVideo({ items, width, height, aspect, durationMs, backgroundColor, layoutId, layoutSlots, onLoaded, onFrame, isCancelled }: EncodeOptions): Promise<Uint8Array> {
  const { Output, Mp4OutputFormat, BufferTarget, CanvasSource, QUALITY_HIGH } = await import('mediabunny');
  const renderer = await createSceneRenderer({ items, width, height, aspect, backgroundColor, layoutId, layoutSlots });
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
  let started = false;
  try {
    onLoaded?.();
    const source = new CanvasSource(renderer.canvas, { codec: 'avc', bitrate: QUALITY_HIGH, keyFrameInterval: 2 });
    output.addVideoTrack(source, { frameRate: EXPORT_FPS });
    await output.start();
    started = true;
    const total = Math.max(1, Math.round((durationMs / 1000) * EXPORT_FPS));
    for (let i = 0; i < total; i++) {
      if (isCancelled?.()) throw new ExportCancelledError();
      await renderer.renderAt((i * 1000) / EXPORT_FPS);
      await source.add(i / EXPORT_FPS, 1 / EXPORT_FPS);
      onFrame?.(i + 1, total);
    }
    await output.finalize();
    const buffer = output.target.buffer;
    if (!buffer) throw new Error('The video encoder produced no file');
    return new Uint8Array(buffer);
  } catch (e) {
    if (started) await output.cancel().catch(() => {});
    throw e;
  } finally {
    renderer.destroy();
  }
}
