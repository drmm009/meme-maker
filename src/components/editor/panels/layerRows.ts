import { Type, Smile, Image as ImageIcon, MessageSquare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { isSocialCardCaption } from '../memeEditorUtils';
import { captionLabel } from './selection';
import type { MemeCaption, MemeImageLayer, MemeSticker } from '../../../model/memeDocument';

type LayerKey = 'captions' | 'stickers' | 'imageLayers';

export interface LayerRow {
  id: string;
  key: LayerKey;
  label: string;
  Icon: LucideIcon;
  zIndex: number;
  hidden: boolean;
  locked: boolean;
}

// Every layer, top of the stack first (as they cover each other on the canvas).
export function layerRows(captions: MemeCaption[], stickers: MemeSticker[], images: MemeImageLayer[]): LayerRow[] {
  const rows: LayerRow[] = [
    ...images.map((l, i) => ({ id: l.id, key: 'imageLayers' as const, label: `Image ${i + 1}`, Icon: ImageIcon, zIndex: l.zIndex ?? 0, hidden: !!l.hidden, locked: !!l.locked })),
    ...stickers.map((s) => ({ id: s.id, key: 'stickers' as const, label: s.emoji || s.name || 'Sticker', Icon: Smile, zIndex: s.zIndex ?? 0, hidden: !!s.hidden, locked: !!s.locked })),
    ...captions.map((c) => ({
      id: c.id,
      key: 'captions' as const,
      label: captionLabel(c as MemeCaption & Record<string, unknown>),
      Icon: isSocialCardCaption(c) ? MessageSquare : Type,
      zIndex: c.zIndex ?? 0,
      hidden: !!c.hidden,
      locked: !!c.locked,
    })),
  ];
  return rows.sort((a, b) => b.zIndex - a.zIndex);
}
