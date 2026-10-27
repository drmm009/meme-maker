// Rotation of a w x h box drawn at corner (x, y) and turned `degrees` clockwise about that corner,
// the way Konva rotates nodes. Shared by the preview (Rotate keeps a clip's centre in place) and
// the export (FFmpeg rotates about the centre, so it needs the centre and the turned box's size).

const rad = (degrees: number) => (degrees * Math.PI) / 180;

// Where the box's centre ends up.
export const rotatedCenter = (x: number, y: number, w: number, h: number, degrees: number): { x: number; y: number } => {
  const a = rad(degrees);
  return {
    x: x + (w / 2) * Math.cos(a) - (h / 2) * Math.sin(a),
    y: y + (w / 2) * Math.sin(a) + (h / 2) * Math.cos(a),
  };
};

// The corner (x, y) that puts the turned box's centre at `center`.
export const cornerForCenter = (center: { x: number; y: number }, w: number, h: number, degrees: number): { x: number; y: number } => {
  const a = rad(degrees);
  return {
    x: center.x - ((w / 2) * Math.cos(a) - (h / 2) * Math.sin(a)),
    y: center.y - ((w / 2) * Math.sin(a) + (h / 2) * Math.cos(a)),
  };
};

// The upright size that holds the turned box.
export const rotatedBounds = (w: number, h: number, degrees: number): { width: number; height: number } => {
  const a = rad(degrees);
  const c = Math.abs(Math.cos(a));
  const s = Math.abs(Math.sin(a));
  return { width: w * c + h * s, height: w * s + h * c };
};

// Is this a turn at all (360° and its multiples aren't)?
export const isRotated = (degrees: number | undefined): degrees is number =>
  typeof degrees === 'number' && Number.isFinite(degrees) && Math.abs(degrees % 360) > 1e-6;
