// The video editor's Header & footer (Canvas → Header & footer), as the image editor's BandsSheet:
// the Header and Footer switches in one row, then while either is on one colour and one height for
// both. The bars (utils/videoBands) sit over the clips and photos and under stickers and text.
import { Row, Slider, Switch, SwatchRow } from '../ui';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { BAND_SWATCHES, MAX_BAND_HEIGHT, MIN_BAND_HEIGHT } from '../../utils/videoBands';
import type { VideoBand } from '../../utils/videoBands';
import '../editor/panels/panels.css';

type SetBand = (band: VideoBand | ((prev: VideoBand) => VideoBand)) => void;
interface BandState {
  videoHeader: VideoBand;
  videoFooter: VideoBand;
  setVideoHeader: SetBand;
  setVideoFooter: SetBand;
}

export default function VideoBandsPanel() {
  const header = useEditorStore((s: BandState) => s.videoHeader);
  const footer = useEditorStore((s: BandState) => s.videoFooter);
  const setHeader = useEditorStore((s: BandState) => s.setVideoHeader);
  const setFooter = useEditorStore((s: BandState) => s.setVideoFooter);
  const anyOn = header.enabled || footer.enabled;
  // The colour and height shown: the header's, or the footer's while only it is on.
  const shown = header.enabled || !footer.enabled ? header : footer;
  const both = (patch: Partial<VideoBand>) => {
    setHeader((prev) => ({ ...prev, ...patch }));
    setFooter((prev) => ({ ...prev, ...patch }));
  };

  return (
    <div className="ie-panels--sheet vt-ie-look">
      <div className="ie-bands-sheet ie-tool-sheet">
        <div className="ie-bands-switches">
          <div className="ie-bands-switch">
            <span className="ui-row-label">Header</span>
            <Switch label="Header" checked={header.enabled} onChange={(on: boolean) => setHeader((prev) => ({ ...prev, enabled: on }))} />
          </div>
          <div className="ie-bands-switch">
            <span className="ui-row-label">Footer</span>
            <Switch label="Footer" checked={footer.enabled} onChange={(on: boolean) => setFooter((prev) => ({ ...prev, enabled: on }))} />
          </div>
        </div>
        {!anyOn && <p className="ie-empty">Switch one on for a bar above or below the video to write in.</p>}
        {anyOn && (
          <>
            <Row label="Color">
              <SwatchRow ariaLabel="Bar colour" colors={BAND_SWATCHES} value={shown.bgColor} onChange={(bgColor: string) => both({ bgColor })} />
            </Row>
            <Row label="Height">
              <Slider
                label="Bar height"
                min={MIN_BAND_HEIGHT}
                max={MAX_BAND_HEIGHT}
                step={5}
                value={shown.height}
                onChange={(height: number) => both({ height })}
                format={(v: number) => `${Math.round(v)}`}
              />
            </Row>
          </>
        )}
      </div>
    </div>
  );
}
