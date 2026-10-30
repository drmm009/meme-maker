// Auto-saved image editor draft in IndexedDB, in its own database so the gallery's is untouched.
// DB: meme-creator-image / store: drafts (one record, id 'current'). Pictures that only exist as
// blob: URLs die with the page, so their Blobs are saved in the record too. The same database keeps
// the memes saved on purpose (store: projects): projects to come back to and templates to reuse.
import { HISTORY_FIELDS } from '../components/editor/store/useMemeEditorStore';

const DB_NAME = 'meme-creator-image';
const DB_VERSION = 2;
const DRAFTS = 'drafts';
const PROJECTS = 'projects';
const DRAFT_ID = 'current';

export const MEME_DRAFT_VERSION = 1;

// The document fields a draft keeps: everything undo restores, plus the canvas settings.
export const DRAFT_FIELDS: string[] = [...HISTORY_FIELDS, 'slotImages', 'slotTransforms', 'aspectRatio', 'canvasBgColor', 'canvasBgGradient', 'imageFilters'];

export type MemeDraftDocument = Record<string, unknown>;

export interface MemeDraft {
  id: typeof DRAFT_ID;
  version: number;
  savedAt: number;
  document: MemeDraftDocument;
  // Blobs of the document's blob: URLs, by URL.
  media: Record<string, Blob>;
}

// blob:<origin>/<id> (an opaque origin is "null"), so a caption that merely starts with "blob:" is left alone.
const isBlobUrl = (u: unknown): u is string => typeof u === 'string' && /^blob:(?:[a-z][a-z0-9+.-]*:\/\/|null\/)\S+$/i.test(u);

// A copy of `value` IndexedDB can store: plain objects, arrays, primitives and Blobs. Functions,
// DOM nodes and other class instances (a template's loaded image, say) are left out.
export const plainCopy = (value: unknown): unknown => {
  if (typeof value === 'function' || typeof value === 'symbol') return undefined;
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Blob) return value;
  if (Array.isArray(value)) return value.map(plainCopy);
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    const copy = plainCopy(v);
    if (copy !== undefined) out[k] = copy;
  }
  return out;
};

// Every string in `value` passed through `fn` (objects and arrays are copied, the rest kept).
export const mapStrings = (value: unknown, fn: (s: string) => unknown): unknown => {
  if (typeof value === 'string') return fn(value);
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, fn));
  if (value && typeof value === 'object' && !(value instanceof Blob)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapStrings(v, fn)]));
  }
  return value;
};

export const collectBlobUrls = (value: unknown): string[] => {
  const urls = new Set<string>();
  mapStrings(value, (s) => {
    if (isBlobUrl(s)) urls.add(s);
    return s;
  });
  return [...urls];
};

// The editor state's document, ready to store.
export const documentFromState = (state: Record<string, unknown>): MemeDraftDocument =>
  plainCopy(Object.fromEntries(DRAFT_FIELDS.map((k) => [k, state[k]]))) as MemeDraftDocument;

// How many layers the document has (for the restore offer).
export const layerCount = (doc: MemeDraftDocument): number =>
  ['captions', 'stickers', 'imageLayers'].reduce((n, k) => n + (Array.isArray(doc[k]) ? (doc[k] as unknown[]).length : 0), 0);

// The saved document with fresh URLs for its stored pictures (a picture whose Blob is missing
// becomes null).
export const restoreDocument = (draft: Pick<MemeDraft, 'document' | 'media'>, makeUrl: (blob: Blob) => string): MemeDraftDocument => {
  const fresh = new Map<string, string>();
  for (const [url, blob] of Object.entries(draft.media || {})) if (blob) fresh.set(url, makeUrl(blob));
  return mapStrings(draft.document, (s) => (isBlobUrl(s) ? fresh.get(s) ?? null : s)) as MemeDraftDocument;
};

let dbPromise: Promise<IDBDatabase> | null = null;
const openDB = (): Promise<IDBDatabase> => {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB unavailable'));
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(DRAFTS)) req.result.createObjectStore(DRAFTS, { keyPath: 'id' });
        if (!req.result.objectStoreNames.contains(PROJECTS)) req.result.createObjectStore(PROJECTS, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    dbPromise.catch(() => { dbPromise = null; });
  }
  return dbPromise;
};

