import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { safeGet, safeSet } from '../../../utils/storage';
import { BUBBLE_W, placeBubble } from './tourPlacement';
import type { Rect } from './tourPlacement';

export const TOUR_KEY = 'meme-maker-editor-tour-v1';

interface TourStep {
  // The element the step points at.
  target: string;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    target: '.ui-dock',
    title: 'Your tools live here',
    body: 'Draw, Media, Text, AI/Filters and Canvas. Tap one and its tools appear just above; some open settings below.',
  },
  {
    target: '.meme-canvas',
    title: 'Tap anything on the meme',
    body: 'Select text, a sticker or a photo to get its quick tools floating above it. Drag to move; use the corner handles to resize or rotate.',
  },
  {
    target: '.ie-aspect-bar > :first-child',
    title: 'Pick the shape',
    body: 'Square for posts, 9:16 for stories, or keep the original picture.',
  },
  {
    target: '.ui-topbar .ui-btn-accent',
    title: 'Share it',
    body: 'Export saves, shares or copies your meme as PNG, JPG or WebP, in the size you want.',
  },
];

// The first time the editor opens: a few steps, each highlighting part of the screen with a short
// explanation. Finishing or skipping it is remembered (TOUR_KEY), so it shows once.
export default function FirstRunTour() {
  const [step, setStep] = useState(() => (safeGet(TOUR_KEY, null) ? -1 : 0));
  const [rect, setRect] = useState<Rect | null>(null);

  const done = () => {
    safeSet(TOUR_KEY, 'done');
    setStep(-1);
  };

  // The editor slides in and its panels change size, so the target is measured again every so
  // often while the tour is open rather than once.
  useLayoutEffect(() => {
    if (step < 0) return undefined;
    const measure = () => {
      const r = document.querySelector(STEPS[step].target)?.getBoundingClientRect();
      const next = r && r.width > 0 ? { left: r.left, top: r.top, width: r.width, height: r.height } : null;
      setRect((prev) => (prev && next && prev.left === next.left && prev.top === next.top && prev.width === next.width && prev.height === next.height ? prev : next));
    };
    measure();
    const timer = window.setInterval(measure, 250);
    window.addEventListener('resize', measure);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('resize', measure);
    };
  }, [step]);

  if (step < 0) return null;
  const s = STEPS[step];
  const last = step === STEPS.length - 1;
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const bubble = rect ? placeBubble(rect, viewport) : { left: 12, width: Math.min(BUBBLE_W, viewport.width - 24), top: viewport.height / 3, bottom: undefined };

  // In document.body: the editor's container is transformed while it animates in, which would
  // make position: fixed follow it instead of the screen.
  return createPortal(
    <div className="ie-tour ui-theme" role="dialog" aria-label="Editor tour" aria-modal="true">
      {rect ? (
        <div className="ie-tour-spot" style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 }} />
      ) : (
        <div className="ie-tour-dim" />
      )}
      <div className="ie-tour-bubble" style={{ left: bubble.left, width: bubble.width, top: bubble.top, bottom: bubble.bottom }}>
        <p className="ie-tour-step">{step + 1} of {STEPS.length}</p>
        <h2 className="ie-tour-title">{s.title}</h2>
        <p className="ie-tour-body">{s.body}</p>
        <div className="ie-tour-actions">
          {!last && <button type="button" className="ie-tour-skip" onClick={done}>Skip</button>}
          <button type="button" className="ui-btn-accent" onClick={() => (last ? done() : setStep(step + 1))}>{last ? 'Got it' : 'Next'}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
