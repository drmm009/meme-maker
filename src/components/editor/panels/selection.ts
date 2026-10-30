import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { isSocialCardCaption } from '../memeEditorUtils';
import type { MemeCaption, MemeImageLayer, MemeSticker } from '../../../model/memeDocument';
import type { DragDrawing } from '../../canvas/draw/shapes';
import { isDragDrawing } from '../../canvas/interaction/drawingHits';

// What is selected: a caption, a social card (a caption drawn as a tweet/post/chat), a sticker,
// an image layer, or a shape or censor region from the Draw tab.
export type LayerKind = 'caption' | 'card' | 'sticker' | 'image' | 'shape';

export interface Selection {
  id: string | null;
  kind: LayerKind | null;
  caption: (MemeCaption & Record<string, unknown>) | null;
  sticker: MemeSticker | null;
  image: (MemeImageLayer & Record<string, unknown>) | null;
  drawing: DragDrawing | null;
}

// The edit handlers MemeEditor wires up (editor/hooks/use*Actions), passed to the panels as one object.
export type EditorActions = Record<string, any>;

// Which sheet edits each kind of layer.
export const SHEET_FOR_KIND: Record<LayerKind, string> = { caption: 'text', card: 'text', sticker: 'media', image: 'media', shape: 'draw' };

export function useSelection(): Selection {
  const id: string | null = useMemeEditorStore((s: { activeLayerId: string | null }) => s.activeLayerId);
  const caption = useMemeEditorStore((s: { captions: MemeCaption[] }) => s.captions.find((c) => c.id === id)) || null;
  const sticker = useMemeEditorStore((s: { stickers: MemeSticker[] }) => s.stickers.find((c) => c.id === id)) || null;
  const image = useMemeEditorStore((s: { imageLayers: MemeImageLayer[] }) => (s.imageLayers || []).find((c) => c.id === id)) || null;
  const drawing = useMemeEditorStore((s: { drawings: unknown[] }) => (id && (s.drawings || []).find((d) => isDragDrawing(d) && d.id === id)) || null) as DragDrawing | null;
  const kind: LayerKind | null = caption ? (isSocialCardCaption(caption) ? 'card' : 'caption')
    : sticker ? 'sticker' : image ? 'image' : drawing ? 'shape' : null;
  return { id, kind, caption, sticker, image, drawing };
}

// A short name for a caption chip.
export const captionLabel = (c: MemeCaption & Record<string, unknown>): string => {
  if (c.isTweetCard) return 'Tweet card';
  if (c.isInstagramCard) return 'Instagram post';
  if (c.isWhatsAppCard) return 'WhatsApp chat';
  if (c.isBreakingNews) return 'Breaking news';
  const text = (c.text || '').replace(/\s+/g, ' ').trim();
  return text || 'Empty text';
};
