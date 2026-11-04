import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import { Sheet } from '../../ui';
import { BUBBLE_PRESETS, BUBBLE_CATEGORIES } from './bubblePresets';
import type { BubblePreset } from './bubblePresets';
import { useSelection } from './selection';
import type { EditorActions } from './selection';

function BubblePreview({ preset, text }: { preset: BubblePreset; text: string }) {
  const { id, bubbleBg, textColor, borderColor, borderWidth } = preset;
  const stroke = borderWidth ? borderColor : 'none';
  const strokeW = borderWidth || 0;

  let shape: ReactNode = null;
  const textStyle: CSSProperties = {
    color: textColor,
    fontFamily: preset.fontFamily,
  };

  if (id === 'imessage-send' || id === 'imessage-sms') {
    textStyle.paddingRight = '10px';
    textStyle.paddingLeft = '6px';
    const isSms = id === 'imessage-sms';
    const gradId = isSms ? 'bubble-grad-sms' : 'bubble-grad-imsg';
    shape = (
      <g>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isSms ? '#3ee06a' : '#3299ff'} />
            <stop offset="100%" stopColor={isSms ? '#28c853' : '#007aff'} />
          </linearGradient>
        </defs>
        <path
          d="M 24,5 H 114 C 121.5,5 127,10.5 127,18 V 30 C 127,37 128.5,44 135.5,45 C 133,45 128.5,45 124.5,45 H 24 C 16.5,45 11,39.5 11,32 V 18 C 11,10.5 16.5,5 24,5 Z"
          fill={`url(#${gradId})`}
          stroke={stroke}
          strokeWidth={strokeW}
        />
      </g>
    );
  } else if (id === 'imessage-receive' || id === 'imessage-dark') {
    textStyle.paddingLeft = '10px';
    textStyle.paddingRight = '6px';
    const isDark = id === 'imessage-dark';
    const cardStroke = (stroke && stroke !== 'transparent' && stroke !== 'none') ? stroke : (isDark ? 'rgba(255, 255, 255, 0.22)' : 'none');
    const cardStrokeW = strokeW || (isDark ? 1.2 : 0);
    shape = (
      <path
        d="M 15.5,45 H 116 C 123.5,45 129,39.5 129,32 V 18 C 129,10.5 123.5,5 116,5 H 26 C 18.5,5 13,10.5 13,18 V 30 C 13,37 11.5,44 4.5,45 C 7,45 11.5,45 15.5,45 Z"
        fill={bubbleBg}
        stroke={cardStroke}
        strokeWidth={cardStrokeW}
      />
    );
  } else if (id === 'whatsapp-send' || id === 'whatsapp-light-send') {
    textStyle.paddingRight = '12px';
    shape = (
      <path
        d="M 16,5 L 116,5 Q 124,5 124,13 L 124,33 L 133,43 L 116,43 L 16,43 Q 7,43 7,35 L 7,13 Q 7,5 16,5 Z"
        fill={bubbleBg}
        stroke={stroke}
        strokeWidth={strokeW}
      />
    );
  } else if (id === 'whatsapp-receive' || id === 'whatsapp-light-receive') {
    textStyle.paddingLeft = '12px';
    shape = (
      <path
        d="M 24,43 L 7,43 L 16,33 L 16,13 Q 16,5 24,5 L 124,5 Q 133,5 133,13 L 133,35 Q 133,43 124,43 L 24,43 Z"
        fill={bubbleBg}
        stroke={stroke}
        strokeWidth={strokeW}
      />
    );
  } else if (id === 'speech-left' || id === 'whisper') {
    textStyle.paddingBottom = '8px';
    shape = (
      <path
        d="M 20,4 L 120,4 Q 130,4 130,14 L 130,27 Q 130,37 120,37 L 36,37 L 18,48 L 24,37 L 20,37 Q 8,37 8,27 L 8,14 Q 8,4 20,4 Z"
        fill={bubbleBg}
        stroke={stroke}
        strokeWidth={strokeW}
        strokeDasharray={id === 'whisper' ? '4 3' : undefined}
      />
    );
  } else if (id === 'speech-right') {
    textStyle.paddingBottom = '8px';
    shape = (
      <path
        d="M 20,4 L 120,4 Q 130,4 130,14 L 130,27 Q 130,37 120,37 L 116,37 L 122,48 L 104,37 L 20,37 Q 8,37 8,27 L 8,14 Q 8,4 20,4 Z"
        fill={bubbleBg}
        stroke={stroke}
        strokeWidth={strokeW}
      />
    );
  } else if (id === 'thought') {
    textStyle.paddingBottom = '10px';
    shape = (
      <g>
        <ellipse cx="70" cy="20" rx="56" ry="16" fill={bubbleBg} stroke={stroke} strokeWidth={strokeW} />
        <circle cx="44" cy="40" r="4.5" fill={bubbleBg} stroke={stroke} strokeWidth={strokeW} />
        <circle cx="36" cy="46" r="2.5" fill={bubbleBg} stroke={stroke} strokeWidth={Math.max(1, strokeW * 0.8)} />
      </g>
    );
  } else if (id === 'shout' || id === 'action-red') {
    textStyle.fontSize = '10px';
    textStyle.textTransform = 'uppercase';
    shape = (
      <path
        d="M 134.0,24.0 L 121.2,28.0 L 127.7,33.5 L 111.0,35.2 L 109.9,41.2 L 92.8,40.3 L 84.2,45.4 L 70.0,42.0 L 55.8,45.4 L 47.2,40.3 L 30.1,41.2 L 29.0,35.2 L 12.3,33.5 L 18.8,28.0 L 6.0,24.0 L 18.8,20.0 L 12.3,14.5 L 29.0,12.8 L 30.1,6.8 L 47.2,7.7 L 55.8,2.6 L 70.0,6.0 L 84.2,2.6 L 92.8,7.7 L 109.9,6.8 L 111.0,12.8 L 127.7,14.5 L 121.2,20.0 Z"
        fill={bubbleBg}
        stroke={stroke}
        strokeWidth={strokeW}
        strokeLinejoin="round"
      />
    );
  } else if (id === 'action-neon') {
    textStyle.fontSize = '10px';
    textStyle.letterSpacing = '0.5px';
    shape = (
      <path
        d="M 18,4 L 122,4 L 134,14 L 134,34 L 122,42 L 36,42 L 22,50 L 26,42 L 6,42 L 6,14 Z"
        fill={bubbleBg}
        stroke={borderColor}
        strokeWidth="2"
      />
    );
  } else {
    shape = <rect x="8" y="5" width="124" height="38" rx="14" fill={bubbleBg} stroke={stroke} strokeWidth={strokeW} />;
  }

  return (
    <div className="ie-bubble-preview">
      <svg className="ie-bubble-svg" viewBox="0 0 140 52" aria-hidden="true" preserveAspectRatio="none">
        {shape}
      </svg>
      <span className="ie-bubble-preview-text" style={textStyle}>
        {text}
      </span>
    </div>
  );
}

// Text > Bubble: chat and speech bubble styles for captions.
// Cards preview real shapes with matching tails, beaks, and thought dots.
// Tapping a card adds/applies the bubble style; tapping the active one removes it.
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
                <BubblePreview preset={p} text={words || p.sampleText} />
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
