import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import { Sheet } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import type { MemeImageLayer } from '../../../model/memeDocument';
import { aspectCrop, clipCrop, isCropped, moveCrop, resizeCrop, FULL_CROP } from '../../../utils/clipCrop';
import type { Corner } from '../../../utils/clipCrop';
import type { ClipCrop } from '../../../model/videoProject';
import './stickerCrop.css';

const SHAPES: { id: string; label: string; aspect: number | 'original' | null }[] = [
  { id: 'free', label: 'Free', aspect: null },
  { id: 'original', label: 'Original', aspect: 'original' },
  { id: '1:1', label: '1:1', aspect: 1 },
  { id: '4:5', label: '4:5', aspect: 4 / 5 },
  { id: '9:16', label: '9:16', aspect: 9 / 16 },
  { id: '16:9', label: '16:9', aspect: 16 / 9 },
];
const CORNERS: Corner[] = ['nw', 'ne', 'sw', 'se'];
// Room kept between the picture and the board's edge when the whole picture wouldn't fit there.
const EDGE = 10;

type LayerBox = { x: number; y: number; w: number; h: number };
type BoardCanvas = HTMLCanvasElement & { layerBoxes?: Record<string, LayerBox> };
// The whole (uncropped) picture: its top-left and size, in canvas pixels.
type Full = { x: number; y: number; w: number; h: number };

