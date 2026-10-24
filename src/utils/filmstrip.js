// Timeline filmstrips: frames sampled along a source video, shown so each tile matches the
// footage at that point of the clip (trims and speed included).

const MIN_STEP_MS = 500;
const MAX_FRAMES = 40;
const FRAME_H = 72;

// When to sample a video of this length: every 0.5s, or spread wider so there are at most 40.
export const frameTimesFor = (durationMs) => {
  if (!(durationMs > 0)) return [0];
  const step = Math.max(MIN_STEP_MS, durationMs / MAX_FRAMES);
  const times = [];
  for (let t = step / 2; t < durationMs; t += step) times.push(Math.round(t));
  return times.length ? times : [0];
};

// Tiles for a clip `width` px wide: each gets the sampled frame nearest to the footage under its centre.
export const filmstripTiles = ({ width, tileWidth, trimStartMs = 0, rate = 1, pxPerSec, frameTimes }) => {
  if (!frameTimes?.length || !(tileWidth > 0) || !(width > 0)) return [];
  const tiles = [];
  for (let left = 0; left < width; left += tileWidth) {
    const centreMs = trimStartMs + ((left + tileWidth / 2) / pxPerSec) * 1000 * rate;
    let best = 0;
    for (let i = 1; i < frameTimes.length; i++) {
      if (Math.abs(frameTimes[i] - centreMs) < Math.abs(frameTimes[best] - centreMs)) best = i;
    }
    tiles.push({ left, width: Math.min(tileWidth, width - left), frame: best });
  }
  return tiles;
};

// url -> Promise<{ times, srcs, aspect }>, so each source is sampled once per session.
const cache = new Map();

const seek = (video, t) => new Promise((resolve) => {
  video.onseeked = () => resolve();
  video.currentTime = t;
});

async function extract(url) {
  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = url;
  await new Promise((resolve, reject) => {
    video.onloadeddata = resolve;
    video.onerror = () => reject(new Error('filmstrip: video failed to load'));
  });
  const aspect = video.videoWidth / video.videoHeight || 16 / 9;
  const canvas = document.createElement('canvas');
  canvas.height = FRAME_H;
  canvas.width = Math.round(FRAME_H * aspect);
  const ctx = canvas.getContext('2d');
  const times = frameTimesFor(video.duration * 1000);
  const srcs = [];
  for (const t of times) {
    await seek(video, t / 1000);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    srcs.push(canvas.toDataURL('image/jpeg', 0.6));
  }
  video.removeAttribute('src');
  video.load();
  return { times, srcs, aspect };
}

export const loadFilmstrip = (url) => {
  if (!cache.has(url)) {
    const job = extract(url);
    job.catch(() => cache.delete(url)); // let a later render retry
    cache.set(url, job);
  }
  return cache.get(url);
};
