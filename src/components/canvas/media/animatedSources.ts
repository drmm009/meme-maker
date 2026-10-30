// Moving layers on the meme: animated GIFs (photos or stickers) and video photos. Each becomes a
// source that draws its current frame into a canvas; that canvas sits in the editor's image cache
// under the layer's url, so the layer painters draw it like any picture. useAnimatedLayers keeps
// them playing on screen, and the animated export seeks them frame by frame.
import { decodeGif, frameIndexAt } from '../../../utils/gif';
import { isVideoUrl } from '../../editor/memeEditorUtils';

export interface AnimatedSpec {
  url: string;
  kind: 'gif' | 'video';
  // Videos: the part that plays, in seconds.
  trimStart?: number;
  trimEnd?: number;
}

export interface AnimatedSource {
  canvas: HTMLCanvasElement;
  // How long one loop lasts.
  loopMs: number;
  // On screen: draw what is showing now (`tMs` since playing started; videos play by themselves).
  show: (tMs: number) => void;
  // Export: draw exactly the frame `tMs` into the loop.
  seek: (tMs: number) => Promise<void>;
  pause: () => void;
  resume: () => void;
  destroy: () => void;
}

export const isAnimatedGifUrl = (url: unknown): boolean =>
  typeof url === 'string' && (/^data:image\/gif[;,]/i.test(url) || /\.gif(\?|#|$)/i.test(url));

interface LayerLike {
  url?: string;
  imageUrl?: string;
  trimStart?: number;
  trimEnd?: number;
}

// The moving pictures among the layers, once each (layers sharing a url share a source).
export function animatedSpecs(imageLayers: LayerLike[] = [], stickers: LayerLike[] = []): AnimatedSpec[] {
  const specs = new Map<string, AnimatedSpec>();
  for (const layer of imageLayers) {
    const url = layer.url;
    if (!url || specs.has(url)) continue;
    if (isVideoUrl(url)) specs.set(url, { url, kind: 'video', trimStart: layer.trimStart, trimEnd: layer.trimEnd });
    else if (isAnimatedGifUrl(url)) specs.set(url, { url, kind: 'gif' });
  }
  for (const sticker of stickers) {
    const url = sticker.url || sticker.imageUrl;
    if (url && !specs.has(url) && isAnimatedGifUrl(url)) specs.set(url, { url, kind: 'gif' });
  }
  return [...specs.values()];
}

const makeCanvas = (w: number, h: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, w);
  canvas.height = Math.max(1, h);
  return canvas;
};

// A GIF decoded into its frames, or null where the browser can't decode GIFs (no ImageDecoder):
// the layer then stays on its first frame.
async function gifSource(url: string): Promise<AnimatedSource | null> {
  const gif = await decodeGif(url).catch(() => null);
  if (!gif || gif.frames.length < 2) return null;
  const canvas = makeCanvas(gif.width, gif.height);
  const ctx = canvas.getContext('2d');
  let shown = -1;
  const show = (tMs: number) => {
    const i = frameIndexAt(gif.durations, tMs);
    if (i === shown || !ctx) return;
    shown = i;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(gif.frames[i], 0, 0);
  };
  show(0);
  return {
    canvas,
    loopMs: gif.durations.reduce((a: number, b: number) => a + b, 0),
    show,
    seek: async (tMs) => show(tMs),
    pause: () => {},
    resume: () => {},
    destroy: () => gif.frames.forEach((f: ImageBitmap) => f.close?.()),
  };
}

const once = (el: HTMLVideoElement, event: string, timeoutMs: number) => new Promise<void>((resolve) => {
  const done = () => {
    clearTimeout(timer);
    el.removeEventListener(event, done);
    resolve();
  };
  const timer = setTimeout(done, timeoutMs);
  el.addEventListener(event, done);
});

// A muted video looping over its trimmed part.
async function videoSource(spec: AnimatedSpec): Promise<AnimatedSource | null> {
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  if (!spec.url.startsWith('data:') && !spec.url.startsWith('blob:')) video.crossOrigin = 'anonymous';
  video.src = spec.url;
  await once(video, 'loadeddata', 15000);
  if (!video.videoWidth) return null;
  const start = Math.max(0, spec.trimStart || 0);
  const end = spec.trimEnd && spec.trimEnd > start ? Math.min(spec.trimEnd, video.duration || spec.trimEnd) : video.duration;
  const loopMs = Math.max(100, (end - start) * 1000);
  const canvas = makeCanvas(video.videoWidth, video.videoHeight);
  const ctx = canvas.getContext('2d');
  const draw = () => ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
  let paused = false;

  const play = () => {
    if (paused) return;
    video.play().catch(() => {});
  };
  video.currentTime = start;
  await once(video, 'seeked', 3000);
  draw();
  play();

  return {
    canvas,
    loopMs,
    show: () => {
      if (paused) return;
      if (video.currentTime >= end || video.ended) {
        video.currentTime = start;
        play();
      }
      draw();
    },
    seek: async (tMs) => {
      const target = start + ((tMs % loopMs) / 1000);
      if (Math.abs(video.currentTime - target) > 0.001) {
        video.currentTime = target;
        await once(video, 'seeked', 3000);
      }
      draw();
    },
    pause: () => {
      paused = true;
      video.pause();
    },
    resume: () => {
      paused = false;
      play();
    },
    destroy: () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    },
  };
}

export const createAnimatedSource = (spec: AnimatedSpec): Promise<AnimatedSource | null> =>
  (spec.kind === 'gif' ? gifSource(spec.url) : videoSource(spec));
