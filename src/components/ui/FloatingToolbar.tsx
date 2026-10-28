import type { CSSProperties, ReactNode, Ref } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface ToolbarItem {
  id: string;
  label: string;
  onClick: () => void;
  Icon?: LucideIcon;
  // Drawn instead of Icon (a colour dot, a font sample…).
  icon?: ReactNode;
  title?: string;
  active?: boolean;
  danger?: boolean;
}

interface FloatingToolbarProps {
  items: ToolbarItem[];
  // A pointer on the bar's top or bottom edge, x pixels from its left.
  tail?: { side: 'top' | 'bottom'; x: number } | null;
  ariaLabel: string;
  className?: string;
  style?: CSSProperties;
  toolbarRef?: Ref<HTMLDivElement>;
}

// A pill of icon-over-label tools that floats over the content (over a selected layer, say).
export default function FloatingToolbar({ items, ariaLabel, className = '', style, toolbarRef, tail }: FloatingToolbarProps) {
  return (
    <div ref={toolbarRef} className={`ui-float ${className}`} role="toolbar" aria-label={ariaLabel} style={style}>
      {items.map(({ id, label, onClick, Icon, icon, title, active, danger }) => (
        <button
          key={id}
          type="button"
          className={`ui-float-item${active ? ' is-on' : ''}${danger ? ' ui-float-item--danger' : ''}`}
          title={title || label}
          aria-pressed={active === undefined ? undefined : active}
          onClick={onClick}
        >
          {icon ?? (Icon ? <Icon size={22} strokeWidth={1.8} /> : null)}
          <span>{label}</span>
        </button>
      ))}
      {tail && <span className={`ui-float-tail ui-float-tail--${tail.side}`} style={{ left: tail.x }} aria-hidden="true" />}
    </div>
  );
}
