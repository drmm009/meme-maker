// Making the GIF in the browser: the caption drawn as a meme caption (white Impact, black edge),
// photos drawn as frames the GIF's size, then FFmpeg (loaded only now) encoding them.
import { frameOrder, photosGifArgs, videoGifArgs, wrapCaption } from './gifPlan';
import type { CaptionPlace, Loop, Trim } from './gifPlan';

// The caption's look, shared with the page's preview (gifMaker.css): its size a tenth of the GIF's
// width, its edge 12% of that, lines at most 92% of the width.
export const CAPTION_FONT = "Impact, Anton, 'Arial Black', sans-serif";
const CAPTION_SIZE = 0.1;
const CAPTION_EDGE = 0.12;
const CAPTION_WIDTH = 0.92;

export interface Caption {
  text: string;
  place: CaptionPlace;
}

function drawCaption(ctx: CanvasRenderingContext2D, caption: Caption, w: number, h: number) {
  if (!caption.text.trim()) return;
  const size = Math.round(w * CAPTION_SIZE);
  ctx.font = `${size}px ${CAPTION_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * CAPTION_EDGE * 2;
  ctx.strokeStyle = '#000';
  ctx.fillStyle = '#fff';
  const lines = wrapCaption(caption.text, w * CAPTION_WIDTH, (s) => ctx.measureText(s).width);
  const lineH = size * 1.1;
  const margin = h * 0.04;
  const top = caption.place === 'top' ? margin : h - margin - lines.length * lineH;
  lines.forEach((line, i) => {
    ctx.strokeText(line, w / 2, top + i * lineH);
    ctx.fillText(line, w / 2, top + i * lineH);
  });
}

function canvasOf(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot draw the GIF');
  return { canvas, ctx };
}

async function pngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('This browser cannot draw the GIF');
  return new Uint8Array(await blob.arrayBuffer());
}

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('A photo could not be read'));
    img.src = url;
  });

// A photo as a frame: covering the GIF's shape (cropped from its middle), the caption on it.
async function photoFrame(url: string, caption: Caption, w: number, h: number): Promise<Uint8Array> {
  const img = await loadImage(url);
  const { canvas, ctx } = canvasOf(w, h);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  const k = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * k;
  const dh = img.naturalHeight * k;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  drawCaption(ctx, caption, w, h);
  return pngBytes(canvas);
}

export type GifJob =
  | { kind: 'video'; file: Blob; trim: Trim; speed: number; loop: Loop; w: number; h: number; caption: Caption }
  | { kind: 'photos'; urls: string[]; frameS: number; loop: Loop; w: number; h: number; caption: Caption };

interface FF {
  writeFile(path: string, data: Uint8Array): Promise<unknown>;
  readFile(path: string): Promise<Uint8Array | string>;
  deleteFile(path: string): Promise<unknown>;
  on(event: 'progress', cb: (e: { progress: number }) => void): void;
  off(event: 'progress', cb: (e: { progress: number }) => void): void;
}

// The GIF, made: `onProgress` hears 0 to 1 as FFmpeg works.
export async function makeGif(job: GifJob, onProgress?: (p: number) => void): Promise<Blob> {
  const { loadFFmpeg, runFFmpeg } = await import('../../utils/ffmpegExport');
  const ff = (await loadFFmpeg()) as unknown as FF;
  const written: string[] = [];
  const write = async (path: string, data: Uint8Array) => {
    await ff.writeFile(path, data);
    written.push(path);
  };
  const progress = ({ progress: p }: { progress: number }) => onProgress?.(Math.max(0, Math.min(1, p)));
  ff.on('progress', progress);
  try {
    let args: string[];
    if (job.kind === 'video') {
      await write('gif_in.mp4', new Uint8Array(await job.file.arrayBuffer()));
      let caption: string | undefined;
      if (job.caption.text.trim()) {
        const { canvas, ctx } = canvasOf(job.w, job.h);
        drawCaption(ctx, job.caption, job.w, job.h);
        await write('gif_caption.png', await pngBytes(canvas));
        caption = 'gif_caption.png';
      }
      args = videoGifArgs({ input: 'gif_in.mp4', output: 'gif_out.gif', trim: job.trim, speed: job.speed, loop: job.loop, w: job.w, h: job.h, caption });
    } else {
      const frames = await Promise.all(job.urls.map((url) => photoFrame(url, job.caption, job.w, job.h)));
      const order = frameOrder(frames.length, job.loop);
      for (let i = 0; i < order.length; i++) await write(`gif_f_${String(i).padStart(3, '0')}.png`, frames[order[i]]);
      args = photosGifArgs({ pattern: 'gif_f_%03d.png', output: 'gif_out.gif', frameS: job.frameS });
    }
    await runFFmpeg(ff, args);
    written.push('gif_out.gif');
    const data = await ff.readFile('gif_out.gif');
    if (typeof data === 'string' || !data.length) throw new Error('The GIF came out empty');
    return new Blob([new Uint8Array(data)], { type: 'image/gif' });
  } finally {
    ff.off('progress', progress);
    await Promise.all(written.map((p) => ff.deleteFile(p).catch(() => {})));
  }
}
