import React, { useState } from 'react';
import BottomSheet from '../BottomSheet';
import { MessageSquare, Check, Ban, Sparkles } from 'lucide-react';

const BUBBLE_PRESETS = [
  {
    id: 'imessage-send',
    name: 'iPhone Sent',
    category: 'iMessage',
    bubbleBg: '#007aff',
    textColor: '#ffffff',
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: '18px 18px 4px 18px',
    sampleText: 'Hello from iPhone! 📤',
    description: 'Classic iOS blue sent bubble'
  },
  {
    id: 'imessage-receive',
    name: 'iPhone Received',
    category: 'iMessage',
    bubbleBg: '#e9e9eb',
    textColor: '#000000',
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: '18px 18px 18px 4px',
    sampleText: 'Hey there! What’s up? 📥',
    description: 'iOS recipient light gray bubble'
  },
  {
    id: 'whatsapp-send',
    name: 'WhatsApp Sent',
    category: 'WhatsApp',
    bubbleBg: '#005c4b',
    textColor: '#ffffff',
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: '14px 4px 14px 14px',
    sampleText: 'Sent via WhatsApp 💬',
    description: 'WhatsApp emerald green bubble'
  },
  {
    id: 'whatsapp-receive',
    name: 'WhatsApp Received',
    category: 'WhatsApp',
    bubbleBg: '#202c33',
    textColor: '#ffffff',
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: '4px 14px 14px 14px',
    sampleText: 'Got it, let’s do it! 💬',
    description: 'WhatsApp dark mode bubble'
  },
  {
    id: 'speech-left',
    name: 'Comic Speech (Left)',
    category: 'Comic',
    bubbleBg: '#ffffff',
    textColor: '#000000',
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: '16px',
    sampleText: 'Wait, what?! ◂',
    description: 'Comic speech pointer left'
  },
  {
    id: 'speech-right',
    name: 'Comic Speech (Right)',
    category: 'Comic',
    bubbleBg: '#ffffff',
    textColor: '#000000',
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: '16px',
    sampleText: 'Let’s go! ▸',
    description: 'Comic speech pointer right'
  },
  {
    id: 'thought',
    name: 'Thought Bubble',
    category: 'Comic',
    bubbleBg: '#ffffff',
    textColor: '#000000',
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: '24px',
    sampleText: 'Thinking... 💭',
    description: 'Cloud thought bubble'
  },
  {
    id: 'shout',
    name: 'Shout / Action',
    category: 'Action',
    bubbleBg: '#ffe600',
    textColor: '#000000',
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: '12px',
    sampleText: 'OMG NOOO! 💥',
    description: 'High-energy comic action shout'
  }
];

const BUBBLE_CATEGORIES = ['All', 'iMessage', 'WhatsApp', 'Comic', 'Action'];

export default function BubbleChatBottomSheet({
  isOpen,
  onClose,
  activeCaption,
  onApplyBubbleStyle,
  onRemoveBubbleStyle
}) {
  const [activeCategory, setActiveCategory] = useState('All');
  const currentBubbleStyle = activeCaption?.bubbleStyle;

  const filteredPresets = BUBBLE_PRESETS.filter((p) => {
    if (activeCategory === 'All') return true;
    return p.category === activeCategory;
  });

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Chat & Speech Bubbles"
      icon={<MessageSquare size={17} strokeWidth={2.4} />}
      maxHeight="78vh"
      contentStyle={{ padding: '6px 16px 20px 16px', overflowY: 'auto' }}
    >
      {/* Top Status & Revert Control Bar */}
      <div className="bs-control-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="bs-control-label">Status:</span>
          {currentBubbleStyle ? (
            <span className="bs-active-tag">
              <Sparkles size={11} strokeWidth={2.4} />
              <span>{BUBBLE_PRESETS.find(p => p.id === currentBubbleStyle)?.name || 'Bubble Active'}</span>
            </span>
          ) : (
            <span style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.65)' }}>
              Standard Text
            </span>
          )}
        </div>

        {currentBubbleStyle && onRemoveBubbleStyle && (
          <button
            type="button"
            className="bs-remove-bubble-btn hover-lift"
            onClick={onRemoveBubbleStyle}
          >
            <Ban size={12} strokeWidth={2.4} />
            <span>Remove Bubble</span>
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="bs-category-bar">
        {BUBBLE_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              className={`bs-category-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Grid of Bubble Style Presets */}
      <div className="bs-bubble-grid">
        {filteredPresets.map((preset) => {
          const isSelected = currentBubbleStyle === preset.id;
          const displayMsg = (activeCaption?.text && activeCaption.text.length <= 26)
            ? activeCaption.text
            : preset.sampleText;

          return (
            <button
              key={preset.id}
              type="button"
              className={`bs-bubble-card hover-lift ${isSelected ? 'active' : ''}`}
              onClick={() => onApplyBubbleStyle(preset.id)}
            >
              {/* Active Selection Badge */}
              {isSelected && (
                <div className="bs-check-badge">
                  <Check size={12} strokeWidth={3} />
                </div>
              )}

              {/* Category Tag */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="bs-bubble-tag">
                  {preset.category}
                </span>
              </div>

              {/* Visual Bubble Preview Container */}
              <div className="bs-bubble-preview-stage">
                <div
                  className="bs-bubble-preview-content"
                  style={{
                    background: preset.bubbleBg,
                    color: preset.textColor,
                    border: preset.borderWidth ? `${preset.borderWidth}px solid ${preset.borderColor}` : 'none',
                    borderRadius: preset.borderRadius,
                    padding: '6px 12px',
                  }}
                >
                  {displayMsg}
                </div>
              </div>

              {/* Preset Title & Description */}
              <div style={{ marginTop: 'auto' }}>
                <div className="bs-bubble-title">
                  {preset.name}
                </div>
                <div className="bs-bubble-desc">
                  {preset.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
