import type { ComponentType } from 'react';

export interface StripItem {
  id: string;
  label: string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  title?: string;
}

interface ToolStripProps {
  items: StripItem[];
  active: string | null;
  onSelect: (id: string) => void;
  ariaLabel: string;
}

// A row of tool buttons above the dock, for the open dock section (Draw: Brush, Glow, Marker).
export default function ToolStrip({ items, active, onSelect, ariaLabel }: ToolStripProps) {
  return (
    <div className="ui-strip" role="toolbar" aria-label={ariaLabel}>
      {items.map(({ id, label, Icon, title }) => (
        <button
          key={id}
          type="button"
          className={`ui-strip-btn${active === id ? ' is-on' : ''}`}
          aria-pressed={active === id}
          title={title || label}
          onClick={() => onSelect(id)}
        >
          <Icon size={17} strokeWidth={2.1} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
