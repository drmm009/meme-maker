// Short time labels shown on cards and banners.

// How long ago a time (ms since the epoch) was: "just now", "5 min ago", "3 h ago", "2 d ago".
export const timeAgo = (ms: number): string => {
  const min = Math.round((Date.now() - ms) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};

// A video's length (ms) as m:ss, at least 0:01.
export const durationClock = (ms?: number): string => {
  const sec = Math.max(1, Math.round((ms || 0) / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
};
