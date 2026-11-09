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
const ROTATER = 30;
const BUTTON = 28;
// Extra touch area round each handle.
const TOUCH = 18;
// A side handle's touch band: this wide, and up to this long.
const SIDE_ZONE = 32;
const SIDE_ZONE_MAX = 64;
const SIDES = ['middle-left', 'middle-right', 'top-center', 'bottom-center'];

// Lucide's copy and trash, as one path each (24-unit box).
const COPY_ICON = 'M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2zM4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2';
const TRASH_ICON = 'M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2';

const isSide = (anchor: Konva.Rect) => ['top-center', 'bottom-center', 'middle-left', 'middle-right'].some((n) => anchor.hasName(n));

// Lucide's rotate-cw (24-unit box): an open circle with an arrowhead at its end.
const ROTATE_ICON = 'M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8M21 3v5h-5';
let rotateIcon: Path2D | null = null;

const turning = (shape: Konva.Node) => (shape.getParent() as Konva.Transformer | null)?.getActiveAnchor?.() === 'rotater';

// The rotate knob: a white disc with a turning arrow; orange with a white arrow while it turns.
function drawRotater(ctx: Konva.Context, shape: Konva.Shape) {
  const r = shape.width() / 2;
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillShape(shape);
  if (typeof Path2D === 'undefined') return;
  rotateIcon ??= new Path2D(ROTATE_ICON);
  const native = ctx._context;
  const size = r * 1.1;
  native.save();
  native.translate(r - size / 2, r - size / 2);
  native.scale(size / 24, size / 24);
  // Drawn without the disc's shadow, as a 2px line at this size.
  native.shadowColor = 'transparent';
  native.strokeStyle = turning(shape) ? '#ffffff' : INK;
  native.lineWidth = 2.4;
  native.lineCap = 'round';
  native.lineJoin = 'round';
  native.stroke(rotateIcon);
  native.restore();
}

// Its touch area: the disc alone (the arrow is drawn on the picture only).
function hitRotater(ctx: Konva.Context, shape: Konva.Shape) {
  const r = shape.width() / 2;
  ctx.beginPath();
  ctx.arc(r, r, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStrokeShape(shape);
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
  // Centred on the frame's line, which sits `padding` outside the layer (as Konva places them; the
  // rotater's padding is in its position instead).
  const tr = anchor.getParent() as Konva.Transformer | null;
  const pad = rotater ? 0 : tr?.padding() || 0;
  const name = anchor.name();
  // A corner handle sits on the middle of the frame's rounded corner, not its square corner.
  let inset = 0;
  if (!rotater && !isSide(anchor)) {
    const back = tr?.findOne('.back');
    const r = Math.min(RADIUS, Math.abs((back?.width() || 0) + pad * 2) / 2, Math.abs((back?.height() || 0) + pad * 2) / 2);
    inset = r * (1 - Math.SQRT1_2);
  }
  const dx = name.includes('left') ? pad - inset : name.includes('right') ? inset - pad : 0;
  const dy = name.includes('top') ? pad - inset : name.includes('bottom') ? inset - pad : 0;
  anchor.offsetX(w / 2 + dx);
  anchor.offsetY(h / 2 + dy);
  anchor.cornerRadius(Math.min(w, h) / 2);
  anchor.fill(rotater && turning(anchor) ? FRAME : '#ffffff');
  anchor.stroke('rgba(0, 0, 0, 0.12)');
  anchor.strokeWidth(1);
  anchor.shadowColor('#000000');
  anchor.shadowBlur(6);
  anchor.shadowOpacity(0.35);
  anchor.shadowOffsetY(1);
  anchor.hitStrokeWidth(TOUCH);
  if (rotater) {
    anchor.sceneFunc(drawRotater);
    anchor.hitFunc(hitRotater);
  } else if (isSide(anchor)) {
    // Its touch area: a band half the frame's side long (the buttons and corner handles keep the
    // rest), drawn over them, so it's easy to catch even on one line of text.
    const back = tr?.findOne('.back');
    const across = anchor.hasName('top-center') || anchor.hasName('bottom-center');
    const side = Math.abs(((across ? back?.width() : back?.height()) || 0) + (tr?.padding() || 0) * 2);
    const along = Math.max(across ? w : h, Math.min(SIDE_ZONE_MAX, side / 2));
    anchor.hitFunc((ctx, shape) => {
      const bw = across ? along : SIDE_ZONE;
      const bh = across ? SIDE_ZONE : along;
      ctx.beginPath();
      ctx.rect((w - bw) / 2, (h - bh) / 2, bw, bh);
      ctx.closePath();
      ctx.fillShape(shape);
    });
  }
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
  rotateAnchorOffset: 34,
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
    // The side handles' bands over the buttons and corners (see styleAnchor).
    SIDES.forEach((name) => tr.findOne(`.${name}`)?.moveToTop());
    angle.moveToTop();
  };
  // While turning: the angle in a small dark pill.
  const angle = new Konva.Label({ name: 'vt-sel-angle', visible: false, listening: false });
  angle.add(new Konva.Tag({ fill: 'rgba(28, 28, 30, 0.88)', cornerRadius: 11, pointerDirection: 'none' }));
  angle.add(new Konva.Text({ text: '0°', fontSize: 13, fontStyle: 'bold', fontFamily: 'system-ui, sans-serif', fill: '#ffffff', padding: 5, align: 'center' }));
  Konva.Group.prototype.add.call(tr, angle);
  const showAngle = () => {
    const on = tr.getActiveAnchor() === 'rotater';
    angle.visible(on);
    if (!on) return;
    const back = tr.findOne('.back');
    const deg = Math.round(((tr.rotation() % 360) + 360) % 360);
    (angle.getText() as Konva.Text).text(`${deg === 360 ? 0 : deg}°`);
    angle.offsetX(angle.width() / 2);
    angle.offsetY(angle.height() / 2);
    // In the middle of the layer (always on the canvas), kept upright on screen.
    angle.position({ x: (back?.width() || 0) / 2, y: (back?.height() || 0) / 2 });
    angle.rotation(-tr.rotation());
  };
  tr.on('transform.vtangle', showAngle);
  tr.on('transformend.vtangle', () => { angle.visible(false); tr.getLayer()?.batchDraw(); });
  const update = tr.update.bind(tr);
  tr.update = () => {
    if (held.has(tr)) return;
    update();
    place();
  };
  tr.update();
}

const held = new WeakSet<Konva.Transformer>();

// Runs `change` (several attributes set on the selected node) with the box laid out once at the
// end, not once per attribute: each one would otherwise lay out every handle again.
export function holdSelection(tr: Konva.Transformer | null | undefined, change: () => void) {
  if (!tr) {
    change();
    return;
  }
  held.add(tr);
  try {
    change();
  } finally {
    held.delete(tr);
    tr.update();
  }
}
