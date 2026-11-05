import { SegmentedControl } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { EDITOR_MODES } from '../editorModes';
import type { EditorMode } from '../editorModes';
import { CANVAS_SIZES } from '../canvasSizes';
import type { Aspect } from '../canvasSizes';

const ASPECTS = CANVAS_SIZES.map(({ value, label, title }) => ({ value, label, title }));

// The canvas shape, as a floating pill above the canvas. In the editors with a Canvas tab a tall canvas
// has it in the top bar instead (SizeMenu), so the meme keeps the room. Gone while a sheet is open, and
// in the Stickers maker.
export default function AspectBar() {
  const aspectRatio: Aspect = useMemeEditorStore((s: { aspectRatio: Aspect }) => s.aspectRatio) || 'original';
  const setAspectRatio = useMemeEditorStore((s: { setAspectRatio: (v: Aspect) => void }) => s.setAspectRatio);
  const pushHistoryDebounced = useMemeEditorStore((s: { pushHistoryDebounced: () => void }) => s.pushHistoryDebounced);
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const mode: EditorMode = useEditorUiStore((s: { mode: EditorMode }) => s.mode);
  const canvasTall: boolean = useEditorUiStore((s: { canvasTall: boolean }) => s.canvasTall);
  if (sheet || mode === 'sticker' || (canvasTall && EDITOR_MODES[mode].dock.includes('canvas'))) return null;
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
