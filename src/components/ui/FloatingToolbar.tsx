import { Fragment } from 'react';
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
  // Shown as just its icon (the label is still read out), in a group after a divider: the actions
  // every layer shares (Copy, Layers, Delete) after the tools for this kind of layer.
  iconOnly?: boolean;
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

// A pill of icon-over-label tools that floats over the content (over a selected layer, say), then
// any icon-only ones after a thin divider. When there are more than fit (its max-width), the tools
// scroll sideways inside the pill.
export default function FloatingToolbar({ items, ariaLabel, className = '', style, toolbarRef, tail }: FloatingToolbarProps) {
  return (
    <div ref={toolbarRef} className={`ui-float ${className}`} role="toolbar" aria-label={ariaLabel} style={style}>
      <div className="ui-float-items">
        {items.map(({ id, label, onClick, Icon, icon, title, active, danger, iconOnly }, i) => (
          <Fragment key={id}>
            {iconOnly && i > 0 && !items[i - 1].iconOnly && <span className="ui-float-divider" aria-hidden="true" />}
            <button
              type="button"
              className={`ui-float-item${iconOnly ? ' ui-float-item--icon' : ''}${active ? ' is-on' : ''}${danger ? ' ui-float-item--danger' : ''}`}
              title={title || label}
              aria-pressed={active === undefined ? undefined : active}
              onClick={onClick}
            >
              {icon ?? (Icon ? <Icon size={iconOnly ? 20 : 19} strokeWidth={1.9} aria-hidden="true" /> : null)}
              <span className={iconOnly ? 'ui-visually-hidden' : 'ui-float-label'}>{label}</span>
            </button>
          </Fragment>
        ))}
      </div>
      {tail && <span className={`ui-float-tail ui-float-tail--${tail.side}`} style={{ left: tail.x }} aria-hidden="true" />}
    </div>
  );
}
