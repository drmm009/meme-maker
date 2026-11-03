import { useEffect, useRef } from 'react';
import { Type, Copy, PenLine, Sparkles, LayoutGrid, ScanFace, Share2, Wand2, Sticker, Download, Palette } from 'lucide-react';
import { ToolDock, ToolStrip } from '../../ui';
import type { DockItem } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useSelection } from './selection';
import type { EditorActions } from './selection';
import TextSheet from './TextSheet';
import CanvasColorSheet from './CanvasColorSheet';
import WatermarkSheet from './WatermarkSheet';
import HeaderSheet from './HeaderSheet';
import FooterSheet from './FooterSheet';
import CanvasStrip from './CanvasStrip';
import MediaSheet from './MediaSheet';
import DrawSheet from './DrawSheet';
import FiltersSheet from './FiltersSheet';
import AiFiltersStrip from './AiFiltersStrip';
import MediaStrip from './MediaStrip';
import TextStrip from './TextStrip';
import FaceSwapSheet from './FaceSwapSheet';
import LayersSheet from './LayersSheet';
import ExportSheet from '../export/ExportSheet';
import LibrarySheet from '../library/LibrarySheet';
import LinkSheet from './LinkSheet';
import TemplatesSheet, { MemePickerSheet } from './TemplatesSheet';
import FaceSwapStrip from './FaceSwapStrip';
import CardFormSheet, { CardLookSheet } from './CardFormSheet';
import CardStrip from './CardStrip';
import AiMemeSheet from './AiMemeSheet';
import AiStrip from './AiStrip';
import StickerStrip from './StickerStrip';
import StickersSheet from './StickersSheet';
import EmojiSheet from './EmojiSheet';
import BubbleSheet from './BubbleSheet';
import BackgroundSheet from './BackgroundSheet';
import DieCutSheet from './DieCutSheet';
import LayerToolbar from './LayerToolbar';
import { DRAW_TOOLS } from './drawTools';
import { useSmoothHeight } from './useSmoothHeight';
import { EDITOR_MODES } from '../editorModes';
import type { EditorMode } from '../editorModes';
import './panels.css';

// Text sits in the middle; the open section is the wide gradient pill. A focused maker's dock has
// only its mode's tabs (editorModes.ts), in its order.
const DOCK: DockItem[] = [
  { id: 'draw', label: 'Draw', Icon: PenLine, title: 'Draw on the meme' },
  { id: 'media', label: 'Media', Icon: Copy, title: 'Photos, videos, stickers and emoji' },
  { id: 'text', label: 'Text', Icon: Type, title: 'Text' },
  { id: 'fx', label: 'AI/Filters', Icon: Sparkles, title: 'AI tools and photo filters' },
  { id: 'canvas', label: 'Canvas', Icon: LayoutGrid, title: 'Canvas colour, bands and watermark' },
  { id: 'swap', label: 'Face Swap', Icon: ScanFace, title: 'Your face and the meme' },
  { id: 'card', label: 'Card', Icon: Share2, title: 'The social card' },
  { id: 'ai', label: 'AI', Icon: Wand2, title: 'AI meme ideas' },
  // The Stickers maker's dock buttons: Generate Sticker (Full editor once it's made) and Export.
  { id: 'sticker', label: 'Generate Sticker', Icon: Sticker, title: 'Cut out the picture', variant: 'primary' },
  { id: 'export', label: 'Export', Icon: Download, title: 'Save or share the sticker', variant: 'primary' },
];

const SHEETS = { text: TextSheet, media: MediaSheet, draw: DrawSheet, canvasColor: CanvasColorSheet, watermark: WatermarkSheet, header: HeaderSheet, footer: FooterSheet, filters: FiltersSheet, background: BackgroundSheet, layers: LayersSheet, export: ExportSheet, library: LibrarySheet, mediaLink: LinkSheet,
  templates: TemplatesSheet, memes: MemePickerSheet, stickers: StickersSheet, emoji: EmojiSheet, bubble: BubbleSheet, diecut: DieCutSheet,
  card: CardFormSheet, cardLook: CardLookSheet, aiMeme: AiMemeSheet };
// Sheets for browsing a big library, shown full height (the meme needn't stay in view).
const FULL_SHEETS = new Set<string>(['templates', 'memes', 'stickers', 'emoji', 'aiMeme']);

