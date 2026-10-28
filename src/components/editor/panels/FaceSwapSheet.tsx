import { Check, Eye, RefreshCw, X } from 'lucide-react';
import { Sheet, Section, Row, Slider } from '../../ui';
import type { EditorActions } from './selection';

interface FaceSwapSheetProps {
  morphProgress: number | undefined;
  actions: EditorActions;
}

// Shown while a face swap on the template is being tuned: strength, compare, change face, done.
export default function FaceSwapSheet({ morphProgress, actions }: FaceSwapSheetProps) {
  const hold = (on: boolean) => () => actions.setIsHoldingCanvasCompare(on);
  return (
    <Sheet title="Face Swap" onClose={actions.handleFinalizeTemplateFace}>
      <Section>
        <Row label="Strength">
          <Slider label="Morph intensity" min={0} max={1} step={0.01} value={morphProgress ?? 0.85} onChange={(v) => actions.handleUpdateTemplateMorphProgress(v)} format={(v) => `${Math.round(v * 100)}%`} />
        </Row>
      </Section>
      <Section>
        <div className="ie-layer-actions">
          <button type="button" className="ui-btn" title="Hold to see original without face swap" onPointerDown={hold(true)} onPointerUp={hold(false)} onPointerLeave={hold(false)}>
            <Eye size={16} />Hold to compare
          </button>
          <button type="button" className="ui-btn" title="Pick a different face or photo" onClick={actions.handleChangeFace}><RefreshCw size={16} />Change face</button>
        </div>
        <div className="ie-layer-actions">
          <button type="button" className="ui-btn ui-btn--danger" title="Cancel face swap and revert" onClick={actions.handleRevertTemplateFace}><X size={16} />Cancel</button>
          <button type="button" className="ui-btn-accent" title="Accept face swap" onClick={actions.handleFinalizeTemplateFace}><Check size={16} />Done</button>
        </div>
      </Section>
    </Sheet>
  );
}
