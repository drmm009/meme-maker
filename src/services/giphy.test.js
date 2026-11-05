// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { GIPHY_PAGE, appendPage, giphyUrl, hasMorePages, readRecentGifs, rememberGif, toGifResult } from './giphy';

describe('giphy', () => {
  it('builds trending and search URLs for stickers and GIFs', () => {
    const trending = new URL(giphyUrl({ kind: 'stickers', key: 'K' }));
    expect(trending.pathname).toBe('/v1/stickers/trending');
    expect(trending.searchParams.get('q')).toBe(null);
    expect(trending.searchParams.get('rating')).toBe('g');
    const search = new URL(giphyUrl({ kind: 'gifs', query: ' bruh moment ', key: 'K', offset: 30 }));
    expect(search.pathname).toBe('/v1/gifs/search');
    expect(search.searchParams.get('q')).toBe('bruh moment');
    expect(search.searchParams.get('offset')).toBe('30');
  });

  it('pages until a short page or Giphy’s last offset, without repeats', () => {
    expect(hasMorePages(GIPHY_PAGE, 0)).toBe(true);
    expect(hasMorePages(12, 30)).toBe(false);
    expect(hasMorePages(GIPHY_PAGE, 4980)).toBe(false);
    expect(appendPage([{ id: 'a' }, { id: 'b' }], [{ id: 'b' }, { id: 'c' }]).map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('remembers the last picks per kind, newest first', () => {
    localStorage.removeItem('meme_recent_gifs');
    const gif = (id) => ({ id, title: id, preview: `p/${id}`, url: `u/${id}`, width: 200, height: 200 });
    rememberGif('gifs', gif('a'));
    rememberGif('gifs', gif('b'));
    rememberGif('gifs', gif('a'));
    expect(readRecentGifs('gifs').map((r) => r.id)).toEqual(['a', 'b']);
    expect(readRecentGifs('stickers').some((r) => r.id === 'a')).toBe(false);
    localStorage.removeItem('meme_recent_gifs');
  });

  it('maps a result to a preview and a 200px GIF', () => {
    const g = {
      id: 'abc',
      title: 'Dancing Cat Sticker',
      images: {
        fixed_width_small: { url: 'https://m/100w.gif', webp: 'https://m/100w.webp' },
        fixed_width: { url: 'https://m/200w.gif?cid=1', width: '200', height: '150' },
      },
    };
    expect(toGifResult(g)).toEqual({ id: 'abc', title: 'Dancing Cat Sticker', preview: 'https://m/100w.webp', url: 'https://m/200w.gif?cid=1', width: 200, height: 150 });
    expect(toGifResult({ id: 'x', images: {} })).toBe(null);
  });
});
