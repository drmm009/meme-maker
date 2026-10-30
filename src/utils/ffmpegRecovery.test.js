// @vitest-environment jsdom
// A crashed or stuck FFmpeg never hangs a job: the command fails with FFmpegCrashedError, that
// FFmpeg is thrown away, and the next job (or the export's one retry) gets a fresh one.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const ff = vi.hoisted(() => ({ created: 0, terminated: 0, behaviour: [], execs: [] }));

vi.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: class {
    constructor() { ff.created++; this.listeners = []; this.pending = []; }
    async load() {}
    on(_, fn) { this.listeners.push(fn); }
    off(_, fn) { this.listeners = this.listeners.filter((l) => l !== fn); }
    async writeFile() {}
    // Each command takes the next behaviour: 'ok', 'ok-aborted' (prints "Aborted()" as it exits,
    // as the real core does), 'abort' (the engine dies and the command never returns) or 'hang'
    // (silent, never returns).
    exec(args) {
      ff.execs.push(args);
      const how = ff.behaviour.shift() || 'ok';
      if (how === 'ok') return Promise.resolve(0);
      if (how === 'ok-aborted') {
        this.listeners.forEach((l) => l({ type: 'stderr', message: 'Aborted()' }));
        return Promise.resolve(0);
      }
      return new Promise((resolve, reject) => {
        this.pending.push(reject);
        if (how === 'abort') this.listeners.forEach((l) => l({ type: 'stderr', message: 'Aborted()' }));
      });
    }
    async readFile() { return new Uint8Array([1, 2, 3]); }
    async deleteFile() {}
    terminate() {
      ff.terminated++;
      this.pending.forEach((reject) => reject(new Error('called FFmpeg.terminate()')));
      this.pending = [];
    }
  }
}));
vi.mock('@ffmpeg/util', () => ({ fetchFile: async () => new Uint8Array([1, 2]), toBlobURL: async (u) => u }));
vi.mock('./gridHelper', () => ({ generateGridImage: () => null }));
vi.mock('./webCodecsExport', () => ({ canEncodeMp4: async () => false }));

// Tests share a module cache (isolate: false): load the export fresh, so it uses this file's mocks.
vi.resetModules();
const { FFmpegCrashedError, exportVideoFFmpeg, loadFFmpeg, runFFmpeg } = await import('./ffmpegExport');

beforeEach(() => {
  ff.behaviour = [];
  ff.execs = [];
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.useRealTimers());

describe('runFFmpeg', () => {
  it('passes a normal command\'s return code through', async () => {
    const first = await loadFFmpeg();
    expect(await runFFmpeg(first, ['-version'])).toBe(0);
    expect(await loadFFmpeg()).toBe(first);
  });

  it('takes "Aborted()" printed by a command that then returns as a normal exit', async () => {
    vi.useFakeTimers();
    const first = await loadFFmpeg();
    const terminated = ff.terminated;
    ff.behaviour = ['ok-aborted'];
    expect(await runFFmpeg(first, ['-i', 'x', 'out.gif'])).toBe(0);
    await vi.advanceTimersByTimeAsync(5000);
    expect(ff.terminated).toBe(terminated);
    expect(await loadFFmpeg()).toBe(first);
  });

  it('fails when the engine aborts, and the next load is a fresh FFmpeg', async () => {
    const first = await loadFFmpeg();
    const terminated = ff.terminated;
    ff.behaviour = ['abort'];
    await expect(runFFmpeg(first, ['-i', 'x'])).rejects.toBeInstanceOf(FFmpegCrashedError);
    expect(ff.terminated).toBe(terminated + 1);
    const second = await loadFFmpeg();
    expect(second).not.toBe(first);
    expect(await runFFmpeg(second, ['-version'])).toBe(0);
  });

  it('gives up on a command that goes silent for a minute', async () => {
    vi.useFakeTimers();
    const first = await loadFFmpeg();
    ff.behaviour = ['hang'];
    const run = expect(runFFmpeg(first, ['-i', 'x'])).rejects.toThrow('stopped responding');
    await vi.advanceTimersByTimeAsync(66000);
    await run;
    expect(await loadFFmpeg()).not.toBe(first);
  });
});

describe('export after a crash', () => {
  const text = { id: 't', type: 'text', text: 'HI', startMs: 0, endMs: 1000 };
  const run = () => exportVideoFFmpeg([text], 1000, 16 / 9, { width: 800, height: 450 }, null, () => {}, { download: false });

  it('tries once more on a fresh FFmpeg', async () => {
    const created = ff.created;
    ff.behaviour = ['abort'];
    const { blob } = await run();
    expect(blob.size).toBe(3);
    expect(ff.created).toBe(created + 1);
    expect(ff.execs).toHaveLength(2);
  });

  it('reports the crash if the second try crashes too', async () => {
    ff.behaviour = ['abort', 'abort'];
    await expect(run()).rejects.toBeInstanceOf(FFmpegCrashedError);
    expect(ff.execs).toHaveLength(2);
  });
});
