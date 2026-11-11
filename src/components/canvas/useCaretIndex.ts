import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

// The letters selected in a text box: start and end indexes (equal when it's just a cursor).
export interface TextSelection {
  start: number;
  end: number;
}

// Where the cursor is in the hidden text box a text layer is typed into (both editors draw the
// text on the canvas and hide the box), while `active`: the selection, or null when the box isn't
// focused. Follows typing, the arrow keys and the phone's own cursor moves (selectionchange).
export function useTextSelection(ref: RefObject<HTMLTextAreaElement | HTMLInputElement | null>, active: boolean): TextSelection | null {
  const [selection, setSelection] = useState<TextSelection | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!active || !el) {
      setSelection(null);
      return undefined;
    }
    let timer: ReturnType<typeof setTimeout> | null = null;
    const read = () => {
      timer = null;
      const { selectionStart: start, selectionEnd: end } = el;
      const next = document.activeElement === el && typeof start === 'number' ? { start, end: end ?? start } : null;
      setSelection((was) => (was && next && was.start === next.start && was.end === next.end ? was : next));
    };
    // Read just after, never inside the box's own events: a state change there would redraw a
    // controlled box with its old text before React's onChange sees the new letter, losing it.
    const later = () => {
      if (!timer) timer = setTimeout(read, 0);
    };
    read();
    const events = ['input', 'keyup', 'select', 'focus', 'blur', 'click'];
    events.forEach((type) => el.addEventListener(type, later));
    document.addEventListener('selectionchange', later);
    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((type) => el.removeEventListener(type, later));
      document.removeEventListener('selectionchange', later);
    };
  }, [ref, active]);

  return selection;
}

// Just the cursor: with letters selected, the end of the selection.
export function useCaretIndex(ref: RefObject<HTMLTextAreaElement | HTMLInputElement | null>, active: boolean): number | null {
  return useTextSelection(ref, active)?.end ?? null;
}

// Puts the cursor (or a selection) in the box a little after the current event, so it wins over
// the browser's own placement from the same tap, and tells the listeners above.
export function placeSelection(el: HTMLTextAreaElement | HTMLInputElement | null, start: number, end = start): void {
  if (!el) return;
  setTimeout(() => {
    if (document.activeElement !== el) el.focus({ preventScroll: true });
    const max = el.value.length;
    el.setSelectionRange(Math.min(start, max), Math.min(end, max));
    el.dispatchEvent(new Event('select'));
  }, 0);
}
