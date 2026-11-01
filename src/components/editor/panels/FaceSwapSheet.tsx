import { useState } from 'react';
import { Check, Eye, RefreshCw, X } from 'lucide-react';
import { Sheet, Section, Slider } from '../../ui';
import type { EditorActions } from './selection';

interface FaceSwapSheetProps {
  morphProgress: number | undefined;
  actions: EditorActions;
}

// Shown while a face swap on the template is being tuned: strength, compare, change face, done.
export default function FaceSwapSheet({ morphProgress, actions }: FaceSwapSheetProps) {
  const [isHolding, setIsHolding] = useState(false);

  const startHold = () => {
    setIsHolding(true);
    actions.setIsHoldingCanvasCompare(true);
  };

  const endHold = () => {
    setIsHolding(false);
    actions.setIsHoldingCanvasCompare(false);
  };

  const morphVal = morphProgress ?? 0.85;

  return (
    <Sheet className="ie-face-swap-sheet" title="Face Swap" hideTitle onClose={actions.handleFinalizeTemplateFace}>
      <Section title="Swap Intensity">
        <div className="ie-bg-blur-slider-wrap">
          <Slider
            label="Morph intensity"
            min={0}
            max={1}
            step={0.01}
            value={morphVal}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => actions.handleUpdateTemplateMorphProgress(v)}
          />
        </div>
      </Section>

      <Section rule>
        <div className="ie-face-swap-actions">
          <div className="ie-face-swap-row">
            <button
              type="button"
              className={`ui-btn ie-face-swap-btn${isHolding ? ' is-on' : ''}`}
              title="Hold to see original without face swap"
              onPointerDown={startHold}
              onPointerUp={endHold}
              onPointerLeave={endHold}
              onPointerCancel={endHold}
            >
              <Eye size={17} className="ie-face-swap-icon" />
              <span>{isHolding ? 'Viewing Original' : 'Hold to compare'}</span>
            </button>

            <button
              type="button"
              className="ui-btn ie-face-swap-btn"
              title="Pick a different face or photo"
              onClick={actions.handleChangeFace}
            >
              <RefreshCw size={17} className="ie-face-swap-icon" />
              <span>Change face</span>
            </button>
          </div>

          <div className="ie-face-swap-row">
            <button
              type="button"
              className="ui-btn ie-face-swap-btn ie-face-swap-btn--danger"
              title="Cancel face swap and revert"
              onClick={actions.handleRevertTemplateFace}
            >
              <X size={17} />
              <span>Cancel</span>
            </button>

            <button
              type="button"
              className="ui-btn ie-face-swap-btn ie-face-swap-btn--done"
              title="Accept face swap"
              onClick={actions.handleFinalizeTemplateFace}
            >
              <Check size={17} />
              <span>Done</span>
            </button>
          </div>
        </div>
      </Section>
    </Sheet>
  );
}
