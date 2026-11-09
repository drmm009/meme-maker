import Konva from 'konva';

// How a selected layer's box looks on the preview (every Transformer in the video editor): a
// rounded orange frame with a soft shadow; a Delete button on its top-left corner and a Duplicate
// button on its top-right, plain white discs with a soft shadow; round white resize handles on the
// bottom corners and white pills on the sides; and a white rotate knob with a turning arrow above
// the top, clear of the buttons. Turning snaps to straight angles. Sizes are in screen pixels (the
// Transformer draws unscaled).

const FRAME = '#ff5a36';
const DELETE = '#ff3b30';
const INK = '#1c1c1e';
const FRAME_WIDTH = 2.5;
const RADIUS = 14;
const HANDLE = 14;
const SIDE_LONG = 20;
const SIDE_SHORT = 7;
const ROTATER = 26;
const BUTTON = 28;
// Extra touch area round each handle.
const TOUCH = 18;

// Lucide's copy and trash, as one path each (24-unit box).
const COPY_ICON = 'M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2zM4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2';
const TRASH_ICON = 'M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2';

const isSide = (anchor: Konva.Rect) => ['top-center', 'bottom-center', 'middle-left', 'middle-right'].some((n) => anchor.hasName(n));

// The rotate knob: a white disc with a three-quarter turning arrow.
function drawRotater(ctx: Konva.Context, shape: Konva.Shape) {
  const r = shape.width() / 2;
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillShape(shape);
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
  anchor.fill('#ffffff');
  anchor.stroke('rgba(0, 0, 0, 0.12)');
  anchor.strokeWidth(1);
  anchor.shadowColor('#000000');
  anchor.shadowBlur(6);
  anchor.shadowOpacity(0.35);
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
  // High enough that the knob clears the corner buttons on a small layer.
  rotateAnchorOffset: 30,
  rotationSnaps: [0, 90, 180, 270],
  rotationSnapTolerance: 5,
  // The top corners hold Delete and Duplicate.
  enabledAnchors: ['middle-left', 'middle-right', 'top-center', 'bottom-center', 'bottom-left', 'bottom-right'],
  anchorStyleFunc: styleAnchor,
};

function cornerButton(colour: string, icon: string, label: string, run: () => void) {
  const button = new Konva.Group({ name: `vt-sel-btn vt-sel-${label}` });
  button.add(new Konva.Circle({
    radius: BUTTON / 2, fill: '#ffffff',
    shadowColor: '#000000', shadowBlur: 8, shadowOpacity: 0.35, shadowOffsetY: 1,
    hitStrokeWidth: TOUCH,
  }));
  button.add(new Konva.Path({
    data: icon, stroke: colour, strokeWidth: 2.2, lineCap: 'round', lineJoin: 'round',
    scaleX: 0.6, scaleY: 0.6, offsetX: 12, offsetY: 12, listening: false,
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
// Delete and Duplicate buttons, kept on the top corners as the box moves, resizes and turns.
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
  const copy = cornerButton(INK, COPY_ICON, 'duplicate', actions.onDuplicate);
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
    remove.position({ x: -pad, y: top });
    copy.position({ x: w + pad, y: top });
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
