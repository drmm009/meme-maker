import { useState } from 'react';
import { LayoutGrid, Smartphone, MessageCircle, MessageSquareQuote, Zap, Check } from 'lucide-react';
import MediaPickerSheet from './MediaPickerSheet';
import { BUBBLE_PRESETS, BUBBLE_CATEGORIES } from './bubblePresets';
import { useSelection } from './selection';
import type { EditorActions } from './selection';

const ICONS = { All: LayoutGrid, iMessage: Smartphone, WhatsApp: MessageCircle, Comic: MessageSquareQuote, Action: Zap };
const TABS = BUBBLE_CATEGORIES.map((c) => ({ id: c, label: c, Icon: ICONS[c as keyof typeof ICONS] }));

// Text > Bubble: chat and speech bubble styles for the selected caption (a new bubble caption when
// none is), each previewed with the caption's own words when they're short.
export default function BubbleSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const [category, setCategory] = useState('All');
  const { caption } = useSelection();
  const current = caption?.bubbleStyle as string | undefined;
  const words = typeof caption?.text === 'string' && caption.text.length <= 26 ? caption.text : '';
  const list = BUBBLE_PRESETS.filter((p) => category === 'All' || p.category === category);

  return (
    <MediaPickerSheet
      title="Bubbles"
      onClose={onClose}
      tabs={TABS}
      tab={category}
      onTab={setCategory}
      grid="bubbles"
      action={current ? { label: 'Remove bubble', variant: 'plain', onClick: () => actions.updateActiveCaptionProps({ bubbleStyle: null }) } : undefined}
    >
      {list.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`ie-picker-bubble${current === p.id ? ' is-on' : ''}`}
          aria-pressed={current === p.id}
          title={p.description}
          onClick={() => actions.handleApplyBubbleStyle(p.id)}
        >
          <span className="ie-picker-bubble-stage">
            <span
              className="ie-picker-bubble-sample"
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
          <span className="ie-picker-name">{p.name}</span>
          {current === p.id && <span className="ie-picker-check" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>}
        </button>
      ))}
    </MediaPickerSheet>
  );
}
