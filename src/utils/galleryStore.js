// Minimal IndexedDB gallery store — no external deps.
// DB: meme-creator / store: memes / keyPath: id
// Record: { id, name, createdAt, thumbnailUrl, imageBlob, rawImageUrl, captions, stickers, imageLayers, aspectRatio, imageFit, isNativeLayout, layoutDef, slotImages, slotTransforms }

const DB_NAME = 'meme-creator';
const STORE = 'memes';
const DB_VERSION = 1;

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
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

function tx(mode) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        try {
          const t = db.transaction(STORE, mode);
          const store = t.objectStore(STORE);
          t.oncomplete = () => resolve();
          t.onerror = () => reject(t.error);
          // Resolve with store immediately; callers use request events.
          // We resolve store via a separate tick to keep API simple.
          resolve(store);
        } catch (e) {
          reject(e);
        }
      })
  );
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbPutMeme(record) {
  const store = await tx('readwrite');
  await reqToPromise(store.put(record));
}

export async function idbGetMeme(id) {
  const store = await tx('readonly');
  return reqToPromise(store.get(id));
}

export async function idbGetAllMemes() {
  const store = await tx('readonly');
  const all = await reqToPromise(store.getAll());
  return Array.isArray(all) ? all : [];
}

export async function idbDeleteMeme(id) {
  const store = await tx('readwrite');
  await reqToPromise(store.delete(id));
}

export function dataURLToBlob(dataUrl) {
  const [head, b64] = String(dataUrl).split(',');
  const mime = /data:(.*?);base64/.exec(head)?.[1] || 'image/png';
  const bin = atob(b64 || '');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function blobToDataURL(blob) {
  if (!blob) return '';
  if (typeof blob === 'string') return blob;
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
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
  const base64 = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(buffer).toString('base64');
  const mime = blob.type || 'image/png';
  return `data:${mime};base64,${base64}`;
}

export function createThumbnail(dataUrl, maxSide = 320) {
  return new Promise((resolve) => {
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
          c.getContext('2d').drawImage(img, 0, 0, w, h);
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
export function toMetadata(record) {
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
