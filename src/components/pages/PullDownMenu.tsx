// An iOS pull-down menu (pages/iosLook.css): a button, and the menu it opens. The menu hangs from
// the button's right edge; near the bottom of the screen it opens upward, clear of the dock, and
// near the left edge it moves right, so it stays on the screen. Escape, a tap outside or picking
// an action closes it. Actions with `checked` set make it a pick-one menu, with a tick.
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './iosLook.css';

export interface MenuAction {
  id: string;
  label: string;
  title?: string;
  Icon?: LucideIcon;
  destructive?: boolean;
  // Set on every action of a pick-one menu: true on the picked one.
  checked?: boolean;
  run: () => void;
}

interface PullDownMenuProps {
  // The button's name, for screen readers.
  label: string;
  // The menu's name, when it differs from the button's.
  menuLabel?: string;
  actions: MenuAction[];
  // What the button shows.
  children: ReactNode;
  className?: string;
  buttonClassName?: string;
}

// The menu's width, and the gap it keeps from the screen's left edge.
const MENU_WIDTH = 208;
const MENU_EDGE = 12;

export default function PullDownMenu({ label, menuLabel, actions, children, className = '', buttonClassName = '' }: PullDownMenuProps) {
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const [shift, setShift] = useState(0);
  const menuId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pickOne = actions.some((a) => a.checked !== undefined);

  useLayoutEffect(() => {
    if (!open) return;
    const box = buttonRef.current?.getBoundingClientRect();
    if (!box) return;
    setUp(window.innerHeight - box.bottom < 250 && box.top > 250);
    setShift(Math.max(0, MENU_EDGE + MENU_WIDTH - box.right));
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    wrapRef.current?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus();
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open]);

  // Up and Down move through the actions, as in a menu.
  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const rows = [...e.currentTarget.querySelectorAll<HTMLElement>('[role^="menuitem"]')];
    const at = rows.indexOf(document.activeElement as HTMLElement);
    rows[(at + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length]?.focus();
  };

  return (
    <div className={`ios-menu-wrap ${open ? 'is-open' : ''} ${open && up ? 'is-up' : ''} ${className}`} ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`ios-menu-btn ${buttonClassName}`}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        {children}
      </button>
      {open && (
        <div
          id={menuId}
          className="ios-menu"
          role="menu"
          aria-label={menuLabel || label}
          style={{ width: MENU_WIDTH, right: -shift }}
          onKeyDown={onMenuKeyDown}
        >
          {actions.map(({ id, label: text, title, Icon, destructive, checked, run }) => (
            <button
              key={id}
              type="button"
              role={pickOne ? 'menuitemradio' : 'menuitem'}
              aria-checked={pickOne ? Boolean(checked) : undefined}
              title={title}
              className={`ios-menu-item ${destructive ? 'ios-menu-item--destructive' : ''}`}
              onClick={() => {
                setOpen(false);
                run();
              }}
            >
              {pickOne && (
                <span className="ios-menu-tick" aria-hidden="true">
                  {checked && <Check size={16} strokeWidth={2.6} />}
                </span>
              )}
              <span className="ios-menu-label">{text}</span>
              {Icon && <Icon size={17} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
