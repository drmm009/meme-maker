import { Type, Copy, PenLine, Sparkles, LayoutGrid } from 'lucide-react';
import { ToolDock, ToolStrip } from '../../ui';
import type { DockItem } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useSelection, SHEET_FOR_KIND } from './selection';
import type { EditorActions } from './selection';
import TextSheet from './TextSheet';
import CanvasColorSheet from './CanvasColorSheet';
import WatermarkSheet from './WatermarkSheet';
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
import TemplatesSheet from './TemplatesSheet';
import StickersSheet from './StickersSheet';
import GifSheet from './GifSheet';
import EmojiSheet from './EmojiSheet';
import BubbleSheet from './BubbleSheet';
import { DRAW_TOOLS } from './drawTools';
import './panels.css';

// Text sits in the middle; the open section is the wide gradient pill.
const DOCK: DockItem[] = [
  { id: 'draw', label: 'Draw', Icon: PenLine, title: 'Draw on the meme' },
  { id: 'media', label: 'Media', Icon: Copy, title: 'Photos, videos, stickers and emoji' },
  { id: 'text', label: 'Text', Icon: Type, title: 'Text' },
  { id: 'fx', label: 'AI/Filters', Icon: Sparkles, title: 'AI tools and photo filters' },
  { id: 'canvas', label: 'Canvas', Icon: LayoutGrid, title: 'Canvas colour, bands and watermark' },
];

const SHEETS = { text: TextSheet, media: MediaSheet, draw: DrawSheet, canvasColor: CanvasColorSheet, watermark: WatermarkSheet, filters: FiltersSheet, layers: LayersSheet, export: ExportSheet, library: LibrarySheet, mediaLink: LinkSheet,
  templates: TemplatesSheet, stickers: StickersSheet, gifs: GifSheet, emoji: EmojiSheet, bubble: BubbleSheet };

// The bottom of the editor: the dock with the open tab's tool strip above it, or, when one of that
// tab's sheets is open, the strip above the sheet (so its tools stay one tap away).
export default function EditorPanels({ actions }: { actions: EditorActions }) {
  const sheet: keyof typeof SHEETS | null = useEditorUiStore((s: { sheet: keyof typeof SHEETS | null }) => s.sheet);
  const closeSheet = useEditorUiStore((s: { closeSheet: () => void }) => s.closeSheet);
  const dockTab: string | null = useEditorUiStore((s: { dockTab: string | null }) => s.dockTab);
  const drawTool: string | null = useEditorUiStore((s: { drawTool: string | null }) => s.drawTool);
  const showDockTab = useEditorUiStore((s: { showDockTab: (tab: string) => void }) => s.showDockTab);
  const pickDrawTool = useEditorUiStore((s: { pickDrawTool: (tool: string) => void }) => s.pickDrawTool);
  const leaveDock = useEditorUiStore((s: { leaveDock: () => void }) => s.leaveDock);
  const setActiveLayerId = useMemeEditorStore((s: { setActiveLayerId: (id: string | null) => void }) => s.setActiveLayerId);
  const faceMorph = useMemeEditorStore((s: { templateFaceMorph: { morphProgress?: number } | null }) => s.templateFaceMorph);
  const { kind } = useSelection();

  if (faceMorph && !kind) {
    return (
      <div className="ie-panels ie-panels--sheet">
        <FaceSwapSheet morphProgress={faceMorph.morphProgress} actions={actions} />
      </div>
    );
  }

  const strip = dockTab === 'draw'
    ? <ToolStrip ariaLabel="Draw tools" layout="stacked" items={DRAW_TOOLS} active={drawTool} onSelect={pickDrawTool} />
    : dockTab === 'media' ? <MediaStrip actions={actions} />
    : dockTab === 'text' ? <TextStrip actions={actions} />
    : dockTab === 'fx' ? <AiFiltersStrip actions={actions} />
    : dockTab === 'canvas' ? <CanvasStrip actions={actions} /> : null;

  const SheetComponent = sheet ? SHEETS[sheet] : null;
  if (SheetComponent) {
    return (
      <div className="ie-panels ie-panels--sheet">
        {strip}
        <SheetComponent actions={actions} onClose={closeSheet} />
      </div>
    );
  }

  return (
    <div className="ie-panels">
      {strip}
      <ToolDock
        ariaLabel="Editor tools"
        items={DOCK}
        active={dockTab || (kind ? SHEET_FOR_KIND[kind] : null)}
        onSelect={(id) => {
          // Every tab shows its strip; tapping it again closes it (and stops drawing).
          if (dockTab === id) leaveDock();
          else {
            if (id === 'draw') setActiveLayerId(null);
            showDockTab(id);
          }
        }}
      />
    </div>
  );
}
