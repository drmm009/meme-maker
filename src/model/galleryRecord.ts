// A meme saved to the gallery (IndexedDB 'meme-creator' / 'memes'): its finished image plus the
// editable layers the image editor reopens it with.
import type { MemeCaption, MemeImageLayer, MemeSticker } from './memeDocument';

// Saved records carry this. Bump it when the saved shape changes, and teach migrateGalleryRecord
// to upgrade the previous version.
export const GALLERY_RECORD_VERSION = 1;

export interface SlotTransform {
  offsetX?: number;
  offsetY?: number;
  scale?: number;
}

export interface GalleryRecord {
  // Absent on memes saved before versioning.
  version?: number;
  id: string;
  name: string;
  createdAt: string;
  thumbnailUrl: string;
  imageBlob: Blob | null;
  rawImageUrl: string | null;
  captions: MemeCaption[];
  stickers: MemeSticker[];
  imageLayers: MemeImageLayer[];
  aspectRatio?: string;
  imageFit?: string;
  isNativeLayout?: boolean;
  layoutDef?: { id: string; slots: number };
  slotImages?: (string | null)[];
  slotTransforms?: SlotTransform[];
}

// The editable parts of a meme being saved: the editor's save, or an entry of the old
// localStorage gallery (which kept stickers as defaultStickers).
export interface SavableMeme {
  rawImageUrl?: string | null;
  captions?: MemeCaption[];
  stickers?: MemeSticker[];
  defaultStickers?: MemeSticker[];
  imageLayers?: MemeImageLayer[];
  aspectRatio?: string;
  imageFit?: string;
  isNativeLayout?: boolean;
  layoutDef?: GalleryRecord['layoutDef'];
  slotImages?: GalleryRecord['slotImages'];
  slotTransforms?: SlotTransform[];
}

// The record to store for a meme.
export function galleryRecord(
  meme: SavableMeme,
  meta: Pick<GalleryRecord, 'id' | 'name' | 'createdAt' | 'thumbnailUrl' | 'imageBlob'>
): GalleryRecord {
  return {
    version: GALLERY_RECORD_VERSION,
    ...meta,
    rawImageUrl: meme.rawImageUrl || null,
    captions: meme.captions || [],
    stickers: meme.stickers || meme.defaultStickers || [],
    imageLayers: meme.imageLayers || [],
    aspectRatio: meme.aspectRatio,
    imageFit: meme.imageFit,
    isNativeLayout: meme.isNativeLayout,
    layoutDef: meme.layoutDef,
    slotImages: meme.slotImages,
    slotTransforms: meme.slotTransforms,
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

// A stored record upgraded to the current version, or null if it isn't a gallery record at all.
// Records from a newer app version are kept as they are: their image still shows, even if this
// version can't make sense of every layer.
export function migrateGalleryRecord(raw: unknown): GalleryRecord | null {
  if (!isRecord(raw) || typeof raw.id !== 'string') return null;
  const version = typeof raw.version === 'number' ? raw.version : 0;
  if (version > GALLERY_RECORD_VERSION) return raw as unknown as GalleryRecord;
  // 0 -> 1: no change in shape; versioning starts here, and layer lists are always arrays.
  return {
    ...(raw as unknown as GalleryRecord),
    version: GALLERY_RECORD_VERSION,
    captions: list<MemeCaption>(raw.captions),
    stickers: list<MemeSticker>(raw.stickers),
    imageLayers: list<MemeImageLayer>(raw.imageLayers),
  };
}
