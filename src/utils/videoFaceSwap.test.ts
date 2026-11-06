// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cutArgs, jobStatus, muxArgs, runServerSwap } from './videoFaceSwap';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const swap = { face: 'data:image/jpeg;base64,AA==', video: new Blob(['v'], { type: 'video/mp4' }), faces: 1, referenceMs: 1200.4, strength: 0.8, quality: 'fast' as const };

afterEach(() => vi.unstubAllGlobals());

describe('video face swap', () => {
  it('cuts the section at most 720p, silent when asked', () => {
    const args = cutArgs({ startSec: 1.5, lengthSec: 4 });
    expect(args.slice(0, 4)).toEqual(['-ss', '1.500', '-t', '4.000']);
    expect(args.join(' ')).toContain('min(720,iw)');
    expect(args).toContain('aac');
    expect(cutArgs({ startSec: 0, lengthSec: 1, withAudio: false })).toContain('-an');
  });

  it('puts the sound back only if the section has some', () => {
    expect(muxArgs().join(' ')).toContain('-map 0:v:0 -map 1:a:0?');
  });

  it('starts a job, follows it and fetches the frames', async () => {
    const calls: { url: string; body?: Record<string, unknown> }[] = [];
    let polls = 0;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      if (url === '/api/face-swap/video') return json({ success: true, job: 'j1' });
      if (url === '/api/face-swap/video/j1') return json(polls++ ? { status: 'done', done: 10, total: 10, fps: 25 } : { status: 'running', done: 3, total: 10 });
      if (url === '/api/face-swap/video/j1/result') return new Response('frames', { headers: { 'Content-Type': 'video/x-msvideo' } });
      throw new Error(`unexpected ${url}`);
    }));
    const progress = vi.fn();
    const { frames, durationMs } = await runServerSwap(swap, { onProgress: progress, pollMs: 0 });
    expect(await frames.text()).toBe('frames');
    expect(durationMs).toBe(400);
    expect(calls[0].body).toMatchObject({ target_face_index: 1, swap_all: false, reference_ms: 1200, blend_ratio: 0.8, every: 4 });
    expect(String(calls[0].body?.video)).toMatch(/^data:video\/mp4;base64,/);
    expect(progress).toHaveBeenCalledWith({ phase: 'swap', done: 3, total: 10 });
  });

  it('passes on the server\'s reason when the swap fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (url === '/api/face-swap/video'
      ? json({ job: 'j2' })
      : json({ status: 'error', error: 'No face found in this clip to swap.' }))));
    await expect(runServerSwap({ ...swap, faces: 'all' }, { pollMs: 0 })).rejects.toThrow('No face found in this clip to swap.');
  });

  it('cancels the job on the server when stopped', async () => {
    const controller = new AbortController();
    const urls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      urls.push(url);
      if (url === '/api/face-swap/video') return json({ job: 'j3' });
      if (url.endsWith('/cancel')) return json({ success: true });
      controller.abort();
      return json({ status: 'running', done: 1, total: 9 });
    }));
    await expect(runServerSwap(swap, { signal: controller.signal, pollMs: 50 })).rejects.toThrow('Cancelled');
    expect(urls).toContain('/api/face-swap/video/j3/cancel');
  });

  it('says how far the job has got and roughly how long is left', () => {
    expect(jobStatus({ phase: 'prepare', startedAt: 0 }).text).toBe('Getting the clip ready…');
    expect(jobStatus({ phase: 'swap', done: 1, total: 40, startedAt: 0 }, 5000).text).toBe('Swapping frame 2 of 40…');
    // 10 frames in 20s: 30 more take a minute.
    expect(jobStatus({ phase: 'swap', done: 10, total: 40, startedAt: 0, swapStartedAt: 0 }, 20_000)).toEqual({ text: 'Swapping frame 11 of 40 · about 1 min left', value: 0.25 });
    expect(jobStatus({ phase: 'swap', done: 30, total: 40, startedAt: 0 }, 30_000).text).toContain('about 10 s left');
  });
});
