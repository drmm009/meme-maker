// Auto-saved video editor draft in IndexedDB, in its own database so the gallery's is untouched.
// DB: meme-creator-video / stores: drafts (one record, id 'current'), media (uploaded files by key).
// Uploaded files only exist as blob: URLs, which die with the page, so their Blobs are stored too.

const DB_NAME = 'meme-creator-video';
const DB_VERSION = 1;
const DRAFTS = 'drafts';
const MEDIA = 'media';
const DRAFT_ID = 'current';

export const PROJECT_KEYS = ['items', 'duration', 'canvasAspectRatio', 'backgroundColor', 'layoutId', 'layoutSlots', 'gridOverlayUrl'];

const isBlobUrl = (u) => typeof u === 'string' && u.startsWith('blob:');

// The parts of the editor state that make up the project.
export const projectFromState = (state) =>
  Object.fromEntries(PROJECT_KEYS.filter((k) => state[k] !== undefined).map((k) => [k, state[k]]));

// blob: URLs the project depends on (clip sources and generated thumbnails).
export const collectBlobUrls = (items) => {
  const urls = new Set();
  for (const item of items) for (const u of [item.url, item.thumbnailUrl]) if (isBlobUrl(u)) urls.add(u);
  return [...urls];
};

// Rebuild a project from a saved draft: stored Blobs get fresh URLs; clips whose file is missing are dropped.
export const restoreProject = (draft, media, makeUrl) => {
  const fresh = new Map();
  for (const [key, blob] of Object.entries(media)) if (blob) fresh.set(key, makeUrl(blob));
  const fix = (u) => (isBlobUrl(u) ? fresh.get(u) ?? null : u);
  const items = (draft.project.items || [])
    .map((i) => ({ ...i, url: fix(i.url), thumbnailUrl: fix(i.thumbnailUrl) }))
    .filter((i) => i.type === 'text' || i.url);
  return { ...draft.project, items };
};

let dbPromise = null;
const openDB = () => {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB unavailable'));
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(DRAFTS)) db.createObjectStore(DRAFTS, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(MEDIA)) db.createObjectStore(MEDIA);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    dbPromise.catch(() => { dbPromise = null; });
  }
  return dbPromise;
};

const run = (storeName, mode, fn) => openDB().then((db) => new Promise((resolve, reject) => {
  const t = db.transaction(storeName, mode);
  const req = fn(t.objectStore(storeName));
  t.oncomplete = () => resolve(req?.result);
  t.onerror = () => reject(t.error);
  t.onabort = () => reject(t.error);
}));

// Media keys already written this session, so a big video is stored once rather than on every save.
const storedMedia = new Set();

export async function saveVideoDraft(state) {
  const project = projectFromState(state);
  const urls = collectBlobUrls(project.items || []);
  for (const url of urls) {
    if (storedMedia.has(url)) continue;
    const blob = await (await fetch(url)).blob();
    await run(MEDIA, 'readwrite', (s) => s.put(blob, url));
    storedMedia.add(url);
  }
  await run(DRAFTS, 'readwrite', (s) => s.put({ id: DRAFT_ID, savedAt: Date.now(), project, mediaKeys: urls }));
  // Drop files no clip uses any more.
  const keys = await run(MEDIA, 'readonly', (s) => s.getAllKeys());
  const stale = keys.filter((k) => !urls.includes(k));
  if (stale.length) await run(MEDIA, 'readwrite', (s) => { stale.forEach((k) => { s.delete(k); storedMedia.delete(k); }); });
}

// The saved draft and its files, or null.
export async function loadVideoDraft() {
  const draft = await run(DRAFTS, 'readonly', (s) => s.get(DRAFT_ID));
  if (!draft?.project?.items?.length) return null;
  const media = {};
  for (const key of draft.mediaKeys || []) media[key] = await run(MEDIA, 'readonly', (s) => s.get(key));
  return { draft, media };
}
