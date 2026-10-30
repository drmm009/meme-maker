import { Type, Smile, Image as ImageIcon, MessageSquare, MoveUpRight, Circle, Square, Minus, EyeOff, PenLine, Highlighter, MoveHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { isSocialCardCaption } from '../memeEditorUtils';
import { captionLabel } from './selection';
import type { MemeCaption, MemeImageLayer, MemeSticker } from '../../../model/memeDocument';
import { isDragDrawing } from '../../canvas/interaction/drawingHits';

type LayerKey = 'captions' | 'stickers' | 'imageLayers' | 'drawings';

export interface LayerRow {
  id: string;
  key: LayerKey;
  label: string;
  Icon: LucideIcon;
  zIndex: number;
  hidden: boolean;
  locked: boolean;
  groupId?: string | null;
}

// Every layer, top of the stack first (as they cover each other on the canvas).
export function layerRows(captions: MemeCaption[], stickers: MemeSticker[], images: MemeImageLayer[]): LayerRow[] {
  const rows: LayerRow[] = [
    ...images.map((l, i) => ({ id: l.id, key: 'imageLayers' as const, label: `Image ${i + 1}`, Icon: ImageIcon, zIndex: l.zIndex ?? 0, hidden: !!l.hidden, locked: !!l.locked, groupId: l.groupId })),
    ...stickers.map((s) => ({ id: s.id, key: 'stickers' as const, label: s.emoji || s.name || 'Sticker', Icon: Smile, zIndex: s.zIndex ?? 0, hidden: !!s.hidden, locked: !!s.locked, groupId: s.groupId })),
    ...captions.map((c) => ({
      id: c.id,
      key: 'captions' as const,
      label: captionLabel(c as MemeCaption & Record<string, unknown>),
      Icon: isSocialCardCaption(c) ? MessageSquare : Type,
      zIndex: c.zIndex ?? 0,
      hidden: !!c.hidden,
      locked: !!c.locked,
      groupId: c.groupId,
    })),
  ];
  return rows.sort((a, b) => b.zIndex - a.zIndex);
}

const SHAPE_ROW: Record<string, { label: string; Icon: LucideIcon }> = {
  arrow: { label: 'Arrow', Icon: MoveUpRight },
  ellipse: { label: 'Circle', Icon: Circle },
  rect: { label: 'Box', Icon: Square },
  line: { label: 'Line', Icon: Minus },
  sketch: { label: 'Sketch', Icon: PenLine },
  highlight: { label: 'Highlight', Icon: Highlighter },
  double: { label: 'Both-ways arrow', Icon: MoveHorizontal },
};
const CENSOR_LABEL: Record<string, string> = { blur: 'Blur', pixelate: 'Pixelate', bar: 'Black bar' };

// Shapes and censor regions (drawn over every layer, in list order), top first.
export function drawingRows(drawings: unknown[]): LayerRow[] {
  return drawings.filter(isDragDrawing).map((d, i) => {
    const flags = d as { hidden?: boolean; locked?: boolean };
    const kind = d.type === 'shape' ? SHAPE_ROW[d.shape] || SHAPE_ROW.line : { label: `Censor: ${CENSOR_LABEL[d.censor] || 'Blur'}`, Icon: EyeOff };
    return { id: d.id, key: 'drawings' as const, label: kind.label, Icon: kind.Icon, zIndex: i, hidden: !!flags.hidden, locked: !!flags.locked };
  }).reverse();
}
