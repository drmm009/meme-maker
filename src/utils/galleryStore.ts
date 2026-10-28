// Minimal IndexedDB gallery store — no external deps.
// DB: meme-creator / store: memes / keyPath: id. Records are GalleryRecords (model/galleryRecord):
// they're saved with a format version and upgraded to the current one as they're read.
import { migrateGalleryRecord } from '../model/galleryRecord';
import type { GalleryRecord } from '../model/galleryRecord';

const DB_NAME = 'meme-creator';
const STORE = 'memes';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('IndexedDB blocked'));
    } catch (e) {
      reject(e);
    }
  });
  return dbPromise;
}

function tx(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return openDB().then(
    (db) =>
      new Promise<IDBObjectStore>((resolve, reject) => {
        try {
          const t = db.transaction(STORE, mode);
          const store = t.objectStore(STORE);
          t.onerror = () => reject(t.error);
          // Resolve with the store right away; callers wait on their own requests.
          resolve(store);
        } catch (e) {
          reject(e);
        }
      })
  );
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbPutMeme(record: GalleryRecord): Promise<void> {
  const store = await tx('readwrite');
  await reqToPromise(store.put(record));
}

export async function idbGetMeme(id: string): Promise<GalleryRecord | null> {
  const store = await tx('readonly');
  return migrateGalleryRecord(await reqToPromise(store.get(id)));
}

export async function idbGetAllMemes(): Promise<GalleryRecord[]> {
  const store = await tx('readonly');
  const all: unknown = await reqToPromise(store.getAll());
  return Array.isArray(all) ? all.map(migrateGalleryRecord).filter((r): r is GalleryRecord => r !== null) : [];
}

export async function idbDeleteMeme(id: string): Promise<void> {
  const store = await tx('readwrite');
  await reqToPromise(store.delete(id));
}

export function dataURLToBlob(dataUrl: string): Blob {
  const [head, b64] = String(dataUrl).split(',');
  const mime = /data:(.*?);base64/.exec(head)?.[1] || 'image/png';
  const bin = atob(b64 || '');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function blobToDataURL(blob: Blob | string | null | undefined): Promise<string> {
  if (!blob) return '';
  if (typeof blob === 'string') return blob;
  if (typeof FileReader !== 'undefined') {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error || new Error('Failed to read blob'));
      reader.readAsDataURL(blob);
    });
  }
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  const mime = blob.type || 'image/png';
  return `data:${mime};base64,${base64}`;
}

export function createThumbnail(dataUrl: string, maxSide = 320): Promise<string> {
  return new Promise<string>((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, maxSide / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
          const w = Math.max(1, Math.round((img.naturalWidth || 320) * scale));
          const h = Math.max(1, Math.round((img.naturalHeight || 320) * scale));
          const c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          c.getContext('2d')?.drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL('image/jpeg', 0.7));
        } catch {
          resolve(dataUrl.slice(0, 200000));
        }
      };
      img.onerror = () => resolve(dataUrl.slice(0, 200000));
      img.src = dataUrl;
    } catch {
      resolve(dataUrl.slice(0, 200000));
    }
  });
}

// Metadata kept in React state (small). Full bytes stay in IDB.
export function toMetadata(record: GalleryRecord) {
  return {
    id: record.id,
    name: record.name,
    createdAt: record.createdAt,
    thumbnailUrl: record.thumbnailUrl,
    rawImageUrl: record.rawImageUrl,
    captions: record.captions || [],
    stickers: record.stickers || [],
    imageLayers: record.imageLayers || [],
    aspectRatio: record.aspectRatio,
    imageFit: record.imageFit,
    isNativeLayout: record.isNativeLayout,
    layoutDef: record.layoutDef,
    slotImages: record.slotImages,
    slotTransforms: record.slotTransforms,
    // Back-compat: list renderers can use thumbnailUrl; keep imageUrl as thumbnail.
    imageUrl: record.thumbnailUrl,
  };
}
