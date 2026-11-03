import { Stamp, PanelsTopBottom } from 'lucide-react';
import { ToolStrip } from '../../ui';
import type { StripItem } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import type { EditorActions } from './selection';

// The Canvas tab's strip: Canvas Style (background colour, mirror, crop) and Watermark open their
// sheets; Header & Footer opens the bands' sheet (switching the header on if neither band is).
export default function CanvasStrip({ actions }: { actions: EditorActions }) {
  const canvasBgColor: string = useMemeEditorStore((s: { canvasBgColor: string }) => s.canvasBgColor);
  const headerOn = useMemeEditorStore((s: { canvasHeader: { enabled: boolean } }) => Boolean(s.canvasHeader?.enabled));
  const footerOn = useMemeEditorStore((s: { canvasFooter: { enabled: boolean } }) => Boolean(s.canvasFooter?.enabled));
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const watermarkOn = useEditorUiStore((s: { watermark: { enabled?: boolean } }) => Boolean(s.watermark?.enabled));
  const updateWatermark = useEditorUiStore((s: { updateWatermark: (key: string, value: unknown) => void }) => s.updateWatermark);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string, focus?: string | null) => void }) => s.openSheet);
  const closeSheet = useEditorUiStore((s: { closeSheet: () => void }) => s.closeSheet);

  const swatch = (
    <span
      className="ie-strip-swatch"
      style={{ background: canvasBgColor === 'transparent' ? 'repeating-conic-gradient(#888 0 25%, #ddd 0 50%) 0 0 / 8px 8px' : canvasBgColor || '#ffffff' }}
    />
  );
  const items: StripItem[] = [
    { id: 'style', label: 'Canvas Style', title: 'Background colour, mirror and crop', icon: swatch, active: sheet === 'canvasColor' },
    { id: 'watermark', label: 'Watermark', title: 'Watermark Settings', Icon: Stamp, active: sheet === 'watermark' },
    { id: 'bands', label: 'Header & Footer', title: 'Bands above and below the meme', Icon: PanelsTopBottom, active: sheet === 'bands', className: 'ie-strip-btn--two-line' },
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
    } else if (id === 'bands') {
      if (sheet === 'bands') closeSheet();
      else {
        if (!headerOn && !footerOn) actions.handleToggleCanvasHeader();
        openSheet('bands');
      }
    }
  };

  return <ToolStrip ariaLabel="Canvas tools" layout="stacked" items={items} onSelect={onSelect} />;
}
