import { AtSign } from 'lucide-react';
import { HeaderFooterIcon } from './editorIcons';
import { CENSOR_TOOL } from './drawTools';
import { ToolStrip } from '../../ui';
import type { StripItem } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import type { EditorActions } from './selection';

// The Canvas tab's strip: Canvas Style (background colour, mirror,
// crop) and Watermark open their sheets; Header & Footer opens the bands' sheet (switching the header on if neither band is); Censor
// picks the censor draw tool, dragging out regions while this tab shows (its settings in the draw sheet).
export default function CanvasStrip({ actions }: { actions: EditorActions }) {
  const canvasBgColor: string = useMemeEditorStore((s: { canvasBgColor: string }) => s.canvasBgColor);
  const headerOn = useMemeEditorStore((s: { canvasHeader: { enabled: boolean } }) => Boolean(s.canvasHeader?.enabled));
  const footerOn = useMemeEditorStore((s: { canvasFooter: { enabled: boolean } }) => Boolean(s.canvasFooter?.enabled));
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const watermarkOn = useEditorUiStore((s: { watermark: { enabled?: boolean } }) => Boolean(s.watermark?.enabled));
  const updateWatermark = useEditorUiStore((s: { updateWatermark: (key: string, value: unknown) => void }) => s.updateWatermark);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string, focus?: string | null) => void }) => s.openSheet);
  const closeSheet = useEditorUiStore((s: { closeSheet: () => void }) => s.closeSheet);
  const drawTool: string | null = useEditorUiStore((s: { drawTool: string | null }) => s.drawTool);
  const pickDrawTool = useEditorUiStore((s: { pickDrawTool: (tool: string) => void }) => s.pickDrawTool);
  const censoring = drawTool === 'censor';

  const swatch = (
    <span
      className="ie-strip-swatch"
      style={{ background: canvasBgColor === 'transparent' ? 'repeating-conic-gradient(#888 0 25%, #ddd 0 50%) 0 0 / 8px 8px' : canvasBgColor || '#ffffff' }}
    />
  );
  const items: StripItem[] = [
    { id: 'style', label: 'Canvas Style', title: 'Background colour, mirror and crop', icon: swatch, active: sheet === 'canvasColor', className: 'ie-strip-btn--two-line' },
    { id: 'bands', label: 'Header & Footer', title: 'Bands above and below the meme', Icon: HeaderFooterIcon, active: sheet === 'bands', className: 'ie-strip-btn--two-line' },
    { ...CENSOR_TOOL, active: censoring && sheet === 'draw' },
    { id: 'watermark', label: 'Watermark', title: 'Watermark Settings', Icon: AtSign, active: sheet === 'watermark' },
  ];

  const onSelect = (id: string) => {
    if (id === 'style') {
      if (sheet === 'canvasColor') closeSheet();
      else openSheet('canvasColor');
    } else if (id === 'watermark') {
      if (sheet === 'watermark') closeSheet();
      else {
        if (!watermarkOn) updateWatermark('enabled', true);
        openSheet('watermark');
      }
    } else if (id === 'censor') {
      pickDrawTool('censor');
    } else if (id === 'bands') {
      if (sheet === 'bands') closeSheet();
      else {
        if (!headerOn && !footerOn) actions.handleToggleCanvasHeader();
        openSheet('bands');
      }
    }
  };

  return <ToolStrip ariaLabel="Canvas tools" layout="stacked" items={items} live={censoring && sheet !== 'draw' ? 'censor' : null} onSelect={onSelect} />;
}
