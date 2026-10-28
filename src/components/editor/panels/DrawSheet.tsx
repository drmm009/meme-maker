import { Trash2 } from 'lucide-react';
import { Sheet, Section, Row, SwatchRow, Slider } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { DRAW_COLORS } from '../../../utils/captionLayout';
import { DRAW_TOOLS } from './drawTools';
import type { EditorActions } from './selection';

// The picked brush's settings: colour, size, and clearing the drawing. Drawing stays on after
// it closes (see the UI store's pickDrawTool).
export default function DrawSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const drawings: unknown[] = useMemeEditorStore((s: { drawings: unknown[] }) => s.drawings);
  const drawTool: string | null = useEditorUiStore((s: { drawTool: string | null }) => s.drawTool);
  const brushColor: string = useEditorUiStore((s: { brushColor: string }) => s.brushColor);
  const setBrushColor = useEditorUiStore((s: { setBrushColor: (v: string) => void }) => s.setBrushColor);
  const brushSize: number = useEditorUiStore((s: { brushSize: number }) => s.brushSize);
  const setBrushSize = useEditorUiStore((s: { setBrushSize: (v: number) => void }) => s.setBrushSize);
  const tool = DRAW_TOOLS.find((t) => t.id === drawTool) || DRAW_TOOLS[0];

  return (
    <Sheet title={tool.label} onClose={onClose}>
      <Section>
        <Row label="Color">
          <SwatchRow ariaLabel="Brush colour" colors={DRAW_COLORS} value={brushColor} onChange={setBrushColor} />
        </Row>
        <Row label="Size">
          <Slider label="Brush size" min={2} max={50} value={brushSize} onChange={setBrushSize} />
        </Row>
      </Section>
      <Section rule>
        <button type="button" className="ui-btn ui-btn--danger ie-wide-btn" disabled={!drawings.length} onClick={actions.handleClearDrawings}>
          <Trash2 size={16} />Clear drawing
        </button>
      </Section>
    </Sheet>
  );
}
