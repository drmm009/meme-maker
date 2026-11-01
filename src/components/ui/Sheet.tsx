import { useRef } from 'react';
import type { PointerEvent, ReactNode } from 'react';
import { Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SheetAction {
  label: string;
  onClick: () => void;
  Icon?: LucideIcon | null;
  disabled?: boolean;
  variant?: 'primary' | 'plain';
}

interface SheetProps {
  title: string;
  onClose: () => void;
  badge?: string;
  action?: SheetAction;
  className?: string;
  // For a sheet opened from a strip button, which already says what's open: no heading (the title
  // stays as the sheet's accessible name), only the action if there is one.
  hideTitle?: boolean;
  children: ReactNode;
}

const CLOSE_DRAG_PX = 70;

// A panel docked at the bottom of the editor (not a modal: the canvas above stays usable).
// Close it with a tap on the handle, or by dragging the handle or header down.
export default function Sheet({ title, onClose, badge, action, className = '', hideTitle = false, children }: SheetProps) {
  const sheetRef = useRef<HTMLElement>(null);
  const drag = useRef<{ y: number; dy: number } | null>(null);
  const isClosingRef = useRef(false);
  const hasIcon = Boolean(action && action.Icon !== null && action.variant !== 'plain');
  const ActionIcon = action?.Icon || Plus;

  const isTest = typeof navigator !== 'undefined' && (navigator.userAgent.includes('jsdom') || navigator.userAgent.includes('Node.js'));

  const triggerClose = () => {
    if (isClosingRef.current) return;
    if (isTest || !sheetRef.current) {
      onClose();
      return;
    }
    isClosingRef.current = true;
    const el = sheetRef.current;
    el.style.transition = 'transform 0.24s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.22s ease';
    el.style.transform = 'translateY(100%)';
    el.style.opacity = '0';
    setTimeout(() => {
      onClose();
    }, 220);
  };

  const onPointerDown = (e: PointerEvent) => {
    if (isClosingRef.current) return;
    if ((e.target as HTMLElement).closest('button:not(.ui-sheet-handle)')) return;
    drag.current = { y: e.clientY, dy: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!drag.current || !sheetRef.current || isClosingRef.current) return;
    drag.current.dy = Math.max(0, e.clientY - drag.current.y);
    sheetRef.current.style.transform = `translateY(${drag.current.dy}px)`;
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!sheetRef.current || isClosingRef.current) return;
    if (d && d.dy > CLOSE_DRAG_PX) {
      triggerClose();
    } else if (d && d.dy > 0) {
      const el = sheetRef.current;
      el.style.transition = 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.transform = 'translateY(0)';
      const onEnd = () => {
        el.removeEventListener('transitionend', onEnd);
        if (!isClosingRef.current) {
          el.style.transition = '';
          el.style.transform = '';
        }
      };
      el.addEventListener('transitionend', onEnd);
    } else {
      sheetRef.current.style.transform = '';
    }
  };

  const dragProps = { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp };

  return (
    <section ref={sheetRef} className={`ui-sheet ${className}`} role="dialog" aria-label={title}>
      <button type="button" className="ui-sheet-handle" aria-label={`Close ${title}`} onClick={triggerClose} {...dragProps} />
      {(!hideTitle || action) && (
        <header className={`ui-sheet-head${hideTitle ? ' ui-sheet-head--bare' : ''}`} {...dragProps}>
          {!hideTitle && <h2 className="ui-sheet-title">{title}</h2>}
          {!hideTitle && badge && <span className="ui-badge">{badge}</span>}
          <div className="ui-sheet-head-end">
            {action && (
              <button
                type="button"
                className={`ui-sheet-action${action.variant ? ` ui-sheet-action--${action.variant}` : ''}`}
                disabled={action.disabled}
                onClick={action.onClick}
              >
                {action.label}
                {hasIcon && (
                  <span className="ui-sheet-action-icon"><ActionIcon size={18} strokeWidth={2.2} /></span>
                )}
              </button>
            )}
          </div>
        </header>
      )}
      <div className="ui-sheet-body">{children}</div>
    </section>
  );
}
