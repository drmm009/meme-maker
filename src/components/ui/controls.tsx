// Small form controls for sheets: sections, label rows, chips, toggles, swatches, sliders,
// switches and tiles.
import type { ChangeEvent, CSSProperties, ReactNode } from 'react';
import { Pipette } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export function Section({ title, aside, id, rule, children }: { title?: string; aside?: ReactNode; id?: string; rule?: boolean; children: ReactNode }) {
  return (
    <div className={`ui-section${rule ? ' ui-section--rule' : ''}`} id={id} data-section={id}>
      {(title || aside) && (
        <div className="ui-section-head">
          {title && <h3 className="ui-section-title">{title}</h3>}
          {aside && <div className="ui-section-aside">{aside}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

// A label on the left and its control on the right.
export function Row({ label, end, children }: { label: string; end?: boolean; children: ReactNode }) {
  return (
    <div className="ui-row">
      <span className="ui-row-label">{label}</span>
      <div className={`ui-row-control${end ? ' ui-row-control--end' : ''}`}>{children}</div>
    </div>
  );
}

export function ChipRow({ ariaLabel, children }: { ariaLabel?: string; children: ReactNode }) {
  return <div className="ui-chips" role="group" aria-label={ariaLabel}>{children}</div>;
}

interface ChipProps {
  label: ReactNode;
  onClick: () => void;
  active?: boolean;
  Icon?: LucideIcon;
  title?: string;
}

export function Chip({ label, onClick, active, Icon, title }: ChipProps) {
  return (
    <button type="button" className={`ui-chip${active ? ' is-on' : ''}`} aria-pressed={active ?? undefined} title={title} onClick={onClick}>
      {Icon && <Icon size={15} />}
      <span>{label}</span>
    </button>
  );
}

interface ToggleProps {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: ReactNode;
  // 'tile' is a filled square (font samples); the default is borderless (B / I / U).
  variant?: 'tile' | 'plain';
  style?: CSSProperties;
}

export function Toggle({ label, onClick, active = false, children, variant = 'plain', style }: ToggleProps) {
  return (
    <button
      type="button"
      className={`ui-toggle${variant === 'tile' ? ' ui-toggle--tile' : ''}${active ? ' is-on' : ''}`}
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={onClick}
      style={style}
    >
      {children}
    </button>
  );
}

interface SwatchRowProps {
  colors: string[];
  value: string | null | undefined;
  onChange: (color: string) => void;
  ariaLabel: string;
  // Adds a colour wheel that opens the system picker.
  custom?: boolean;
  // Wraps onto more lines instead of scrolling sideways.
  wrap?: boolean;
}

const sameColor = (a?: string | null, b?: string | null) => (a || '').toLowerCase() === (b || '').toLowerCase();

export function SwatchRow({ colors, value, onChange, ariaLabel, custom = true, wrap = false }: SwatchRowProps) {
  const isCustom = Boolean(value) && value !== 'transparent' && !colors.some((c) => sameColor(c, value));
  return (
    <div className={`ui-swatches${wrap ? ' ui-swatches--wrap' : ''}`} role="radiogroup" aria-label={ariaLabel}>
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={sameColor(c, value)}
          aria-label={c === 'transparent' ? 'None' : c}
          title={c === 'transparent' ? 'None' : c}
          className={`ui-swatch${c === 'transparent' ? ' ui-swatch--none' : ''}${sameColor(c, value) ? ' is-on' : ''}`}
          style={c === 'transparent' ? undefined : ({ background: c, '--swatch': c } as CSSProperties)}
          onClick={() => onChange(c)}
        />
      ))}
      {custom && (
        <label className={`ui-swatch ui-swatch--custom${isCustom ? ' is-on' : ''}`} title="Custom colour" aria-label="Custom colour">
          <Pipette size={15} strokeWidth={2.2} />
          <input type="color" value={isCustom && value?.startsWith('#') && value.length === 7 ? value : '#ff5a36'} onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} />
        </label>
      )}
    </div>
  );
}

interface SliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  StartIcon?: LucideIcon;
  EndIcon?: LucideIcon;
  format?: (value: number) => string;
}

// A range input whose filled part shows the value.
export function Slider({ label, min, max, step = 1, value, onChange, StartIcon, EndIcon, format }: SliderProps) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <div className="ui-slider-wrap">
      {StartIcon && <StartIcon size={16} aria-hidden="true" />}
      <input
        type="range"
        className="ui-slider"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--pct': `${Math.max(0, Math.min(100, pct))}%` } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {EndIcon && <EndIcon size={18} aria-hidden="true" />}
      {format && <span className="ui-slider-value">{format(value)}</span>}
    </div>
  );
}

export function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} title={label} className="ui-switch" onClick={() => onChange(!checked)} />;
}

export function TileGrid({ columns = 3, children }: { columns?: 2 | 3 | 4; children: ReactNode }) {
  return <div className={`ui-tiles${columns === 3 ? '' : ` ui-tiles--${columns}`}`}>{children}</div>;
}

interface TileProps {
  label: ReactNode;
  Icon?: LucideIcon;
  icon?: ReactNode;
  sub?: ReactNode;
  title?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  // Makes the tile a file picker.
  accept?: string;
  onFile?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function Tile({ label, Icon, icon, sub, title, active, disabled, onClick, accept, onFile }: TileProps) {
  const body = (
    <>
      <span className="ui-tile-icon">{icon ?? (Icon ? <Icon size={22} strokeWidth={1.8} /> : null)}</span>
      <span>{label}</span>
      {sub && <span className="ui-tile-sub">{sub}</span>}
    </>
  );
  if (onFile) {
    return (
      <label className={`ui-tile${active ? ' is-on' : ''}`} title={title}>
        {body}
        <input
          type="file"
          accept={accept}
          onChange={(e) => {
            onFile(e);
            e.target.value = '';
          }}
        />
      </label>
    );
  }
  return (
    <button type="button" className={`ui-tile${active ? ' is-on' : ''}`} title={title} aria-pressed={active ?? undefined} disabled={disabled} onClick={onClick}>
      {body}
    </button>
  );
}
