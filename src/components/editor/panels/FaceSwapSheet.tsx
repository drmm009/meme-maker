import { useState } from 'react';
import { Check, Eye, RefreshCw } from 'lucide-react';
import { Sheet, Row, Slider } from '../../ui';
import type { EditorActions } from './selection';

interface FaceSwapSheetProps {
  morphProgress: number | undefined;
  actions: EditorActions;
}

// Shown while a face swap on the template is being tuned: how strong it is, hold to see the
// original, then undo it or keep it. Change face (in the header) goes back to the face picker.
export default function FaceSwapSheet({ morphProgress, actions }: FaceSwapSheetProps) {
  const [isHolding, setIsHolding] = useState(false);

  const hold = (on: boolean) => () => {
    setIsHolding(on);
    actions.setIsHoldingCanvasCompare(on);
  };

  return (
    <Sheet
      className="ie-face-swap-sheet ie-tool-sheet"
      title="Face Swap"
      onClose={actions.handleFinalizeTemplateFace}
      action={{ label: 'Change face', Icon: RefreshCw, variant: 'plain', onClick: actions.handleChangeFace }}
    >
      <Row label="Strength">
        <Slider
          label="Swap strength"
          min={0}
          max={1}
          step={0.01}
          value={morphProgress ?? 0.85}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => actions.handleUpdateTemplateMorphProgress(v)}
        />
      </Row>

      <div className="ie-fs-foot">
        <button
          type="button"
          className={`ie-fs-btn ie-fs-btn--compare${isHolding ? ' is-on' : ''}`}
          aria-pressed={isHolding}
          title="Hold to see the original"
          onPointerDown={hold(true)}
          onPointerUp={hold(false)}
          onPointerLeave={hold(false)}
          onPointerCancel={hold(false)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <Eye size={17} strokeWidth={2.2} aria-hidden="true" />
          {isHolding ? 'Original' : 'Compare'}
        </button>
        <button type="button" className="ie-fs-btn" title="Undo the face swap" onClick={actions.handleRevertTemplateFace}>
          Cancel
        </button>
        <button type="button" className="ie-fs-btn ie-fs-btn--done" title="Keep the face swap" onClick={actions.handleFinalizeTemplateFace}>
          <Check size={17} strokeWidth={2.4} aria-hidden="true" />
          Done
        </button>
      </div>
    </Sheet>
  );
}
