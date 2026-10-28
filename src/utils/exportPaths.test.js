// @vitest-environment jsdom
// Which export path runs: frame by frame with WebCodecs (sound mixed by FFmpeg, or no FFmpeg at
// all when silent), or the whole render in FFmpeg as the fallback and for GIFs.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const ff = vi.hoisted(() => ({ created: 0, execs: [], writes: [] }));
const frames = vi.hoisted(() => ({ supported: true, fail: null, calls: 0 }));

vi.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: class {
    constructor() { ff.created++; this.loaded = false; }
    async load() { this.loaded = true; }
    on() {}
    off() {}
    async writeFile(name) { ff.writes.push(name); }
    async exec(args) {
      ff.execs.push(args);
      // Sources have sound (the audio probe succeeds).
      return 0;
    }
    async readFile() { return new Uint8Array([7, 7, 7]); }
    async deleteFile() {}
    terminate() {}
  }
}));
vi.mock('@ffmpeg/util', () => ({ fetchFile: async () => new Uint8Array([1, 2]), toBlobURL: async (u) => u }));
vi.mock('./gridHelper', () => ({ generateGridImage: () => null }));
vi.mock('./webCodecsExport', async () => {
  const { ExportCancelledError } = await import('./exportProgress');
  return {
    canEncodeMp4: async () => frames.supported,
    encodeProjectVideo: async ({ onLoaded, onFrame, isCancelled }) => {
      frames.calls++;
      onLoaded();
      if (frames.fail === 'cancel') {
        const { cancelExport } = await import('./ffmpegExport');
        cancelExport();
        if (isCancelled()) throw new ExportCancelledError();
      }
      if (frames.fail) throw new Error(frames.fail);
      onFrame(1, 1);
      return new Uint8Array([9, 9]);
    },
  };
});

import { exportVideoFFmpeg } from './ffmpegExport';
import { ExportCancelledError } from './exportProgress';

beforeEach(() => {
  ff.execs = [];
  ff.writes = [];
  frames.supported = true;
  frames.fail = null;
  frames.calls = 0;
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

const text = { id: 't', type: 'text', text: 'HI', startMs: 0, endMs: 1000 };
const run = (items, options = {}) => exportVideoFFmpeg(items, 1000, 16 / 9, { width: 800, height: 450 }, null, () => {}, { download: false, ...options });

describe('export paths', () => {
  it('uses the encoded picture as is for a silent project, without running FFmpeg', async () => {
    const before = ff.execs.length;
    const { blob, fileName } = await run([text]);
    expect(frames.calls).toBe(1);
    expect(ff.execs.length).toBe(before);
    expect(blob.type).toBe('video/mp4');
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(new Uint8Array([9, 9]));
    expect(fileName).toMatch(/\.mp4$/);
  });

  it('mixes sound onto the picture, copying the picture as is', async () => {
    const items = [
      { id: 'v', type: 'video', url: 'blob:v', startMs: 0, endMs: 1000, trimStartMs: 200 },
      { id: 'a', type: 'audio', url: 'blob:a', mimeType: 'audio/webm', startMs: 500, endMs: 900 },
      { id: 'm', type: 'audio', url: 'blob:m', startMs: 0, endMs: 900, muted: true },
    ];
    const { blob } = await run(items);
    const mix = ff.execs[ff.execs.length - 1];
    expect(mix.slice(0, 2)).toEqual(['-i', 'picture.mp4']);
    expect(mix).toEqual(expect.arrayContaining(['-ss', '0.2', '-i', 'input_2.mp4', '-i', 'audio_3.webm', '-c:v', 'copy', '-movflags', '+faststart']));
    expect(mix).not.toContain('blob:m');
    expect(mix[mix.indexOf('-filter_complex') + 1]).toMatch(/\[1:a\]\[aud2\]\[aud3\]amix=inputs=3/);
    expect(ff.writes).toContain('picture.mp4');
    expect(blob.size).toBe(3);
  });

  it('falls back to rendering everything in FFmpeg when the frame path fails', async () => {
    frames.fail = 'decoder broke';
    await run([text]);
    expect(frames.calls).toBe(1);
    expect(ff.execs[ff.execs.length - 1]).toContain('libx264');
  });

  it('falls back when the browser can\'t encode, and never for GIFs', async () => {
    frames.supported = false;
    await run([text]);
    expect(frames.calls).toBe(0);
    frames.supported = true;
    await run([text], { format: 'gif' });
    expect(frames.calls).toBe(0);
    expect(ff.execs[ff.execs.length - 1]).toContain('output.gif');
  });

  it('stops on cancel instead of falling back', async () => {
    frames.fail = 'cancel';
    const execs = ff.execs.length;
    await expect(run([text])).rejects.toBeInstanceOf(ExportCancelledError);
    expect(ff.execs.length).toBe(execs);
  });
});
