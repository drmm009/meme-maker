import { describe, it, expect } from 'vitest';
import { parseFfmpegTime, overallPercent, etaSeconds, formatEta } from './exportProgress';

describe('exportProgress', () => {
  it('reads the rendered time from FFmpeg log lines', () => {
    expect(parseFfmpegTime('frame=   42 fps=12 q=28.0 size=  256kB time=00:00:01.40 bitrate=1497.3kbits/s speed=0.4x')).toBeCloseTo(1.4);
    expect(parseFfmpegTime('time=01:02:03.5')).toBeCloseTo(3723.5);
    expect(parseFfmpegTime('time=-577014:32:22.77 bitrate=N/A')).toBe(null);
    expect(parseFfmpegTime('Stream mapping:')).toBe(null);
  });

  it('splits the bar between preparing and rendering', () => {
    expect(overallPercent('preparing', 0)).toBe(0);
    expect(overallPercent('preparing', 1)).toBe(15);
    expect(overallPercent('rendering', 0)).toBe(15);
    expect(overallPercent('rendering', 0.5)).toBeCloseTo(57.5);
    expect(overallPercent('rendering', 2)).toBe(100);
  });

  it('estimates time left once there is enough progress', () => {
    expect(etaSeconds(10000, 0.01)).toBe(null);
    expect(etaSeconds(10000, 0.25)).toBe(30);
    expect(etaSeconds(10000, 1)).toBe(null);
    expect(formatEta(30)).toBe('about 30s left');
    expect(formatEta(150)).toBe('about 3 min left');
    expect(formatEta(null)).toBe(null);
  });
});
