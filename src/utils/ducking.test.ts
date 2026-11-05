import { describe, it, expect } from 'vitest';
import { DUCK_LEVEL, duckGain, duckVolume, voiceSpans } from './ducking';

const voice = (startMs: number, endMs: number, extra = {}) => ({ type: 'audio', isVoiceover: true, url: 'blob:v', startMs, endMs, ...extra });
const video = (startMs: number, endMs: number, extra = {}) => ({ type: 'video', url: 'blob:x', startMs, endMs, ...extra });
const music = { type: 'audio', url: 'blob:m', startMs: 0, endMs: 10000 };

describe('voiceSpans', () => {
  it('takes heard voiceovers and videos, not music, muted or hidden clips', () => {
    expect(voiceSpans([music, voice(1000, 2000), video(4000, 5000, { muted: true }), voice(6000, 7000, { hidden: true })]))
      .toEqual([{ start: 1000, end: 2000 }]);
  });

  it('joins clips with short gaps, keeps long gaps apart', () => {
    expect(voiceSpans([voice(1000, 2000), video(2300, 3000), voice(5000, 6000)]))
      .toEqual([{ start: 1000, end: 3000 }, { start: 5000, end: 6000 }]);
  });
});

describe('duckGain', () => {
  const spans = [{ start: 1000, end: 2000 }];

  it('is full volume away from voice and down during it, easing in and out', () => {
    expect(duckGain(spans, 0)).toBe(1);
    expect(duckGain(spans, 1500)).toBe(DUCK_LEVEL);
    expect(duckGain(spans, 875)).toBeCloseTo((1 + DUCK_LEVEL) / 2);
    expect(duckGain(spans, 2125)).toBeCloseTo((1 + DUCK_LEVEL) / 2);
    expect(duckGain(spans, 2500)).toBe(1);
    expect(duckGain([], 1500)).toBe(1);
  });
});

describe('duckVolume', () => {
  it('is a plain volume with no voice to duck under', () => {
    expect(duckVolume(0.8, [])).toBe('volume=0.8');
  });

  it('builds the same curve as an expression on the output clock', () => {
    expect(duckVolume(1, [{ start: 1000, end: 2000 }]))
      .toBe("volume='1*(1-0.750*clip(min((t-(0.750))/0.250,(2.250-t)/0.250),0,1))':eval=frame");
  });
});
