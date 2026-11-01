import { Sheet, Section, Row, Slider, Switch, SwatchRow } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { isColorDark } from '../../../utils/captionLayout';
import { bandColor } from '../../canvas/layout/canvasLayout';
import type { EditorActions } from './selection';

const BAND_COLORS = [
  '#ffffff', '#000000', '#f8fafc', '#1e293b', '#ff5a36', '#ffd60a',
  '#34c759', '#0a84ff', '#bf5af2', '#ff375f'
];

interface CanvasBand {
  enabled: boolean;
  bgColor?: string;
  height?: number;
  ownColor?: boolean;
}

interface CaptionItem {
  id: string;
  isFooterCaption?: boolean;
  text?: string;
  color?: string;
  [key: string]: unknown;
}

export default function FooterSheet({ actions: _actions, onClose }: { actions?: EditorActions; onClose: () => void }) {
  const canvasFooter = useMemeEditorStore((s: { canvasFooter: CanvasBand }) => s.canvasFooter);
  const setCanvasFooter = useMemeEditorStore((s: { setCanvasFooter: (fn: (prev: CanvasBand) => CanvasBand) => void }) => s.setCanvasFooter);
  const pushHistory = useMemeEditorStore((s: { pushHistory: () => void }) => s.pushHistory);
  const pushHistoryDebounced = useMemeEditorStore((s: { pushHistoryDebounced: () => void }) => s.pushHistoryDebounced);
  const canvasBgColor: string = useMemeEditorStore((s: { canvasBgColor: string }) => s.canvasBgColor);
  const captions = useMemeEditorStore((s: { captions: CaptionItem[] }) => s.captions);
  const setCaptions = useMemeEditorStore((s: { setCaptions: (caps: CaptionItem[]) => void }) => s.setCaptions);

  const footerCap = captions.find((c: CaptionItem) => c.isFooterCaption);

  const toggleFooter = (on: boolean) => {
    setCanvasFooter((prev: CanvasBand) => ({ ...prev, enabled: on }));
    if (on && !footerCap) {
      const isDark = isColorDark(bandColor(canvasFooter, canvasBgColor));
      const newCap: CaptionItem = {
        id: `caption-footer-${Date.now()}`,
        text: 'Add footer text',
        x: 0.5,
        y: 0.95,
        fontSize: 50,
        fontFamily: 'Montserrat, sans-serif',
        color: isDark ? '#ffffff' : '#000000',
        stroke: 'transparent',
        strokeWidth: 0,
        align: 'center',
        width: 0.92,
        isFooterCaption: true
      };
      setCaptions([...captions, newCap]);
    }
    pushHistory();
  };

  const setHeight = (h: number) => {
    setCanvasFooter((prev: CanvasBand) => ({ ...prev, height: h }));
    pushHistoryDebounced();
  };

  const setBgColor = (color: string) => {
    setCanvasFooter((prev: CanvasBand) => ({ ...prev, bgColor: color, ownColor: true }));
    const isDark = isColorDark(color);
    const nextTextColor = isDark ? '#ffffff' : '#000000';
    // Plain black or white text follows the band so it stays readable; a colour the user chose stays.
    const plain = !footerCap?.color || ['#ffffff', '#000000'].includes(String(footerCap.color).toLowerCase());
    if (footerCap && plain) {
      setCaptions(captions.map((c: CaptionItem) => (c.id === footerCap.id ? { ...c, color: nextTextColor } : c)));
    }
    pushHistory();
  };

  return (
    <Sheet className="ie-footer-sheet" title="Footer" hideTitle onClose={onClose}>
      <Section>
        <Row label="Footer" end>
          <Switch label="Footer" checked={Boolean(canvasFooter.enabled)} onChange={toggleFooter} />
        </Row>
        <Row label="Height">
          <Slider
            label="Footer height"
            min={60}
            max={400}
            step={5}
            value={canvasFooter.height || 140}
            onChange={setHeight}
            format={(v) => `${Math.round(v)}px`}
          />
        </Row>
        <Row label="Color">
          <SwatchRow
            ariaLabel="Footer colour"
            colors={BAND_COLORS}
            value={bandColor(canvasFooter, canvasBgColor)}
            onChange={setBgColor}
          />
        </Row>
      </Section>
    </Sheet>
  );
}
