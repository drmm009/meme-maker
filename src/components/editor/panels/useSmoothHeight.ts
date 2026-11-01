import { useEffect, useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';

const DURATION_MS = 300;
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

// Glides an element between heights instead of jumping: whenever its natural height changes (a sheet
// opens, closes or is swapped for another, or a sheet's content grows or shrinks), it is held at the
// old height and transitions to the new one, then goes back to auto. Changes from React are caught
// before paint by the layout effect, others by a ResizeObserver (also before paint). Off with reduced
// motion, and while `skip` (the full-height library sheets) or in tests.
export function useSmoothHeight(ref: RefObject<HTMLElement | null>, skip: boolean) {
  const last = useRef(0);
  const animating = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipRef = useRef(skip);
  skipRef.current = skip;

  const settle = (el: HTMLElement) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    animating.current = false;
    el.style.transition = '';
    el.style.height = '';
  };

  const run = () => {
    const el = ref.current;
    if (!el) return;
    const still = skipRef.current || typeof ResizeObserver === 'undefined'
      || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // Mid-glide, start from where it is now; otherwise from the last settled height.
    const from = animating.current ? el.getBoundingClientRect().height : last.current;
    el.style.transition = 'none';
    el.style.height = '';
    const to = el.getBoundingClientRect().height;
    // A full-height sheet is laid over the editor, so the panel doesn't glide out of it.
    last.current = skipRef.current ? 0 : to;
    if (still || !from || Math.abs(to - from) < 1) {
      settle(el);
      return;
    }
    el.style.height = `${from}px`;
    void el.offsetHeight;
    el.style.transition = `height ${DURATION_MS}ms ${EASE}`;
    el.style.height = `${to}px`;
    animating.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => settle(el), DURATION_MS + 30);
  };

  useLayoutEffect(run);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    // While gliding the height changes every frame; those are ours, so they're ignored.
    const observer = new ResizeObserver(() => { if (!animating.current) run(); });
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer.current) clearTimeout(timer.current);
    };
    // run reads only refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
}
