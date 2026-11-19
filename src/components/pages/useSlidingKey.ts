// The black key behind the picked tab of a row (the segmented control, Explore's chips, Choose Canvas
// Layout's shape picker): it slides
// to the tab picked, and each time the row comes into view (the page opens, or a kept page is shown
// again) it grows out from the picked tab's left edge. The row sets --ios-key-x and --ios-key-w on
// itself; its key element reads them (pages/iosLook.css: .ios-key-entering, the class for the
// entrance, moves only the width).
import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';

const ENTRANCE_MS = 420;

// `picked` finds the picked tab in the row (a radio group's is aria-checked).
export default function useSlidingKey(trackRef: RefObject<HTMLElement | null>, watch: string, picked = '[aria-selected="true"]') {
  // True while the row is out of view (not yet shown, or inside a hidden page): its next placement is an entrance.
  const hidden = useRef(true);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    let entranceTimer = 0;
    let entranceFrame = 0;

    const place = () => {
      const on = track.querySelector<HTMLElement>(picked);
      if (!on || track.offsetWidth === 0) {
        // Out of view: fold the key away, so showing the row again never flashes the old one.
        hidden.current = true;
        track.style.setProperty('--ios-key-w', '0px');
        return;
      }
      if (hidden.current) {
        hidden.current = false;
        // Start at the picked tab, no width, without sliding there; then grow to its width. The
        // growing waits two frames: a row that was inside a display:none page only a moment ago
        // has no style yet to transition from, so a change in the same frame would just jump.
        track.classList.add('ios-key-entering');
        track.style.setProperty('--ios-key-x', `${on.offsetLeft}px`);
        track.style.setProperty('--ios-key-w', '0px');
        window.cancelAnimationFrame(entranceFrame);
        window.clearTimeout(entranceTimer);
        entranceFrame = window.requestAnimationFrame(() => {
          entranceFrame = window.requestAnimationFrame(() => {
            const now = track.querySelector<HTMLElement>(picked);
            track.style.setProperty('--ios-key-x', `${(now || on).offsetLeft}px`);
            track.style.setProperty('--ios-key-w', `${(now || on).offsetWidth}px`);
            entranceTimer = window.setTimeout(() => track.classList.remove('ios-key-entering'), ENTRANCE_MS);
          });
        });
        return;
      }
      track.style.setProperty('--ios-key-x', `${on.offsetLeft}px`);
      track.style.setProperty('--ios-key-w', `${on.offsetWidth}px`);
    };

    // Also ends an entrance cut short (a tab picked mid-way), so the key slides again after.
    const stop = () => {
      window.cancelAnimationFrame(entranceFrame);
      window.clearTimeout(entranceTimer);
      track.classList.remove('ios-key-entering');
    };
    place();
    if (typeof ResizeObserver === 'undefined') return stop;
    const observer = new ResizeObserver(place);
    observer.observe(track);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [trackRef, watch, picked]);
}
