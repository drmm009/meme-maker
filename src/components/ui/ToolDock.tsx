import type { LucideIcon } from 'lucide-react';

export interface DockItem {
  id: string;
  label: string;
  Icon: LucideIcon;
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
          <Icon size={20} strokeWidth={1.9} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
