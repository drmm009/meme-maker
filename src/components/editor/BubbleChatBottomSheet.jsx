import React from 'react';
import BottomSheet from '../BottomSheet';
import { MessageSquare, Check, Ban } from 'lucide-react';

export const BUBBLE_PRESETS = [
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

export default function BubbleChatBottomSheet({
  isOpen,
  onClose,
  activeCaption,
  onApplyBubbleStyle,
  onRemoveBubbleStyle
}) {
  const currentBubbleStyle = activeCaption?.bubbleStyle;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Chat & Speech Bubbles"
      icon={<MessageSquare size={18} style={{ color: 'var(--cyber-cyan)' }} />}
      maxHeight="75vh"
      contentStyle={{ padding: '8px 16px 24px 16px', overflowY: 'auto' }}
    >
      {/* Top Controls: Status + Revert to Normal Text Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '8px 12px',
          borderRadius: '12px',
          border: '1px solid var(--glass-border)',
          marginBottom: '14px',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
          {currentBubbleStyle ? (
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.16)',
                border: '1px solid var(--cyber-cyan)',
                color: 'var(--cyber-cyan)'
              }}
            >
              {BUBBLE_PRESETS.find(p => p.id === currentBubbleStyle)?.name || 'Bubble Active'}
            </span>
          ) : (
            <span style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              Standard Text
            </span>
          )}
        </div>

        {currentBubbleStyle && onRemoveBubbleStyle && (
          <button
            type="button"
            className="btn btn-xs btn-ghost"
            onClick={() => {
              onRemoveBubbleStyle();
            }}
            style={{
              fontSize: '0.72rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: '#ef4444',
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            <Ban size={12} />
            <span>Remove Bubble</span>
          </button>
        )}
      </div>

      {/* Grid of Bubble Style Presets */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '10px'
        }}
      >
        {BUBBLE_PRESETS.map((preset) => {
          const isSelected = currentBubbleStyle === preset.id;
          const displayMsg = (activeCaption?.text && activeCaption.text.length <= 26)
            ? activeCaption.text
            : preset.sampleText;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyBubbleStyle(preset.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                padding: '10px',
                borderRadius: '14px',
                background: isSelected
                  ? 'rgba(6, 182, 212, 0.12)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: isSelected
                  ? '1.5px solid var(--cyber-cyan)'
                  : '1px solid var(--glass-border)',
                boxShadow: isSelected
                  ? '0 0 14px rgba(6, 182, 212, 0.35)'
                  : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                position: 'relative',
                transition: 'all 0.18s ease',
                outline: 'none'
              }}
            >
              {/* Active Selection Badge */}
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'var(--cyber-cyan)',
                    borderRadius: '50%',
                    width: 18,
                    height: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 8px rgba(6, 182, 212, 0.6)',
                    zIndex: 2
                  }}
                >
                  <Check size={11} color="#000000" strokeWidth={3} />
                </div>
              )}

              {/* Category Tag */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: isSelected ? 'var(--cyber-cyan)' : 'rgba(255, 255, 255, 0.5)'
                  }}
                >
                  {preset.category}
                </span>
              </div>

              {/* Visual Bubble Preview Container */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  borderRadius: '10px',
                  padding: '12px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '62px',
                  marginBottom: '8px'
                }}
              >
                <div
                  style={{
                    background: preset.bubbleBg,
                    color: preset.textColor,
                    border: preset.borderWidth ? `${preset.borderWidth}px solid ${preset.borderColor}` : 'none',
                    borderRadius: preset.borderRadius,
                    padding: '5px 10px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    maxWidth: '100%',
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    lineHeight: 1.25,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
                  }}
                >
                  {displayMsg}
                </div>
              </div>

              {/* Preset Title & Description */}
              <div style={{ marginTop: 'auto' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>
                  {preset.name}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.55)', marginTop: '2px' }}>
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
