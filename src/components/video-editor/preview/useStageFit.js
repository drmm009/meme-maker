import { useEffect } from 'react';
import { fitStage } from './previewMath';

// Sizes the Konva stage (and its wrapper, #stage-sink-wrapper) to the space around the preview at
// this aspect ratio, on window resizes and whenever that space changes size. It sets the stage
// directly rather than through React state, so resizing stays smooth.
export function useStageFit(containerRef, stageRef, aspect) {
  useEffect(() => {
    const areaAround = (selectors) => containerRef.current.closest(selectors) || containerRef.current.parentElement;
    const updateSize = () => {
      if (!containerRef.current) return;
      let availableWidth;
      let availableHeight;
      if (window.innerWidth <= 900) {
        // Phones: the flex area the preview sits in.
        const area = areaAround('.video-canvas-area, .canvas-area');
        const pad = 12;
        availableWidth = Math.max(200, (area ? area.clientWidth : window.innerWidth) - pad);
        availableHeight = Math.max(150, (area ? area.clientHeight : window.innerHeight * 0.45) - pad);
      } else {
        const area = areaAround('.canvas-area, .video-canvas-area, .canvas-wrapper');
        const pad = 24;
        availableWidth = Math.max(100, (area ? area.clientWidth : window.innerWidth * 0.5) - pad);
        availableHeight = Math.max(100, (area ? area.clientHeight : (window.innerHeight - 80)) - pad);
      }

      const { width, height, scale } = fitStage(availableWidth, availableHeight, aspect);
      if (stageRef.current) {
        stageRef.current.width(width);
        stageRef.current.height(height);
        stageRef.current.scale({ x: scale, y: scale });
      }
      const wrapper = document.getElementById('stage-sink-wrapper');
      if (wrapper) {
        wrapper.style.width = `${width}px`;
        wrapper.style.height = `${height}px`;
      }
    };

    window.addEventListener('resize', updateSize);
    updateSize();

    let observer = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      const area = areaAround('.canvas-area, .video-canvas-area, .canvas-wrapper');
      if (area) {
        observer = new ResizeObserver(() => updateSize());
        observer.observe(area);
      }
    }
    return () => {
      window.removeEventListener('resize', updateSize);
      if (observer) observer.disconnect();
    };
  }, [aspect, containerRef, stageRef]);
}