const run = <T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>, storeName = DRAFTS): Promise<T> =>
  openDB().then((db) => new Promise<T>((resolve, reject) => {
    const t = db.transaction(storeName, mode);
    const req = fn(t.objectStore(storeName));
    t.oncomplete = () => resolve(req.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));

// Blobs already read this session, so a picture isn't fetched again on every save.
const blobCache = new Map<string, Blob>();

// The Blobs behind a document's blob: URLs (ones already revoked are left out).
async function collectMedia(document: MemeDraftDocument): Promise<Record<string, Blob>> {
  const media: Record<string, Blob> = {};
  for (const url of collectBlobUrls(document)) {
    let blob = blobCache.get(url);
    if (!blob) {
      try {
        blob = await (await fetch(url)).blob();
        blobCache.set(url, blob);
      } catch {
        continue; // revoked: the picture is gone
      }
    }
    media[url] = blob;
  }
  return media;
}

export async function saveMemeDraft(state: Record<string, unknown>): Promise<void> {
  const document = documentFromState(state);
  const media = await collectMedia(document);
  const draft: MemeDraft = { id: DRAFT_ID, version: MEME_DRAFT_VERSION, savedAt: Date.now(), document, media };
  await run('readwrite', (s) => s.put(draft));
}

// The saved draft, or null when there is none, it's from a newer version of the app, or it can't
// be read.
export async function loadMemeDraft(): Promise<MemeDraft | null> {
  const saved = await run<MemeDraft | undefined>('readonly', (s) => s.get(DRAFT_ID));
  if (!saved?.document || (saved.version ?? 0) > MEME_DRAFT_VERSION) return null;
  return saved;
}

// A meme saved on purpose: a project to come back to, or a template to start new memes from.
export type MemeProjectKind = 'project' | 'template';

export interface MemeProject {
  id: string;
  kind: MemeProjectKind;
  name: string;
  version: number;
  savedAt: number;
  // A small JPEG data URL of the meme.
  thumb: string;
  document: MemeDraftDocument;
  media: Record<string, Blob>;
}

export type MemeProjectSummary = Omit<MemeProject, 'document' | 'media'>;

// Saves the editor's meme. One of the same kind and name is replaced (saving again updates it).
export async function saveMemeProject(state: Record<string, unknown>, { kind, name, thumb }: { kind: MemeProjectKind; name: string; thumb: string }): Promise<MemeProjectSummary> {
  const document = documentFromState(state);
  const media = await collectMedia(document);
  const existing = (await listMemeProjects()).find((p) => p.kind === kind && p.name === name);
  const project: MemeProject = {
    id: existing?.id || `${kind}-${Date.now()}`,
    kind, name, version: MEME_DRAFT_VERSION, savedAt: Date.now(), thumb, document, media,
  };
  await run('readwrite', (s) => s.put(project), PROJECTS);
  const { document: _d, media: _m, ...summary } = project;
  return summary;
}

// Every saved meme (newest first), without their documents.
export async function listMemeProjects(): Promise<MemeProjectSummary[]> {
  const all = await run<MemeProject[]>('readonly', (s) => s.getAll() as IDBRequest<MemeProject[]>, PROJECTS);
  return (all || [])
    .filter((p) => p && (p.version ?? 0) <= MEME_DRAFT_VERSION)
    .map(({ document: _d, media: _m, ...summary }) => summary)
    .sort((a, b) => b.savedAt - a.savedAt);
}

export async function loadMemeProject(id: string): Promise<MemeProject | null> {
  const saved = await run<MemeProject | undefined>('readonly', (s) => s.get(id), PROJECTS);
  if (!saved?.document || (saved.version ?? 0) > MEME_DRAFT_VERSION) return null;
  return saved;
}

export const deleteMemeProject = (id: string): Promise<undefined> => run('readwrite', (s) => s.delete(id), PROJECTS);

// A new name for a saved meme (its contents are left as they are).
export async function renameMemeProject(id: string, name: string): Promise<void> {
  const saved = await run<MemeProject | undefined>('readonly', (s) => s.get(id), PROJECTS);
  if (!saved) return;
  await run('readwrite', (s) => s.put({ ...saved, name }), PROJECTS);
}
