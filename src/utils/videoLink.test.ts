import { describe, it, expect, vi, afterEach } from 'vitest';
import { LinkError, loadVideoLink, parseVideoLink } from './videoLink';

const video = (bytes = 4, headers: Record<string, string> = {}) =>
  new Response(new Uint8Array(bytes), { status: 200, headers: { 'content-type': 'video/mp4', ...headers } });
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

afterEach(() => vi.unstubAllGlobals());

describe('parseVideoLink', () => {
  it('finds the link in shared text and names the site', () => {
    expect(parseVideoLink('lol look https://www.tiktok.com/@me/video/123?is_from=app!')).toEqual({
      url: 'https://www.tiktok.com/@me/video/123?is_from=app', kind: 'site', site: 'TikTok',
    });
    expect(parseVideoLink('https://youtu.be/abc')?.site).toBe('YouTube');
    expect(parseVideoLink('https://x.com/a/status/1')?.site).toBe('X');
    expect(parseVideoLink('instagram.com/reel/xyz/')).toMatchObject({ url: 'https://instagram.com/reel/xyz/', site: 'Instagram' });
  });

  it('tells a video file from a page', () => {
    expect(parseVideoLink('https://cdn.example.com/clips/cat.MP4')).toMatchObject({ kind: 'file', site: null });
    expect(parseVideoLink('https://example.com/watch')).toMatchObject({ kind: 'site', site: null });
  });

  it('ignores text without a link', () => {
    expect(parseVideoLink('')).toBeNull();
    expect(parseVideoLink('just words')).toBeNull();
    expect(parseVideoLink('ftp://example.com/a.mp4')).toBeNull();
  });
});

describe('loadVideoLink', () => {
  it('loads a video file straight from its site', async () => {
    const fetch = vi.fn(async () => video(10));
    vi.stubGlobal('fetch', fetch);
    const file = await loadVideoLink(parseVideoLink('https://cdn.example.com/cat%20clip.mp4')!);
    expect(file.name).toBe('cat clip.mp4');
    expect(file.size).toBe(10);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('sends a file its site blocks to the helper', async () => {
    const fetch = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(video(6, { 'x-video-title': encodeURIComponent('Cat') }));
    vi.stubGlobal('fetch', fetch);
    const file = await loadVideoLink(parseVideoLink('https://cdn.example.com/cat.mp4')!);
    expect(file.name).toBe('Cat');
    expect(fetch.mock.calls[1][0]).toBe('./api/video-link');
  });

  it('says the helper is off when no address answers as it', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response('<html>', { status: 404 }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetch);
    await expect(loadVideoLink(parseVideoLink('https://www.tiktok.com/@a/video/1')!)).rejects.toMatchObject({ code: 'server-off' });
    expect(fetch.mock.calls[1][0]).toBe('http://127.0.0.1:5175/api/video-link');
  });

  it('passes on what the helper says went wrong', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(403, { detail: { code: 'private', message: 'Private post' } })));
    const err = await loadVideoLink(parseVideoLink('https://instagram.com/reel/1')!).catch((e) => e);
    expect(err).toBeInstanceOf(LinkError);
    expect(err.code).toBe('private');
    expect(err.message).toBe('Private post');
  });

  it('stops a video over the size limit', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => video(4, { 'content-length': String(300 * 1024 * 1024) })));
    await expect(loadVideoLink(parseVideoLink('https://cdn.example.com/big.mp4')!)).rejects.toMatchObject({ code: 'too-big' });
  });
});

describe('loadVideoLink when the helper never answers', () => {
  it('gives up with a message, and Cancel still cancels', async () => {
    vi.useFakeTimers();
    const hang = (_: unknown, init?: RequestInit) => new Promise<Response>((_res, rej) => {
      init?.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')));
    });
    vi.stubGlobal('fetch', vi.fn(hang));
    const slow = loadVideoLink(parseVideoLink('https://instagram.com/reel/1')!).catch((e) => e);
    await vi.advanceTimersByTimeAsync(150_000);
    expect(await slow).toMatchObject({ code: 'failed', message: expect.stringMatching(/too long/) });

    const ctrl = new AbortController();
    const cancelled = loadVideoLink(parseVideoLink('https://instagram.com/reel/1')!, { signal: ctrl.signal }).catch((e) => e);
    ctrl.abort();
    expect((await cancelled).name).toBe('AbortError');
    vi.useRealTimers();
  });
});
