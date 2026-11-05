import { useLayoutEffect, useRef } from 'react';
import type { ComponentType, PointerEvent, ReactNode } from 'react';
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
  // Drawn beside the heading, in a soft orange circle.
  Icon?: ComponentType<{ size?: number; strokeWidth?: number }>;
  onClose: () => void;
  badge?: string;
  action?: SheetAction;
  className?: string;
  // For a sheet opened from a strip button, which already says what's open: no heading (the title
  // stays as the sheet's accessible name), only the action if there is one.
  hideTitle?: boolean;
  // Something small at the end of the header, before the action: the sheet's on/off switch.
  aside?: ReactNode;
  ariaLabel?: string;
  children: ReactNode;
}

const CLOSE_DRAG_PX = 70;
const GHOST_MS = 300;

// A sheet leaves a copy of itself as it goes, so it never just vanishes. In a host marked
// data-sheet-ghosts (the editor's bottom panel, which glides to its new height) the copy stays where
// the sheet was, behind what replaces it, fading, and sinks with the panel. Anywhere else (the
// full-height library sheets) it is laid over the same spot and slides down out of view.
// The host may change its classes as the sheet goes (the editor's panel stops being a sheet panel), and
// a full-height sheet's copy leaves the host altogether, so the copy sits in a box-less wrapper with the
// host's classes as they were, keeping its styles (the library sheets' glass among them).
function leaveGhost(el: HTMLElement) {
  const host = el.parentElement;
  const glide = Boolean(host?.hasAttribute('data-sheet-ghosts'));
  const parent = glide ? host : (host?.offsetParent as HTMLElement | null);
  if (!parent) return null;
  const ghost = el.cloneNode(true) as HTMLElement;
  ghost.className = `${el.className} ui-sheet-ghost${glide ? '' : ' ui-sheet-ghost--drop'}`;
  ghost.removeAttribute('role');
  ghost.setAttribute('aria-hidden', 'true');
  ghost.inert = true;
  if (glide) {
    Object.assign(ghost.style, { top: `${el.offsetTop}px`, height: `${el.offsetHeight}px` });
  } else {
    const at = el.getBoundingClientRect();
    const base = parent.getBoundingClientRect();
    // Its place already counts a drag down in progress, so the copy drops the drag's offset.
    Object.assign(ghost.style, { top: `${at.top - base.top}px`, left: `${at.left - base.left}px`, width: `${at.width}px`, height: `${at.height}px`, transform: '', transition: '' });
  }
  let holder: HTMLElement = ghost;
  if (host?.className) {
    holder = document.createElement('div');
    holder.className = host.className;
    holder.style.display = 'contents';
    holder.setAttribute('aria-hidden', 'true');
    holder.appendChild(ghost);
  }
  // A dim the sheet sits on (a sibling marked data-sheet-dim) fades out behind the dropping copy.
  const dim = glide ? null : host?.querySelector<HTMLElement>(':scope > [data-sheet-dim]');
  if (dim && holder !== ghost) {
    const at = dim.getBoundingClientRect();
    const base = parent.getBoundingClientRect();
    const copy = dim.cloneNode() as HTMLElement;
    copy.className = `${dim.className} ui-sheet-dim-ghost`;
    Object.assign(copy.style, { inset: 'auto', top: `${at.top - base.top}px`, left: `${at.left - base.left}px`, width: `${at.width}px`, height: `${at.height}px` });
    holder.insertBefore(copy, ghost);
  }
  parent.appendChild(holder);
  // A copy starts at the top of anything scrolled; put it back where the sheet was scrolled to.
  const from = el.querySelectorAll('*');
  const to = ghost.querySelectorAll('*');
  from.forEach((node, i) => {
    if (node.scrollTop || node.scrollLeft) to[i]?.scrollTo(node.scrollLeft, node.scrollTop);
  });
  setTimeout(() => holder.remove(), GHOST_MS + 50);
  return holder;
}

// What a drag down can start on: the handle, the header, or a row the sheet marks data-sheet-drag
// (a sheet drawing its own title row, like the library sheets). Never a control in them.
const DRAG_FROM = '.ui-sheet-handle, .ui-sheet-head, [data-sheet-drag]';
const NOT_DRAG = 'button:not(.ui-sheet-handle), input, textarea, select, a';

// A panel docked at the bottom of the editor (not a modal: the canvas above stays usable).
// Close it with a tap on the handle, or by dragging the handle, header or a data-sheet-drag row down.
export default function Sheet({ title, Icon, onClose, badge, action, className = '', hideTitle = false, aside, ariaLabel, children }: SheetProps) {
  const sheetRef = useRef<HTMLElement>(null);
  const drag = useRef<{ y: number; dy: number } | null>(null);
  const isClosingRef = useRef(false);
  const ghostRef = useRef<HTMLElement | null>(null);
  const hasIcon = Boolean(action && action.Icon !== null && action.variant !== 'plain');
  // A plain action shows its icon only when given one, small and before the label.
  const PlainIcon = action?.variant === 'plain' ? action.Icon : null;
  const ActionIcon = action?.Icon || Plus;

  const isTest = typeof navigator !== 'undefined' && (navigator.userAgent.includes('jsdom') || navigator.userAgent.includes('Node.js'));

  // Runs while the sheet is still in the page, just before React removes it. (StrictMode's practice
  // unmount leaves a ghost too; the remount takes it away.)
  useLayoutEffect(() => {
    ghostRef.current?.remove();
    const el = sheetRef.current;
    return () => {
      if (!isTest && el?.isConnected) ghostRef.current = leaveGhost(el);
    };
  }, [isTest]);

  // The copy left on unmount does the going (see leaveGhost).
  const triggerClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    onClose();
  };

  const onPointerDown = (e: PointerEvent) => {
    if (isClosingRef.current) return;
    const target = e.target as HTMLElement;
    if (!target.closest(DRAG_FROM) || target.closest(NOT_DRAG)) return;
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
    if (!d || !sheetRef.current || isClosingRef.current) return;
    if (d.dy > CLOSE_DRAG_PX) {
      triggerClose();
    } else if (d.dy > 0) {
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

  return (
    <section
      ref={sheetRef}
      className={`ui-sheet ${className}`}
      role="dialog"
      aria-label={ariaLabel || title}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <button type="button" className="ui-sheet-handle" aria-label={`Close ${title}`} onClick={triggerClose} />
      {(!hideTitle || action || aside) && (
        <header className={`ui-sheet-head${hideTitle ? ' ui-sheet-head--bare' : ''}`}>
          {!hideTitle && Icon && <span className="ui-sheet-title-icon" aria-hidden="true"><Icon size={17} strokeWidth={2.2} /></span>}
          {!hideTitle && <h2 className="ui-sheet-title">{title}</h2>}
          {!hideTitle && badge && <span className="ui-badge">{badge}</span>}
          <div className="ui-sheet-head-end">
            {aside}
            {action && (
              <button
                type="button"
                className={`ui-sheet-action${action.variant ? ` ui-sheet-action--${action.variant}` : ''}`}
                disabled={action.disabled}
                onClick={action.onClick}
              >
                {PlainIcon && <PlainIcon size={14} strokeWidth={2.2} aria-hidden="true" />}
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
