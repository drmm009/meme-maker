import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

interface TopBarProps {
  title: ReactNode;
  // A short line under the title (where the work stands).
  subtitle?: ReactNode;
  onBack: () => void;
  backLabel?: string;
  // The right-hand actions (history, export…).
  children?: ReactNode;
}

// Back button, centred title (with an optional line under it), actions on the right.
export default function TopBar({ title, subtitle, onBack, backLabel = 'Back', children }: TopBarProps) {
  return (
    <header className="ui-topbar">
      <div>
        <button type="button" className="ui-icon-btn ui-topbar-back" onClick={onBack} aria-label={backLabel} title={backLabel}>
          <ChevronLeft size={22} strokeWidth={2.3} />
        </button>
      </div>
      {title ? (
        <div className="ui-topbar-heading">
          <h1 className="ui-topbar-title">{title}</h1>
          {subtitle && <p className="ui-topbar-subtitle" aria-live="polite">{subtitle}</p>}
        </div>
      ) : <div className="ui-topbar-spacer" />}
      <div className="ui-topbar-actions">{children}</div>
    </header>
  );
}
