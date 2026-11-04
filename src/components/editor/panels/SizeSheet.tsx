import { Sheet } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';

export type Aspect = 'original' | '1:1' | '4:5' | '9:16' | '16:9';

// Each shape with a small outline of it (w x h, in px) and where it's used.
const SIZES: { value: Aspect; label: string; sub: string; title: string; w: number; h: number }[] = [
  { value: 'original', label: 'Original', sub: 'As the picture', title: 'Original image', w: 26, h: 18 },
  { value: '1:1', label: 'Square', sub: '1:1', title: 'Square', w: 22, h: 22 },
  { value: '4:5', label: 'Post', sub: '4:5', title: 'Portrait', w: 20, h: 25 },
  { value: '9:16', label: 'Story', sub: '9:16', title: 'Story', w: 16, h: 28 },
  { value: '16:9', label: 'Wide', sub: '16:9', title: 'Video', w: 30, h: 17 },
];

// Canvas > Size: the canvas shape as tiles, each with an outline of its shape; the picked one orange.
export default function SizeSheet({ onClose }: { onClose: () => void }) {
  const aspectRatio: Aspect = useMemeEditorStore((s: { aspectRatio: Aspect }) => s.aspectRatio) || 'original';
  const setAspectRatio = useMemeEditorStore((s: { setAspectRatio: (v: Aspect) => void }) => s.setAspectRatio);
  const pushHistoryDebounced = useMemeEditorStore((s: { pushHistoryDebounced: () => void }) => s.pushHistoryDebounced);

  return (
    <Sheet className="ie-size-sheet ie-tool-sheet" title="Size" onClose={onClose}>
      <div className="ui-tiles ui-tiles--5" role="radiogroup" aria-label="Aspect ratio">
        {SIZES.map((s) => (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={aspectRatio === s.value}
            aria-label={s.value === 'original' ? 'Original' : s.sub}
            title={s.title}
            className={`ui-tile ie-size-tile${aspectRatio === s.value ? ' is-on' : ''}`}
            onClick={() => {
              setAspectRatio(s.value);
              pushHistoryDebounced();
            }}
          >
            <span className="ui-tile-icon">
              <span className="ie-size-shape" style={{ width: s.w, height: s.h }} aria-hidden="true" />
            </span>
            <span>{s.label}</span>
            <span className="ui-tile-sub">{s.sub}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
