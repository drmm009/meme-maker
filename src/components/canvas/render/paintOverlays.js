import { drawImageFiltered } from '../../../data/photoFilters';
import { STICKER_GREEN, accentOf } from './handles';

// The snapping guides shown while a layer is dragged: the app's orange, as the selection frame and
// the video editor's guides (video-editor/preview/CanvasText); green on the Stickers maker's screen.
const GUIDE_GLOW = 'rgba(255, 90, 54, 0.55)';
const STICKER_GLOW = 'rgba(47, 211, 155, 0.55)';

export function paintOverlays({
  activeCaption, activeHandleDrawer, applyGlobalFilter, canvas, canvasH, compCanvas, ctx,
  filterCss, headerExtH, isDragging, skipHandles, snappingLines
}) {
  // If global composition filter is enabled, draw the rendered composition canvas with the filter
  if (applyGlobalFilter && compCanvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawImageFiltered(ctx, compCanvas, filterCss, 0, 0, canvas.width, canvas.height);
  }

  // Draw active layer selection handles and rotation knob on the screen canvas (unfiltered and sharp)
  if (activeHandleDrawer && !skipHandles) {
    activeHandleDrawer(ctx);
  }

  // Draw Snapping Guides
  if (!skipHandles && isDragging.current && snappingLines.current && (snappingLines.current.horizontal !== null || snappingLines.current.vertical !== null)) {
    const { horizontal, vertical } = snappingLines.current;
    const GUIDE = accentOf(ctx);
    const glow = GUIDE === STICKER_GREEN ? STICKER_GLOW : GUIDE_GLOW;
    ctx.save();
    ctx.setLineDash([6, 6]);

    if (horizontal !== null) {
      const isHeaderOrFooter = activeCaption?.isHeaderCaption || activeCaption?.isFooterCaption;
      const y = isHeaderOrFooter ? (horizontal * canvas.height) : (headerExtH + horizontal * canvasH);
      const isCenter = Math.abs(horizontal - 0.5) < 0.002;
      ctx.strokeStyle = GUIDE;
      ctx.lineWidth = isCenter ? 2 : 1.5;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    if (vertical !== null) {
      const x = vertical * canvas.width;
      const isCenter = Math.abs(vertical - 0.5) < 0.002;
      ctx.strokeStyle = GUIDE;
      ctx.lineWidth = isCenter ? 2 : 1.5;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    ctx.restore();
  }
}
