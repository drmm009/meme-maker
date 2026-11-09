import type Konva from 'konva';

// How a selected layer's box looks on the preview (every Transformer in the video editor): a white
// border with a soft shadow, so it shows on light and dark pictures alike; round white corner
// handles and slim pill side handles, each with a shadow and a finger-sized touch area; and an
// orange rotate knob a little above, without the line to it. Turning snaps to straight angles.

const ACCENT = '#ff5a36';
const CORNER = 12;
const SIDE_LONG = 18;
const SIDE_SHORT = 6;
const ROTATER = 20;
// Extra touch area round each handle, in screen pixels.
const TOUCH = 18;

const isSide = (anchor: Konva.Rect) => ['top-center', 'bottom-center', 'middle-left', 'middle-right'].some((n) => anchor.hasName(n));

function styleAnchor(anchor: Konva.Rect) {
  const rotater = anchor.hasName('rotater');
  let w = CORNER;
  let h = CORNER;
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
  anchor.fill(rotater ? ACCENT : '#ffffff');
  anchor.stroke(rotater ? '#ffffff' : 'rgba(0, 0, 0, 0.18)');
  anchor.strokeWidth(rotater ? 2 : 1);
  anchor.shadowColor('#000000');
  anchor.shadowBlur(6);
  anchor.shadowOpacity(0.35);
  anchor.shadowOffsetY(1);
  anchor.hitStrokeWidth(TOUCH);
}

export const SELECTION_PROPS = {
  borderStroke: '#ffffff',
  borderStrokeWidth: 1.5,
  // A little room between the layer and its box, so the handles don't sit on small text.
  padding: 5,
  rotateLineVisible: false,
  rotateAnchorOffset: 28,
  rotationSnaps: [0, 90, 180, 270],
  rotationSnapTolerance: 5,
  anchorStyleFunc: styleAnchor,
};

// The border's shadow (the Transformer has no prop for it): call once it has its nodes.
export function shadeSelection(tr: Konva.Transformer | null) {
  const back = tr?.findOne('.back') as Konva.Shape | undefined;
  if (!back) return;
  back.shadowColor('#000000');
  back.shadowBlur(4);
  back.shadowOpacity(0.5);
  back.shadowForStrokeEnabled(true);
}
