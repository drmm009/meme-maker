import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Crop as CropIcon, Crosshair, RotateCcw } from 'lucide-react';
import { Sheet } from '../../ui';
import { useSelection } from './selection';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import type { MemeImageLayer } from '../../../model/memeDocument';
import { aspectCrop, clipCrop, isCropped, moveCrop, resizeCrop, FULL_CROP } from '../../../utils/clipCrop';
import type { Corner } from '../../../utils/clipCrop';
import type { ClipCrop } from '../../../model/videoProject';
import './cropSheet.css';

const SHAPES: { id: string; label: string; aspect: number | null | 'original' | 'canvas' }[] = [
  { id: 'free', label: 'Free', aspect: null },
  { id: 'original', label: 'Original', aspect: 'original' },
  { id: 'canvas', label: 'Canvas', aspect: 'canvas' },
  { id: '1:1', label: '1:1', aspect: 1 },
  { id: '4:5', label: '4:5', aspect: 4 / 5 },
  { id: '3:4', label: '3:4', aspect: 3 / 4 },
  { id: '9:16', label: '9:16', aspect: 9 / 16 },
  { id: '4:3', label: '4:3', aspect: 4 / 3 },
  { id: '16:9', label: '16:9', aspect: 16 / 9 },
];

const CORNERS: Corner[] = ['nw', 'ne', 'sw', 'se'];
const MAX_FRAME_HEIGHT = 360;

function ShapeGlyph({ aspect }: { aspect: number | null }) {
  const size = aspect
    ? aspect >= 1
      ? { width: 24, height: Math.max(10, Math.round(24 / aspect)) }
      : { width: Math.max(10, Math.round(24 * aspect)), height: 24 }
    : { width: 22, height: 16 };
  return <span className={`vt-crop-glyph${aspect ? '' : ' is-free'}`} style={size} aria-hidden="true" />;
}

