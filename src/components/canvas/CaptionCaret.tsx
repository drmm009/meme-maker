import type { MemeCaption } from '../../model/memeDocument';
import { captionCaret, captionSelectionBoxes, captionTextLayout, caretOnCanvas } from './render/captionTextLayout';
import { scratchCtx } from './captionTextHit';
import type { TextSelection } from './useCaretIndex';
import './captionCaret.css';

interface Props {
  caption: MemeCaption;
  // The canvas the caption is painted on (its pixel size), and the caption's centre on it.
  canvas: HTMLCanvasElement;
  centerY: number;
  // Where the cursor is in the caption's text, or the letters selected (useTextSelection).
  selection: TextSelection;
}

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

// The text cursor while a caption is typed into: a thin orange bar laid over the canvas where
// paintCaption draws that point of the text (the same layout), turned with the caption, blinking,
// and solid again whenever it moves. With letters selected, a soft orange highlight over them
// instead. Over the canvas, never on it, so exports never show either.
export default function CaptionCaret({ caption, canvas, centerY, selection }: Props) {
  if (!canvas.width || !canvas.height) return null;
  const ctx = scratchCtx();
  if (!ctx) return null;
  const layout = captionTextLayout(ctx, caption, canvas.width);
  const cx = (caption.x ?? 0.5) * canvas.width;
  const rotation = caption.rotation || 0;

  if (selection.start !== selection.end) {
    const boxes = captionSelectionBoxes(ctx, caption, layout, selection.start, selection.end);
    return (
      <>
        {boxes.map((box, i) => {
          const at = caretOnCanvas(box, cx, centerY, rotation);
          return (
            <span
              key={i}
              className="caption-selection"
              aria-hidden="true"
              style={{
                left: pct(at.x, canvas.width),
                top: pct(at.y, canvas.height),
                width: pct(at.width, canvas.width),
                height: pct(at.height, canvas.height),
                transform: `translate(-50%, -50%) rotate(${at.rotation}deg)`,
              }}
            />
          );
        })}
      </>
    );
  }

  const spot = captionCaret(ctx, caption, layout, selection.end);
  if (!spot) return null;
  const at = caretOnCanvas(spot, cx, centerY, rotation);
  return (
    <span
      // A new key restarts the blink, so the cursor shows solid as it moves.
      key={`${selection.end}:${caption.text}`}
      className="caption-caret"
      aria-hidden="true"
      style={{
        left: pct(at.x, canvas.width),
        top: pct(at.y, canvas.height),
        height: pct(at.height, canvas.height),
        transform: `translate(-50%, -50%) rotate(${at.rotation}deg)`,
      }}
    />
  );
}
