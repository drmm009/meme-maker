import Konva from 'konva';

// How a selected layer's box looks on the preview (every Transformer in the video editor): a bold,
// rounded lime frame; a Duplicate button on its top-left corner and a Delete button on its
// top-right, both round with a dark outline; lime resize handles on the bottom corners and the
// sides; and a white rotate knob with a turning arrow below the bottom. Turning snaps to straight
// angles. Sizes are in screen pixels (the Transformer draws unscaled).

const FRAME = '#6cf04f';
const DELETE = '#f2716b';
const INK = '#111111';
const FRAME_WIDTH = 3;
const RADIUS = 16;
const HANDLE = 14;
const SIDE_LONG = 20;
const SIDE_SHORT = 8;
const ROTATER = 26;
const BUTTON = 30;
// Extra touch area round each handle.
const TOUCH = 18;

// Lucide's copy-plus and trash-2, as one path each (24-unit box).
const COPY_ICON = 'M15 12v6M12 15h6M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2zM4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2';
const TRASH_ICON = 'M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6';

const isSide = (anchor: Konva.Rect) => ['top-center', 'bottom-center', 'middle-left', 'middle-right'].some((n) => anchor.hasName(n));

// The rotate knob: a white disc with a dark ring and a three-quarter turning arrow.
function drawRotater(ctx: Konva.Context, shape: Konva.Shape) {
  const r = shape.width() / 2;
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStrokeShape(shape);
  const a = r * 0.42;
  const end = -Math.PI * 0.35;
  ctx.beginPath();
  ctx.arc(r, r, a, -Math.PI * 1.85, end);
  const tipX = r + a * Math.cos(end);
  const tipY = r + a * Math.sin(end);
  ctx.moveTo(tipX - 4.5, tipY - 1);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(tipX + 0.5, tipY - 4.5);
  ctx.setAttr('strokeStyle', INK);
  ctx.setAttr('lineWidth', 2);
  ctx.setAttr('lineCap', 'round');
  ctx.setAttr('lineJoin', 'round');
  ctx.stroke();
}

function styleAnchor(anchor: Konva.Rect) {
  const rotater = anchor.hasName('rotater');
  let w = HANDLE;
  let h = HANDLE;
  if (rotater) {
    w = ROTATER;
    h = ROTATER;
  } else if (isSide(anchor)) {
    const across = anchor.hasName('top-center') || anchor.hasName('bottom-center');
    w = across ? SIDE_LONG : SIDE_SHORT;
    h = across ? SIDE_SHORT : SIDE_LONG;
  }
  anchor.width(w);
  anchor.height(h);
  anchor.offsetX(w / 2);
  anchor.offsetY(h / 2);
  anchor.cornerRadius(Math.min(w, h) / 2);
  anchor.fill(rotater ? '#ffffff' : FRAME);
  anchor.stroke(INK);
  anchor.strokeWidth(2);
  anchor.shadowColor('#000000');
  anchor.shadowBlur(6);
  anchor.shadowOpacity(0.3);
  anchor.shadowOffsetY(1);
  anchor.hitStrokeWidth(TOUCH);
  if (rotater) anchor.sceneFunc(drawRotater);
}

// The frame: a rounded rectangle round the layer and its padding.
function drawFrame(ctx: Konva.Context, shape: Konva.Shape) {
  const pad = (shape.getParent() as Konva.Transformer).padding();
  const w = shape.width() + pad * 2;
  const h = shape.height() + pad * 2;
  const r = Math.max(0, Math.min(RADIUS, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.beginPath();
  ctx.roundRect(-pad, -pad, w, h, r);
  ctx.fillStrokeShape(shape);
}

export const SELECTION_PROPS = {
  borderStroke: FRAME,
  borderStrokeWidth: FRAME_WIDTH,
  // A little room between the layer and its frame, so the corner buttons don't cover small text.
  padding: 8,
  rotateLineVisible: false,
  // The rotate knob sits below, clear of the corner buttons.
  rotateAnchorAngle: 180,
  rotateAnchorOffset: 30,
  rotationSnaps: [0, 90, 180, 270],
  rotationSnapTolerance: 5,
  // The top corners hold Duplicate and Delete.
  enabledAnchors: ['middle-left', 'middle-right', 'top-center', 'bottom-center', 'bottom-left', 'bottom-right'],
  anchorStyleFunc: styleAnchor,
};

function cornerButton(fill: string, icon: string, label: string, run: () => void) {
  const button = new Konva.Group({ name: `vt-sel-btn vt-sel-${label}` });
  button.add(new Konva.Circle({
    radius: BUTTON / 2, fill, stroke: INK, strokeWidth: 2.5,
    shadowColor: '#000000', shadowBlur: 8, shadowOpacity: 0.3, shadowOffsetY: 2,
    hitStrokeWidth: TOUCH,
  }));
  button.add(new Konva.Path({
    data: icon, stroke: INK, strokeWidth: 2.2, lineCap: 'round', lineJoin: 'round',
    scaleX: 0.66, scaleY: 0.66, offsetX: 12, offsetY: 12, listening: false,
  }));
  button.on('pointerdown mousedown touchstart', (e) => { e.cancelBubble = true; });
  button.on('click tap', (e) => {
    e.cancelBubble = true;
    run();
  });
  button.on('mouseenter', () => { const s = button.getStage(); if (s) s.container().style.cursor = 'pointer'; });
  button.on('mouseleave', () => { const s = button.getStage(); if (s) s.container().style.cursor = ''; });
  return button;
}

interface SelectionActions { onDuplicate: () => void; onDelete: () => void }

// Dresses a Transformer once it has its nodes: the rounded frame with its shadow, and the
// Duplicate and Delete buttons, kept on the top corners as the box moves, resizes and turns.
export function decorateSelection(tr: Konva.Transformer | null, actions: SelectionActions) {
  if (!tr) return;
  const back = tr.findOne('.back') as Konva.Shape | undefined;
  if (back) {
    back.sceneFunc(drawFrame);
    back.shadowColor('#000000');
    back.shadowBlur(6);
    back.shadowOpacity(0.35);
    back.shadowForStrokeEnabled(true);
  }
  if (tr.findOne('.vt-sel-btn')) return;
  const copy = cornerButton(FRAME, COPY_ICON, 'duplicate', actions.onDuplicate);
  const remove = cornerButton(DELETE, TRASH_ICON, 'delete', actions.onDelete);
  // Transformer.add refuses outside nodes once it is built; the group's own add takes them (one
  // at a time: with several it calls tr.add again for each).
  Konva.Group.prototype.add.call(tr, copy);
  Konva.Group.prototype.add.call(tr, remove);
  const place = () => {
    const pad = tr.padding();
    const w = back?.width() || 0;
    const h = back?.height() || 0;
    // A flipped box (negative height) keeps the buttons on its visual top.
    const top = h < 0 ? h + pad : -pad;
    copy.position({ x: -pad, y: top });
    remove.position({ x: w + pad, y: top });
    copy.moveToTop();
    remove.moveToTop();
  };
  const update = tr.update.bind(tr);
  tr.update = () => {
    update();
    place();
  };
  tr.update();
}
