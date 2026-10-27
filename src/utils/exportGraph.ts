// Builds the FFmpeg command for a video export. Pure: it never touches FFmpeg or the network.
// ffmpegExport.js fetches each clip, writes it into FFmpeg's file system under the name this
// builder hands out, then adds it here; finish() returns the full argument list.
//
// The picture is composited bottom to top: the background colour is [0:v], and every overlay
// produces the next layer [bg1], [bg2], ... Input 1 is silence, which keeps the soundtrack the
// full length; sounds are mixed onto it.
import type { AudioClip, ImageClip, Media, Placed, StickerClip, TextClip, VideoClip } from '../model/videoProject';
import { fadeFilter } from './audioFades';
import { chromaKeyFilter } from './chromaKey';
import { gifPaletteFilter } from './gif';
import { clipPunchTimes, punchFilter } from './zoomPunch';
import { filterChain, resolveFilter } from './clipFilters';
import { extensionForType } from './voiceRecorder';
import { transitionFilters } from './clipTransitions';
import type { SequenceCandidate } from './clipTransitions';
import { animationSteps, shakeExpressions } from './textAnimation';
import type { TextFrame } from './textAnimation';
import { isRotated, rotatedBounds, rotatedCenter } from './rotation';

const num = (v: unknown, fallback: number): number => (typeof v === 'number' && !isNaN(v) ? v : fallback);
// Even pixels, rounding up (video sizes must be even); floating-point noise doesn't round up.
const evenUp = (v: number) => Math.max(2, Math.ceil(v / 2 - 1e-6) * 2);

