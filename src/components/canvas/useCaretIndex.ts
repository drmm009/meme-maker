import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

// Where the cursor is in the hidden text box a text layer is typed into (both editors draw the
// text on the canvas and hide the box), while `active`: its index, or null. Follows typing, the
// arrow keys and the phone's own cursor moves (selectionchange). With letters selected, the end of
// the selection.
export function useCaretIndex(ref: RefObject<HTMLTextAreaElement | HTMLInputElement | null>, active: boolean): number | null {
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!active || !el) {
      setIndex(null);
      return undefined;
    }
    let timer: ReturnType<typeof setTimeout> | null = null;
    const read = () => {
      timer = null;
      const at = el.selectionEnd ?? el.selectionStart;
      setIndex(document.activeElement === el && typeof at === 'number' ? at : null);
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

  return index;
}
