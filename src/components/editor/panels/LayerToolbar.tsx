import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Trash2, Settings, SlidersHorizontal, Copy, Scaling, FlipHorizontal, Scissors, Crop, Wand2, Ellipsis, Layers, Palette, Square, MessageSquareQuote, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { FloatingToolbar } from '../../ui';
import type { ToolbarItem } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useSelection } from './selection';
import { placeToolbar } from './placeToolbar';
import type { LayerBox } from './placeToolbar';
import type { EditorActions } from './selection';

// The selected layer's quick tools, floating just above it on the canvas. Hidden while a sheet
// is open and while the layer is being dragged. A caption's Font, Style, Align, Color and Box
// each open the Text sheet with just their sections; the bar scrolls sideways if tools don't fit.
type LayerCanvas = HTMLCanvasElement & { activeLayerBox?: LayerBox | null };

// The Align button shows the caption's alignment.
const alignIcon = (align: unknown) => (align === 'left' ? AlignLeft : align === 'right' ? AlignRight : AlignCenter);

export default function LayerToolbar({ canvasRef, actions }: { canvasRef: RefObject<LayerCanvas | null>; actions: EditorActions }) {
  const { id, kind, caption, sticker, image, drawing } = useSelection();
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string, focus?: string | null) => void }) => s.openSheet);
  const pickDrawTool = useEditorUiStore((s: { pickDrawTool: (tool: string) => void }) => s.pickDrawTool);
  const faceMorph = useMemeEditorStore((s: { templateFaceMorph: unknown }) => s.templateFaceMorph);
  const [box, setBox] = useState<LayerBox | null>(null);
  const [pressing, setPressing] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; below: boolean; tailX: number } | null>(null);
  const [tick, setTick] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas?.addEventListener) return undefined;
    const onBox = () => setBox(canvas.activeLayerBox || null);
    const down = () => setPressing(true);
    const up = () => setPressing(false);
    const resize = () => setTick((t) => t + 1);
    onBox();
    canvas.addEventListener('activelayerbox', onBox);
    canvas.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('resize', resize);
    canvas.addEventListener('canvasview', resize);
    return () => {
      canvas.removeEventListener('canvasview', resize);
      canvas.removeEventListener('activelayerbox', onBox);
      canvas.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef]);

  const dockTab: string | null = useEditorUiStore((s: { dockTab: string | null }) => s.dockTab);
  const shown = Boolean(id && kind && !sheet && dockTab !== 'draw' && !faceMorph);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const el = ref.current;
    const parent = el?.offsetParent as HTMLElement | null;
    if (!shown || !box || !canvas || !el || !parent) {
      setPos(null);
      return;
    }
    setPos(placeToolbar(box, canvas.getBoundingClientRect(), canvas.width, parent.getBoundingClientRect(), { w: el.offsetWidth, h: el.offsetHeight }));
  }, [shown, box, kind, tick, canvasRef]);

  if (!shown || !id) return null;

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
    <FloatingToolbar
      toolbarRef={ref}
      ariaLabel="Layer tools"
      className="ie-layer-toolbar"
      items={items}
      tail={pos ? { side: pos.below ? 'top' : 'bottom', x: pos.tailX } : null}
      style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos && !pressing ? 'visible' : 'hidden' }}
    />
  );
}
