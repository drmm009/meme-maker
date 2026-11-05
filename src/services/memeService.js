import { MEME_TEMPLATES as LOCAL_TEMPLATES, VIDEO_MEME_TEMPLATES as LOCAL_VIDEO_TEMPLATES } from '../data/templates';
import { fromImgflip, fromMemegen, mergeTemplates } from '../utils/memeTemplateSources';

// In-memory cache for open-source API templates
let cachedTemplates = null;
let cachedVideoTemplates = null;

// Fetches JSON, giving up after `ms`.
const fetchJson = async (url, ms = 8000) => {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
};

/**
 * The curated templates plus Imgflip's top 100 and memegen.link's ~200, each meme once
 * (see utils/memeTemplateSources). Either site may be down; whatever loads is used, and with
 * neither the curated templates alone.
 */
export async function fetchOpenSourceMemes() {
  if (cachedTemplates) {
    return cachedTemplates;
  }

  const [imgflip, memegen] = await Promise.allSettled([
    fetchJson('https://api.imgflip.com/get_memes').then((data) => (data.success && Array.isArray(data.data?.memes) ? data.data.memes.map(fromImgflip) : [])),
    fetchJson('https://api.memegen.link/templates').then((list) => (Array.isArray(list) ? list.filter((t) => t?.id && t?.blank).map(fromMemegen) : [])),
  ]);
  for (const r of [imgflip, memegen]) {
    if (r.status === 'rejected') console.warn('A meme template source is offline; using the others:', r.reason);
  }
  const online = [imgflip, memegen].flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  const merged = mergeTemplates(LOCAL_TEMPLATES, online);
  // Keep trying next time while nothing online came through.
  if (online.length) cachedTemplates = merged;
  return merged;
}

/**
 * Fetches viral video meme templates from Giphy API & Open Source Repositories
 * with instant fallback to local curated video templates.
 * Requires VITE_GIPHY_API_KEY — otherwise returns local templates only (no hardcoded key).
 */
export async function fetchOpenSourceVideoMemes() {
  if (cachedVideoTemplates) {
    return cachedVideoTemplates;
  }

  const giphyKey = import.meta.env.VITE_GIPHY_API_KEY;
  if (!giphyKey) {
    cachedVideoTemplates = LOCAL_VIDEO_TEMPLATES;
    return LOCAL_VIDEO_TEMPLATES;
  }

  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 8000);
    const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(giphyKey)}&q=meme&limit=30&rating=g`, { signal: ctl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`Giphy HTTP ${res.status}`);
    const data = await res.json();

    if (data.data && Array.isArray(data.data)) {
      const giphyMemes = data.data
        .filter((g) => g.images?.original_mp4?.mp4 || g.images?.looping?.mp4)
        .map((g, index) => {
          const mp4Url = g.images?.original_mp4?.mp4 || g.images?.looping?.mp4;
          const cleanTitle = (g.title || 'Meme Video')
            .replace(/\bGIF\b/gi, '')
            .replace(/\bMeme\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim() || 'Viral Meme Clip';

          return {
            id: `giphy-${g.id}`,
            name: cleanTitle,
            category: 'reaction',
            tag: 'free',
            mediaType: 'video',
            imageUrl: mp4Url,
            rawImageUrl: mp4Url,
            width: parseInt(g.images?.original?.width || '800', 10),
            height: parseInt(g.images?.original?.height || '450', 10),
            defaultCaptions: [
              { text: 'WHEN YOU SEE THIS MEME', x: 0.5, y: 0.15, fontSize: 32, color: '#ffffff', stroke: '#000000', align: 'center', fontFamily: 'Impact, sans-serif' },
              { text: 'BOTTOM TEXT', x: 0.5, y: 0.85, fontSize: 32, color: '#ffffff', stroke: '#000000', align: 'center', fontFamily: 'Impact, sans-serif' }
            ],
            trendingScore: 100 - index
          };
        });

      cachedVideoTemplates = [...LOCAL_VIDEO_TEMPLATES, ...giphyMemes];
      return cachedVideoTemplates;
    }
  } catch (err) {
    console.warn('Giphy API offline. Falling back to local video templates dataset:', err);
  }

  cachedVideoTemplates = LOCAL_VIDEO_TEMPLATES;
  return LOCAL_VIDEO_TEMPLATES;
}
