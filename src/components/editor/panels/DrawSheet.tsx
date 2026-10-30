import { Trash2, MoveUpRight, Circle, Square, Minus, Droplets, Grid3x3, RectangleHorizontal } from 'lucide-react';
import { Sheet, Section, Row, SwatchRow, Slider, Switch, TileGrid, Tile } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { DRAW_COLORS } from '../../../utils/captionLayout';
import { DRAW_TOOLS } from './drawTools';
import type { EditorActions } from './selection';

const SHAPES = [
  { id: 'arrow', label: 'Arrow', Icon: MoveUpRight },
  { id: 'ellipse', label: 'Circle', Icon: Circle },
  { id: 'rect', label: 'Box', Icon: Square },
  { id: 'line', label: 'Line', Icon: Minus },
];
const CENSORS = [
  { id: 'blur', label: 'Blur', Icon: Droplets },
  { id: 'pixelate', label: 'Pixelate', Icon: Grid3x3 },
  { id: 'bar', label: 'Black bar', Icon: RectangleHorizontal },
];

// The picked draw tool's settings, under the Draw strip: brushes get colour and size; Shapes the
// shape, colour, line width and fill; Censor the style and strength. Clearing removes every drawing.
// Drawing stays on after the sheet closes (see the UI store's pickDrawTool).
export default function DrawSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const drawings: unknown[] = useMemeEditorStore((s: { drawings: unknown[] }) => s.drawings);
  const ui = useEditorUiStore((s: Record<string, any>) => s);
  const drawTool: string | null = ui.drawTool;
  const tool = DRAW_TOOLS.find((t) => t.id === drawTool) || DRAW_TOOLS[0];
  const isShape = drawTool === 'shape';
  const isCensor = drawTool === 'censor';

  return (
    <Sheet title={tool.label} onClose={onClose}>
      {isShape && (
        <Section>
          <TileGrid columns={4}>
            {SHAPES.map((s) => <Tile key={s.id} label={s.label} Icon={s.Icon} active={ui.shapeKind === s.id} onClick={() => ui.setShapeKind(s.id)} />)}
          </TileGrid>
        </Section>
      )}
      {isCensor && (
        <Section>
          <TileGrid>
            {CENSORS.map((c) => <Tile key={c.id} label={c.label} Icon={c.Icon} active={ui.censorMode === c.id} onClick={() => ui.setCensorMode(c.id)} />)}
          </TileGrid>
          <p className="ie-empty">Drag over the part you want to hide.</p>
        </Section>
      )}

      <Section>
        {!isCensor && (
          <Row label="Color">
            <SwatchRow ariaLabel="Brush colour" colors={DRAW_COLORS} value={ui.brushColor} onChange={ui.setBrushColor} />
          </Row>
        )}
        {!isCensor && (
          <Row label={isShape ? 'Width' : 'Size'}>
            <Slider label="Brush size" min={2} max={isShape ? 30 : 50} value={ui.brushSize} onChange={ui.setBrushSize} />
          </Row>
        )}
        {isShape && (ui.shapeKind === 'ellipse' || ui.shapeKind === 'rect') && (
          <Row label="Fill" end>
            <Switch label="Fill shape" checked={Boolean(ui.shapeFill)} onChange={ui.setShapeFill} />
          </Row>
        )}
        {isCensor && ui.censorMode !== 'bar' && (
          <Row label="Strength">
            <Slider label="Censor strength" min={4} max={40} value={ui.censorStrength} onChange={ui.setCensorStrength} />
          </Row>
        )}
      </Section>

      <Section rule>
        <button type="button" className="ui-btn ui-btn--danger ie-wide-btn" disabled={!drawings.length} onClick={actions.handleClearDrawings}>
          <Trash2 size={16} />Clear drawing
        </button>
      </Section>
    </Sheet>
  );
}
