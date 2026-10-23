import { describe, it, expect } from 'vitest';
import { giphyUrl, toGifResult } from './giphy';

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
