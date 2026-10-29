import { Sheet, Section, SwatchRow } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import type { EditorActions } from './selection';

const CANVAS_COLORS = [
  '#ffffff', '#000000', '#1e293b', '#6b7280', '#ff5a36', '#ffd60a',
  '#34c759', '#0a84ff', '#bf5af2', '#ff375f', '#f5e6c8', 'transparent',
];

// The Canvas strip's Color: the background behind the meme, its bands and any empty space.
export default function CanvasColorSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const canvasBgColor: string = useMemeEditorStore((s: { canvasBgColor: string }) => s.canvasBgColor);
  return (
    <Sheet title="Background" onClose={onClose}>
      <Section>
        <SwatchRow wrap ariaLabel="Canvas colour" colors={CANVAS_COLORS} value={canvasBgColor} onChange={actions.handleSetCanvasBgColor} />
      </Section>
    </Sheet>
  );
}
