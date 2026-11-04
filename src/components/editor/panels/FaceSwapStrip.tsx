import { Type, Sparkles } from 'lucide-react';
import { HeaderFooterIcon } from './editorIcons';
import { ToolStrip } from '../../ui';
import type { StripItem } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import type { EditorActions } from './selection';

// The Face Swap maker's strip, above its dock (Swap face, then Swap again, Move to editor and Export, in
// EditorPanels; the swap itself is on its page, FaceSwapStudio): Text adds a caption, Effects opens
// the photo filters, Header & Footer opens the bands' sheet (as on the Canvas strip), Canvas opens
// the canvas colour.
export default function FaceSwapStrip({ actions }: { actions: EditorActions }) {
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const closeSheet = useEditorUiStore((s: { closeSheet: () => void }) => s.closeSheet);
  const canvasBgColor: string = useMemeEditorStore((s: { canvasBgColor: string }) => s.canvasBgColor);
  const headerOn = useMemeEditorStore((s: { canvasHeader: { enabled: boolean } }) => Boolean(s.canvasHeader?.enabled));
  const footerOn = useMemeEditorStore((s: { canvasFooter: { enabled: boolean } }) => Boolean(s.canvasFooter?.enabled));

  const swatch = (
    <span
      className="ie-strip-swatch"
      style={{ background: canvasBgColor === 'transparent' ? 'repeating-conic-gradient(#888 0 25%, #ddd 0 50%) 0 0 / 8px 8px' : canvasBgColor || '#ffffff' }}
    />
  );
  const items: StripItem[] = [
    { id: 'text', label: 'Text', title: 'Add a caption', Icon: Type },
    { id: 'effects', label: 'Effects', title: 'Photo effects and filters', Icon: Sparkles, active: sheet === 'filters' },
    { id: 'bands', label: 'Header & Footer', title: 'Bands above and below the meme', Icon: HeaderFooterIcon, active: sheet === 'bands', className: 'ie-strip-btn--two-line' },
    { id: 'canvas', label: 'Canvas', title: 'Canvas colour', icon: swatch, active: sheet === 'canvasColor' },
  ];

  // The sheet each button opens; tapping it again closes it.
  const SHEET: Record<string, string> = { effects: 'filters', bands: 'bands', canvas: 'canvasColor' };
  const onSelect = (id: string) => {
    if (id === 'text') {
      actions.handleAddCaption();
      return;
    }
    if (sheet === SHEET[id]) {
      closeSheet();
      return;
    }
    if (id === 'bands' && !headerOn && !footerOn) actions.handleToggleCanvasHeader();
    openSheet(SHEET[id]);
  };

  return <ToolStrip ariaLabel="Face swap tools" layout="stacked" items={items} onSelect={onSelect} />;
}
