// The Stickers maker's outline styles (styled in stickerStudioPage.css, the outline looks
// .ie-stk-look--* in stickerStudio.css): a header, Style and the picked one's name in a small green
// pill, then a row of six tiles, each the picture in that outline on the see-through checkerboard
// (as the sticker will show) over its name, the picked one ringed in green. On the sticker page
// (StickerStudio) before Generate, and on the editing screen (StickerStrip) after it, where a pick
// restyles the cut-out.
import { useEditorUiStore } from '../store/useEditorUiStore';
import { STICKER_STYLES } from '../stickerMaker';

export default function StickerStylePicker({ previewUrl, disabled = false, onPick }: {
  /** The picture each style is shown on. */
  previewUrl: string;
  disabled?: boolean;
  onPick: (id: string) => void;
}) {
  const style: string = useEditorUiStore((s: { stickerStyle: string }) => s.stickerStyle);
  const picked = STICKER_STYLES.find((s) => s.id === style)?.label || 'Classic';
  return (
    <div className="ssp">
      <div className="ssp-head">
        <span className="ssp-title">Style</span>
        <span className="ssp-picked" aria-hidden="true">{picked}</span>
      </div>

      <div className="ssp-row" role="radiogroup" aria-label="Sticker style">
        {STICKER_STYLES.map((s) => {
          const isOn = style === s.id;
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={isOn}
              aria-label={s.label}
              className={`ssp-style${isOn ? ' is-on' : ''}`}
              disabled={disabled}
              onClick={() => onPick(s.id)}
            >
              <span className="ssp-tile" aria-hidden="true">
                <img className={`ie-stk-look--${s.id}`} src={previewUrl} alt="" draggable={false} />
              </span>
              <span className="ssp-name">{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
