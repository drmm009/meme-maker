import { useRef } from 'react';
import type { ChangeEvent, ComponentType, SyntheticEvent } from 'react';
import { Plus } from 'lucide-react';
import './canvasStartPrompt.css';

export interface StartAction {
  id: string;
  label: string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean | 'true' }>;
  onPick?: () => void;
  /** A file picker instead of onPick. */
  accept?: string;
  onFile?: (e: ChangeEvent<HTMLInputElement>) => void;
}

interface CanvasStartPromptProps {
  /** The group's name, for screen readers. */
  title: string;
  primary: StartAction;
  hint?: string;
  secondary: StartAction[];
  /** Ink for the canvas colour under it (see src/utils/inkFor.ts). */
  ink: 'dark' | 'light';
}

// Keeps taps on the prompt's buttons from reaching the canvas under it (selecting, dragging).
const stop = (e: SyntheticEvent) => e.stopPropagation();

function StartButton({ action, className, children }: { action: StartAction; className: string; children: React.ReactNode }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className={className} onClick={() => (action.onFile ? input.current?.click() : action.onPick?.())}>
        {children}
      </button>
      {action.onFile && (
        <input
          ref={input}
          type="file"
          accept={action.accept}
          hidden
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            action.onFile?.(e);
            e.target.value = '';
          }}
        />
      )}
    </>
  );
}

// An empty canvas's first step, laid inside the canvas box (its parent): one big add button, a
// hint, and pills for the other ways to start. Only the buttons take taps.
export default function CanvasStartPrompt({ title, primary, hint, secondary, ink }: CanvasStartPromptProps) {
  const { Icon } = primary;
  return (
    <div className={`ui-start is-ink-${ink}`} role="group" aria-label={title}>
      <div className="ui-start-zone">
        <div className="ui-start-body" onPointerDown={stop} onMouseDown={stop} onTouchStart={stop}>
          <StartButton action={primary} className="ui-start-primary">
            <span className="ui-start-plus" aria-hidden="true">
              <Icon size={24} strokeWidth={2.2} aria-hidden="true" />
              <span className="ui-start-plus-badge"><Plus size={12} strokeWidth={3.2} /></span>
            </span>
            <span className="ui-start-label">{primary.label}</span>
          </StartButton>
          {hint && <p className="ui-start-hint">{hint}</p>}
          <div className="ui-start-pills">
            {secondary.map((a) => (
              <StartButton key={a.id} action={a} className="ui-start-pill">
                <a.Icon size={16} strokeWidth={2.2} aria-hidden="true" />
                {a.label}
              </StartButton>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
