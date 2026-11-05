// Auto-ducking: a music clip set to "Lower under voice" drops to DUCK_LEVEL while a voiceover or a
// video's own sound plays, easing down and back up over DUCK_RAMP_MS. The preview multiplies its
// volume by duckGain; the export builds the same curve as an FFmpeg volume expression.
import { speechClips } from './clipAudio';

export const DUCK_LEVEL = 0.25;
export const DUCK_RAMP_MS = 250;

export interface Span { start: number; end: number }

type Clip = { type: string; startMs: number; endMs: number; url?: string; hidden?: boolean; muted?: boolean; volume?: number; isVoiceover?: boolean; isFreeze?: boolean };

// When someone may be speaking: the heard voiceovers and videos, merged where their ramps would
// overlap (so the music stays down across short gaps).
export const voiceSpans = (items: Clip[]): Span[] => {
  const spans: Span[] = [];
  for (const c of speechClips(items) as Clip[]) {
    const last = spans[spans.length - 1];
    if (last && c.startMs - last.end < 2 * DUCK_RAMP_MS) last.end = Math.max(last.end, c.endMs);
    else spans.push({ start: c.startMs, end: c.endMs });
  }
  return spans;
};

// How far down (DUCK_LEVEL..1) a ducking clip is at timeline time tMs.
export const duckGain = (spans: Span[], tMs: number): number => {
  let gain = 1;
  for (const { start, end } of spans) {
    const into = Math.min((tMs - (start - DUCK_RAMP_MS)) / DUCK_RAMP_MS, ((end + DUCK_RAMP_MS) - tMs) / DUCK_RAMP_MS);
    const k = Math.min(1, Math.max(0, into));
    gain = Math.min(gain, 1 - (1 - DUCK_LEVEL) * k);
  }
  return gain;
};

// The FFmpeg volume filter value for a clip at `volume`, ducked under `spans` (on the output's
// clock, in seconds). Plain when there is nothing to duck under.
export const duckVolume = (volume: number, spans: Span[]): string => {
  if (!spans.length) return `volume=${volume}`;
  const r = DUCK_RAMP_MS / 1000;
  const f = (v: number) => v.toFixed(3);
  const terms = spans.map(({ start, end }) =>
    `(1-${f(1 - DUCK_LEVEL)}*clip(min((t-(${f(start / 1000 - r)}))/${f(r)},(${f(end / 1000 + r)}-t)/${f(r)}),0,1))`);
  return `volume='${volume}*${terms.join('*')}':eval=frame`;
};
