// Export helper: auto captions go out as one image sequence (FFmpeg concat list) instead of one
// looped input per caption and animation step, which would be hundreds of inputs for a long video.
import { animationSteps } from './textAnimation';
import type { TextFrame } from './textAnimation';
import type { TextClip } from '../model/videoProject';

// One still of the track: what to draw and when (timeline ms).
export interface CaptionFrame {
  item: TextClip;
  frame: Readonly<TextFrame>;
  fromMs: number;
  toMs: number;
}

// Auto captions that can share the track: in time order, not overlapping, not shaking (shake moves
// the overlay, which a shared track can't do). The rest export like any other text.
export const splitCaptionTrack = (textItems: TextClip[]): { track: TextClip[]; rest: TextClip[] } => {
  const track: TextClip[] = [];
  const rest: TextClip[] = [];
  const candidates = textItems.filter((i) => i.autoCaption && i.animation !== 'shake').sort((a, b) => a.startMs - b.startMs);
  let lastEnd = -Infinity;
  for (const item of candidates) {
    if (item.startMs >= lastEnd && item.endMs > item.startMs) { track.push(item); lastEnd = item.endMs; }
    else rest.push(item);
  }
  rest.push(...textItems.filter((i) => !candidates.includes(i)));
  return { track, rest };
};

// Frames of the track: [{ item, frame, fromMs, toMs }] (timeline ms), one per animation step.
export const captionFrames = (track: TextClip[]): CaptionFrame[] => track.flatMap((item) =>
  animationSteps(item).map((step) => ({ item, frame: step.frame, fromMs: item.startMs + step.fromMs, toMs: item.startMs + step.toMs })));

// ffconcat text for frames whose images are `files[i]`, with `blank` filling the gaps, over
// totalMs. Durations come from rounded absolute times so they don't drift over a long video.
export const concatList = (frames: CaptionFrame[], files: string[], blank: string, totalMs: number): string => {
  const lines = ['ffconcat version 1.0'];
  const sec = (ms: number) => Math.round(ms) / 1000;
  const entry = (file: string, fromMs: number, toMs: number) => {
    const d = sec(toMs) - sec(fromMs);
    if (d > 0) lines.push(`file ${file}`, `duration ${d.toFixed(3)}`);
  };
  let t = 0;
  frames.forEach((f, i) => {
    if (f.fromMs > t) entry(blank, t, f.fromMs);
    entry(files[i], Math.max(t, f.fromMs), f.toMs);
    t = Math.max(t, f.toMs);
  });
  if (totalMs > t) entry(blank, t, totalMs);
  // The concat demuxer ignores the last entry's duration; repeating the last file keeps it.
  lines.push(`file ${blank}`);
  return `${lines.join('\n')}\n`;
};
