import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { SquarePlay, Image as ImageIcon, Clapperboard } from 'lucide-react';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { inkFor } from '../../utils/inkFor';

type StartKind = 'video' | 'photo' | 'clips';

interface Box { left: number; top: number; width: number; height: number }

// Where the canvas sits inside the stage frame, kept up to date as either changes size. The canvas
// element is looked up again when the shape changes. Measured in an effect, so after the preview
// (rendered before this) has sized the canvas for the new shape.
function useCanvasBox(ref: React.RefObject<HTMLDivElement | null>, shape: unknown): Box | null {
  const [box, setBox] = useState<Box | null>(null);
  useEffect(() => {
    const frame = ref.current?.parentElement;
    if (!frame || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => measure());
    let watched: Element | null = null;
    const measure = () => {
      const canvas = frame.querySelector<HTMLElement>('#stage-sink-wrapper');
      if (!canvas) return;
      if (canvas !== watched) {
        if (watched) ro.unobserve(watched);
        ro.observe(canvas);
        watched = canvas;
      }
      const f = frame.getBoundingClientRect();
      const c = canvas.getBoundingClientRect();
      if (!c.width || !c.height) return;
      setBox({ left: c.left - f.left, top: c.top - f.top, width: c.width, height: c.height });
    };
    measure();
    ro.observe(frame);
    const raf = requestAnimationFrame(measure);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [ref, shape]);
  return box;
}

// The empty video's prompt, drawn inside the canvas: what to start with, as three tiles.
export default function StartPrompt({ onPick }: { onPick: (kind: StartKind) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const box = useCanvasBox(ref, useEditorStore((s: { canvasAspectRatio?: number }) => s.canvasAspectRatio));
  const ink = inkFor(useEditorStore((s: { backgroundColor?: string }) => s.backgroundColor));
  const style: CSSProperties | undefined = box ? { left: box.left, top: box.top, width: box.width, height: box.height } : undefined;

  return (
    <div ref={ref} className={`vt-start is-ink-${ink}`} style={style} role="group" aria-labelledby="vt-start-title">
      <div className="vt-start-zone">
        <p id="vt-start-title" className="vt-start-title">Start your video</p>
        <p className="vt-start-sub">Add a clip or a photo, then layer text, stickers and sounds on it.</p>
        <div className="vt-start-actions">
          <button type="button" className="vt-start-tile is-primary" onClick={() => onPick('video')}>
            <span className="vt-start-icon"><SquarePlay size={20} strokeWidth={2.2} aria-hidden="true" /></span>
            Video
          </button>
          <button type="button" className="vt-start-tile" onClick={() => onPick('photo')}>
            <span className="vt-start-icon"><ImageIcon size={20} strokeWidth={2.2} aria-hidden="true" /></span>
            Photo
          </button>
          <button type="button" className="vt-start-tile" onClick={() => onPick('clips')}>
            <span className="vt-start-icon"><Clapperboard size={20} strokeWidth={2.2} aria-hidden="true" /></span>
            Meme clip
          </button>
        </div>
      </div>
    </div>
  );
}
