import { gridLines } from './gridLines';

// The layout's divider lines as a transparent PNG data URL for the export (null for a single panel).
export const generateGridImage = (layoutId, width, height) => {
  if (!layoutId || layoutId === '1-panel') return null;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (const [x1, y1, x2, y2] of gridLines(layoutId, width, height)) {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();
  return canvas.toDataURL('image/png');
};
