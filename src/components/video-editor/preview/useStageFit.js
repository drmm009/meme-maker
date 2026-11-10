import { useEffect } from 'react';
import { fitStage } from './previewMath';

// A jump in the preview's size bigger than this (a sheet opening or closing) glides to the new
// size; smaller steps (the timeline folding open, frame by frame) are already smooth.
const GLIDE_MIN_PX = 40;
const GLIDE_MS = 320;

// The preview glides from where it was drawn (`from`, a rect) to where it now is: put back over its
// old place with a transform, then let the transform go.
function glide(wrapper, from, to) {
  if (!to.width || !to.height) return;
  const s = from.width / to.width;
  wrapper.style.transition = 'none';
  wrapper.style.transformOrigin = '0 0';
  wrapper.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${s})`;
  void wrapper.offsetWidth;
  wrapper.style.transition = `transform ${GLIDE_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`;
  wrapper.style.transform = '';
}

// An element's place on screen as laid out, ignoring its own transform.
const layoutRect = (el, width, height) => {
  const parent = el.offsetParent;
  const base = parent ? parent.getBoundingClientRect() : { left: 0, top: 0 };
  return { left: base.left + el.offsetLeft, top: base.top + el.offsetTop, width, height };
};

const reducedMotion = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Sizes the Konva stage (and its wrapper, #stage-sink-wrapper) to the space around the preview at
// this aspect ratio, on window resizes and whenever that space changes size. It sets the stage
// directly rather than through React state, so resizing stays smooth; a big change (a sheet
// opening) glides there rather than jumping.
export function useStageFit(containerRef, stageRef, aspect) {
  useEffect(() => {
    // Where the preview was last laid out (with no glide applied), and its size.
    let drawn = null;
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
      const wrapper = document.getElementById('stage-sink-wrapper');
      const jump = drawn && Math.max(Math.abs(drawn.width - width), Math.abs(drawn.height - height)) >= GLIDE_MIN_PX;
      const from = jump && !reducedMotion() ? drawn.rect : null;
      if (stageRef.current) {
        stageRef.current.width(width);
        stageRef.current.height(height);
        stageRef.current.scale({ x: scale, y: scale });
      }
      if (wrapper) {
        wrapper.style.width = `${width}px`;
        wrapper.style.height = `${height}px`;
        // Its new place as laid out (a glide still running doesn't count); a jump glides there from
        // the old one, and a small step leaves any glide to finish.
        const to = layoutRect(wrapper, width, height);
        if (from) glide(wrapper, from, to);
        drawn = { width, height, rect: to };
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
