import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

interface TopBarProps {
  title: string;
  onBack: () => void;
  backLabel?: string;
  // The right-hand actions (history, export…).
  children?: ReactNode;
}

// Back button, centred title, actions on the right.
export default function TopBar({ title, onBack, backLabel = 'Back', children }: TopBarProps) {
  return (
    <header className="ui-topbar">
      <div>
        <button type="button" className="ui-icon-btn" onClick={onBack} aria-label={backLabel} title={backLabel}>
          <ChevronLeft size={20} strokeWidth={2.2} />
        </button>
      </div>
      <h1 className="ui-topbar-title">{title}</h1>
      <div className="ui-topbar-actions">{children}</div>
    </header>
  );
}
