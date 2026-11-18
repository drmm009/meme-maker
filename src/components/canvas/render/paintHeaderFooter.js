import { isColorDark } from '../../../utils/captionLayout';
import { bandColor } from '../layout/canvasLayout';

// The header and footer bands. `divider` draws a faint line where each meets the picture, a guide
// while editing only: the export (renderCanvas's skipHandles) leaves it out.
export function paintHeaderFooter({
  canvasBgColor, canvasFooter, canvasH, canvasHeader, canvasW, footerExtH, headerExtH,
  isFooterEnabled, isHeaderEnabled, liveBgColor, targetCtx, divider = true
}) {
  // Draw Header Extension (Banner extending above canvas)
  if (isHeaderEnabled && headerExtH > 0) {
    targetCtx.save();
    // 1. Solid background for header extension (the band's own colour, else the canvas colour)
    const extBg = bandColor(canvasHeader, liveBgColor || canvasBgColor);
    targetCtx.fillStyle = extBg;
    targetCtx.fillRect(0, 0, canvasW, headerExtH);

    // 2. A faint guide line between header extension and meme image (on screen only)
    if (divider) {
      const isDark = isColorDark(extBg);
      targetCtx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
      targetCtx.lineWidth = 1;
      targetCtx.beginPath();
      targetCtx.moveTo(0, headerExtH);
      targetCtx.lineTo(canvasW, headerExtH);
      targetCtx.stroke();
    }
    targetCtx.restore();
  }

  // Draw Footer Extension (Banner extending below canvas)
  if (isFooterEnabled && footerExtH > 0) {
    targetCtx.save();
    const footerY = headerExtH + canvasH;
    // 1. Solid background for footer extension (the band's own colour, else the canvas colour)
    const extBg = bandColor(canvasFooter, liveBgColor || canvasBgColor);
    targetCtx.fillStyle = extBg;
    targetCtx.fillRect(0, footerY, canvasW, footerExtH);

    // 2. A faint guide line between meme image and footer extension (on screen only)
    if (divider) {
      const isDark = isColorDark(extBg);
      targetCtx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
      targetCtx.lineWidth = 1;
      targetCtx.beginPath();
      targetCtx.moveTo(0, footerY);
      targetCtx.lineTo(canvasW, footerY);
      targetCtx.stroke();
    }
    targetCtx.restore();
  }
}