export default function CropSheet({ onClose }: { onClose: () => void }) {
  const { id, image } = useSelection();
  const imageLayers: MemeImageLayer[] = useMemeEditorStore((s: { imageLayers: MemeImageLayer[] }) => s.imageLayers || []);
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  const pushHistory = useMemeEditorStore((s: { pushHistory: () => void }) => s.pushHistory);
  const activeTemplate = useMemeEditorStore((s: { activeTemplate: { aspectRatio?: string; width?: number; height?: number } | null }) => s.activeTemplate);
  const aspectRatio = useMemeEditorStore((s: { aspectRatio?: string }) => s.aspectRatio) || 'original';

  const currentLayer = id ? imageLayers.find((l) => l.id === id) : null;
  const target = currentLayer || image;
  const src = target?.uncroppedUrl || target?.url || '';

  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [room, setRoom] = useState(320);
  const [shape, setShape] = useState('free');
  const [draft, setDraft] = useState<ClipCrop>(() => (target ? clipCrop(target) : FULL_CROP));
  const drag = useRef<{ kind: 'move' | Corner; x: number; y: number; start: ClipCrop; last: ClipCrop | null; w: number; h: number } | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  const canvasAspect = (() => {
    if (aspectRatio === '16:9') return 16 / 9;
    if (aspectRatio === '9:16') return 9 / 16;
    if (aspectRatio === '4:5') return 4 / 5;
    if (aspectRatio === '1:1') return 1;
    if (activeTemplate?.width && activeTemplate?.height) return activeTemplate.width / activeTemplate.height;
    return 1;
  })();

  const saved = target ? clipCrop(target) : FULL_CROP;
  const savedKey = `${saved.x},${saved.y},${saved.width},${saved.height}`;
  useEffect(() => {
    if (drag.current) return;
    setDraft(saved);
    if (!isCropped(saved)) setShape('free');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey]);

  useLayoutEffect(() => {
    if (hostRef.current?.clientWidth) setRoom(hostRef.current.clientWidth - 24);
  }, []);

  const commit = (next: ClipCrop) => {
    setDraft(next);
    if (!id || !target) return;
    const cropped = isCropped(next);
    const naturalW = natural?.w || 200;
    const naturalH = natural?.h || 200;

    const cropW = (cropped ? next.width : 1) * naturalW;
    const cropH = (cropped ? next.height : 1) * naturalH;
    const cropAspect = cropW / cropH;

    const fitScale = Math.min(320 / naturalW, 320 / naturalH);
    const baseWidth = target.boxWidth || target.width || Math.round(naturalW * fitScale * (target.scale || 1.0));
    const newW = Math.round(baseWidth);
    const newH = Math.round(baseWidth / cropAspect);

    patchLayer('imageLayers', id, {
      crop: cropped ? { ...next } : undefined,
      uncroppedUrl: target.uncroppedUrl || target.url,
      width: newW,
      height: newH,
      boxWidth: newW,
      boxHeight: newH,
    });
    pushHistory();
  };

  const handleReset = () => {
    setShape('free');
    commit({ ...FULL_CROP });
  };

  const aspectOf = (shapeId: string): number | null => {
    const a = SHAPES.find((sh) => sh.id === shapeId)?.aspect ?? null;
    if (a === 'original') return natural ? natural.w / natural.h : null;
    if (a === 'canvas') return canvasAspect || null;
    return a;
  };

  const lock = (() => {
    const a = aspectOf(shape);
    return a && natural ? (a * natural.h) / natural.w : null;
  })();

  const pickShape = (shapeId: string) => {
    setShape(shapeId);
    const a = aspectOf(shapeId);
    if (a && natural) commit(aspectCrop(a, natural.w, natural.h));
  };

  const centre = () => commit({ ...draft, x: (1 - draft.width) / 2, y: (1 - draft.height) / 2 });
  const centred = Math.abs(draft.x - (1 - draft.width) / 2) < 0.002 && Math.abs(draft.y - (1 - draft.height) / 2) < 0.002;

  const start = (kind: 'move' | Corner) => (e: ReactPointerEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const frame = (e.currentTarget.closest('.vt-crop-frame') as HTMLElement).getBoundingClientRect();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // follows pointer
    }
    drag.current = { kind, x: e.clientX, y: e.clientY, start: draft, last: null, w: frame.width, h: frame.height };
  };

  const move = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.x) / d.w;
    const dy = (e.clientY - d.y) / d.h;
    d.last = d.kind === 'move' ? moveCrop(d.start, dx, dy) : resizeCrop(d.start, d.kind, dx, dy, lock);
    setDraft(d.last);
  };

  const end = () => {
    const last = drag.current?.last;
    drag.current = null;
    if (last) commit(last);
  };

  const scale = natural ? Math.min(room / natural.w, MAX_FRAME_HEIGHT / natural.h) : 0;
  const size = natural ? { width: Math.round(natural.w * scale), height: Math.round(natural.h * scale) } : null;
  const pct = (v: number) => `${v * 100}%`;

  if (!target || !id) {
    return (
      <Sheet Icon={CropIcon} className="ie-crop-sheet ie-tool-sheet" title="Crop" onClose={onClose}>
        <p className="ie-empty">Select a photo layer to crop.</p>
      </Sheet>
    );
  }

  return (
    <Sheet
      Icon={CropIcon}
      className="ie-crop-sheet ie-tool-sheet"
      title="Crop"
      onClose={onClose}
      action={{
        label: 'Reset',
        Icon: RotateCcw,
        variant: 'plain',
        disabled: !isCropped(draft),
        onClick: handleReset,
      }}
    >
      <div className="vt-crop">
        <div className="vt-crop-host" ref={hostRef}>
          {src ? (
            <div className="vt-crop-frame" style={size ?? { visibility: 'hidden' }}>
              <img
                src={src}
                alt=""
                draggable={false}
                onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              />
              <div
                className="vt-crop-box"
                role="group"
                aria-label="Crop box"
                style={{ left: pct(draft.x), top: pct(draft.y), width: pct(draft.width), height: pct(draft.height) }}
                onPointerDown={start('move')}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
              >
                {CORNERS.map((c) => (
                  <span
                    key={c}
                    className={`vt-crop-handle is-${c}`}
                    aria-hidden="true"
                    onPointerDown={start(c)}
                    onPointerMove={move}
                    onPointerUp={end}
                    onPointerCancel={end}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="vt-crop-loading" style={{ height: MAX_FRAME_HEIGHT / 2 }}>Getting the picture…</div>
          )}
        </div>
        <div className="vt-crop-info">
          <span className="vt-crop-size">
            {isCropped(draft) ? `Keeps ${Math.round(draft.width * 100)}% × ${Math.round(draft.height * 100)}%` : 'The whole picture'}
          </span>
          <button type="button" className="vt-crop-centre" disabled={!natural || centred} onClick={centre}>
            <Crosshair size={15} aria-hidden="true" /> Centre
          </button>
        </div>
        <div className="vt-crop-shapes" role="radiogroup" aria-label="Crop shape">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={shape === s.id}
              className={`vt-crop-shape${shape === s.id ? ' is-on' : ''}`}
              disabled={!natural}
              onClick={() => pickShape(s.id)}
            >
              <ShapeGlyph aspect={s.id === 'free' ? null : aspectOf(s.id) ?? 1} />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
