import { Type, Sparkles, PanelTop, PanelBottom } from 'lucide-react';
import { ToolStrip } from '../../ui';
import type { StripItem } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import type { EditorActions } from './selection';

// The Face Swap maker's strip, above its dock (Swap face, then Swap again, Editor Pro and Export, in
// EditorPanels; the swap itself is on its page, FaceSwapStudio): Text adds a caption, Effects opens
// the photo filters, Header and Footer turn their band on and open its sheet (as on the Canvas
// strip), Canvas opens the canvas colour.
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
    { id: 'header', label: 'Header', title: 'A band above the meme', Icon: PanelTop, active: sheet === 'header' },
    { id: 'footer', label: 'Footer', title: 'A band below the meme', Icon: PanelBottom, active: sheet === 'footer' },
    { id: 'canvas', label: 'Canvas', title: 'Canvas colour', icon: swatch, active: sheet === 'canvasColor' },
  ];

  // The sheet each button opens; tapping it again closes it.
  const SHEET: Record<string, string> = { effects: 'filters', header: 'header', footer: 'footer', canvas: 'canvasColor' };
  const onSelect = (id: string) => {
    if (id === 'text') {
      actions.handleAddCaption();
      return;
    }
    if (sheet === SHEET[id]) {
      closeSheet();
      return;
    }
    if (id === 'header' && !headerOn) actions.handleToggleCanvasHeader();
    if (id === 'footer' && !footerOn) actions.handleToggleCanvasFooter();
    openSheet(SHEET[id]);
  };

  return <ToolStrip ariaLabel="Face swap tools" layout="stacked" items={items} onSelect={onSelect} />;
}
