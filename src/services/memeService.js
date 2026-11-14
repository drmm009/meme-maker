import { MEME_TEMPLATES as LOCAL_TEMPLATES } from '../data/templates';
import { fromImgflip, fromMemegen, mergeTemplates } from '../utils/memeTemplateSources';

// In-memory cache for open-source API templates
let cachedTemplates = null;

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
