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

// The box around a picture's visible pixels (alpha above 8 of 255), from its RGBA bytes; null when
// it has none.
export function opaqueBounds(data: Uint8ClampedArray, width: number, height: number) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  return right < 0 ? null : { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
}

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

// The visible part of a picture, as a box in its own pixels (the whole picture when there is no
// see-through margin to trim, or the pixels can't be read).
function visibleBox(img: HTMLImageElement) {
  const width = img.naturalWidth || 1;
  const height = img.naturalHeight || 1;
  const whole = { x: 0, y: 0, w: width, h: height };
  try {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return whole;
    ctx.drawImage(img, 0, 0);
    return opaqueBounds(ctx.getImageData(0, 0, width, height).data, width, height) ?? whole;
  } catch {
    return whole;
  }
}

// A small preview of a saved image: a JPEG, or a PNG (type) for a sticker, which keeps its
// see-through edges and is trimmed to the sticker, so its tile in My Studio isn't mostly empty.
export function createThumbnail(dataUrl: string, maxSide = 320, type: 'image/jpeg' | 'image/png' = 'image/jpeg'): Promise<string> {
  return loadImage(dataUrl)
    .then((img) => {
      const box = type === 'image/png'
        ? visibleBox(img)
        : { x: 0, y: 0, w: img.naturalWidth || 320, h: img.naturalHeight || 320 };
      const scale = Math.min(1, maxSide / Math.max(box.w, box.h));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(box.w * scale));
      c.height = Math.max(1, Math.round(box.h * scale));
      c.getContext('2d')?.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, c.width, c.height);
      return type === 'image/png' ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.7);
    })
    .catch(() => dataUrl.slice(0, 200000));
}

// Whether a sticker's thumbnail needs making again: a JPEG one (black where the sticker is
// see-through, as stickers once got), or one with an empty see-through margin (from before they were
// trimmed).
async function stickerThumbNeedsRemake(thumbnailUrl: string): Promise<boolean> {
  if (thumbnailUrl.startsWith('data:image/jpeg')) return true;
  if (!thumbnailUrl.startsWith('data:image/png')) return false;
  const img = await loadImage(thumbnailUrl);
  const box = visibleBox(img);
  // A pixel or two of margin is the scaling's soft edge, not empty space.
  return img.naturalWidth - box.w > 4 || img.naturalHeight - box.h > 4;
}

// Remakes the thumbnails of saved stickers that need it (stickerThumbNeedsRemake) from the saved full
// image (when that image kept its transparency), stores them, and returns the records it fixed. Once
// a thumbnail is a trimmed PNG it is left alone, so this does its work once.
export async function repairStickerThumbnails(records: GalleryRecord[]): Promise<GalleryRecord[]> {
  const fixed: GalleryRecord[] = [];
  for (const record of records) {
    const blob = record.imageBlob;
    if (record.kind !== 'sticker' || !blob || blob.type === 'image/jpeg' || !record.thumbnailUrl) continue;
    try {
      if (!(await stickerThumbNeedsRemake(record.thumbnailUrl))) continue;
      const thumbnailUrl = await createThumbnail(await blobToDataURL(blob), 320, 'image/png');
      if (!thumbnailUrl.startsWith('data:image/png') || thumbnailUrl === record.thumbnailUrl) continue;
      const next = { ...record, thumbnailUrl };
      await idbPutMeme(next);
      fixed.push(next);
    } catch {
      // Leave this one as it was.
    }
  }
  return fixed;
}

// Metadata kept in React state (small). Full bytes stay in IDB.
export function toMetadata(record: GalleryRecord) {
  return {
    id: record.id,
    kind: record.kind || 'meme',
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
