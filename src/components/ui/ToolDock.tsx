import type { ComponentType } from 'react';

export interface DockItem {
  id: string;
  label: string;
  // A lucide icon, or any icon taking the same size/strokeWidth props.
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  title?: string;
}

interface ToolDockProps {
  items: DockItem[];
  active: string | null;
  onSelect: (id: string) => void;
  ariaLabel: string;
}

// The editor's bottom bar of sections; the open one is filled with the accent.
export default function ToolDock({ items, active, onSelect, ariaLabel }: ToolDockProps) {
  return (
    <nav className="ui-dock" aria-label={ariaLabel}>
      {items.map(({ id, label, Icon, title }) => (
        <button
          key={id}
          type="button"
          className={`ui-dock-item${active === id ? ' is-on' : ''}`}
          aria-pressed={active === id}
          title={title || label}
          onClick={() => onSelect(id)}
        >
          <Icon size={21} strokeWidth={2.1} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
