import { Brush, Highlighter, SunMedium, Undo2, Trash2 } from 'lucide-react';
import { Sheet, Section, Row, SwatchRow, Slider, TileGrid, Tile } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { DRAW_COLORS } from '../../../utils/captionLayout';
import type { EditorActions } from './selection';

const TOOLS = [
  { id: 'brush', label: 'Brush', title: 'Brush: solid stroke', Icon: Brush },
  { id: 'highlighter', label: 'Marker', title: 'Marker: translucent highlighter', Icon: Highlighter },
  { id: 'glow', label: 'Glow', title: 'Glow: neon stroke', Icon: SunMedium },
];

// The Draw sheet. While it is open, dragging on the canvas draws.
export default function DrawSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const drawings: unknown[] = useMemeEditorStore((s: { drawings: unknown[] }) => s.drawings);
  const drawTool: string | null = useEditorUiStore((s: { drawTool: string | null }) => s.drawTool);
  const setDrawTool = useEditorUiStore((s: { setDrawTool: (v: string) => void }) => s.setDrawTool);
  const brushColor: string = useEditorUiStore((s: { brushColor: string }) => s.brushColor);
  const setBrushColor = useEditorUiStore((s: { setBrushColor: (v: string) => void }) => s.setBrushColor);
  const brushSize: number = useEditorUiStore((s: { brushSize: number }) => s.brushSize);
  const setBrushSize = useEditorUiStore((s: { setBrushSize: (v: number) => void }) => s.setBrushSize);

  return (
    <Sheet title="Draw" onClose={onClose}>
      <Section>
        <TileGrid>
          {TOOLS.map((t) => <Tile key={t.id} label={t.label} title={t.title} Icon={t.Icon} active={drawTool === t.id} onClick={() => setDrawTool(t.id)} />)}
        </TileGrid>
      </Section>
      <Section>
        <Row label="Color">
          <SwatchRow ariaLabel="Brush colour" colors={DRAW_COLORS} value={brushColor} onChange={setBrushColor} />
        </Row>
        <Row label="Size">
          <Slider label="Brush size" min={2} max={50} value={brushSize} onChange={setBrushSize} format={(v) => `${v}px`} />
        </Row>
      </Section>
      <Section>
        <div className="ie-layer-actions">
          <button type="button" className="ui-btn" disabled={!drawings.length} onClick={actions.handleUndoDrawing}><Undo2 size={16} />Undo stroke</button>
          <button type="button" className="ui-btn ui-btn--danger" disabled={!drawings.length} onClick={actions.handleClearDrawings}><Trash2 size={16} />Clear all</button>
        </div>
      </Section>
    </Sheet>
  );
}
