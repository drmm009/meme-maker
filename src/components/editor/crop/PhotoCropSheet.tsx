import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { Check, ImageIcon, RotateCcw, RotateCw, Undo2, X } from 'lucide-react';
import { FULL_CROP, aspectCrop, bakeCrop, fractionRatio, resizeCrop, rotatedSize, turn } from './cropMath';
import type { CropBox, CropHandle, Rotation } from './cropMath';
import './crop.css';

// 'photo' keeps the photo's own shape (as turned).
const ASPECTS: { id: string; label: string; value: number | 'photo' | null }[] = [
  { id: 'free', label: 'Free', value: null },
  { id: 'original', label: 'Original', value: 'photo' },
  { id: '1:1', label: '1:1', value: 1 },
  { id: '4:5', label: '4:5', value: 4 / 5 },
  { id: '9:16', label: '9:16', value: 9 / 16 },
  { id: '16:9', label: '16:9', value: 16 / 9 },
];

// A small outline of each shape beside its name; Free is dashed, Original is a photo icon.
function ShapeIcon({ value }: { value: number | 'photo' | null }) {
  if (value === 'photo') return <ImageIcon size={16} strokeWidth={2.2} aria-hidden="true" />;
  const r = value ?? 1;
  const w = r >= 1 ? 16 : Math.round(16 * r);
  const h = r >= 1 ? Math.round(16 / r) : 16;
  return <span className={`ie-crop-shape${value === null ? ' ie-crop-shape--free' : ''}`} style={{ width: w, height: h }} aria-hidden="true" />;
}

interface Props {
  url: string;
  // The photo before any crop, to go back to.
  uncroppedUrl?: string | null;
  onApply: (dataUrl: string) => void;
  onRestore?: (url: string) => void;
  onClose: () => void;
  /** 'sticker' when the Stickers maker opens it: its green in place of the app's orange, and laid
   * out in place on its editing screen (minimal: see below). */
  tone?: 'sticker';
}

