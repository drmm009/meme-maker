// Where a new layer goes in the image editor. In a multi-panel layout: the middle of the first
// empty panel (no photo of its own, no photo, sticker or caption with its middle there), the same
// panels whose start cards show (ImagePanelPrompts). Otherwise, or when every panel has something,
// a free spot on the canvas (getNonOverlappingPosition).
import { getNonOverlappingPosition } from '../../../utils/captionLayout';
import { inPanel, panelRects } from '../../canvas/layout/panels';
import type { PanelLayout, PanelRect } from '../../canvas/layout/panels';
import { WHITE_PIXEL_URL } from '../store/useMemeEditorStore';

interface Layer { x?: number; y?: number; isHeaderCaption?: boolean; isFooterCaption?: boolean }
export interface LayerDoc {
  activeTemplate?: { isNativeLayout?: boolean; layoutDef?: PanelLayout | null } | null;
  slotImages?: (string | null)[];
  captions?: Layer[];
  stickers?: Layer[];
  imageLayers?: Layer[] | null;
}

// The layers that can sit in a panel: photos, stickers and captions not in a header or footer bar.
export const panelLayers = (doc: LayerDoc): Layer[] => [
  ...(doc.imageLayers || []),
  ...(doc.stickers || []),
  ...(doc.captions || []).filter((c) => !c.isHeaderCaption && !c.isFooterCaption),
];

// A multi-panel layout's first panel with nothing in it, or null when every panel has something.
export const firstEmptyPanel = (rects: PanelRect[], layers: Layer[] = [], slotImages: (string | null)[] = []): PanelRect | null =>
  rects.find((r, i) =>
    !(slotImages[i] && slotImages[i] !== WHITE_PIXEL_URL)
    && !layers.some((l) => inPanel(r, l.x ?? 0.5, l.y ?? 0.5))) || null;

// The first empty panel of the document's layout, if it has one.
export function emptyPanelOf(doc: LayerDoc): PanelRect | null {
  if (!doc.activeTemplate?.isNativeLayout) return null;
  const rects = panelRects(doc.activeTemplate.layoutDef);
  return rects.length > 1 ? firstEmptyPanel(rects, panelLayers(doc), doc.slotImages) : null;
}

export function newLayerPosition(kind: 'caption' | 'phrase' | 'sticker' | 'image', doc: LayerDoc): { x: number; y: number } {
  const panel = emptyPanelOf(doc);
  if (panel) return { x: panel.x + panel.width / 2, y: panel.y + panel.height / 2 };
  return getNonOverlappingPosition(kind, doc.captions || [], doc.stickers || [], doc.imageLayers || []);
}
