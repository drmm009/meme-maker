// A maker's top bar, as drawn (MakerTopBar gives it the image editor's makers' state; the GIF maker
// its own): Back, the title on a tile in the maker's colour, the right-hand controls, and under them
// a three-step track, the step the work is on lit orange and the ones done ticked. Where it stands is
// also said in words for screen readers.
import { Check, ChevronLeft } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import './makerTopBar.css';

export interface MakerBarProps {
  title: string;
  Icon: LucideIcon;
  tone: string;
  steps: string[];
  step: number;
  status: string;
  onBack: () => void;
  children?: ReactNode;
}

export default function MakerBar({ title, Icon, tone, steps, step, status, onBack, children }: MakerBarProps) {
  return (
    <header className="mtb" style={{ '--mtb-tone': tone } as CSSProperties}>
      <div className="mtb-row">
        <button type="button" className="mtb-round" onClick={onBack} aria-label="Back" title="Back">
          <ChevronLeft size={22} strokeWidth={2.3} />
        </button>
        <h1 className="mtb-title ui-topbar-title">
          <span className="mtb-tile" aria-hidden="true"><Icon size={15} strokeWidth={2.4} /></span>
          <span>{title}</span>
        </h1>
        <div className="mtb-end">{children}</div>
      </div>

      <ol className="mtb-steps" aria-hidden="true">
        {steps.map((label, i) => (
          <li key={label} className={`mtb-step${i < step ? ' is-done' : ''}${i === step ? ' is-now' : ''}`}>
            <span className="mtb-dot">{i < step ? <Check size={11} strokeWidth={3.2} /> : i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <p className="mtb-status ui-topbar-subtitle" aria-live="polite">{status}</p>
    </header>
  );
}
