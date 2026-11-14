// The Stickers maker's outline styles: a row of the maker pages' choices card (faceSwap.css), its
// label and the picked style's name, then small pictures of the photo in each style (as a camera app
// shows its filters), the picked one ringed in orange. On the sticker page (StickerStudio) before
// Generate, and on the editing page (StickerStrip) after it, where a pick restyles the cut-out.
import { Check, Palette } from 'lucide-react';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { STICKER_STYLES } from '../stickerMaker';

export default function StickerStylePicker({ previewUrl, disabled = false, onPick }: {
  /** The picture each style is shown on. */
  previewUrl: string;
  disabled?: boolean;
  onPick: (id: string) => void;
}) {
  const style: string = useEditorUiStore((s: { stickerStyle: string }) => s.stickerStyle);
  return (
    <>
      <div className="ie-stk-style-picker-header">
        <span className="ie-swap-panel-label"><Palette size={16} aria-hidden="true" /> Style</span>
        <span className="ie-swap-panel-value">{STICKER_STYLES.find((s) => s.id === style)?.label || 'Classic'}</span>
      </div>

      <div className="ie-stk-styles" role="radiogroup" aria-label="Sticker style">
        {STICKER_STYLES.map((s) => {
          const isOn = style === s.id;
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={isOn}
              aria-label={s.label}
              className={`ie-stk-style${isOn ? ' is-on' : ''}`}
              disabled={disabled}
              onClick={() => onPick(s.id)}
            >
              <span className="ie-stk-thumb" aria-hidden="true">
                <img className={`ie-stk-look--${s.id}`} src={previewUrl} alt="" draggable={false} />
                {isOn && (
                  <span className="ie-stk-thumb-check" aria-hidden="true">
                    <Check size={11} strokeWidth={3.5} />
                  </span>
                )}
              </span>
              <span className="ie-stk-style-label">{s.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
