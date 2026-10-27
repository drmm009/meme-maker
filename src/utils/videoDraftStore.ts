// Auto-saved video editor draft in IndexedDB, in its own database so the gallery's is untouched.
// DB: meme-creator-video / stores: drafts (one record, id 'current'), media (uploaded files by key).
// Uploaded files only exist as blob: URLs, which die with the page, so their Blobs are stored too.
import { VIDEO_PROJECT_VERSION, migrateVideoProject } from '../model/videoProject';
import type { Clip, VideoProject } from '../model/videoProject';

const DB_NAME = 'meme-creator-video';
const DB_VERSION = 1;
const DRAFTS = 'drafts';
const MEDIA = 'media';
const DRAFT_ID = 'current';

export const PROJECT_KEYS = ['items', 'duration', 'canvasAspectRatio', 'backgroundColor', 'layoutId', 'layoutSlots', 'gridOverlayUrl'] as const;

// The saved record. `version` is the project format (absent on drafts saved before versioning).
export interface VideoDraft {
  id: typeof DRAFT_ID;
  version?: number;
  savedAt: number;
  project: VideoProject;
  mediaKeys: string[];
}

const isBlobUrl = (u: unknown): u is string => typeof u === 'string' && u.startsWith('blob:');

// The parts of the editor state that make up the project.
export const projectFromState = (state: Partial<VideoProject> & Record<string, unknown>): VideoProject =>
  Object.fromEntries(PROJECT_KEYS.filter((k) => state[k] !== undefined).map((k) => [k, state[k]])) as unknown as VideoProject;

// blob: URLs the project depends on (clip sources and generated thumbnails).
export const collectBlobUrls = (items: Clip[]): string[] => {
  const urls = new Set<string>();
  for (const item of items) {
    for (const u of ['url' in item ? item.url : undefined, 'thumbnailUrl' in item ? item.thumbnailUrl : undefined]) {
      if (isBlobUrl(u)) urls.add(u);
    }
  }
  return [...urls];
};

// Rebuild a project from a saved draft: stored Blobs get fresh URLs; clips whose file is missing are dropped.
export const restoreProject = (draft: Pick<VideoDraft, 'project'>, media: Record<string, Blob | undefined>, makeUrl: (blob: Blob) => string): VideoProject => {
  const fresh = new Map<string, string>();
  for (const [key, blob] of Object.entries(media)) if (blob) fresh.set(key, makeUrl(blob));
  const fix = <T>(u: T): T | string | null => (isBlobUrl(u) ? fresh.get(u) ?? null : u);
  const items = (draft.project.items || [])
    .map((i) => ({ ...i, ...('url' in i ? { url: fix(i.url) } : {}), ...('thumbnailUrl' in i ? { thumbnailUrl: fix(i.thumbnailUrl) } : {}) }) as Clip)
    .filter((i) => i.type === 'text' || ('url' in i && i.url));
  return { ...draft.project, items };
};

let dbPromise: Promise<IDBDatabase> | null = null;
const openDB = (): Promise<IDBDatabase> => {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB unavailable'));
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
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

const run = <T>(storeName: string, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> =>
  openDB().then((db) => new Promise<T | undefined>((resolve, reject) => {
    const t = db.transaction(storeName, mode);
    const req = fn(t.objectStore(storeName));
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));

// Media keys already written this session, so a big video is stored once rather than on every save.
const storedMedia = new Set<string>();

export async function saveVideoDraft(state: Partial<VideoProject> & Record<string, unknown>): Promise<void> {
  const project = projectFromState(state);
  const urls = collectBlobUrls(project.items || []);
  for (const url of urls) {
    if (storedMedia.has(url)) continue;
    const blob = await (await fetch(url)).blob();
    await run(MEDIA, 'readwrite', (s) => s.put(blob, url));
    storedMedia.add(url);
  }
  const draft: VideoDraft = { id: DRAFT_ID, version: VIDEO_PROJECT_VERSION, savedAt: Date.now(), project, mediaKeys: urls };
  await run(DRAFTS, 'readwrite', (s) => s.put(draft));
  // Drop files no clip uses any more.
  const keys = (await run<IDBValidKey[]>(MEDIA, 'readonly', (s) => s.getAllKeys())) || [];
  const stale = keys.filter((k): k is string => typeof k === 'string' && !urls.includes(k));
  if (stale.length) await run(MEDIA, 'readwrite', (s) => { stale.forEach((k) => { s.delete(k); storedMedia.delete(k); }); });
}

// The saved draft (its project upgraded to the current version) and its files, or null when there
// is none, it's empty, or it can't be read.
export async function loadVideoDraft(): Promise<{ draft: VideoDraft; media: Record<string, Blob | undefined> } | null> {
  const saved = await run<VideoDraft>(DRAFTS, 'readonly', (s) => s.get(DRAFT_ID));
  const project = saved ? migrateVideoProject(saved.project, saved.version ?? 0) : null;
  if (!saved || !project?.items.length) return null;
  const media: Record<string, Blob | undefined> = {};
  for (const key of saved.mediaKeys || []) media[key] = await run<Blob>(MEDIA, 'readonly', (s) => s.get(key));
  return { draft: { ...saved, version: VIDEO_PROJECT_VERSION, project }, media };
}
