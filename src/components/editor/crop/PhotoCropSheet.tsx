import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { RotateCcw, RotateCw, Undo2 } from 'lucide-react';
import { ChipRow, Chip } from '../../ui';
import { FULL_CROP, aspectCrop, bakeCrop, fractionRatio, resizeCrop, rotatedSize, turn } from './cropMath';
import type { CropBox, CropHandle, Rotation } from './cropMath';
import './crop.css';

const ASPECTS: { id: string; label: string; value: number | null }[] = [
  { id: 'free', label: 'Free', value: null },
  { id: '1:1', label: '1:1', value: 1 },
  { id: '4:5', label: '4:5', value: 4 / 5 },
  { id: '9:16', label: '9:16', value: 9 / 16 },
  { id: '16:9', label: '16:9', value: 16 / 9 },
];

interface Props {
  url: string;
  // The photo before any crop, to go back to.
  uncroppedUrl?: string | null;
  onApply: (dataUrl: string) => void;
  onRestore?: (url: string) => void;
  onClose: () => void;
}

// Crop and turn the main photo: drag the box or its corners, pick a shape, turn it a quarter at
// a time. Done bakes it into a new photo (cropMath.bakeCrop).
export default function PhotoCropSheet({ url, uncroppedUrl, onApply, onRestore, onClose }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [failed, setFailed] = useState('');
  const [rotation, setRotation] = useState<Rotation>(0);
  const [aspect, setAspect] = useState('free');
  const [box, setBox] = useState<CropBox>(FULL_CROP);
  const preview = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ handle: CropHandle; x: number; y: number; start: CropBox } | null>(null);

  useEffect(() => {
    const image = new Image();
    if (!url.startsWith('data:') && !url.startsWith('blob:')) image.crossOrigin = 'anonymous';
    image.onload = () => setImg(image);
    image.onerror = () => setFailed('This photo could not be loaded.');
    image.src = url;
  }, [url]);

  const size = img ? rotatedSize(img.naturalWidth, img.naturalHeight, rotation) : { w: 1, h: 1 };
  const photoAspect = size.w / size.h;
  const aspectValue = ASPECTS.find((a) => a.id === aspect)?.value ?? null;

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
    setBox(aspectCrop(ASPECTS.find((a) => a.id === id)?.value ?? null, photoAspect));
  };
  const rotate = (by: 90 | -90) => {
    const next = turn(rotation, by);
    setRotation(next);
    if (img) {
      const s = rotatedSize(img.naturalWidth, img.naturalHeight, next);
      setBox(aspectCrop(aspectValue, s.w / s.h));
    }
  };

  const startDrag = (handle: CropHandle) => (e: ReactPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    drag.current = { handle, x: e.clientX, y: e.clientY, start: box };
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

  return createPortal(
    <div className="ie-crop ui-theme" role="dialog" aria-label="Crop photo" aria-modal="true">
      <div className="ie-crop-bar">
        <button type="button" className="ie-crop-text-btn" onClick={onClose}>Cancel</button>
        <h2 className="ie-crop-title">Crop photo</h2>
        <button type="button" className="ui-btn-accent" disabled={!img} onClick={apply}>Done</button>
      </div>
      <div className="ie-crop-stage" ref={stage} onPointerMove={onMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
        {failed && <p className="ie-empty">{failed}</p>}
        <div className="ie-crop-frame">
          <canvas ref={preview} className="ie-crop-photo" />
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
      <div className="ie-crop-tools">
        <ChipRow ariaLabel="Crop shape">
          {ASPECTS.map((a) => <Chip key={a.id} label={a.label} active={aspect === a.id} onClick={() => pickAspect(a.id)} />)}
        </ChipRow>
        <div className="ie-crop-actions">
          <button type="button" className="ui-btn" onClick={() => rotate(-90)} aria-label="Turn left"><RotateCcw size={16} />Left</button>
          <button type="button" className="ui-btn" onClick={() => rotate(90)} aria-label="Turn right"><RotateCw size={16} />Right</button>
          {uncroppedUrl && onRestore && (
            <button type="button" className="ui-btn" onClick={() => onRestore(uncroppedUrl)}><Undo2 size={16} />Original photo</button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
