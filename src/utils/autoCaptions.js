// Auto captions: transcribe the heard clips on the device and turn the words into captions.
import { chunkWords, isSpeechWord } from './captionChunks';
import { clipSpeechAudio, speechClips, toTimelineMs } from './clipAudio';
import { transcribe } from './transcriber';

// onProgress({ phase: 'download' | 'listen', progress?, clip, clips })
// Resolves to captions [{ text, startMs, endMs }] on the timeline.
export async function generateCaptions(items, onProgress = () => {}) {
  const clips = speechClips(items);
  const words = [];
  for (const [i, clip] of clips.entries()) {
    onProgress({ phase: 'listen', clip: i, clips: clips.length });
    const audio = await clipSpeechAudio(clip);
    const { words: heard } = await transcribe(audio, (p) => onProgress({
      phase: p.phase === 'download' ? 'download' : 'listen', progress: p.progress, clip: i, clips: clips.length,
    }));
    for (const w of heard) {
      if (!isSpeechWord(w.text)) continue;
      const startMs = toTimelineMs(clip, w.start);
      const endMs = Math.min(clip.endMs, toTimelineMs(clip, Number.isFinite(w.end) ? w.end : w.start + 0.3));
      if (startMs < clip.endMs) words.push({ text: w.text, startMs, endMs: Math.max(endMs, startMs + 1) });
    }
  }
  words.sort((a, b) => a.startMs - b.startMs);
  return { captions: chunkWords(words), clips: clips.length };
}
