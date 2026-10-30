// Fonts people upload for their captions: kept in IndexedDB (its own `meme-creator-fonts`
// database) and registered with the page (FontFace) so the canvas can draw with them.
const DB_NAME = 'meme-creator-fonts';
const STORE = 'fonts';

export interface CustomFont {
  // The CSS family name it is registered under.
  family: string;
  // The value for a caption's fontFamily.
  css: string;
}

interface StoredFont {
  family: string;
  data: Blob;
}

export const FONT_ACCEPT = '.ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2';

// "My Font-Bold.ttf" -> "My Font-Bold"; keeps letters, digits, spaces and dashes.
export const familyFromFileName = (name: string) =>
  name.replace(/\.(ttf|otf|woff2?)$/i, '').replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 40) || 'Custom font';

export const toCustomFont = (family: string): CustomFont => ({ family, css: `"${family}", sans-serif` });

let dbPromise: Promise<IDBDatabase> | null = null;
const openDB = (): Promise<IDBDatabase> => {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB unavailable'));
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'family' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    dbPromise.catch(() => { dbPromise = null; });
  }
  return dbPromise;
};

const run = <T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> =>
  openDB().then((db) => new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req.result);
    t.onerror = () => reject(t.error);
  }));

async function register(family: string, data: Blob): Promise<void> {
  if (typeof FontFace === 'undefined') return;
  const face = new FontFace(family, await data.arrayBuffer());
  await face.load();
  document.fonts.add(face);
}

// Registers an uploaded font file and keeps it for next time. Throws if it isn't a font.
export async function addFontFile(file: File): Promise<CustomFont> {
  const family = familyFromFileName(file.name);
  await register(family, file);
  await run('readwrite', (s) => s.put({ family, data: file } satisfies StoredFont)).catch(() => {});
  return toCustomFont(family);
}

// Every kept font, registered with the page (fonts that fail to load are skipped).
export async function loadCustomFonts(): Promise<CustomFont[]> {
  const stored = await run<StoredFont[]>('readonly', (s) => s.getAll());
  const loaded: CustomFont[] = [];
  for (const f of stored || []) {
    try {
      await register(f.family, f.data);
      loaded.push(toCustomFont(f.family));
    } catch {
      // A damaged file: leave it out.
    }
  }
  return loaded;
}
