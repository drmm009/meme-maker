import { useRef } from 'react';
import type { PointerEvent, ReactNode } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SheetAction {
  label: string;
  onClick: () => void;
  Icon?: LucideIcon;
}

interface SheetProps {
  title: string;
  onClose: () => void;
  badge?: string;
  action?: SheetAction;
  className?: string;
  children: ReactNode;
}

const CLOSE_DRAG_PX = 70;

// A panel docked at the bottom of the editor (not a modal: the canvas above stays usable).
// Close it with the chevron, a tap on the handle, or by dragging the handle or header down.
export default function Sheet({ title, onClose, badge, action, className = '', children }: SheetProps) {
  const sheetRef = useRef<HTMLElement>(null);
  const drag = useRef<{ y: number; dy: number } | null>(null);
  const ActionIcon = action?.Icon || Plus;

  const onPointerDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('button:not(.ui-sheet-handle)')) return;
    drag.current = { y: e.clientY, dy: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!drag.current || !sheetRef.current) return;
    drag.current.dy = Math.max(0, e.clientY - drag.current.y);
    sheetRef.current.style.transform = `translateY(${drag.current.dy}px)`;
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (sheetRef.current) sheetRef.current.style.transform = '';
    if (d && d.dy > CLOSE_DRAG_PX) onClose();
  };
  const dragProps = { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp };

  return (
    <section ref={sheetRef} className={`ui-sheet ${className}`} role="dialog" aria-label={title}>
      <button type="button" className="ui-sheet-handle" aria-label={`Close ${title}`} onClick={onClose} {...dragProps} />
      <header className="ui-sheet-head" {...dragProps}>
        <h2 className="ui-sheet-title">{title}</h2>
        {badge && <span className="ui-badge">{badge}</span>}
        <div className="ui-sheet-head-end">
          {action && (
            <button type="button" className="ui-sheet-action" onClick={action.onClick}>
              {action.label}
              <span className="ui-sheet-action-icon"><ActionIcon size={16} strokeWidth={2.4} /></span>
            </button>
          )}
          <button type="button" className="ui-icon-btn ui-icon-btn--ghost" onClick={onClose} aria-label="Close" title="Close">
            <ChevronDown size={20} />
          </button>
        </div>
      </header>
      <div className="ui-sheet-body">{children}</div>
    </section>
  );
}
