import { MoveUpRight, Circle, Square, Minus, Droplets, Grid3x3, RectangleHorizontal, PenLine, Highlighter, MoveHorizontal } from 'lucide-react';
import { Sheet, Section, Row, SwatchRow, Slider, Switch, TileGrid, Tile } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { DRAW_COLORS } from '../../../utils/captionLayout';
import { DRAW_TOOLS } from './drawTools';
import { isDragDrawing } from '../../canvas/interaction/drawingHits';
import type { DragDrawing } from '../../canvas/draw/shapes';
import type { EditorActions } from './selection';

const SHAPES = [
  { id: 'arrow', label: 'Arrow', Icon: MoveUpRight },
  { id: 'ellipse', label: 'Circle', Icon: Circle },
  { id: 'rect', label: 'Box', Icon: Square },
  { id: 'line', label: 'Line', Icon: Minus },
  { id: 'sketch', label: 'Sketch', Icon: PenLine },
  { id: 'highlight', label: 'Highlight', Icon: Highlighter },
  { id: 'double', label: 'Both ways', Icon: MoveHorizontal },
];
const CENSORS = [
  { id: 'blur', label: 'Blur', Icon: Droplets },
  { id: 'pixelate', label: 'Pixelate', Icon: Grid3x3 },
  { id: 'bar', label: 'Black bar', Icon: RectangleHorizontal },
];

// The picked draw tool's settings, under the Draw strip: brushes get colour and size; Shapes the
// shape, colour, line width and fill; Censor the style and strength. With a shape (or censor
// region) selected, they show and change that one too. Clear drawing sits in the sheet header.
// Drawing stays on after the sheet closes (see the UI store's pickDrawTool).
export default function DrawSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const drawings: unknown[] = useMemeEditorStore((s: { drawings: unknown[] }) => s.drawings);
  const activeLayerId: string | null = useMemeEditorStore((s: { activeLayerId: string | null }) => s.activeLayerId);
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  const ui = useEditorUiStore((s: Record<string, any>) => s);
  const drawTool: string | null = ui.drawTool;
  const tool = DRAW_TOOLS.find((t) => t.id === drawTool) || DRAW_TOOLS[0];
  const isShape = drawTool === 'shape';
  const isCensor = drawTool === 'censor';
  const isEraser = drawTool === 'eraser';

  const selected = drawings.find((d): d is DragDrawing => isDragDrawing(d) && d.id === activeLayerId && d.type === drawTool);
  const shape = selected?.type === 'shape' ? selected : null;
  const censor = selected?.type === 'censor' ? selected : null;
  // A setting for the next drawing that also changes the selected one.
  const both = <T,>(setUi: (v: T) => void, patch: (v: T) => object) => (v: T) => {
    setUi(v);
    if (selected) patchLayer('drawings', selected.id, patch(v));
  };
  const shapeKind: string = shape?.shape ?? ui.shapeKind;
  const color: string = shape?.color ?? ui.brushColor;
  const size: number = shape?.size ?? ui.brushSize;
  const fill: boolean = shape ? Boolean(shape.fill) : Boolean(ui.shapeFill);
  const censorMode: string = censor?.censor ?? ui.censorMode;
  const strength: number = censor?.strength ?? ui.censorStrength;

  return (
    <Sheet
      className="ie-draw-sheet"
      title={tool.label}
      onClose={onClose}
      action={{
        label: 'Clear drawing',
        variant: 'plain',
        disabled: !drawings.length,
        onClick: actions.handleClearDrawings,
      }}
    >
      {isShape && (
        <Section>
          <TileGrid columns={4}>
            {SHAPES.map((s) => <Tile key={s.id} label={s.label} Icon={s.Icon} active={shapeKind === s.id} onClick={() => both(ui.setShapeKind, (v) => ({ shape: v }))(s.id)} />)}
          </TileGrid>
        </Section>
      )}
      {isCensor && (
        <Section>
          <TileGrid>
            {CENSORS.map((c) => <Tile key={c.id} label={c.label} Icon={c.Icon} active={censorMode === c.id} onClick={() => both(ui.setCensorMode, (v) => ({ censor: v }))(c.id)} />)}
          </TileGrid>
          {!censor && <p className="ie-empty">Drag over the part you want to hide.</p>}
        </Section>
      )}

      <Section>
        {!isCensor && !isEraser && (
          <Row label="Color">
            <SwatchRow ariaLabel="Brush colour" colors={DRAW_COLORS} value={color} onChange={both(ui.setBrushColor, (v) => ({ color: v }))} />
          </Row>
        )}
        {!isCensor && (
          <Row label={isShape ? 'Width' : 'Size'}>
            <Slider label="Brush size" min={2} max={isShape ? 30 : 50} value={size} onChange={both(ui.setBrushSize, (v) => ({ size: v }))} />
          </Row>
        )}
        {isShape && (shapeKind === 'ellipse' || shapeKind === 'rect') && (
          <Row label="Fill" end>
            <Switch label="Fill shape" checked={fill} onChange={both(ui.setShapeFill, (v) => ({ fill: v }))} />
          </Row>
        )}
        {isCensor && censorMode !== 'bar' && (
          <Row label="Strength">
            <Slider label="Censor strength" min={4} max={40} value={strength} onChange={both(ui.setCensorStrength, (v) => ({ strength: v }))} />
          </Row>
        )}
      </Section>
    </Sheet>
  );
}
