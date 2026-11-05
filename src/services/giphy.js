// Giphy search for animated stickers (transparent) and GIFs. Needs VITE_GIPHY_API_KEY.
import { safeGet, safeSet } from '../utils/storage';

const GIPHY_KEY = import.meta.env.VITE_GIPHY_API_KEY || '';

// Results per request, and the furthest Giphy pages (its offset stops at 4999).
export const GIPHY_PAGE = 30;
const GIPHY_MAX_OFFSET = 4999;

// Moods to browse by: each searches Giphy for its words; Trending is Giphy's trending list.
export const GIPHY_MOODS = [
  { id: 'trending', label: 'Trending', q: '' },
  { id: 'reactions', label: 'Reactions', q: 'reaction' },
  { id: 'lol', label: 'LOL', q: 'lol funny' },
  { id: 'facepalm', label: 'Facepalm', q: 'facepalm' },
  { id: 'wow', label: 'Wow', q: 'wow shocked' },
  { id: 'dance', label: 'Dance', q: 'dance' },
  { id: 'sad', label: 'Sad', q: 'sad crying' },
  { id: 'love', label: 'Love', q: 'love heart' },
  { id: 'yes', label: 'Yes', q: 'yes thumbs up' },
  { id: 'no', label: 'No', q: 'no nope' },
  { id: 'party', label: 'Party', q: 'party celebrate' },
  { id: 'animals', label: 'Animals', q: 'funny cat dog' },
];

// Whether another page may follow one of `count` results that started at `offset`.
export const hasMorePages = (count, offset) => count >= GIPHY_PAGE && offset + GIPHY_PAGE <= GIPHY_MAX_OFFSET;

// Adds a page to what's shown, without repeats (Giphy sometimes sends one again).
export const appendPage = (shown, page) => {
  const ids = new Set(shown.map((r) => r.id));
  return [...shown, ...page.filter((r) => !ids.has(r.id))];
};

// The last ones picked, per kind (stickers or gifs), newest first.
const RECENT_MAX = 12;
const recentKey = (kind) => (kind === 'gifs' ? 'meme_recent_gifs' : 'meme_recent_giphy_stickers');

export const readRecentGifs = (kind) => {
  const saved = safeGet(recentKey(kind));
  return Array.isArray(saved) ? saved.filter((r) => r && typeof r.id === 'string' && typeof r.url === 'string') : [];
};

export const rememberGif = (kind, result) => {
  const { id, title, preview, url, width, height } = result;
  safeSet(recentKey(kind), [{ id, title, preview, url, width, height }, ...readRecentGifs(kind).filter((r) => r.id !== id)].slice(0, RECENT_MAX));
};

export const hasGiphyKey = () => Boolean(GIPHY_KEY);

// kind: 'stickers' or 'gifs'; no query means trending.
export const giphyUrl = ({ kind, query, key = GIPHY_KEY, limit = GIPHY_PAGE, offset = 0 }) => {
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