// The bottom of the editor: the dock with the open tab's tool strip above it, or, when one of that
// tab's sheets is open, the strip above the sheet (so its tools stay one tap away). While a layer is
// selected (and not drawing), its tools pill (LayerToolbar) takes the strip's place above the dock,
// and above the sheets it opens, and no dock tab is lit.
export default function EditorPanels({ actions }: { actions: EditorActions }) {
  const sheet: keyof typeof SHEETS | null = useEditorUiStore((s: { sheet: keyof typeof SHEETS | null }) => s.sheet);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const closeSheet = useEditorUiStore((s: { closeSheet: () => void }) => s.closeSheet);
  const openFullEditor = useEditorUiStore((s: { openFullEditor: () => void }) => s.openFullEditor);
  const dockTab: string | null = useEditorUiStore((s: { dockTab: string | null }) => s.dockTab);
  const drawTool: string | null = useEditorUiStore((s: { drawTool: string | null }) => s.drawTool);
  const sheetFromPill: boolean = useEditorUiStore((s: { sheetFromPill: boolean }) => s.sheetFromPill);
  const showDockTab = useEditorUiStore((s: { showDockTab: (tab: string) => void }) => s.showDockTab);
  const pickDrawTool = useEditorUiStore((s: { pickDrawTool: (tool: string) => void }) => s.pickDrawTool);
  const leaveDock = useEditorUiStore((s: { leaveDock: () => void }) => s.leaveDock);
  const mode: EditorMode = useEditorUiStore((s: { mode: EditorMode }) => s.mode);
  const busy = Boolean(actions.isRemovingBg);
  const photos: { originalUrl?: string | null }[] = useMemeEditorStore((s: { imageLayers: { originalUrl?: string | null }[] }) => s.imageLayers);
  const generated = photos.length > 0 && photos.every((l) => Boolean(l.originalUrl));
  // The Stickers maker's dock: Generate Sticker (waiting for a photo until there is one); once the
  // sticker is made, Export leads and Full editor sits beside it.
  const stickerDock: Partial<DockItem> = busy ? { label: 'Generating…', disabled: true }
    : generated ? { label: 'Full editor', title: 'Keep editing in the full editor', Icon: Palette, variant: 'secondary' }
    : { title: photos.length ? 'Cut out the picture' : 'Add a photo first', disabled: !photos.length };
  const modeDock = mode === 'sticker' && !generated ? ['sticker'] : EDITOR_MODES[mode].dock;
  const dock = modeDock.map((id) => DOCK.find((d) => d.id === id)).filter((d): d is DockItem => Boolean(d))
    .map((d) => (d.id === 'sticker' ? { ...d, ...stickerDock } : d));
  const setActiveLayerId = useMemeEditorStore((s: { setActiveLayerId: (id: string | null) => void }) => s.setActiveLayerId);
  const faceMorph = useMemeEditorStore((s: { templateFaceMorph: { morphProgress?: number } | null }) => s.templateFaceMorph);
  const { kind } = useSelection();
  // One element in every branch below, so its height can glide between them.
  const panelRef = useRef<HTMLDivElement>(null);
  const full = Boolean(sheet && FULL_SHEETS.has(sheet));
  useSmoothHeight(panelRef, full);
  // A sheet opened from the pill belongs to its layer: once that layer is gone (deleted, or
  // deselected) the sheet closes, back to the dock, rather than staying with nothing under it.
  const orphaned = sheetFromPill && !kind;
  useEffect(() => {
    if (orphaned) closeSheet();
  }, [orphaned, closeSheet]);

  if (faceMorph && !kind) {
    return (
      <div ref={panelRef} className="ie-panels ie-panels--sheet" data-sheet-ghosts="">
        <FaceSwapSheet morphProgress={faceMorph.morphProgress} actions={actions} />
      </div>
    );
  }

  const strip = dockTab === 'draw'
    ? <ToolStrip ariaLabel="Draw tools" layout="stacked" items={DRAW_TOOLS} active={sheet === 'draw' ? drawTool : null} live={sheet === 'draw' ? null : drawTool} onSelect={pickDrawTool} />
    : dockTab === 'media' ? <MediaStrip actions={actions} />
    : dockTab === 'text' ? <TextStrip actions={actions} />
    : dockTab === 'fx' ? <AiFiltersStrip actions={actions} />
    : dockTab === 'canvas' ? <CanvasStrip actions={actions} />
    : dockTab === 'swap' ? <FaceSwapStrip actions={actions} />
    : dockTab === 'card' ? <CardStrip actions={actions} />
    : dockTab === 'ai' ? <AiStrip />
    : dockTab === 'sticker' ? <StickerStrip actions={actions} /> : null;

  // A selected layer's pill replaces the strip, the Draw strip too unless a draw tool is live (taps
  // then draw rather than select). In the Stickers maker a photo keeps the Sticker strip: its few
  // buttons are the whole job there.
  const layerTools = Boolean(kind) && !(dockTab === 'draw' && drawTool) && !faceMorph && !(mode === 'sticker' && kind === 'image');
  const SheetComponent = sheet && !orphaned ? SHEETS[sheet] : null;
  if (SheetComponent && full) {
    // A browsing sheet takes the editor's whole height, over the meme, with its own close button.
    return (
      <div ref={panelRef} className="ie-panels ie-panels--sheet ie-panels--full">
        <SheetComponent actions={actions} onClose={closeSheet} />
      </div>
    );
  }
  if (SheetComponent) {
    return (
      <div ref={panelRef} className="ie-panels ie-panels--sheet" data-sheet-ghosts="">
        {layerTools && sheetFromPill ? <LayerToolbar actions={actions} /> : strip}
        <SheetComponent actions={actions} onClose={closeSheet} />
      </div>
    );
  }

  return (
    <div ref={panelRef} className={`ie-panels${mode === 'sticker' ? ' ie-panels--sticker' : ''}`} data-sheet-ghosts="">
      {layerTools ? <LayerToolbar actions={actions} /> : strip}
      <ToolDock
        ariaLabel="Editor tools"
        items={dock}
        active={layerTools ? null : mode === 'sticker' ? null : dockTab}
        onSelect={(id) => {
          if (id === 'sticker') {
            if (generated) {
              openFullEditor();
              return;
            }
            if (!busy && photos.length) void actions.handleGenerateSticker();
            return;
          }
          if (id === 'export') {
            if (sheet === 'export') closeSheet();
            else openSheet('export');
            return;
          }
          // Every tab deselects the layer and shows its strip; tapping the lit tab again closes it
          // (and stops drawing). With a layer selected no tab is lit, so any tab opens its strip.
          if (dockTab === id && !layerTools) leaveDock();
          else {
            setActiveLayerId(null);
            showDockTab(id);
          }
        }}
      />
    </div>
  );
}
