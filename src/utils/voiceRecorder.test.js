import { describe, it, expect } from 'vitest';
import { pickRecordingType, extensionForType } from './voiceRecorder';

describe('voiceRecorder', () => {
  it('prefers Opus in WebM, then whatever the browser has', () => {
    expect(pickRecordingType(() => true)).toBe('audio/webm;codecs=opus');
    expect(pickRecordingType((t) => t === 'audio/mp4')).toBe('audio/mp4');
    expect(pickRecordingType(() => false)).toBe('');
  });

  it('names recordings so FFmpeg reads them right', () => {
    expect(extensionForType('audio/webm;codecs=opus')).toBe('webm');
    expect(extensionForType('audio/mp4')).toBe('m4a');
    expect(extensionForType('audio/ogg;codecs=opus')).toBe('ogg');
    expect(extensionForType('')).toBe('mp3');
  });
});
