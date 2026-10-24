// Audio for speech recognition: the heard part of each clip, as 16 kHz mono samples.

export const SPEECH_RATE = 16000;

// Clips whose speech becomes captions: videos and voiceovers that are heard.
export const speechClips = (items) => items
  .filter((i) => !i.hidden && !i.muted && (i.volume ?? 1) > 0 && i.url && !i.isFreeze
    && (i.type === 'video' || (i.type === 'audio' && i.isVoiceover)))
  .sort((a, b) => a.startMs - b.startMs);

// The section of the source footage a clip plays, in source seconds.
export const sourceWindow = (item) => {
  const rate = item.playbackRate || 1;
  const from = (item.trimStartMs || 0) / 1000;
  return { from, to: from + ((item.endMs - item.startMs) * rate) / 1000 };
};

// Seconds into the extracted window -> timeline ms.
export const toTimelineMs = (item, sec) => item.startMs + (sec * 1000) / (item.playbackRate || 1);

// Mono mix of a decoded buffer's samples between from and to (seconds), resampled to 16 kHz.
const resample = async (buffer, from, to) => {
  const start = Math.max(0, from);
  const end = Math.min(buffer.duration, to);
  const length = Math.max(1, Math.ceil((end - start) * SPEECH_RATE));
  const ctx = new OfflineAudioContext(1, length, SPEECH_RATE);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  src.start(0, start, end - start);
  const rendered = await ctx.startRendering();
  return rendered.getChannelData(0);
};

const decodeWithWebAudio = async (url) => {
  const data = await (await fetch(url)).arrayBuffer();
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  try {
    return await ctx.decodeAudioData(data);
  } finally {
    ctx.close?.();
  }
};

// Some containers (WebM on Safari, for one) do not decode in Web Audio; FFmpeg reads them instead.
const extractWithFFmpeg = async (item, from, to) => {
  const { loadFFmpeg } = await import('./ffmpegExport');
  const { fetchFile } = await import('@ffmpeg/util');
  const ff = await loadFFmpeg();
  const input = `speech_in_${Date.now()}`;
  const output = `${input}.pcm`;
  await ff.writeFile(input, await fetchFile(item.url));
  try {
    await ff.exec(['-ss', from.toFixed(3), '-t', (to - from).toFixed(3), '-i', input, '-vn', '-ac', '1', '-ar', String(SPEECH_RATE), '-f', 'f32le', output]);
    const bytes = await ff.readFile(output);
    return new Float32Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 4)).slice();
  } finally {
    await ff.deleteFile(input).catch(() => {});
    await ff.deleteFile(output).catch(() => {});
  }
};

export const clipSpeechAudio = async (item) => {
  const { from, to } = sourceWindow(item);
  try {
    const buffer = await decodeWithWebAudio(item.url);
    return await resample(buffer, from, to);
  } catch {
    return extractWithFFmpeg(item, from, to);
  }
};
