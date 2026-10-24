import { describe, it, expect } from 'vitest';
import { captionItems, captionStyle, chunkWords, isSpeechWord, splitPhrases } from './captionChunks';
import { sourceWindow, speechClips, toTimelineMs } from './clipAudio';

const w = (text, startMs, endMs) => ({ text, startMs, endMs });

describe('captionChunks', () => {
  it('groups up to four words and breaks on pauses and sentence ends', () => {
    const words = [
      w(' This', 0, 200), w(' is', 200, 300), w(' fine.', 300, 600),
      w(' Everything', 700, 1100), w(' is', 1100, 1200), w(' totally', 1200, 1500), w(' fine', 1500, 1800), w(' okay', 1800, 2000),
      w(' later', 4000, 4400),
    ];
    const captions = chunkWords(words);
    expect(captions.map((c) => c.text)).toEqual(['This is fine.', 'Everything is', 'totally fine okay', 'later']);
    // Each caption runs on to the next one across a short gap, but not across a long pause.
    expect(captions[0]).toMatchObject({ startMs: 0, endMs: 700 });
    expect(captions[2].endMs).toBe(2000);
    expect(captions[3]).toMatchObject({ startMs: 4000, endMs: 4400 });
  });

  it('keeps captions short enough to read', () => {
    const captions = chunkWords([w('Supercalifragilistic', 0, 500), w('expialidocious', 500, 900)]);
    expect(captions.map((c) => c.text)).toEqual(['Supercalifragilistic', 'expialidocious']);
  });

  it('shares a phrase timestamp across its words by length', () => {
    expect(splitPhrases([w(' ab cd', 0, 1000)])).toEqual([w('ab', 0, 500), w('cd', 500, 1000)]);
  });

  it('drops non-speech labels from Whisper', () => {
    expect([' hello', ' [Music]', ' (laughs)', ' ♪', ' ', ' fine.'].filter(isSpeechWord)).toEqual([' hello', ' fine.']);
  });

  it('gives a very short caption a minimum time on screen', () => {
    expect(chunkWords([w('Hi', 0, 50)])).toEqual([{ text: 'Hi', startMs: 0, endMs: 400 }]);
  });

  it('builds styled caption items centred in the lower third', () => {
    const [classic] = captionItems([{ text: 'this is fine', startMs: 0, endMs: 900 }], 'classic', { width: 400, height: 300 });
    expect(classic).toMatchObject({ type: 'text', autoCaption: true, text: 'THIS IS FINE', x: 32, width: 336, y: 216, align: 'center', fontFamily: 'Impact, sans-serif' });
    const [typed] = captionItems([{ text: 'this is fine', startMs: 0, endMs: 900 }], 'typewriter', { width: 400, height: 300 });
    expect(typed).toMatchObject({ text: 'this is fine', animation: 'typewriter', bgColor: 'black' });
  });

  it('restyles from the words as heard but keeps rewritten text', () => {
    expect(captionStyle('typewriter', { captionText: 'this is fine', text: 'THIS IS FINE' })).toMatchObject({ text: 'this is fine', captionStyle: 'typewriter' });
    expect(captionStyle('classic', { captionText: 'this is fine', text: 'this is NOT fine' })).toMatchObject({ text: 'this is NOT fine', animation: null, bgColor: 'none' });
  });
});

describe('clipAudio', () => {
  it('picks heard videos and voiceovers in timeline order', () => {
    const items = [
      { id: 'v2', type: 'video', url: 'b', startMs: 3000, endMs: 5000 },
      { id: 'v1', type: 'video', url: 'a', startMs: 0, endMs: 3000 },
      { id: 'm', type: 'video', url: 'c', startMs: 0, endMs: 1000, muted: true },
      { id: 'song', type: 'audio', url: 'd', startMs: 0, endMs: 1000 },
      { id: 'vo', type: 'audio', url: 'e', startMs: 500, endMs: 1500, isVoiceover: true },
    ];
    expect(speechClips(items).map((i) => i.id)).toEqual(['v1', 'vo', 'v2']);
  });

  it('maps between the trimmed, sped-up footage and the timeline', () => {
    const clip = { startMs: 2000, endMs: 4000, trimStartMs: 1000, playbackRate: 2 };
    expect(sourceWindow(clip)).toEqual({ from: 1, to: 5 });
    expect(toTimelineMs(clip, 2)).toBe(3000);
  });
});