// The Stickers maker's Crop (its dock's Crop): the crop happens on the board itself. The sticker's
// selection border gives way to a crop box over the whole picture, laid exactly where the sticker sits
// on the canvas (canvas.layerBoxes; scaled down about its middle only if the whole picture wouldn't fit
// the board), what's cut away dimmed; drag the box or its corners. The sheet is one bare row: a round
// Cancel, the shapes as words (Original shows the whole picture again, so no Reset), and a round green
// Done; closing it any other way leaves the sticker as it was too. Done keeps the
// crop on the layer (its `crop`, which the canvas draws; the picture itself is untouched), the sticker
// staying the same scale.
export default function StickerCropSheet({ onClose }: { onClose: () => void }) {
  const imageLayers: MemeImageLayer[] = useMemeEditorStore((s: { imageLayers: MemeImageLayer[] }) => s.imageLayers || []);
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  const pushHistory = useMemeEditorStore((s: { pushHistory: () => void }) => s.pushHistory);
  const setActiveLayerId = useMemeEditorStore((s: { setActiveLayerId: (id: string | null) => void }) => s.setActiveLayerId);
  const photo = imageLayers.find((l) => Boolean((l as { originalUrl?: string }).originalUrl)) || imageLayers[0];
  const saved = photo ? clipCrop(photo) : FULL_CROP;

  const [draft, setDraft] = useState<ClipCrop>(saved);
  const [shape, setShape] = useState('free');
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [host, setHost] = useState<{ wrap: HTMLElement; canvas: BoardCanvas } | null>(null);
  const [full, setFull] = useState<Full | null>(null);
  const [, redraw] = useState(0);
  const drag = useRef<{ kind: 'move' | Corner; x: number; y: number; start: ClipCrop; w: number; h: number } | null>(null);

  // The board, and the sticker no longer selected (its border is the crop box now).
  useLayoutEffect(() => {
    const canvas = document.querySelector<BoardCanvas>('.meme-editor--sticker-mode .meme-canvas');
    const wrap = canvas?.closest<HTMLElement>('.canvas-interactive-wrapper');
    if (canvas && wrap) setHost({ wrap, canvas });
    setActiveLayerId(null);
  }, [setActiveLayerId]);

  // Where the whole picture is, from the sticker's box on the canvas and the crop it has now.
  useEffect(() => {
    if (!host || !photo || full) return;
    const read = () => {
      const b = host.canvas.layerBoxes?.[photo.id];
      if (!b || !b.w || !b.h) return false;
      const fw = b.w / saved.width;
      const fh = b.h / saved.height;
      setFull({ x: b.x - b.w / 2 - saved.x * fw, y: b.y - b.h / 2 - saved.y * fh, w: fw, h: fh });
      return true;
    };
    if (read()) return;
    const t = window.setTimeout(read, 80);
    return () => window.clearTimeout(t);
  }, [host, photo, full, saved.x, saved.y, saved.width, saved.height]);

  // The board glides as the sheet opens: follow it.
  useEffect(() => {
    if (!host || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => redraw((n) => n + 1));
    ro.observe(host.wrap);
    return () => ro.disconnect();
  }, [host]);

  // The picture on screen, in the board's own pixels.
  const shown = (() => {
    if (!host || !full || !host.canvas.width) return null;
    const c = host.canvas.getBoundingClientRect();
    const b = host.wrap.getBoundingClientRect();
    const k = c.width / host.canvas.width;
    let w = full.w * k;
    let h = full.h * k;
    let cx = c.left - b.left + (full.x + full.w / 2) * k;
    let cy = c.top - b.top + (full.y + full.h / 2) * k;
    const fit = Math.min(1, (b.width - EDGE * 2) / w, (b.height - EDGE * 2) / h);
    w *= fit;
    h *= fit;
    cx = Math.min(Math.max(cx, w / 2 + EDGE), b.width - w / 2 - EDGE);
    cy = Math.min(Math.max(cy, h / 2 + EDGE), b.height - h / 2 - EDGE);
    return { left: cx - w / 2, top: cy - h / 2, width: w, height: h };
  })();

  const aspectOf = (id: string): number | null => {
    const a = SHAPES.find((s) => s.id === id)?.aspect ?? null;
    return a === 'original' ? (natural ? natural.w / natural.h : null) : a;
  };
  const shapeAspect = aspectOf(shape);
  const lock = shapeAspect && natural ? (shapeAspect * natural.h) / natural.w : null;

  const pickShape = (id: string) => {
    setShape(id);
    const a = aspectOf(id);
    setDraft(a && natural ? aspectCrop(a, natural.w, natural.h) : { ...FULL_CROP });
  };

  const start = (kind: 'move' | Corner) => (e: ReactPointerEvent<HTMLElement>) => {
    if (!shown) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // follows the pointer
    }
    drag.current = { kind, x: e.clientX, y: e.clientY, start: draft, w: shown.width, h: shown.height };
  };
  const move = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.x) / d.w;
    const dy = (e.clientY - d.y) / d.h;
    setDraft(d.kind === 'move' ? moveCrop(d.start, dx, dy) : resizeCrop(d.start, d.kind, dx, dy, lock));
  };
  const end = () => {
    drag.current = null;
  };

  const same = draft.x === saved.x && draft.y === saved.y && draft.width === saved.width && draft.height === saved.height;
  const done = () => {
    if (photo && full && !same) {
      const cropped = isCropped(draft);
      const w = Math.max(1, Math.round(full.w * (cropped ? draft.width : 1)));
      const h = Math.max(1, Math.round(full.h * (cropped ? draft.height : 1)));
      patchLayer('imageLayers', photo.id, {
        crop: cropped ? { ...draft } : undefined,
        uncroppedUrl: photo.uncroppedUrl || photo.url,
        width: w,
        height: h,
        boxWidth: w,
        boxHeight: h,
      });
      pushHistory();
    }
    onClose();
  };

  const pct = (v: number) => `${v * 100}%`;
  const board = host && photo && shown
    ? createPortal(
      <div className="stk-crop" style={{ background: getComputedStyle(host.wrap).background }} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
        <div className="stk-crop-pic" style={shown}>
          <img src={photo.url} alt="" draggable={false} onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} />
          <div
            className="stk-crop-box"
            aria-label="Crop area"
            style={{ left: pct(draft.x), top: pct(draft.y), width: pct(draft.width), height: pct(draft.height) }}
            onPointerDown={start('move')}
          >
            {CORNERS.map((c) => <span key={c} className={`stk-crop-handle stk-crop-handle--${c}`} aria-label={`Crop corner ${c}`} onPointerDown={start(c)} />)}
          </div>
        </div>
      </div>,
      host.wrap,
    )
    : null;

  return (
    <Sheet className="ie-tool-sheet stk-crop-sheet" title="Crop" hideTitle onClose={onClose}>
      {board}
      <div className="stk-crop-row">
        <button type="button" className="stk-crop-round" onClick={onClose} aria-label="Cancel" title="Cancel">
          <X size={19} strokeWidth={2.4} />
        </button>
        <div className="stk-crop-shapes" role="radiogroup" aria-label="Crop shape">
          {SHAPES.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={shape === s.id} className={`stk-crop-shape${shape === s.id ? ' is-on' : ''}`} onClick={() => pickShape(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
        <button type="button" className="stk-crop-round stk-crop-done" onClick={done} disabled={!photo} aria-label="Done" title="Done">
          <Check size={20} strokeWidth={2.8} />
        </button>
      </div>
    </Sheet>
  );
}
