// The GIF maker (GifMaker.tsx): a video clip or a set of photos made into a looping GIF with an
// optional meme caption. The rules here are pure: how long a clip may be, how a trim handle moves,
// the GIF's size, the order photo frames play in, and the FFmpeg commands that make it.
import { GIF_FPS } from '../../utils/gif';

// The GIF maker's link (as in location.hash): App opens the page on it.
export const GIF_MAKER_LINK = '#/gif';

// At most this many seconds of a video go in a GIF; a new video starts on its first DEFAULT_CLIP_S.
export const MAX_CLIP_S = 10;
export const DEFAULT_CLIP_S = 5;
// The shortest clip a trim leaves.
export const MIN_CLIP_S = 0.5;
// At most this many photos make a GIF.
export const MAX_PHOTOS = 30;

export type Loop = 'loop' | 'bounce';
export type GifSize = 320 | 480;
export type CaptionPlace = 'top' | 'bottom';

export interface Trim {
  start: number;
  end: number;
}

// A video's clip when it's picked: from the start, DEFAULT_CLIP_S long (or the whole video).
export const defaultTrim = (duration: number): Trim => ({ start: 0, end: Math.min(duration, DEFAULT_CLIP_S) });

// A trim with one handle moved to `to` seconds: kept inside the video, at least MIN_CLIP_S long
// and at most MAX_CLIP_S (the other handle following when the clip would grow past it).
export function moveTrim(trim: Trim, handle: 'start' | 'end', to: number, duration: number): Trim {
  const minLen = Math.min(MIN_CLIP_S, duration);
  const t = Math.max(0, Math.min(duration, to));
  if (handle === 'start') {
    const start = Math.min(t, trim.end - minLen);
    const end = Math.min(trim.end, start + MAX_CLIP_S);
    return { start: Math.max(0, start), end };
  }
  const end = Math.max(t, trim.start + minLen);
  const start = Math.max(trim.start, end - MAX_CLIP_S);
  return { start, end: Math.min(duration, end) };
}

// The whole clip slid so it starts at `to` (its length kept), inside the video.
export function slideTrim(trim: Trim, to: number, duration: number): Trim {
  const len = trim.end - trim.start;
  const start = Math.max(0, Math.min(duration - len, to));
  return { start, end: start + len };
}

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

// The GIF's size: the picture's shape with its longer side `size` px (never larger than it is), both
// sides even.
export function gifDimensions(width: number, height: number, size: GifSize): { w: number; h: number } {
  if (!(width > 0) || !(height > 0)) return { w: size, h: size };
  const k = Math.min(1, size / Math.max(width, height));
  return { w: even(width * k), h: even(height * k) };
}

// How long the GIF plays, in seconds: the clip at its speed, or each photo for its frame time; a
// bounce plays it forwards then back.
export function gifSeconds(o: { clip?: number; speed?: number; photos?: number; frameS?: number; loop: Loop }): number {
  const once = o.photos !== undefined ? o.photos * (o.frameS ?? 0.5) : (o.clip ?? 0) / (o.speed || 1);
  return o.loop === 'bounce' ? once * 2 : once;
}

// The order photo frames play in: as added, or for a bounce forwards then back without showing the
// two ends twice.
export function frameOrder(count: number, loop: Loop): number[] {
  const forward = Array.from({ length: count }, (_, i) => i);
  if (loop !== 'bounce' || count < 3) return forward;
  return [...forward, ...forward.slice(1, -1).reverse()];
}

// The FFmpeg filter that turns frames into a good-looking GIF: a palette built from them all,
// applied with light dithering.
const palette = (input: string) =>
  `${input}split[ga][gb];[ga]palettegen=stats_mode=diff[gp];[gb][gp]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle[gif]`;

// The command for a video clip: cut from `start` for the clip's length, sped up or slowed down,
// GIF_FPS frames a second at the GIF's size, played back again for a bounce, the caption (a PNG the
// GIF's size, `caption`) laid over it.
export function videoGifArgs(o: { input: string; output: string; trim: Trim; speed: number; loop: Loop; w: number; h: number; caption?: string }): string[] {
  const len = Math.max(0.1, o.trim.end - o.trim.start);
  const chain: string[] = [`[0:v]setpts=PTS/${o.speed},fps=${GIF_FPS},scale=${o.w}:${o.h}:flags=lanczos,setsar=1[v0]`];
  let last = 'v0';
  if (o.loop === 'bounce') {
    chain.push(`[${last}]split[fw][bk];[bk]reverse[rv];[fw][rv]concat=n=2:v=1:a=0[v1]`);
    last = 'v1';
  }
  if (o.caption) {
    chain.push(`[${last}][1:v]overlay=0:0[v2]`);
    last = 'v2';
  }
  chain.push(palette(`[${last}]`));
  return [
    '-ss', o.trim.start.toFixed(3), '-t', len.toFixed(3), '-i', o.input,
    ...(o.caption ? ['-i', o.caption] : []),
    '-filter_complex', chain.join(';'),
    '-map', '[gif]', '-an', '-loop', '0', '-y', o.output,
  ];
}

// The command for photo frames: numbered PNGs (`pattern`, e.g. frame_%03d.png, already the GIF's
// size with the caption drawn on), each shown for `frameS` seconds.
export function photosGifArgs(o: { pattern: string; output: string; frameS: number }): string[] {
  const rate = (1 / Math.max(0.05, o.frameS)).toFixed(4);
  return [
    '-framerate', rate, '-i', o.pattern,
    '-filter_complex', palette('[0:v]'),
    '-map', '[gif]', '-loop', '0', '-y', o.output,
  ];
}

// A caption's lines: upper case, broken between words so none is wider than `maxWidth` by
// `measure` (a canvas's measureText in the app).
export function wrapCaption(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const words = text.trim().toUpperCase().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Seconds as the trim shows them: 0:03.5.
export function clock(s: number): string {
  const safe = Math.max(0, s);
  const m = Math.floor(safe / 60);
  const rest = safe - m * 60;
  return `${m}:${rest < 10 ? '0' : ''}${rest.toFixed(1)}`;
}
