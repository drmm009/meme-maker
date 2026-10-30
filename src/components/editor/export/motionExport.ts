// A meme with moving layers (GIFs, videos) exported as a GIF or an MP4: the meme is drawn frame by
// frame (each moving layer seeked to the frame's time through canvas.animation, see
// canvas/media/useAnimatedLayers) and the frames encoded. MP4s use the browser's encoder
// (WebCodecs) where it can, else FFmpeg; GIFs use FFmpeg's palette GIF. Neither has sound.
import { GIF_FPS, GIF_MAX_SIDE, gifPaletteFilter } from '../../../utils/gif';
import { outputSize } from './exportImage';
import type { ExportWidth } from './exportImage';
import type { CanvasAnimation } from '../../canvas/media/useAnimatedLayers';

export type MotionFormat = 'gif' | 'mp4';

export const isMotionFormat = (f: unknown): f is MotionFormat => f === 'gif' || f === 'mp4';

export const MP4_FPS = 30;
// One loop of the longest moving layer, kept between these; MP4s run at least MIN_MP4_MS (a short
// GIF loop plays a few times over).
export const MIN_MOTION_MS = 1000;
export const MIN_MP4_MS = 3000;
export const MAX_MOTION_MS = 15000;

export const motionFps = (format: MotionFormat): number => (format === 'gif' ? GIF_FPS : MP4_FPS);

export function motionDuration(loopsMs: number[], format: MotionFormat): number {
  const longest = Math.max(0, ...loopsMs.filter((n) => Number.isFinite(n)));
  const ms = Math.min(MAX_MOTION_MS, Math.max(MIN_MOTION_MS, longest));
  if (format !== 'mp4' || ms >= MIN_MP4_MS) return ms;
  // Whole loops, so it doesn't jump at the end.
  return Math.min(MAX_MOTION_MS, ms * Math.ceil(MIN_MP4_MS / ms));
}

const even = (n: number) => Math.max(2, Math.floor(n / 2) * 2);

// GIFs are at most GIF_MAX_SIDE on their longer side; MP4s take the chosen width, and both sides
// even (H.264 needs that).
export function motionSize(w: number, h: number, format: MotionFormat, width: ExportWidth): { w: number; h: number } {
  if (format === 'gif') {
    const k = Math.min(1, GIF_MAX_SIDE / Math.max(w, h));
    return { w: even(w * k), h: even(h * k) };
  }
  const size = outputSize(w, h, width);
  return { w: even(size.w), h: even(size.h) };
}

export interface MotionCanvas {
  width: number;
  height: number;
  exportCleanCanvas: (o?: { transparent?: boolean }) => HTMLCanvasElement;
  animation?: CanvasAnimation;
}

export interface MotionOptions {
  format: MotionFormat;
  width: ExportWidth;
  // 0..1.
  onProgress?: (done: number) => void;
  isCancelled?: () => boolean;
}

export class MotionCancelledError extends Error {
  constructor() {
    super('Export cancelled');
    this.name = 'AbortError';
  }
}

const toPng = (canvas: HTMLCanvasElement) => new Promise<Uint8Array>((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (!blob) reject(new Error('Could not draw a frame'));
    else blob.arrayBuffer().then((b) => resolve(new Uint8Array(b)), reject);
  }, 'image/png');
});

