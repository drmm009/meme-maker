import { SegmentedControl } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';

type Aspect = 'original' | '1:1' | '4:5' | '9:16' | '16:9';

const ASPECTS: { value: Aspect; label: string; title: string }[] = [
  { value: 'original', label: 'Original', title: 'Original image' },
  { value: '1:1', label: '1:1', title: 'Square' },
  { value: '4:5', label: '4:5', title: 'Portrait' },
  { value: '9:16', label: '9:16', title: 'Story' },
  { value: '16:9', label: '16:9', title: 'Video' },
];

// The canvas shape, as a floating pill above the canvas. Gone while a sheet is open, so the canvas
// gets the room.
export default function AspectBar() {
  const aspectRatio: Aspect = useMemeEditorStore((s: { aspectRatio: Aspect }) => s.aspectRatio) || 'original';
  const setAspectRatio = useMemeEditorStore((s: { setAspectRatio: (v: Aspect) => void }) => s.setAspectRatio);
  const pushHistoryDebounced = useMemeEditorStore((s: { pushHistoryDebounced: () => void }) => s.pushHistoryDebounced);
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  if (sheet) return null;
  return (
    <div className="ie-aspect-bar">
      <SegmentedControl
        ariaLabel="Aspect ratio"
        variant="floating"
        options={ASPECTS}
        value={aspectRatio}
        onChange={(v) => {
          setAspectRatio(v);
          pushHistoryDebounced();
        }}
      />
    </div>
  );
}
