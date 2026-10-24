// Export progress: preparing inputs (fetching media, drawing text stills) is the first 15%,
// FFmpeg's render the rest. Render progress comes from the time= in FFmpeg's log lines.

const PREPARE_SHARE = 15;

// Seconds rendered so far from an FFmpeg log line like "frame=  42 ... time=00:00:01.40 ...".
export const parseFfmpegTime = (message) => {
  const m = /time=(-?\d+):(\d{2}):(\d{2}(?:\.\d+)?)/.exec(message || '');
  if (!m || m[1].startsWith('-')) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
};

const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Overall 0..100 for a phase ('preparing' | 'rendering') and how far through it is (0..1).
export const overallPercent = (phase, fraction) => (phase === 'preparing'
  ? PREPARE_SHARE * clamp01(fraction)
  : PREPARE_SHARE + (100 - PREPARE_SHARE) * clamp01(fraction));

// Seconds left in a phase from how long it has taken so far, or null until there's enough to go on.
export const etaSeconds = (elapsedMs, fraction) => {
  if (!(fraction >= 0.05) || fraction >= 1 || !(elapsedMs > 0)) return null;
  return Math.max(1, Math.round((elapsedMs / 1000) * (1 - fraction) / fraction));
};

export const formatEta = (sec) => {
  if (sec == null) return null;
  if (sec < 60) return `about ${sec}s left`;
  return `about ${Math.round(sec / 60)} min left`;
};

export class ExportCancelledError extends Error {
  constructor() {
    super('Export cancelled');
    this.name = 'ExportCancelledError';
  }
}
