import { describe, it, expect } from 'vitest';
import { cameraConstraints, pickVideoType } from './cameraRecorder';

describe('cameraRecorder', () => {
  it('prefers MP4, then WebM, then whatever the browser has', () => {
    expect(pickVideoType(() => true)).toBe('video/mp4;codecs=avc1,mp4a');
    expect(pickVideoType((t) => t.startsWith('video/webm'))).toBe('video/webm;codecs=vp9,opus');
    expect(pickVideoType(() => false)).toBe('');
  });

  it('asks for the chosen camera at up to 720p, with sound', () => {
    const c = cameraConstraints('environment');
    expect(c.video).toMatchObject({ facingMode: 'environment', height: { ideal: 720 } });
    expect(c.audio).toBeTruthy();
  });
});
