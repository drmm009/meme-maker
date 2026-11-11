import type { MemeCaption } from '../../model/memeDocument';
import { captionCaret, captionTextLayout, caretOnCanvas } from './render/captionTextLayout';
import './captionCaret.css';

let scratch: HTMLCanvasElement | null = null;

interface Props {
  caption: MemeCaption;
  // The canvas the caption is painted on (its pixel size), and the caption's centre on it.
  canvas: HTMLCanvasElement;
  centerY: number;
  // Where the cursor is in the caption's text (useCaretIndex).
  index: number;
}

// The text cursor while a caption is typed into: a thin orange bar laid over the canvas where
// paintCaption draws that point of the text (the same layout), turned with the caption, blinking,
// and solid again whenever it moves. Over the canvas, never on it, so exports never show it.
export default function CaptionCaret({ caption, canvas, centerY, index }: Props) {
  if (!canvas.width || !canvas.height || typeof document === 'undefined') return null;
  scratch = scratch || document.createElement('canvas');
  const ctx = scratch.getContext('2d');
  if (!ctx || typeof ctx.measureText !== 'function') return null;
  const layout = captionTextLayout(ctx, caption, canvas.width);
  const spot = captionCaret(ctx, caption, layout, index);
  if (!spot) return null;
  const at = caretOnCanvas(spot, (caption.x ?? 0.5) * canvas.width, centerY, caption.rotation || 0);
  return (
    <span
      // A new key restarts the blink, so the cursor shows solid as it moves.
      key={`${index}:${caption.text}`}
      className="caption-caret"
      aria-hidden="true"
      style={{
        left: `${(at.x / canvas.width) * 100}%`,
        top: `${(at.y / canvas.height) * 100}%`,
        height: `${(at.height / canvas.height) * 100}%`,
        transform: `translate(-50%, -50%) rotate(${at.rotation}deg)`,
      }}
    />
  );
}
