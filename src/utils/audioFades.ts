// Clip volume and fade in/out, shared by the live preview and the FFmpeg export.
// Items carry volume (0..1, default 1), fadeInMs and fadeOutMs (0 = off).
import type { Media } from '../model/videoProject';

export const DEFAULT_FADE_MS = 600;

// The fields fades and volume read.
export type Fadeable = Pick<Media, 'volume' | 'fadeInMs' | 'fadeOutMs'> & { startMs: number; endMs: number };

const fadesFor = (item: Pick<Media, 'fadeInMs' | 'fadeOutMs'>, lengthMs: number) => {
  const fadeIn = Math.max(0, item.fadeInMs || 0);
  const fadeOut = Math.max(0, item.fadeOutMs || 0);
  // If both fades are longer than the clip, shrink them proportionally so they meet.
  const total = fadeIn + fadeOut;
  const k = total > lengthMs && total > 0 ? lengthMs / total : 1;
  return { fadeIn: fadeIn * k, fadeOut: fadeOut * k };
};

// Gain (0..1) for a clip at timeline time `playheadMs`: volume times any fade ramp.
export const clipGain = (item: Fadeable, playheadMs: number): number => {
  const volume = typeof item.volume === 'number' && Number.isFinite(item.volume) ? Math.min(1, Math.max(0, item.volume)) : 1;
  const lengthMs = item.endMs - item.startMs;
  const t = playheadMs - item.startMs;
  if (t < 0 || t > lengthMs) return volume;
  const { fadeIn, fadeOut } = fadesFor(item, lengthMs);
  let ramp = 1;
  if (fadeIn > 0 && t < fadeIn) ramp = Math.min(ramp, t / fadeIn);
  if (fadeOut > 0 && t > lengthMs - fadeOut) ramp = Math.min(ramp, (lengthMs - t) / fadeOut);
  return volume * Math.max(0, ramp);
};

// FFmpeg afade filters (with a leading comma, or '') for a clip `durSec` long on the timeline.
export const fadeFilter = (item: Pick<Media, 'fadeInMs' | 'fadeOutMs'>, durSec: number): string => {
  const { fadeIn, fadeOut } = fadesFor(item, durSec * 1000);
  const parts: string[] = [];
  if (fadeIn > 0) parts.push(`afade=t=in:st=0:d=${(fadeIn / 1000).toFixed(3)}`);
  if (fadeOut > 0) parts.push(`afade=t=out:st=${Math.max(0, durSec - fadeOut / 1000).toFixed(3)}:d=${(fadeOut / 1000).toFixed(3)}`);
  return parts.length ? `,${parts.join(',')}` : '';
};
