import { isColorDark } from '../../../utils/captionLayout';

export function paintHeaderFooter({
  canvasBgColor, canvasFooter, canvasH, canvasHeader, canvasW, footerExtH, headerExtH,
  isFooterEnabled, isHeaderEnabled, liveBgColor, targetCtx
}) {
  // Draw Header Extension (Banner extending above canvas)
  if (isHeaderEnabled && headerExtH > 0) {
    targetCtx.save();
    // 1. Solid background for header extension (matches canvas background color)
    const extBg = liveBgColor || canvasBgColor || canvasHeader?.bgColor || '#ffffff';
    targetCtx.fillStyle = extBg;
    targetCtx.fillRect(0, 0, canvasW, headerExtH);

    // 2. Crisp boundary divider line between header extension and meme image
    const isDark = isColorDark(extBg);
    targetCtx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
    targetCtx.lineWidth = 1;
    targetCtx.beginPath();
    targetCtx.moveTo(0, headerExtH);
    targetCtx.lineTo(canvasW, headerExtH);
    targetCtx.stroke();
    targetCtx.restore();
  }

  // Draw Footer Extension (Banner extending below canvas)
  if (isFooterEnabled && footerExtH > 0) {
    targetCtx.save();
    const footerY = headerExtH + canvasH;
    // 1. Solid background for footer extension (matches canvas background color)
    const extBg = liveBgColor || canvasBgColor || canvasFooter?.bgColor || '#ffffff';
    targetCtx.fillStyle = extBg;
    targetCtx.fillRect(0, footerY, canvasW, footerExtH);

    // 2. Crisp boundary divider line between meme image and footer extension
    const isDark = isColorDark(extBg);
    targetCtx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
    targetCtx.lineWidth = 1;
    targetCtx.beginPath();
    targetCtx.moveTo(0, footerY);
    targetCtx.lineTo(canvasW, footerY);
    targetCtx.stroke();
    targetCtx.restore();
  }
}
