// A meme, sticker or GIF saved to the gallery (IndexedDB 'meme-creator' / 'memes'): its finished
// image plus the editable layers the image editor reopens it with. Videos are kept apart
// (savedVideos), so My Studio lists four kinds: memes, stickers, GIFs and videos.
import type { MemeCaption, MemeImageLayer, MemeSticker } from './memeDocument';

// Saved records carry this. Bump it when the saved shape changes, and teach migrateGalleryRecord
// to upgrade the previous version.
export const GALLERY_RECORD_VERSION = 3;

// What was saved, for My Studio's tabs.
export type GalleryKind = 'meme' | 'sticker' | 'gif';
export const GALLERY_KINDS: GalleryKind[] = ['meme', 'sticker', 'gif'];

export interface SlotTransform {
  offsetX?: number;
  offsetY?: number;
  scale?: number;
}

export interface GalleryRecord {
  // Absent on memes saved before versioning.
  version?: number;
  // Since version 2; older records are memes, or GIFs when their image is a GIF.
  kind: GalleryKind;
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
  // A custom grid's also carries its columns and rows (version 3).
  layoutDef?: { id: string; slots: number; cols?: number; rows?: number };
  slotImages?: (string | null)[];
  slotTransforms?: SlotTransform[];
}

// The editable parts of a meme being saved: the editor's save, or an entry of the old
// localStorage gallery (which kept stickers as defaultStickers).
export interface SavableMeme {
  kind?: GalleryKind;
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
    kind: isKind(meme.kind) ? meme.kind : 'meme',
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

export const isKind = (v: unknown): v is GalleryKind => GALLERY_KINDS.includes(v as GalleryKind);

// A record saved before kinds: a GIF if its image is one, else a meme.
const guessKind = (raw: Record<string, unknown>): GalleryKind => {
  const blob = raw.imageBlob as { type?: string } | null | undefined;
  const url = typeof raw.rawImageUrl === 'string' ? raw.rawImageUrl : '';
  return blob?.type === 'image/gif' || url.startsWith('data:image/gif') ? 'gif' : 'meme';
};

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
  // 1 -> 2: records say what they are (kind), guessed from the image for older ones.
  // 2 -> 3: a custom grid's layoutDef may carry cols and rows; older records have none to add.
  return {
    ...(raw as unknown as GalleryRecord),
    version: GALLERY_RECORD_VERSION,
    kind: isKind(raw.kind) ? raw.kind : guessKind(raw),
    captions: list<MemeCaption>(raw.captions),
    stickers: list<MemeSticker>(raw.stickers),
    imageLayers: list<MemeImageLayer>(raw.imageLayers),
  };
}
