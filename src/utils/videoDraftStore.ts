// The video editor's saved work in IndexedDB, in its own database so the gallery's is untouched.
// DB: meme-creator-video / stores: drafts (the auto-saved draft, id 'current'), projects (videos
// saved to My Studio, by id), media (uploaded files by key, shared by the draft and projects).
// Uploaded files only exist as blob: URLs, which die with the page, so their Blobs are stored too.
import { VIDEO_PROJECT_VERSION, migrateVideoProject } from '../model/videoProject';
import type { Clip, VideoProject } from '../model/videoProject';

const DB_NAME = 'meme-creator-video';
const DB_VERSION = 2;
const DRAFTS = 'drafts';
const PROJECTS = 'projects';
const MEDIA = 'media';
const DRAFT_ID = 'current';

export const PROJECT_KEYS = ['items', 'duration', 'canvasAspectRatio', 'backgroundColor', 'layoutId', 'layoutSlots', 'gridOverlayUrl', 'watermark'] as const;

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
    for (const u of ['url' in item ? item.url : undefined, 'thumbnailUrl' in item ? item.thumbnailUrl : undefined, 'originalUrl' in item ? item.originalUrl : undefined]) {
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
    .map((i) => ({
      ...i,
      ...('url' in i ? { url: fix(i.url) } : {}),
      ...('thumbnailUrl' in i ? { thumbnailUrl: fix(i.thumbnailUrl) } : {}),
      ...('originalUrl' in i ? { originalUrl: fix(i.originalUrl) } : {}),
    }) as Clip)
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
        // Version 2: videos saved to My Studio.
        if (!db.objectStoreNames.contains(PROJECTS)) db.createObjectStore(PROJECTS, { keyPath: 'id' });
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

// Stores the files behind a project's blob: URLs (once per session) and returns their keys.
async function storeMedia(project: VideoProject): Promise<string[]> {
  const urls = collectBlobUrls(project.items || []);
  for (const url of urls) {
    if (storedMedia.has(url)) continue;
    const blob = await (await fetch(url)).blob();
    await run(MEDIA, 'readwrite', (s) => s.put(blob, url));
    storedMedia.add(url);
  }
  return urls;
}

// Files neither the draft nor any saved video uses any more.
export const unusedMedia = (keys: IDBValidKey[], inUse: (string[] | undefined)[]): string[] => {
  const used = new Set(inUse.flatMap((k) => k || []));
  return keys.filter((k): k is string => typeof k === 'string' && !used.has(k));
};

async function dropUnusedMedia(): Promise<void> {
  const draft = await run<VideoDraft>(DRAFTS, 'readonly', (s) => s.get(DRAFT_ID));
  const saved = (await run<SavedVideo[]>(PROJECTS, 'readonly', (s) => s.getAll())) || [];
  const keys = (await run<IDBValidKey[]>(MEDIA, 'readonly', (s) => s.getAllKeys())) || [];
  const stale = unusedMedia(keys, [draft?.mediaKeys, ...saved.map((v) => v.mediaKeys)]);
  if (stale.length) await run(MEDIA, 'readwrite', (s) => { stale.forEach((k) => { s.delete(k); storedMedia.delete(k); }); });
}

export async function saveVideoDraft(state: Partial<VideoProject> & Record<string, unknown>): Promise<void> {
  const project = projectFromState(state);
  const urls = await storeMedia(project);
  const draft: VideoDraft = { id: DRAFT_ID, version: VIDEO_PROJECT_VERSION, savedAt: Date.now(), project, mediaKeys: urls };
  await run(DRAFTS, 'readwrite', (s) => s.put(draft));
  await dropUnusedMedia();
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

// A video saved to My Studio: the editable project, a still for its card, and the last exported file
// when it was saved from an export (so My Studio can play, share and download it).
export interface SavedVideo {
  id: string;
  version?: number;
  name: string;
  savedAt: number;
  durationMs: number;
  thumbnail: string;
  project: VideoProject;
  mediaKeys: string[];
  exportBlob?: Blob | null;
}

// What My Studio lists (no project or file bytes).
export interface SavedVideoMeta {
  id: string;
  name: string;
  savedAt: number;
  durationMs: number;
  thumbnail: string;
  exportType: string | null;
}

export const savedVideoMeta = (v: SavedVideo): SavedVideoMeta => ({
  id: v.id,
  name: v.name,
  savedAt: v.savedAt,
  durationMs: v.durationMs,
  thumbnail: v.thumbnail,
  exportType: v.exportBlob?.type || null,
});

// A name for a video: its first line of text, else its first clip's name.
export const videoName = (items: Clip[]): string => {
  const text = items.find((i) => i.type === 'text' && 'text' in i && String(i.text || '').trim());
  const raw = text && 'text' in text ? String(text.text) : items.find((i) => i.name)?.name;
  const name = String(raw || '').replace(/\s+/g, ' ').trim();
  return name ? (name.length > 40 ? `${name.slice(0, 39)}…` : name) : 'My video';
};

// Saves (or, with the id of one saved before, replaces) a video in My Studio. Keeps the previous
// exported file when this save has none.
export async function saveVideoToStudio(
  state: Partial<VideoProject> & Record<string, unknown>,
  { id, thumbnail, durationMs, exportBlob }: { id?: string | null; thumbnail: string; durationMs: number; exportBlob?: Blob | null },
): Promise<SavedVideoMeta> {
  const project = projectFromState(state);
  const mediaKeys = await storeMedia(project);
  const videoId = id || `video-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const before = id ? await run<SavedVideo>(PROJECTS, 'readonly', (s) => s.get(videoId)) : undefined;
  const record: SavedVideo = {
    id: videoId,
    version: VIDEO_PROJECT_VERSION,
    name: videoName(project.items || []),
    savedAt: Date.now(),
    durationMs,
    thumbnail,
    project,
    mediaKeys,
    exportBlob: exportBlob ?? before?.exportBlob ?? null,
  };
  await run(PROJECTS, 'readwrite', (s) => s.put(record));
  await dropUnusedMedia();
  return savedVideoMeta(record);
}

export async function listSavedVideos(): Promise<SavedVideoMeta[]> {
  const all = (await run<SavedVideo[]>(PROJECTS, 'readonly', (s) => s.getAll())) || [];
  return all.map(savedVideoMeta).sort((a, b) => b.savedAt - a.savedAt);
}

// A saved video's project (upgraded to the current version) with its files, ready for restoreProject.
export async function loadSavedVideo(id: string): Promise<{ video: SavedVideo; media: Record<string, Blob | undefined> } | null> {
  const saved = await run<SavedVideo>(PROJECTS, 'readonly', (s) => s.get(id));
  const project = saved ? migrateVideoProject(saved.project, saved.version ?? 0) : null;
  if (!saved || !project) return null;
  const media: Record<string, Blob | undefined> = {};
  for (const key of saved.mediaKeys || []) media[key] = await run<Blob>(MEDIA, 'readonly', (s) => s.get(key));
  return { video: { ...saved, version: VIDEO_PROJECT_VERSION, project }, media };
}

export async function getSavedVideoFile(id: string): Promise<Blob | null> {
  const saved = await run<SavedVideo>(PROJECTS, 'readonly', (s) => s.get(id));
  return saved?.exportBlob || null;
}

export async function deleteSavedVideo(id: string): Promise<void> {
  await run(PROJECTS, 'readwrite', (s) => { s.delete(id); });
  await dropUnusedMedia();
}
