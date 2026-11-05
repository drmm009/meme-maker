import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { RotateCcw } from 'lucide-react';
import { useEditorStore, sourceTimeMs } from '../../store/useVideoEditorStore';
import { captureFrame } from '../../utils/clipEffects';
import { FULL_CROP, applyCrop, aspectCrop, clipCrop, isCropped, moveCrop, resizeCrop } from '../../utils/clipCrop';
import type { Corner } from '../../utils/clipCrop';
import type { ClipCrop, Placed } from '../../model/videoProject';

type CroppableClip = Placed & { id: string; type: string; url?: string; startMs: number; endMs: number; crop?: ClipCrop | null };

// Box shapes (width / height of the picture); Free resizes any way.
const SHAPES: { id: string; label: string; aspect: number | null }[] = [
  { id: 'free', label: 'Free', aspect: null },
  { id: '1:1', label: '1:1', aspect: 1 },
  { id: '4:5', label: '4:5', aspect: 4 / 5 },
  { id: '9:16', label: '9:16', aspect: 9 / 16 },
  { id: '16:9', label: '16:9', aspect: 16 / 9 },
];
const CORNERS: Corner[] = ['nw', 'ne', 'sw', 'se'];
// The tallest the frame gets in the sheet.
const MAX_FRAME_HEIGHT = 220;

// The picture a clip is cropped from: the photo itself, or the video's frame at the playhead.
function useCropSource(item: CroppableClip): string {
  const [src, setSrc] = useState('');
  const isVideo = item.type === 'video';
  const atMs = isVideo ? sourceTimeMs(item, Math.min(Math.max(useEditorStore.getState().playhead, item.startMs), item.endMs)) : 0;
  useEffect(() => {
    if (!item.url) return undefined;
    if (!isVideo) {
      setSrc(item.url);
      return undefined;
    }
    let alive = true;
    let frame = '';
    captureFrame(item.url, atMs).then((url: string) => {
      frame = url;
      if (alive) setSrc(url);
      else URL.revokeObjectURL(url);
    }).catch(() => {});
    return () => {
      alive = false;
      if (frame) URL.revokeObjectURL(frame);
    };
    // The frame is grabbed once per clip; moving the playhead later doesn't re-grab it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.url, isVideo]);
  return src;
}

// Crop: the clip's whole picture with a box over it to drag (inside to move it, a corner to size
// it), box shapes, and Reset. The clip changes when a drag ends, so each drag is one undo step.
export default function CropPanel({ item }: { item: CroppableClip }) {
  const src = useCropSource(item);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [room, setRoom] = useState(320);
  const [shape, setShape] = useState('free');
  const [draft, setDraft] = useState<ClipCrop>(() => clipCrop(item));
  const drag = useRef<{ kind: 'move' | Corner; x: number; y: number; start: ClipCrop; last: ClipCrop | null; w: number; h: number } | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  // Follows the clip (undo, another device of the same project) when not mid-drag.
  const saved = clipCrop(item);
  const savedKey = `${saved.x},${saved.y},${saved.width},${saved.height}`;
  useEffect(() => {
    if (!drag.current) setDraft(clipCrop(item));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey]);

  useLayoutEffect(() => {
    if (hostRef.current?.clientWidth) setRoom(hostRef.current.clientWidth);
  }, []);

  const commit = (next: ClipCrop) => {
    setDraft(next);
    const latest = useEditorStore.getState().items.find((i: CroppableClip) => i.id === item.id) as CroppableClip | undefined;
    if (latest) useEditorStore.getState().updateItem(item.id, applyCrop(latest, next));
  };

  // Shape in fractions of the frame, for locking a corner drag.
  const lock = (() => {
    const a = SHAPES.find((s) => s.id === shape)?.aspect;
    return a && natural ? (a * natural.h) / natural.w : null;
  })();

  const pickShape = (id: string) => {
    setShape(id);
    const a = SHAPES.find((s) => s.id === id)?.aspect;
    if (a && natural) commit(aspectCrop(a, natural.w, natural.h));
  };

  const start = (kind: 'move' | Corner) => (e: ReactPointerEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const frame = (e.currentTarget.closest('.vt-crop-frame') as HTMLElement).getBoundingClientRect();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // The drag still follows the pointer while it stays over the box.
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

  // The frame at the picture's shape, as big as the sheet allows.
  const scale = natural ? Math.min(room / natural.w, MAX_FRAME_HEIGHT / natural.h) : 0;
  const size = natural ? { width: Math.round(natural.w * scale), height: Math.round(natural.h * scale) } : null;
  const pct = (v: number) => `${v * 100}%`;

  return (
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
      <div className="vt-chip-row vt-crop-shapes" role="radiogroup" aria-label="Crop shape">
        {SHAPES.map((s) => (
          <button key={s.id} type="button" role="radio" aria-checked={shape === s.id}
            className={`vt-chip${shape === s.id ? ' is-on' : ''}`} disabled={!natural} onClick={() => pickShape(s.id)}>
            {s.label}
          </button>
        ))}
        <button type="button" className="vt-chip vt-crop-reset" disabled={!isCropped(draft)}
          onClick={() => { setShape('free'); commit({ ...FULL_CROP }); }}>
          <RotateCcw size={15} /> Reset
        </button>
      </div>
    </div>
  );
}