// Frames go to FFmpeg as PNGs: a palette GIF, or an H.264 MP4 where WebCodecs can't.
async function encodeWithFFmpeg(format: MotionFormat, fps: number, total: number, size: { w: number; h: number },
  drawFrame: (i: number) => Promise<HTMLCanvasElement>, step: (done: number) => void, isCancelled?: () => boolean): Promise<Blob> {
  const { loadFFmpeg, runFFmpeg, cancelExport } = await import('../../../utils/ffmpegExport');
  const ff = await loadFFmpeg();
  const names: string[] = [];
  const out = format === 'gif' ? 'motion.gif' : 'motion.mp4';
  try {
    for (let i = 0; i < total; i++) {
      if (isCancelled?.()) throw new MotionCancelledError();
      const name = `motion_${String(i).padStart(4, '0')}.png`;
      await ff.writeFile(name, await toPng(await drawFrame(i)));
      names.push(name);
      step((i + 1) / total);
    }
    const input = ['-framerate', String(fps), '-i', 'motion_%04d.png'];
    const args = format === 'gif'
      ? [...input, '-filter_complex', gifPaletteFilter('[0:v]', size.w, size.h, '[gif]'), '-map', '[gif]', '-loop', '0', out]
      : [...input, '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out];
    // Cancelling while FFmpeg encodes stops FFmpeg.
    const watch = setInterval(() => { if (isCancelled?.()) cancelExport(); }, 250);
    let code: number;
    try {
      code = await runFFmpeg(ff, args);
    } catch (e) {
      throw isCancelled?.() ? new MotionCancelledError() : e;
    } finally {
      clearInterval(watch);
    }
    if (isCancelled?.()) throw new MotionCancelledError();
    if (code !== 0) throw new Error(`FFmpeg could not make the ${format.toUpperCase()}`);
    const data = await ff.readFile(out);
    return new Blob([new Uint8Array(data as Uint8Array)], { type: format === 'gif' ? 'image/gif' : 'video/mp4' });
  } finally {
    for (const name of [...names, out]) await ff.deleteFile(name).catch(() => {});
  }
}

// MP4 through WebCodecs (Mediabunny), drawing each frame into `frame`.
async function encodeWithWebCodecs(fps: number, total: number, frame: HTMLCanvasElement,
  drawFrame: (i: number) => Promise<HTMLCanvasElement>, step: (done: number) => void, isCancelled?: () => boolean): Promise<Blob> {
  const { Output, Mp4OutputFormat, BufferTarget, CanvasSource, QUALITY_HIGH } = await import('mediabunny');
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
  const source = new CanvasSource(frame, { codec: 'avc', bitrate: QUALITY_HIGH, keyFrameInterval: 2 });
  output.addVideoTrack(source, { frameRate: fps });
  await output.start();
  try {
    for (let i = 0; i < total; i++) {
      if (isCancelled?.()) throw new MotionCancelledError();
      await drawFrame(i);
      await source.add(i / fps, 1 / fps);
      step((i + 1) / total);
    }
    await output.finalize();
  } catch (e) {
    await output.cancel().catch(() => {});
    throw e;
  }
  const buffer = output.target.buffer;
  if (!buffer) throw new Error('The video encoder produced no file');
  return new Blob([buffer], { type: 'video/mp4' });
}

// The meme as an animated GIF or MP4. The on-screen playing pauses meanwhile.
export async function renderMotion(canvas: MotionCanvas, { format, width, onProgress, isCancelled }: MotionOptions): Promise<Blob> {
  const animation = canvas.animation;
  if (!animation) throw new Error('Nothing on this meme moves');
  const fps = motionFps(format);
  const total = Math.max(1, Math.round((motionDuration(animation.loopsMs, format) / 1000) * fps));
  const size = motionSize(canvas.width, canvas.height, format, width);
  const frame = document.createElement('canvas');
  frame.width = size.w;
  frame.height = size.h;
  const ctx = frame.getContext('2d');
  const drawFrame = async (i: number) => {
    await animation.seek((i * 1000) / fps);
    const clean = canvas.exportCleanCanvas({ transparent: false });
    if (ctx) {
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(clean, 0, 0, size.w, size.h);
    }
    return frame;
  };
  // Drawing the frames is most of the work; encoding the GIF afterwards is the rest.
  const share = format === 'gif' ? 0.85 : 1;
  const step = (done: number) => onProgress?.(done * share);

  animation.pause();
  try {
    if (format === 'mp4') {
      const { canEncodeMp4 } = await import('../../../utils/webCodecsExport');
      if (await canEncodeMp4(size.w, size.h)) return await encodeWithWebCodecs(fps, total, frame, drawFrame, step, isCancelled);
    }
    return await encodeWithFFmpeg(format, fps, total, size, drawFrame, step, isCancelled);
  } finally {
    animation.resume();
    onProgress?.(1);
  }
}
