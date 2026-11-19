import { useEffect, useRef } from 'react';

// Calls onClose when Escape is pressed while `active`. With `yieldToModals`, a modal dialog open
// over it (aria-modal, such as a picker sheet) gets the Escape instead, so one press closes only
// what is on top.
export default function useEscape(active: boolean, onClose: () => void, { yieldToModals = false } = {}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (yieldToModals && document.querySelector('[aria-modal="true"]')) return;
      closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, yieldToModals]);
}
