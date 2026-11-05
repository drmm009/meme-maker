import SizeMenuView from '../../ui/SizeMenu';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { CANVAS_SIZES } from '../canvasSizes';
import type { Aspect } from '../canvasSizes';

// The top bar's canvas size, for a tall canvas (where the pill bar above it would take the meme's
// room): the shared size menu on the meme's aspect ratio.
export default function SizeMenu() {
  const aspectRatio: Aspect = useMemeEditorStore((s: { aspectRatio: Aspect }) => s.aspectRatio) || 'original';
  const setAspectRatio = useMemeEditorStore((s: { setAspectRatio: (v: Aspect) => void }) => s.setAspectRatio);
  const pushHistoryDebounced = useMemeEditorStore((s: { pushHistoryDebounced: () => void }) => s.pushHistoryDebounced);
  return (
    <SizeMenuView
      sizes={CANVAS_SIZES}
      value={aspectRatio}
      onPick={(v) => {
        setAspectRatio(v);
        pushHistoryDebounced();
      }}
    />
  );
}
