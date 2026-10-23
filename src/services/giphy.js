// Giphy search for animated stickers (transparent) and GIFs. Needs VITE_GIPHY_API_KEY.
const GIPHY_KEY = import.meta.env.VITE_GIPHY_API_KEY || '';

export const hasGiphyKey = () => Boolean(GIPHY_KEY);

// kind: 'stickers' or 'gifs'; no query means trending.
export const giphyUrl = ({ kind, query, key = GIPHY_KEY, limit = 30, offset = 0 }) => {
  const q = (query || '').trim();
  const params = new URLSearchParams({ api_key: key, limit: String(limit), offset: String(offset), rating: 'g' });
  if (q) params.set('q', q);
  return `https://api.giphy.com/v1/${kind === 'gifs' ? 'gifs' : 'stickers'}/${q ? 'search' : 'trending'}?${params}`;
};

// One Giphy result as the picker needs it: a small animated preview and a 200px-wide GIF to add.
export const toGifResult = (g) => {
  const small = g?.images?.fixed_width_small || g?.images?.fixed_width;
  const main = g?.images?.fixed_width || g?.images?.downsized;
  if (!small?.url || !main?.url) return null;
  return {
    id: g.id,
    title: g.title || 'GIF',
    preview: small.webp || small.url,
    url: main.url,
    width: Number(main.width) || 200,
    height: Number(main.height) || 200,
  };
};

export async function searchGiphy({ kind, query, offset = 0, signal }) {
  if (!GIPHY_KEY) return [];
  const res = await fetch(giphyUrl({ kind, query, offset }), { signal });
  if (!res.ok) throw new Error(`Giphy responded ${res.status}`);
  const data = await res.json();
  return (data.data || []).map(toGifResult).filter(Boolean);
}
