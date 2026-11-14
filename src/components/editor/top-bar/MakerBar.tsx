// A maker's top section, as drawn (MakerTopBar gives it the image editor's makers' state; the GIF
// maker its own), in the Sticker Studio's look: a glass Back button, then centred a glowing tagline
// pill in the maker's colour over the title, the right-hand controls, and under them (for makers
// that have steps) a three-step track, the step the work is on lit orange and the ones done ticked.
// Where it stands is also said in words for screen readers. The page behind it carries the glow
// (`maker-glow`, with `--maker-tone`).
import { Check, ChevronLeft } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import './makerTopBar.css';

export interface MakerBarProps {
  /** The maker's name, the last words of the heading. */
  title: string;
  /** Words before the name in the heading ("Create an " + "AI Meme"). */
  lead?: string;
  /** The small glowing pill over the heading. */
  tagline?: string;
  Icon: LucideIcon;
  tone: string;
  /** Empty for a maker without steps: no track is drawn. */
  steps: string[];
  step: number;
  status: string;
  onBack: () => void;
  children?: ReactNode;
}

export default function MakerBar({ title, lead, tagline, Icon, tone, steps, step, status, onBack, children }: MakerBarProps) {
  return (
    <header className="mtb" style={{ '--mtb-tone': tone } as CSSProperties}>
      <div className="mtb-row">
        <button type="button" className="mtb-round mtb-back" onClick={onBack} aria-label="Back" title="Back">
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>
        <div className="mtb-main">
          {tagline && (
            <span className="mtb-tagline">
              <Icon size={10} strokeWidth={2.4} className="mtb-tagline-icon" aria-hidden="true" />
              <span>{tagline}</span>
            </span>
          )}
          <h1 className="mtb-title ui-topbar-title">
            {lead && <span>{lead}</span>}
            <span>{title}</span>
          </h1>
        </div>
        <div className="mtb-end">{children}</div>
      </div>

      {steps.length > 0 && (
        <ol className="mtb-steps" aria-hidden="true">
          {steps.map((label, i) => (
            <li key={label} className={`mtb-step${i < step ? ' is-done' : ''}${i === step ? ' is-now' : ''}`}>
              <span className="mtb-dot">{i < step ? <Check size={11} strokeWidth={3.2} /> : i + 1}</span>
              {label}
            </li>
          ))}
        </ol>
      )}
      <p className="mtb-status ui-topbar-subtitle" aria-live="polite">{status}</p>
    </header>
  );
}
