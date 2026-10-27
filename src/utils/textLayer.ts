// How a video text clip is drawn, for both the preview (CanvasText, in stage units) and the
// export (each text still is drawn with these at the output scale). One definition, so exported
// text matches what you see while editing. `scale` converts stage units to the target's pixels.
import type { TextAlign, TextClip } from '../model/videoProject';

// The background box reaches this far past the text on each side (stage units).
const BOX_PAD_X = 8;
const BOX_PAD_Y = 4;
const BOX_RADIUS = 6;

export type TextLayerItem = Pick<TextClip,
  'text' | 'x' | 'y' | 'width' | 'fontSize' | 'fontFamily' | 'color' | 'stroke' | 'strokeWidth' | 'bgColor' | 'align' | 'rotation'>;

// Konva.Text attributes.
export interface TextAttrs {
  text: string;
  x: number;
  y: number;
  width: number | undefined;
  fontSize: number;
  fontFamily: string;
  fontStyle: 'bold';
  fill: string;
  stroke: string;
  strokeWidth: number;
  letterSpacing: number;
  lineJoin: 'miter';
  miterLimit: number;
  align: TextAlign;
  rotation: number;
}

// Konva.Rect attributes. The box turns about the text's own corner (x, y), so it stays around
// rotated text: offsetX/offsetY place its corner up and left of that point.
export interface TextBoxAttrs {
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  fill: string;
  cornerRadius: number;
  rotation: number;
}

export const hasTextBox = (item: Pick<TextClip, 'bgColor'>): boolean =>
  Boolean(item.bgColor) && item.bgColor !== 'none' && item.bgColor !== 'transparent';

// The text itself. White Impact with a black outline by default; on a background box the outline
// is off unless one was picked, and text on a white box defaults to black.
export function textAttrs(item: TextLayerItem, scale = 1): TextAttrs {
  const fontSize = item.fontSize || 32;
  const boxed = hasTextBox(item);
  return {
    text: item.text !== undefined ? item.text : 'Sample Text',
    x: (item.x ?? 50) * scale,
    y: (item.y ?? 50) * scale,
    width: item.width ? item.width * scale : undefined,
    fontSize: fontSize * scale,
    fontFamily: item.fontFamily || 'Impact, sans-serif',
    fontStyle: 'bold',
    fill: item.color || (item.bgColor === 'white' ? '#000000' : '#ffffff'),
    stroke: item.stroke || (boxed ? 'transparent' : '#000000'),
    strokeWidth: (boxed && item.stroke === 'transparent' ? 0 : (item.strokeWidth || Math.max(2, fontSize / 25))) * scale,
    letterSpacing: -fontSize * 0.05 * scale,
    lineJoin: 'miter',
    miterLimit: 2,
    align: item.align || 'center',
    rotation: item.rotation || 0,
  };
}

// The background box around a text node at (x, y) that measures width x height before its own
// scale (a transformer scales it while resizing). Sizes are in the target's pixels.
export function textBoxAttrs(
  item: Pick<TextClip, 'bgColor' | 'rotation'>,
  node: { x: number; y: number; width: number; height: number; scaleX?: number; scaleY?: number },
  scale = 1
): TextBoxAttrs {
  return {
    x: node.x,
    y: node.y,
    offsetX: BOX_PAD_X * scale,
    offsetY: BOX_PAD_Y * scale,
    width: node.width * (node.scaleX ?? 1) + 2 * BOX_PAD_X * scale,
    height: node.height * (node.scaleY ?? 1) + 2 * BOX_PAD_Y * scale,
    fill: item.bgColor === 'white' ? '#ffffff' : (item.bgColor === 'black' ? '#000000' : item.bgColor || '#000000'),
    cornerRadius: BOX_RADIUS * scale,
    rotation: item.rotation || 0,
  };
}
