import { HeaderFooterIcon } from './editorIcons';
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
// AI Meme strips): the Header and Footer switches in one row, then while either is on one colour and
// one height for both. A band comes on empty, no text layer with it.
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
    (which === 'header' ? setCanvasHeader : setCanvasFooter)((prev) => ({ ...prev, enabled: on }));
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
    <Sheet Icon={HeaderFooterIcon} className="ie-bands-sheet ie-tool-sheet" title="Header & footer" onClose={onClose}>
      <Section>
        <div className="ie-bands-switches">
          <div className="ie-bands-switch">
            <span className="ui-row-label">Header</span>
            <Switch label="Header" checked={Boolean(header.enabled)} onChange={(on) => toggle('header', on)} />
          </div>
          <div className="ie-bands-switch">
            <span className="ui-row-label">Footer</span>
            <Switch label="Footer" checked={Boolean(footer.enabled)} onChange={(on) => toggle('footer', on)} />
          </div>
        </div>
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
