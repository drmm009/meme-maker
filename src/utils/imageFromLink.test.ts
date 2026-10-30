// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { fetchMediaLink, linkIn } from './imageFromLink';

const respond = (body: Blob | null, ok = true) => (async () => {
  if (!body) throw new TypeError('Failed to fetch');
  return { ok, status: ok ? 200 : 404, blob: async () => body } as unknown as Response;
}) as unknown as typeof fetch;

describe('pictures from a link', () => {
  it('finds a single web link in pasted text', () => {
    expect(linkIn('  https://i.imgflip.com/1ur9b0.jpg  ')).toBe('https://i.imgflip.com/1ur9b0.jpg');
    expect(linkIn('hello world')).toBeNull();
    expect(linkIn('javascript:alert(1)')).toBeNull();
    expect(linkIn('')).toBeNull();
  });

  it('keeps a picture as a data URL', async () => {
    const url = await fetchMediaLink('https://x.test/a.png', respond(new Blob(['png'], { type: 'image/png' })));
    expect(url.startsWith('data:image/png')).toBe(true);
  });

  it('says why a link can\'t be used', async () => {
    await expect(fetchMediaLink('not a link', respond(null))).rejects.toMatchObject({ problem: 'not-a-link' });
    await expect(fetchMediaLink('https://x.test/a.png', respond(null))).rejects.toMatchObject({ problem: 'blocked' });
    await expect(fetchMediaLink('https://x.test/page', respond(new Blob(['<html>'], { type: 'text/html' })))).rejects.toMatchObject({ problem: 'not-a-picture' });
  });
});