// #rrggbb -> FFmpeg 0xRRGGBB (anything else falls back to white).
export const ffmpegColor = (hex: string | undefined): string => (/^#[0-9a-f]{6}$/i.test(hex || '') ? `0x${(hex as string).slice(1).toUpperCase()}` : 'white');

// Output size: 720p (long side 1280) or 1080p (long side 1920), shaped by the aspect ratio, even.
export const outputSize = (aspect: number | undefined, resolution: number): { width: number; height: number } => {
  const safeAspect = (typeof aspect === 'number' && !isNaN(aspect) && aspect > 0) ? aspect : (16 / 9);
  const longSide = resolution >= 1080 ? 1920 : 1280;
  const w = safeAspect < 1 ? Math.round(longSide * safeAspect) : longSide;
  const h = safeAspect < 1 ? longSide : Math.round(longSide / safeAspect);
  return { width: Math.max(2, Math.round(w / 2) * 2), height: Math.max(2, Math.round(h / 2) * 2) };
};

// A clip's time on the timeline in seconds; it lasts at least 0.05s and runs to the end if open.
export const clipSpan = (item: { startMs?: number; endMs?: number }, durationMs: number): { start: number; end: number } => {
  const start = Math.max(0, num(item.startMs, 0) / 1000);
  return { start, end: Math.max(start + 0.05, num(item.endMs, durationMs) / 1000) };
};

// A visual clip's output size (even pixels). `ratio` converts the 800-wide preview to the output.
export const visualSize = (item: Placed, ratio: number): { w: number; h: number } => ({
  w: Math.max(2, Math.round(((item.width || 100) * (item.scaleX || item.scale || 1) * ratio) / 2) * 2),
  h: Math.max(2, Math.round(((item.height || 100) * (item.scaleY || item.scale || 1) * ratio) / 2) * 2),
});

// File extension for a sound: from its recorded type, else its URL, else mp3.
export const audioExtension = (item: Pick<Media, 'mimeType' | 'url'>): string => {
  let ext = item.mimeType ? extensionForType(item.mimeType) : 'mp3';
  if (item.url && !item.mimeType) {
    const match = item.url.match(/\.(mp3|wav|ogg|m4a|aac|webm)(\?.*)?$/i);
    if (match) ext = match[1].toLowerCase();
  }
  return ext;
};

export interface TextStill {
  frame: Readonly<TextFrame>;
  position: string;
  enable: string;
}

// The stills a text clip exports as: one for still text; one per step for pop and typewriter;
// one moved by overlay expressions for shake.
export const textStills = (item: TextClip, durationMs: number, ratio: number): TextStill[] => {
  const { start, end } = clipSpan(item, durationMs);
  const steps = animationSteps({ ...item, startMs: start * 1000, endMs: end * 1000 });
  const shake = item.animation === 'shake' ? shakeExpressions(item, start, ratio) : null;
  const position = shake ? `x='${shake.x}':y='${shake.y}'` : '0:0';
  return steps.map((step, i) => {
    const fromT = (start + step.fromMs / 1000).toFixed(3);
    const toT = Math.min(end, start + step.toMs / 1000).toFixed(3);
    // Steps hand over exactly (gte/lt); the last one runs to the clip's end inclusive.
    const enable = i === steps.length - 1 ? `between(t,${fromT},${toT})` : `gte(t,${fromT})*lt(t,${toT})`;
    return { frame: step.frame, position, enable };
  });
};

// A sound's filter chain: trim to its length, resample to stereo 44.1k, speed, fades, place on the
// timeline, volume.
const audioChain = (
  index: number,
  item: Media & { startMs?: number },
  { trimSec, rate, atempo, fadeSec }: { trimSec: number; rate: number; atempo: 'before' | 'after' | null; fadeSec: number }
): string => {
  const startMs = Math.max(0, Math.round(num(item.startMs, 0)));
  const delay = startMs > 0 ? `,adelay=${startMs}|${startMs}` : '';
  const speed = atempo ? `,atempo=${rate}` : '';
  const head = `[${index}:a]atrim=0:${trimSec},asetpts=PTS-STARTPTS`;
  const format = ',aformat=channel_layouts=stereo:sample_rates=44100';
  // Video soundtracks change speed after resampling; standalone sounds before.
  const body = atempo === 'after' ? `${format}${speed}` : `${speed}${format}`;
  return `${head}${body}${fadeFilter(item, fadeSec)}${delay},volume=${num(item.volume, 1.0)}[aud${index}]`;
};

export type VisualKind = 'video' | 'gif' | 'still';

export interface ExportGraph {
  readonly nextIndex: number;
  addVisual(item: VideoClip | ImageClip | StickerClip, opts: { fileName: string; kind: VisualKind; hasAudio?: boolean; ratio: number; items: SequenceCandidate[] }): void;
  addStill(fileName: string, position?: string, enable?: string | null): void;
  addCaptionTrack(listFile: string): void;
  addAudio(item: AudioClip, fileName: string): void;
  finish(opts?: { resolution?: number }): { command: string[]; outputFileName: string; durationSec: number };
}

export function createExportGraph({ width, height, durationMs, backgroundColor, gifOut = false }: {
  width: number;
  height: number;
  durationMs: number;
  backgroundColor?: string;
  gifOut?: boolean;
}): ExportGraph {
  const durationSec = Math.max(0.1, durationMs / 1000);
  const inputs = [
    '-f', 'lavfi',
    '-i', `color=c=${ffmpegColor(backgroundColor)}:s=${width}x${height}:d=${durationSec}`,
    '-f', 'lavfi',
    '-i', `anullsrc=r=44100:cl=stereo:d=${durationSec}`
  ];
  const filters: string[] = [];
  const sounds: string[] = [];
  let layer = 0;
  let index = 2;

  const top = () => (layer === 0 ? '0:v' : `bg${layer}`);
  const overlay = (source: string, position: string, enable?: string | null) => {
    filters.push(`[${top()}][${source}]overlay=${position}:${enable ? `enable='${enable}':` : ''}eof_action=pass:shortest=0[bg${layer + 1}]`);
    layer++;
  };

  return {
    // The FFmpeg input number the next clip gets (file names carry it).
    get nextIndex() { return index; },

    // A photo, sticker, GIF or video clip. kind: 'video' | 'gif' | 'still'. hasAudio: the video
    // file has a sound track (probed by the caller). `items` is the whole project (transitions).
    addVisual(item, { fileName, kind, hasAudio = false, ratio, items }) {
      const isVideo = kind === 'video';
      const isGif = kind === 'gif';
      const { w, h } = visualSize(item, ratio);

      if (isGif) {
        inputs.push('-ignore_loop', '0', '-i', fileName);
      } else if (!isVideo) {
        inputs.push('-loop', '1', '-i', fileName);
      } else {
        const video = item as VideoClip;
        const trimStartSec = Math.max(0, num(video.trimStartMs, 0) / 1000);
        if (trimStartSec > 0) inputs.push('-ss', trimStartSec.toString());
        inputs.push('-i', fileName);
        if (!video.muted && !gifOut && hasAudio) {
          const startMs = Math.max(0, Math.round(num(video.startMs, 0)));
          const timelineSec = Math.max(0.1, (num(video.endMs, startMs + 3000) - startMs) / 1000);
          const rate = num(video.playbackRate, 1.0);
          filters.push(audioChain(index, video, { trimSec: timelineSec * rate, rate, atempo: rate !== 1.0 ? 'after' : null, fadeSec: timelineSec }));
          sounds.push(`[aud${index}]`);
        }
      }

      const { start, end } = clipSpan(item, durationMs);
      const x = Math.round(num(item.x, 0) * ratio);
      const y = Math.round(num(item.y, 0) * ratio);
      const rate = num((item as VideoClip).playbackRate, 1.0);
      // Videos and GIFs are shifted to their start time; looped stills don't need it (and buffering
      // them from 0 would cost a lot of memory).
      const ptsOffset = isVideo || isGif ? `+${start}/TB` : '';
      const key = isVideo ? chromaKeyFilter((item as VideoClip).chromaKey) : '';
      // Transitions at cuts in the main sequence (fade via alpha, zoom, slide as an x offset).
      const transition = isVideo || (item as ImageClip).isFreeze ? transitionFilters(items, item, w, h, ratio) : { chain: '', dx: null };
      // Colour filters on videos and photos (not stickers), after keying like the preview.
      const colour = isVideo || (item.type === 'image' && !isGif) ? filterChain(resolveFilter((item as ImageClip).filter)) : '';
      const punch = isVideo ? punchFilter(clipPunchTimes(item as VideoClip), w, h) : '';

      // Rotation, as in the preview: turned about the clip's corner (x, y). FFmpeg turns about the
      // centre into an upright box that holds the result, so that box is placed around the centre.
      let ox = x;
      let oy = y;
      let rotate = '';
      if (isRotated(item.rotation)) {
        const bounds = rotatedBounds(w, h, item.rotation);
        const bw = evenUp(bounds.width);
        const bh = evenUp(bounds.height);
        const center = rotatedCenter(x, y, w, h, item.rotation);
        ox = Math.round(center.x - bw / 2);
        oy = Math.round(center.y - bh / 2);
        rotate = `,format=rgba,rotate=${((item.rotation * Math.PI) / 180).toFixed(6)}:ow=${bw}:oh=${bh}:c=none`;
      }
      const position = transition.dx ? `x='${ox}+(${transition.dx})':y=${oy}` : `${ox}:${oy}`;
      filters.push(`[${index}:v]setpts=(PTS-STARTPTS)/${rate}${ptsOffset},scale=${w}:${h}${punch}${key}${colour}${transition.chain}${rotate}[vis${index}]`);
      overlay(`vis${index}`, position, `between(t,${start},${end})`);
      index++;
    },

    // A full-canvas still (a text step, the layout grid) shown at `position` while `enable` holds.
    addStill(fileName, position = '0:0', enable = null) {
      inputs.push('-loop', '1', '-i', fileName);
      overlay(`${index}:v`, position, enable);
      index++;
    },

    // The auto-caption track: an ffconcat list of full-canvas stills.
    addCaptionTrack(listFile) {
      inputs.push('-f', 'concat', '-safe', '0', '-i', listFile);
      filters.push(`[${index}:v]fps=30,format=rgba[cap${index}]`);
      overlay(`cap${index}`, '0:0');
      index++;
    },

    // A sound clip (music, effect, voiceover). Muted sounds still take an input number.
    addAudio(item, fileName) {
      const trimStartSec = Math.max(0, num(item.trimStartMs, 0) / 1000);
      if (trimStartSec > 0) inputs.push('-ss', trimStartSec.toString());
      inputs.push('-i', fileName);
      if (!item.muted) {
        const startMs = Math.max(0, Math.round(num(item.startMs, 0)));
        const clipSec = Math.max(0.05, (num(item.endMs, startMs + 3000) - startMs) / 1000);
        const rate = num(item.playbackRate, 1);
        filters.push(audioChain(index, item, { trimSec: clipSec, rate, atempo: rate !== 1 && rate >= 0.5 && rate <= 2.0 ? 'before' : null, fadeSec: clipSec / rate }));
        sounds.push(`[aud${index}]`);
      }
      index++;
    },

    // The complete argument list, and the output file it writes.
    finish({ resolution = 720 } = {}) {
      const graph = [...filters];
      if (sounds.length > 0) {
        const mixCount = 1 + sounds.length;
        graph.push(`${['[1:a]', ...sounds].join('')}amix=inputs=${mixCount}:duration=first:dropout_transition=0,volume=${mixCount}[final_audio]`);
      }
      let videoMap = layer === 0 ? '0:v' : `[bg${layer}]`;
      if (gifOut) {
        graph.push(gifPaletteFilter(layer === 0 ? '[0:v]' : videoMap, width, height, '[gifout]'));
        videoMap = '[gifout]';
      }
      const command = [...inputs];
      if (graph.length > 0) command.push('-filter_complex', graph.join(';'));

      const outputFileName = gifOut ? 'output.gif' : 'output.mp4';
      if (gifOut) {
        command.push('-map', videoMap, '-loop', '0', '-t', durationSec.toString(), outputFileName);
      } else {
        command.push(
          '-map', videoMap,
          '-map', sounds.length > 0 ? '[final_audio]' : '1:a',
          '-c:v', 'libx264',
          // 720p favours speed; 1080p a better encode (slower, smaller for its quality).
          ...(resolution >= 1080 ? ['-preset', 'veryfast', '-crf', '21'] : ['-preset', 'ultrafast']),
          '-c:a', 'aac',
          '-b:a', '192k',
          '-t', durationSec.toString(),
          outputFileName
        );
      }
      return { command, outputFileName, durationSec };
    },
  };
}
