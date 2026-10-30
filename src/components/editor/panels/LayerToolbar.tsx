import { Trash2, Settings, SlidersHorizontal, Copy, Scaling, FlipHorizontal, Scissors, Crop, Wand2, Ellipsis, Layers, Palette, Square, MessageSquareQuote, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { FloatingToolbar } from '../../ui';
import type { ToolbarItem } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useSelection } from './selection';
import type { EditorActions } from './selection';

// The selected layer's quick tools, a pill sitting just above the dock in place of the tab's tool
// strip (EditorPanels). A caption's Font, Style, Align, Color and Box each open the Text sheet with
// just their sections; the pill scrolls sideways if tools don't fit.

// The Align button shows the caption's alignment.
const alignIcon = (align: unknown) => (align === 'left' ? AlignLeft : align === 'right' ? AlignRight : AlignCenter);

export default function LayerToolbar({ actions }: { actions: EditorActions }) {
  const { id, kind, caption, sticker, image, drawing } = useSelection();
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string, focus?: string | null) => void }) => s.openSheet);
  const pickDrawTool = useEditorUiStore((s: { pickDrawTool: (tool: string) => void }) => s.pickDrawTool);

  if (!id || !kind) return null;

  const layers: ToolbarItem = { id: 'layers', label: 'Layers', title: 'All layers: order, hide, lock', Icon: Layers, onClick: () => openSheet('layers') };
  const del: ToolbarItem = { id: 'delete', label: 'Delete', Icon: Trash2, danger: true, onClick: () => actions.handleDeleteLayer(id) };
  const dup: ToolbarItem = { id: 'duplicate', label: 'Copy', title: 'Duplicate', Icon: Copy, onClick: () => actions.handleDuplicateLayer(id) };
  let items: ToolbarItem[] = [];
  if (kind === 'caption' && caption) {
    items = [
      { id: 'font', label: 'Font', title: 'Font and my saved styles', icon: <span className="ie-glyph">Ar</span>, onClick: () => openSheet('text', 'font') },
      { id: 'style', label: 'Style', title: 'Size, bold, italic, underline, case and effects', icon: <span className="ie-glyph ie-glyph--bold">B</span>, onClick: () => openSheet('text', 'style') },
      { id: 'align', label: 'Align', title: 'Alignment and spacing', Icon: alignIcon(caption.align), onClick: () => openSheet('text', 'align') },
      { id: 'color', label: 'Color', title: 'Colour, outline and shadow', icon: <span className="ie-color-dot" style={{ background: caption.color || '#ffffff' }} />, onClick: () => openSheet('text', 'color') },
      { id: 'box', label: 'Box', title: 'Box behind the text and opacity', Icon: Square, onClick: () => openSheet('text', 'box') },
      ...(caption.bubbleStyle ? [{ id: 'bubble', label: 'Bubble', title: 'Bubble style', Icon: MessageSquareQuote, onClick: () => openSheet('bubble') }] : []),
      layers,
      del,
    ];
  } else if (kind === 'card' && caption) {
    const platform = caption.isTweetCard ? 'tweet' : caption.isInstagramCard ? 'instagram' : 'whatsapp';
    items = [
      { id: 'edit', label: 'Edit', title: 'Edit card details', Icon: Settings, onClick: () => actions.handleOpenSocialModalForActiveCard(platform) },
      { id: 'style', label: 'Style', Icon: SlidersHorizontal, onClick: () => openSheet('text') },
      dup,
      layers,
      del,
    ];
  } else if (kind === 'sticker' && sticker) {
    items = [
      { id: 'size', label: 'Size', Icon: Scaling, onClick: () => openSheet('media', 'size') },
      { id: 'flip', label: 'Flip', Icon: FlipHorizontal, active: Boolean(sticker.flipX), onClick: () => actions.handleFlipActiveLayer() },
      { id: 'diecut', label: 'Die-cut', Icon: Scissors, active: Boolean(sticker.dieCut), onClick: () => actions.handleToggleDieCutSticker() },
      dup,
      layers,
      del,
    ];
  } else if (kind === 'image' && image) {
    items = [
      { id: 'crop', label: 'Crop', Icon: Crop, active: image.fitMode === 'crop', onClick: () => actions.updateActiveImageLayer('fitMode', image.fitMode === 'crop' ? 'fit' : 'crop') },
      { id: 'filters', label: 'Filters', Icon: SlidersHorizontal, onClick: () => openSheet('filters') },
      { id: 'cutout', label: image.originalUrl ? 'Undo' : 'Cut out', title: 'Remove the background', Icon: Wand2, onClick: () => actions.handleRemoveBackground() },
      { id: 'more', label: 'More', Icon: Ellipsis, onClick: () => openSheet('media') },
      layers,
      del,
    ];
  } else if (kind === 'shape' && drawing) {
    // Style opens the Draw sheet on this shape's tool; its settings then change this shape.
    items = [
      { id: 'style', label: 'Style', title: drawing.type === 'censor' ? 'Censor style and strength' : 'Shape, colour and width', Icon: Palette, onClick: () => pickDrawTool(drawing.type) },
      dup,
      del,
    ];
  }

  return (
    <div className="ie-layer-dock">
      <FloatingToolbar ariaLabel="Layer tools" className="ie-layer-toolbar" items={items} />
    </div>
  );
}
