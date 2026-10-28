// Browser-side jobs behind the meme effects: grab a still for a freeze frame, and pre-render a
// clip's visible section reversed or as a boomerang with the app's FFmpeg.
import { loadFFmpeg, runFFmpeg } from './ffmpegExport';

const STILL_MAX_SIDE = 1280;
// Reversing holds every frame in memory, so renders are capped in size and length.
export const EFFECT_MAX_SIDE = 720;
export const EFFECT_MAX_SECONDS = 20;

// PNG of the source footage at sourceMs, as a blob: URL.
export async function captureFrame(url, sourceMs) {
  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = url;
  await new Promise((resolve, reject) => {
    video.onloadeddata = resolve;
    video.onerror = () => reject(new Error('Could not load the clip to freeze it.'));
  });
  const t = Math.min(Math.max(0, sourceMs / 1000), Math.max(0, video.duration - 0.05));
  await new Promise((resolve) => { video.onseeked = resolve; video.currentTime = t; });
  const scale = Math.min(1, STILL_MAX_SIDE / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  video.removeAttribute('src');
  video.load();
  if (!blob) throw new Error('Could not capture the frame.');
  return URL.createObjectURL(blob);
}

const fitScale = `scale=w='if(gt(iw,ih),min(${EFFECT_MAX_SIDE},iw),-2)':h='if(gt(iw,ih),-2,min(${EFFECT_MAX_SIDE},ih))'`;

// FFmpeg arguments for rendering a section of `input` reversed or as a boomerang (pure, for tests).
export const effectArgs = (effect, { startSec, lengthSec, input = 'fx_in.mp4', output = 'fx_out.mp4', withAudio = true }) => {
  const head = ['-ss', startSec.toFixed(3), '-t', lengthSec.toFixed(3), '-i', input];
  const encode = ['-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p'];
  if (effect === 'reverse') {
    return [...head, '-vf', `${fitScale},reverse`, ...(withAudio ? ['-af', 'areverse', '-c:a', 'aac'] : ['-an']), ...encode, output];
  }
  // Boomerang: forwards then backwards, silent.
  return [...head, '-filter_complex', `[0:v]${fitScale},split[fwd][bk];[bk]reverse[rev];[fwd][rev]concat=n=2:v=1:a=0[out]`, '-map', '[out]', '-an', ...encode, output];
};

// Render the section [startMs, startMs + lengthMs) of the source at `url`. Resolves to { url, durationMs }.
export async function renderClipEffect(url, effect, { startMs, lengthMs }) {
  const lengthSec = Math.min(EFFECT_MAX_SECONDS, lengthMs / 1000);
  const ff = await loadFFmpeg();
  const input = 'fx_in.mp4';
  const output = 'fx_out.mp4';
  await ff.writeFile(input, new Uint8Array(await (await fetch(url)).arrayBuffer()));
  try {
    const opts = { startSec: startMs / 1000, lengthSec, input, output };
    let code = await runFFmpeg(ff, effectArgs(effect, opts));
    // A clip without sound can't be given a reversed soundtrack; try again silent.
    if (code !== 0 && effect === 'reverse') code = await runFFmpeg(ff, effectArgs(effect, { ...opts, withAudio: false }));
    if (code !== 0) throw new Error(`Couldn't render the ${effect} (FFmpeg code ${code}).`);
    const data = await ff.readFile(output);
    return {
      url: URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' })),
      durationMs: Math.round(lengthSec * 1000) * (effect === 'boomerang' ? 2 : 1),
    };
  } finally {
    for (const f of [input, output]) {
      try { await ff.deleteFile(f); } catch { /* not created */ }
    }
  }
}
