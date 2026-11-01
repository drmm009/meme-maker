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
  isHeaderCaption?: boolean;
  text?: string;
  color?: string;
  [key: string]: unknown;
}

export default function HeaderSheet({ actions: _actions, onClose }: { actions?: EditorActions; onClose: () => void }) {
  const canvasHeader = useMemeEditorStore((s: { canvasHeader: CanvasBand }) => s.canvasHeader);
  const setCanvasHeader = useMemeEditorStore((s: { setCanvasHeader: (fn: (prev: CanvasBand) => CanvasBand) => void }) => s.setCanvasHeader);
  const pushHistory = useMemeEditorStore((s: { pushHistory: () => void }) => s.pushHistory);
  const pushHistoryDebounced = useMemeEditorStore((s: { pushHistoryDebounced: () => void }) => s.pushHistoryDebounced);
  const canvasBgColor: string = useMemeEditorStore((s: { canvasBgColor: string }) => s.canvasBgColor);
  const captions = useMemeEditorStore((s: { captions: CaptionItem[] }) => s.captions);
  const setCaptions = useMemeEditorStore((s: { setCaptions: (caps: CaptionItem[]) => void }) => s.setCaptions);

  const headerCap = captions.find((c: CaptionItem) => c.isHeaderCaption);

  const toggleHeader = (on: boolean) => {
    setCanvasHeader((prev: CanvasBand) => ({ ...prev, enabled: on }));
    if (on && !headerCap) {
      const isDark = isColorDark(bandColor(canvasHeader, canvasBgColor));
      const newCap: CaptionItem = {
        id: `caption-header-${Date.now()}`,
        text: 'When you finally solve the bug after 4 hours:',
        x: 0.5,
        y: 0.05,
        fontSize: 50,
        fontFamily: 'Montserrat, sans-serif',
        color: isDark ? '#ffffff' : '#000000',
        stroke: 'transparent',
        strokeWidth: 0,
        align: 'center',
        width: 0.92,
        isHeaderCaption: true
      };
      setCaptions([newCap, ...captions]);
    }
    pushHistory();
  };

  const setHeight = (h: number) => {
    setCanvasHeader((prev: CanvasBand) => ({ ...prev, height: h }));
    pushHistoryDebounced();
  };

  const setBgColor = (color: string) => {
    setCanvasHeader((prev: CanvasBand) => ({ ...prev, bgColor: color, ownColor: true }));
    const isDark = isColorDark(color);
    const nextTextColor = isDark ? '#ffffff' : '#000000';
    if (headerCap) {
      setCaptions(captions.map((c: CaptionItem) => (c.id === headerCap.id ? { ...c, color: nextTextColor } : c)));
    }
    pushHistory();
  };

  return (
    <Sheet className="ie-header-sheet" title="Header" hideTitle onClose={onClose}>
      <Section>
        <Row label="Header" end>
          <Switch label="Header" checked={Boolean(canvasHeader.enabled)} onChange={toggleHeader} />
        </Row>
        <Row label="Height">
          <Slider
            label="Header height"
            min={60}
            max={400}
            step={5}
            value={canvasHeader.height || 140}
            onChange={setHeight}
            format={(v) => `${Math.round(v)}px`}
          />
        </Row>
        <Row label="Color">
          <SwatchRow
            ariaLabel="Header colour"
            colors={BAND_COLORS}
            value={bandColor(canvasHeader, canvasBgColor)}
            onChange={setBgColor}
          />
        </Row>
      </Section>
    </Sheet>
  );
}
