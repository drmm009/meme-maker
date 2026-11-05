// Timeline waveforms: a sound's loudness, decoded once per file and kept as one peak per slice, so
// each audio clip draws the part of the sound it plays (trims and speed included).

// Peaks per second of sound.
export const PEAKS_PER_SEC = 50;

export interface Peaks {
  // 0..1 per slice (the loudest sample in it, against the loudest in the file).
  values: Float32Array;
  perSec: number;
}

// The loudest sample of each slice, across channels, scaled so the file's loudest is 1.
export const peaksFrom = (channels: Float32Array[], sampleRate: number, perSec = PEAKS_PER_SEC): Peaks => {
  const length = channels[0]?.length || 0;
  const step = Math.max(1, Math.round(sampleRate / perSec));
  const values = new Float32Array(Math.ceil(length / step));
  let top = 0;
  for (let i = 0; i < values.length; i++) {
    let peak = 0;
    const end = Math.min(length, (i + 1) * step);
    for (const ch of channels) {
      for (let s = i * step; s < end; s++) {
        const v = Math.abs(ch[s]);
        if (v > peak) peak = v;
      }
    }
    values[i] = peak;
    if (peak > top) top = peak;
  }
  if (top > 0) for (let i = 0; i < values.length; i++) values[i] /= top;
  return { values, perSec };
};

// Bar heights (percent, at least 6 so silence still shows) for a clip `width` px wide drawn at
// pxPerSec, playing its sound from trimStartMs at `rate`: each bar is the loudest slice under it.
export const waveBarsFor = (
  peaks: Peaks,
  { width, pxPerSec, trimStartMs = 0, rate = 1, barPx = 4 }: { width: number; pxPerSec: number; trimStartMs?: number; rate?: number; barPx?: number },
): number[] => {
  const count = Math.max(1, Math.floor(width / barPx));
  const msPerPx = (1000 / pxPerSec) * rate;
  const bars: number[] = [];
  for (let b = 0; b < count; b++) {
    const from = Math.floor(((trimStartMs + b * barPx * msPerPx) / 1000) * peaks.perSec);
    const to = Math.max(from + 1, Math.ceil(((trimStartMs + (b + 1) * barPx * msPerPx) / 1000) * peaks.perSec));
    let peak = 0;
    for (let i = from; i < to && i < peaks.values.length; i++) if (peaks.values[i] > peak) peak = peaks.values[i];
    bars.push(Math.round(6 + peak * 94));
  }
  return bars;
};

// url -> Promise<Peaks>, so each sound is decoded once per session.
const cache = new Map<string, Promise<Peaks>>();

export const loadPeaks = (url: string): Promise<Peaks> => {
  let pending = cache.get(url);
  if (!pending) {
    pending = (async () => {
      const data = await (await fetch(url)).arrayBuffer();
      const Ctx = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;
      const audio = await new Ctx(1, 1, 44100).decodeAudioData(data);
      const channels = Array.from({ length: audio.numberOfChannels }, (_, i) => audio.getChannelData(i));
      return peaksFrom(channels, audio.sampleRate);
    })();
    pending.catch(() => cache.delete(url));
    cache.set(url, pending);
  }
  return pending;
};
