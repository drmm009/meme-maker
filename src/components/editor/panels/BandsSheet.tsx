import { Sheet, Section, Row, Slider, Switch, SwatchRow } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { isColorDark } from '../../../utils/captionLayout';
import { bandColor } from '../../canvas/layout/canvasLayout';
import type { EditorActions } from './selection';

const BAND_COLORS = [
  '#ffffff', '#000000', '#6b7280', '#1e293b', '#ff5a36', '#ffd60a',
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
  isFooterCaption?: boolean;
  text?: string;
  color?: string;
  [key: string]: unknown;
}

type SetBand = (fn: (prev: CanvasBand) => CanvasBand) => void;
interface BandStore {
  canvasHeader: CanvasBand;
  canvasFooter: CanvasBand;
  setCanvasHeader: SetBand;
  setCanvasFooter: SetBand;
  pushHistory: () => void;
  pushHistoryDebounced: () => void;
  canvasBgColor: string;
  captions: CaptionItem[];
  setCaptions: (caps: CaptionItem[]) => void;
}

// The header and footer bands in one sheet (the Header & Footer button on the Canvas, Face Swap and
// AI Meme strips): a switch for each, then one colour and one height for both. A band switched on
// gets its own caption to write in; switched off, its caption stays for when it comes back.
export default function BandsSheet({ onClose }: { actions?: EditorActions; onClose: () => void }) {
  const header: CanvasBand = useMemeEditorStore((s: BandStore) => s.canvasHeader);
  const footer: CanvasBand = useMemeEditorStore((s: BandStore) => s.canvasFooter);
  const setCanvasHeader: SetBand = useMemeEditorStore((s: BandStore) => s.setCanvasHeader);
  const setCanvasFooter: SetBand = useMemeEditorStore((s: BandStore) => s.setCanvasFooter);
  const pushHistory: () => void = useMemeEditorStore((s: BandStore) => s.pushHistory);
  const pushHistoryDebounced: () => void = useMemeEditorStore((s: BandStore) => s.pushHistoryDebounced);
  const canvasBgColor: string = useMemeEditorStore((s: BandStore) => s.canvasBgColor);
  const captions: CaptionItem[] = useMemeEditorStore((s: BandStore) => s.captions);
  const setCaptions: (caps: CaptionItem[]) => void = useMemeEditorStore((s: BandStore) => s.setCaptions);

  const isBandCap = (c: CaptionItem) => Boolean(c.isHeaderCaption || c.isFooterCaption);
  const anyOn = Boolean(header.enabled || footer.enabled);
  // The colour and height shown: the header's, or the footer's while only it is on.
  const shown = header.enabled || !footer.enabled ? header : footer;

  const toggle = (which: 'header' | 'footer', on: boolean) => {
    const band = which === 'header' ? header : footer;
    (which === 'header' ? setCanvasHeader : setCanvasFooter)((prev) => ({ ...prev, enabled: on }));
    const flag = which === 'header' ? 'isHeaderCaption' : 'isFooterCaption';
    if (on && !captions.some((c) => c[flag])) {
      const isDark = isColorDark(bandColor(band, canvasBgColor));
      const cap: CaptionItem = {
        id: `caption-${which}-${Date.now()}`,
        text: `Add ${which} text`,
        x: 0.5,
        y: which === 'header' ? 0.05 : 0.95,
        fontSize: 50,
        fontFamily: 'Montserrat, sans-serif',
        color: isDark ? '#ffffff' : '#000000',
        stroke: 'transparent',
        strokeWidth: 0,
        align: 'center',
        width: 0.92,
        [flag]: true,
      };
      setCaptions(which === 'header' ? [cap, ...captions] : [...captions, cap]);
    }
    pushHistory();
  };

  const setHeight = (h: number) => {
    setCanvasHeader((prev) => ({ ...prev, height: h }));
    setCanvasFooter((prev) => ({ ...prev, height: h }));
    pushHistoryDebounced();
  };

  const setBgColor = (color: string) => {
    setCanvasHeader((prev) => ({ ...prev, bgColor: color, ownColor: true }));
    setCanvasFooter((prev) => ({ ...prev, bgColor: color, ownColor: true }));
    // Plain black or white band text follows the colour so it stays readable; a colour the user chose stays.
    const textColor = isColorDark(color) ? '#ffffff' : '#000000';
    const plain = (c: CaptionItem) => !c.color || ['#ffffff', '#000000'].includes(String(c.color).toLowerCase());
    setCaptions(captions.map((c) => (isBandCap(c) && plain(c) ? { ...c, color: textColor } : c)));
    pushHistory();
  };

  return (
    <Sheet className="ie-bands-sheet ie-tool-sheet" title="Header & footer" onClose={onClose}>
      <Section>
        <Row label="Header" end>
          <Switch label="Header" checked={Boolean(header.enabled)} onChange={(on) => toggle('header', on)} />
        </Row>
        <Row label="Footer" end>
          <Switch label="Footer" checked={Boolean(footer.enabled)} onChange={(on) => toggle('footer', on)} />
        </Row>
        {!anyOn && <p className="ie-empty">Switch one on for a band above or below the meme to write in.</p>}
        {anyOn && (
          <>
            <Row label="Color">
              <SwatchRow ariaLabel="Band colour" colors={BAND_COLORS} value={bandColor(shown, canvasBgColor)} onChange={setBgColor} />
            </Row>
            <Row label="Height">
              <Slider label="Band height" min={60} max={400} step={5} value={shown.height || 140} onChange={setHeight} format={(v) => `${Math.round(v)}`} />
            </Row>
          </>
        )}
      </Section>
    </Sheet>
  );
}
