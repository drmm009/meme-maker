import { Trash2, Settings, SlidersHorizontal, Copy, Scissors, Aperture, Blend, ScanFace, Ellipsis, Layers, Palette, MessageSquareQuote } from 'lucide-react';
import { FloatingToolbar } from '../../ui';
import type { ToolbarItem } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useSelection } from './selection';
import type { EditorActions } from './selection';

// The selected layer's quick tools, a pill sitting just above the dock in place of the tab's tool
// strip (EditorPanels). A caption's Font, Style and Color each open the Text sheet with just their
// sections; the pill scrolls sideways if tools don't fit. A sheet opened here keeps the pill above
// it, its button lit; tapping that button again closes the sheet.

type OpenSheet = (sheet: string, focus?: string | null, fromPill?: boolean) => void;

export default function LayerToolbar({ actions }: { actions: EditorActions }) {
  const { id, kind, caption, sticker, image, drawing } = useSelection();
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const sheetFocus: string | null = useEditorUiStore((s: { sheetFocus: string | null }) => s.sheetFocus);
  const openSheet: OpenSheet = useEditorUiStore((s: { openSheet: OpenSheet }) => s.openSheet);
  const closeSheet = useEditorUiStore((s: { closeSheet: () => void }) => s.closeSheet);
  const pickDrawTool = useEditorUiStore((s: { pickDrawTool: (tool: string) => void }) => s.pickDrawTool);

  if (!id || !kind) return null;

  // A button that opens a sheet: lit while that sheet is open, and closes it when tapped again.
  const opens = (target: string, focus: string | null = null) => {
    const on = sheet === target && (sheetFocus || null) === focus;
    return { active: on, onClick: () => (on ? closeSheet() : openSheet(target, focus, true)) };
  };

  // Every layer's own actions: icons only, after a divider.
  const layers: ToolbarItem = { id: 'layers', label: 'Layers', title: 'All layers: order, hide, lock', Icon: Layers, iconOnly: true, ...opens('layers') };
  const del: ToolbarItem = { id: 'delete', label: 'Delete', Icon: Trash2, danger: true, iconOnly: true, onClick: () => actions.handleDeleteLayer(id) };
  const dup: ToolbarItem = { id: 'duplicate', label: 'Copy', title: 'Duplicate', Icon: Copy, iconOnly: true, onClick: () => actions.handleDuplicateLayer(id) };
  let items: ToolbarItem[] = [];
  if (kind === 'caption' && caption) {
    const isBubble = Boolean(caption.bubbleStyle);
    items = [
      { id: 'font', label: 'Font', title: 'Font and my saved styles', icon: <span className="ie-glyph">Ar</span>, ...opens('text', 'font') },
      ...(isBubble ? [] : [
        { id: 'style', label: 'Style', title: 'Size, bold, italic, underline, case, effects, alignment and spacing', icon: <span className="ie-glyph ie-glyph--bold">B</span>, ...opens('text', 'style') },
      ]),
      { id: 'color', label: 'Color', title: 'Colour, outline, the box behind the text and opacity', icon: <span className="ie-color-dot" style={{ background: caption.color || '#ffffff' }} />, ...opens('text', 'color') },
      ...(isBubble ? [{ id: 'bubble', label: 'Bubble', title: 'Bubble style', Icon: MessageSquareQuote, ...opens('bubble') }] : []),
      dup,
      layers,
      del,
    ];
  } else if (kind === 'card' && caption) {
    const platform = caption.isTweetCard ? 'tweet' : caption.isInstagramCard ? 'instagram' : 'whatsapp';
    items = [
      { id: 'edit', label: 'Edit', title: 'Edit card details', Icon: Settings, onClick: () => actions.handleOpenSocialModalForActiveCard(platform) },
      dup,
      layers,
      del,
    ];
  } else if (kind === 'sticker' && sticker) {
    items = [
      { id: 'edit', label: 'Edit', title: 'Edit sticker', Icon: SlidersHorizontal, ...opens('media', 'edit') },
      {
        id: 'diecut',
        label: 'Die-cut',
        title: sticker.dieCut ? 'Die-cut border (on)' : 'Add die-cut border',
        Icon: Scissors,
        active: sheet === 'diecut',
        onClick: () => {
          if (sheet === 'diecut') {
            closeSheet();
          } else {
            // Just looking doesn't add a border: the sheet's switch, a colour or a width does.
            openSheet('diecut', null, true);
          }
        },
      },
      dup,
      layers,
      del,
    ];
  } else if (kind === 'image' && image) {
    items = [
      { id: 'faceswap', label: 'Face Swap', title: 'Face swap with AI', Icon: ScanFace, onClick: () => actions.handleStartMorphFace(image) },
      { id: 'background', label: 'Background', title: 'Background blur and background removal', Icon: Aperture, ...opens('background') },
      { id: 'filters', label: 'Filters', Icon: Blend, ...opens('filters') },
      { id: 'more', label: 'More', title: 'More: mirror, crop, replace, look', Icon: Ellipsis, iconOnly: true, ...opens('media') },
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