// Crop and turn the main photo, or a photo layer's picture: drag the box or its corners, pick a shape, turn it a quarter at
// a time. Done bakes it into a new photo (cropMath.bakeCrop). Full screen on black: a round Cancel, the title over the
// crop's size and a Done pill on top; the photo, its thirds grid showing while the box is dragged; and a rounded panel at
// the bottom with the shapes as a row of pills (outline beside name) and Turn left, Turn right and Reset as one bar.
// For the Stickers maker (tone 'sticker') it's minimal and in place: on the screen's own background, the photo where
// the board is (its room under the header), just Crop and the size where the header was, and one bar for the dock:
// the shapes as plain words, then round Cancel, Turn and Reset with Done on the right.
export default function PhotoCropSheet({ url, uncroppedUrl, onApply, onRestore, onClose, tone }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [failed, setFailed] = useState('');
  const [rotation, setRotation] = useState<Rotation>(0);
  const [aspect, setAspect] = useState('free');
  const [box, setBox] = useState<CropBox>(FULL_CROP);
  const [dragging, setDragging] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ handle: CropHandle; x: number; y: number; start: CropBox } | null>(null);
  const inline = tone === 'sticker';
  // In place: the editing screen's header height and background, and the stage's height for the photo.
  const [place] = useState(() => {
    if (!inline || typeof document === 'undefined') return null;
    const screen = document.querySelector<HTMLElement>('.meme-editor--sticker-mode');
    const room = screen?.querySelector<HTMLElement>('.editor-workspace');
    const top = room ? Math.round(room.getBoundingClientRect().top) : 0;
    // The screen's glow (its own background image); the ground under it is the page's (crop.css).
    return { top: top > 0 ? top : 56, glow: screen ? getComputedStyle(screen).backgroundImage : 'none' };
  });
  const [roomH, setRoomH] = useState(0);
  useEffect(() => {
    const el = stage.current;
    if (!inline || !el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setRoomH(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [inline]);

  useEffect(() => {
    const image = new Image();
    if (!url.startsWith('data:') && !url.startsWith('blob:')) image.crossOrigin = 'anonymous';
    image.onload = () => setImg(image);
    image.onerror = () => setFailed('This photo could not be loaded.');
    image.src = url;
  }, [url]);

  const size = img ? rotatedSize(img.naturalWidth, img.naturalHeight, rotation) : { w: 1, h: 1 };
  const photoAspect = size.w / size.h;
  const ratioOf = (id: string, photo: number) => {
    const v = ASPECTS.find((a) => a.id === id)?.value ?? null;
    return v === 'photo' ? photo : v;
  };
  const aspectValue = ratioOf(aspect, photoAspect);
  const changed = rotation !== 0 || aspect !== 'free' || box.x !== 0 || box.y !== 0 || box.w !== 1 || box.h !== 1;

  // The turned photo, drawn small for the preview.
  useEffect(() => {
    const canvas = preview.current;
    if (!img || !canvas) return;
    const scale = Math.min(1, 900 / Math.max(size.w, size.h));
    canvas.width = Math.round(size.w * scale);
    canvas.height = Math.round(size.h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }, [img, rotation, size.w, size.h]);

  const pickAspect = (id: string) => {
    setAspect(id);
    setBox(aspectCrop(ratioOf(id, photoAspect), photoAspect));
  };
  const reset = () => {
    setRotation(0);
    setAspect('free');
    setBox(FULL_CROP);
  };
  const rotate = (by: 90 | -90) => {
    const next = turn(rotation, by);
    setRotation(next);
    if (img) {
      const s = rotatedSize(img.naturalWidth, img.naturalHeight, next);
      setBox(aspectCrop(ratioOf(aspect, s.w / s.h), s.w / s.h));
    }
  };

  const startDrag = (handle: CropHandle) => (e: ReactPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    drag.current = { handle, x: e.clientX, y: e.clientY, start: box };
    setDragging(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    const rect = preview.current?.getBoundingClientRect();
    if (!d || !rect || !rect.width) return;
    const dx = (e.clientX - d.x) / rect.width;
    const dy = (e.clientY - d.y) / rect.height;
    setBox(resizeCrop(d.start, d.handle, dx, dy, fractionRatio(aspectValue, photoAspect)));
  };
  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  const apply = () => {
    if (!img) return;
    try {
      const out = bakeCrop(img, img.naturalWidth, img.naturalHeight, rotation, box);
      const png = /^data:image\/(png|webp|gif)/i.test(url) || /\.png(\?|$)/i.test(url);
      onApply(png ? out.toDataURL('image/png') : out.toDataURL('image/jpeg', 0.92));
    } catch {
      setFailed('This photo comes from a site that does not allow editing it.');
    }
  };

  const cropSize = img ? `${Math.round(box.w * size.w)} × ${Math.round(box.h * size.h)}` : '';

  const shapes = (
    <div className="ie-crop-shapes" role="radiogroup" aria-label="Crop shape">
      {ASPECTS.map((a) => (
        <button
          key={a.id}
          type="button"
          role="radio"
          aria-checked={aspect === a.id}
          className={`ie-crop-shape-btn${aspect === a.id ? ' is-on' : ''}`}
          onClick={() => pickAspect(a.id)}
        >
          {!inline && <span className="ie-crop-shape-box"><ShapeIcon value={a.value} /></span>}
          <span>{a.label}</span>
        </button>
      ))}
    </div>
  );
  const photo = (
    <div className={`ie-crop-stage${dragging ? ' is-dragging' : ''}`} ref={stage} onPointerMove={onMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
      {failed && <p className="ie-empty">{failed}</p>}
      <div className="ie-crop-frame">
        <canvas ref={preview} className="ie-crop-photo" style={inline && roomH ? { maxHeight: roomH - 32 } : undefined} />
        {img && (
          <div
            className="ie-crop-box"
            aria-label="Crop area"
            style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.w * 100}%`, height: `${box.h * 100}%` }}
            onPointerDown={startDrag('move')}
          >
            {(['nw', 'ne', 'sw', 'se'] as const).map((h) => (
              <span key={h} className={`ie-crop-handle ie-crop-handle--${h}`} aria-label={`Crop corner ${h}`} onPointerDown={startDrag(h)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (inline) {
    return createPortal(
      <div className="ie-crop ui-theme ie-crop--sticker ie-crop--inline" role="dialog" aria-label="Crop photo" aria-modal="true" style={place && place.glow !== 'none' ? { backgroundImage: place.glow } : undefined}>
        <header className="ie-crop-top" style={{ height: place?.top }}>
          <h2 className="ie-crop-title">Crop</h2>
          <span className="ie-crop-size">{cropSize}</span>
        </header>
        {photo}
        <div className="ie-crop-dock">
          {shapes}
          <div className="ie-crop-dock-row">
            <button type="button" className="ie-crop-round" onClick={onClose} aria-label="Cancel" title="Cancel">
              <X size={19} strokeWidth={2.4} />
            </button>
            <button type="button" className="ie-crop-round" onClick={() => rotate(90)} aria-label="Turn right" title="Turn">
              <RotateCw size={18} strokeWidth={2.3} />
            </button>
            <button type="button" className="ie-crop-round" onClick={reset} disabled={!changed} aria-label="Reset" title="Reset">
              <Undo2 size={18} strokeWidth={2.3} />
            </button>
            {uncroppedUrl && onRestore && (
              <button type="button" className="ie-crop-round" onClick={() => onRestore(uncroppedUrl)} aria-label="Restore original photo" title="Back to the original photo">
                <ImageIcon size={18} strokeWidth={2.3} />
              </button>
            )}
            <button type="button" className="ie-crop-done" disabled={!img} onClick={apply}>
              <Check size={17} strokeWidth={2.8} aria-hidden="true" />
              Done
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className={`ie-crop ui-theme${tone === 'sticker' ? ' ie-crop--sticker' : ''}`} role="dialog" aria-label="Crop photo" aria-modal="true">
      <header className="ie-crop-bar">
        <button type="button" className="ie-crop-round" onClick={onClose} aria-label="Cancel" title="Cancel">
          <X size={20} strokeWidth={2.4} />
        </button>
        <div className="ie-crop-heading">
          <h2 className="ie-crop-title">Crop</h2>
          {/* The crop's size in pixels, so you know what you'll get. */}
          <span className="ie-crop-size">{cropSize}</span>
        </div>
        <button type="button" className="ie-crop-done" disabled={!img} onClick={apply}>
          <Check size={17} strokeWidth={2.8} aria-hidden="true" />
          Done
        </button>
      </header>

      {photo}

      <div className="ie-crop-panel">
        {shapes}
        <div className="ie-crop-actions" role="group" aria-label="Turn and reset">
          <button type="button" className="ie-crop-action" onClick={() => rotate(-90)} aria-label="Turn left">
            <RotateCcw size={17} strokeWidth={2.2} aria-hidden="true" />
            <span>Left</span>
          </button>
          <button type="button" className="ie-crop-action" onClick={() => rotate(90)} aria-label="Turn right">
            <RotateCw size={17} strokeWidth={2.2} aria-hidden="true" />
            <span>Right</span>
          </button>
          <button type="button" className="ie-crop-action" onClick={reset} disabled={!changed}>
            <Undo2 size={17} strokeWidth={2.2} aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>
        {uncroppedUrl && onRestore && (
          <button type="button" className="ie-crop-restore-btn" onClick={() => onRestore(uncroppedUrl)} aria-label="Restore original photo">
            <ImageIcon size={15} aria-hidden="true" />
            <span>Back to the original photo</span>
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
