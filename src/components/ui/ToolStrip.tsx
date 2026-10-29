import type { ChangeEvent, ComponentType, ReactNode } from 'react';

export interface StripItem {
  id: string;
  label: string;
  Icon?: ComponentType<{ size?: number; strokeWidth?: number }>;
  // Drawn instead of Icon (a colour swatch, say).
  icon?: ReactNode;
  title?: string;
  // On/off tools say themselves whether they are on; otherwise the strip's `active` id is.
  active?: boolean;
  // Makes the button a file picker (onSelect isn't called).
  accept?: string;
  onFile?: (e: ChangeEvent<HTMLInputElement>) => void;
}

interface ToolStripProps {
  items: StripItem[];
  active?: string | null;
  onSelect: (id: string) => void;
  ariaLabel: string;
  // 'stacked' puts each label under its icon, so five tools fit across a phone.
  layout?: 'row' | 'stacked';
}

// A row of tool buttons above the dock, for the open dock section (Draw: Brush, Glow, Marker;
// Canvas: Color, Watermark, Mirror, Header, Footer).
export default function ToolStrip({ items, active = null, onSelect, ariaLabel, layout = 'row' }: ToolStripProps) {
  return (
    <div className={`ui-strip${layout === 'stacked' ? ' ui-strip--stacked' : ''}`} role="toolbar" aria-label={ariaLabel}>
      {items.map(({ id, label, Icon, icon, title, active: on, accept, onFile }) => {
        const pressed = on ?? active === id;
        const body = (
          <>
            {icon ?? (Icon ? <Icon size={layout === 'stacked' ? 19 : 17} strokeWidth={2.1} /> : null)}
            <span>{label}</span>
          </>
        );
        if (onFile) {
          return (
            <label key={id} className="ui-strip-btn" title={title || label}>
              {body}
              <input
                type="file"
                accept={accept}
                aria-label={label}
                hidden
                onChange={(e) => {
                  onFile(e);
                  e.target.value = '';
                }}
              />
            </label>
          );
        }
        return (
          <button
            key={id}
            type="button"
            className={`ui-strip-btn${pressed ? ' is-on' : ''}`}
            aria-pressed={pressed}
            title={title || label}
            onClick={() => onSelect(id)}
          >
            {body}
          </button>
        );
      })}
    </div>
  );
}
