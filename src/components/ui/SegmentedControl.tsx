export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  title?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  // 'floating' sits over content (glass); 'fill' stretches its segments across the row; 'divided'
  // is a compact pill with a rule between the options.
  variant?: 'floating' | 'fill' | 'divided' | 'plain';
}

// One choice out of a few, as a pill of segments.
export default function SegmentedControl<T extends string>({ options, value, onChange, ariaLabel, variant = 'plain' }: SegmentedControlProps<T>) {
  return (
    <div className={`ui-seg${variant === 'plain' ? '' : ` ui-seg--${variant}`}`} role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          title={o.title}
          className={`ui-seg-btn${o.value === value ? ' is-on' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
