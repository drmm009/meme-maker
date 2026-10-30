import { drawImageFiltered } from '../../../data/photoFilters';
import { paintGuideGrid } from '../draw/guideGrid';

export function paintOverlays({
  activeCaption, activeHandleDrawer, applyGlobalFilter, canvas, canvasH, compCanvas, ctx,
  filterCss, headerExtH, isDragging, showGrid, skipHandles, snappingLines
}) {
  // If global composition filter is enabled, draw the rendered composition canvas with the filter
  if (applyGlobalFilter && compCanvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawImageFiltered(ctx, compCanvas, filterCss, 0, 0, canvas.width, canvas.height);
  }

  // Line-up guides over the image area (Canvas > Grid), under the selection, on screen only.
  if (showGrid && !skipHandles) {
    const shown = canvas.getBoundingClientRect?.().width;
    paintGuideGrid(ctx, 0, headerExtH, canvas.width, canvasH, shown ? canvas.width / shown : 1);
  }

  // Draw active layer selection handles and rotation knob on the screen canvas (unfiltered and sharp)
  if (activeHandleDrawer && !skipHandles) {
    activeHandleDrawer(ctx);
  }

  // Draw Snapping Guides
  if (!skipHandles && isDragging.current && snappingLines.current && (snappingLines.current.horizontal !== null || snappingLines.current.vertical !== null)) {
    const { horizontal, vertical } = snappingLines.current;
    ctx.save();
    ctx.setLineDash([6, 6]);

    if (horizontal !== null) {
      const isHeaderOrFooter = activeCaption?.isHeaderCaption || activeCaption?.isFooterCaption;
      const y = isHeaderOrFooter ? (horizontal * canvas.height) : (headerExtH + horizontal * canvasH);
      const isCenter = Math.abs(horizontal - 0.5) < 0.002;
      ctx.strokeStyle = isCenter ? '#00f0ff' : '#a855f7';
      ctx.lineWidth = isCenter ? 2 : 1.5;
      ctx.shadowColor = isCenter ? 'rgba(0, 240, 255, 0.7)' : 'rgba(168, 85, 247, 0.7)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    if (vertical !== null) {
      const x = vertical * canvas.width;
      const isCenter = Math.abs(vertical - 0.5) < 0.002;
      ctx.strokeStyle = isCenter ? '#00f0ff' : '#a855f7';
      ctx.lineWidth = isCenter ? 2 : 1.5;
      ctx.shadowColor = isCenter ? 'rgba(0, 240, 255, 0.7)' : 'rgba(168, 85, 247, 0.7)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    ctx.restore();
  }
}
