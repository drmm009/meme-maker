import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Sheet } from '../../ui';
import { BUBBLE_PRESETS, BUBBLE_CATEGORIES } from './bubblePresets';
import { useSelection } from './selection';
import type { EditorActions } from './selection';

// Text > Bubble (and a bubble caption's Bubble button): chat and speech bubble styles for the
// selected caption (a new bubble caption when none is), each a card previewing the caption's own
// words when they're short; the picked one is a shade lighter with a small tick by its name. Tapping it again,
// or Remove, takes the bubble off.
export default function BubbleSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const [category, setCategory] = useState('All');
  const { caption } = useSelection();
  const current = caption?.bubbleStyle as string | undefined;
  const words = typeof caption?.text === 'string' && caption.text.length <= 26 ? caption.text : '';
  const list = BUBBLE_PRESETS.filter((p) => category === 'All' || p.category === category);

  const removeBubble = () => actions.updateActiveCaptionProps({ bubbleStyle: null });
  const pick = (presetId: string) => {
    if (current === presetId) removeBubble();
    else actions.handleApplyBubbleStyle(presetId);
  };

  return (
    <Sheet
      className="ie-bubble-sheet ie-tool-sheet"
      title="Bubbles"
      onClose={onClose}
      action={current ? { label: 'Remove', Icon: X, variant: 'plain', onClick: removeBubble } : undefined}
    >
      <div className="ie-bubble-tabs" role="group" aria-label="Bubble kinds">
        {BUBBLE_CATEGORIES.map((c) => (
          <button key={c} type="button" className={`ie-bubble-tab${category === c ? ' is-on' : ''}`} aria-pressed={category === c} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="ie-bubble-grid">
        {list.map((p) => {
          const on = current === p.id;
          return (
            <button key={p.id} type="button" className={`ie-bubble-card${on ? ' is-on' : ''}`} aria-pressed={on} title={p.description} onClick={() => pick(p.id)}>
              <span className="ie-bubble-stage">
                <span
                  className="ie-bubble-sample"
                  style={{
                    background: p.bubbleBg,
                    color: p.textColor,
                    border: p.borderWidth ? `${p.borderWidth}px solid ${p.borderColor}` : 'none',
                    borderRadius: p.borderRadius,
                  }}
                >
                  {words || p.sampleText}
                </span>
              </span>
              <span className="ie-bubble-name">
                {on && <span className="ie-bubble-tick" aria-hidden="true"><Check size={10} strokeWidth={3.4} /></span>}
                <span>{p.name}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
