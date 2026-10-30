import { Stamp, PanelTop, PanelBottom } from 'lucide-react';
import { ToolStrip } from '../../ui';
import type { StripItem } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import type { EditorActions } from './selection';

// The Canvas tab's strip: Canvas Style (background colour, mirror, crop) and Watermark open their
// sheets; Header and Footer switch straight away and light up while on.
export default function CanvasStrip({ actions }: { actions: EditorActions }) {
  const canvasBgColor: string = useMemeEditorStore((s: { canvasBgColor: string }) => s.canvasBgColor);
  const headerOn = useMemeEditorStore((s: { canvasHeader: { enabled: boolean } }) => Boolean(s.canvasHeader?.enabled));
  const footerOn = useMemeEditorStore((s: { canvasFooter: { enabled: boolean } }) => Boolean(s.canvasFooter?.enabled));
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const watermarkOn = useEditorUiStore((s: { watermark: { enabled?: boolean } }) => Boolean(s.watermark?.enabled));
  const updateWatermark = useEditorUiStore((s: { updateWatermark: (key: string, value: unknown) => void }) => s.updateWatermark);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string, focus?: string | null) => void }) => s.openSheet);

  const swatch = (
    <span
      className="ie-strip-swatch"
      style={{ background: canvasBgColor === 'transparent' ? 'repeating-conic-gradient(#888 0 25%, #ddd 0 50%) 0 0 / 8px 8px' : canvasBgColor || '#ffffff' }}
    />
  );
  const items: StripItem[] = [
    { id: 'style', label: 'Canvas Style', title: 'Background colour, mirror and crop', icon: swatch, active: sheet === 'canvasColor' },
    { id: 'watermark', label: 'Watermark', title: 'Watermark Settings', Icon: Stamp, active: sheet === 'watermark' || watermarkOn },
    { id: 'header', label: 'Header', title: 'White band above the meme', Icon: PanelTop, active: headerOn },
    { id: 'footer', label: 'Footer', title: 'White band below the meme', Icon: PanelBottom, active: footerOn },
  ];

  const onSelect = (id: string) => {
    if (id === 'style') openSheet('canvasColor');
    else if (id === 'watermark') {
      if (!watermarkOn) updateWatermark('enabled', true);
      openSheet('watermark');
    } else if (id === 'header') actions.handleToggleCanvasHeader();
    else if (id === 'footer') actions.handleToggleCanvasFooter();
  };

  return <ToolStrip ariaLabel="Canvas tools" layout="stacked" items={items} onSelect={onSelect} />;
}
