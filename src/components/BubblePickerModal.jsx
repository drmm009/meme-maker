import React, { useState } from 'react';
import { MessageSquare, MessageCircle, X, Sparkles, Check, CheckCheck } from 'lucide-react';

export const BUBBLE_LAYOUTS = [
  // 1. Social & Chat Layouts
  {
    id: 'imessage-send',
    name: 'iPhone (Sent)',
    category: 'chat',
    platform: 'iOS',
    bgColor: '#007aff',
    textColor: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    stroke: 'transparent',
    strokeWidth: 0,
    desc: 'Classic Apple Blue bubble with send tail'
  },
  {
    id: 'imessage-receive',
    name: 'iPhone (Received)',
    category: 'chat',
    platform: 'iOS',
    bgColor: '#e9e9eb',
    textColor: '#000000',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    stroke: 'transparent',
    strokeWidth: 0,
    desc: 'Apple light gray message bubble'
  },
  {
    id: 'whatsapp-send',
    name: 'WhatsApp (Sent)',
    category: 'chat',
    platform: 'WhatsApp',
    bgColor: '#005c4b',
    textColor: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    stroke: 'transparent',
    strokeWidth: 0,
    desc: 'WhatsApp emerald bubble with double checkmarks'
  },
  {
    id: 'whatsapp-receive',
    name: 'WhatsApp (Received)',
    category: 'chat',
    platform: 'WhatsApp',
    bgColor: '#202c33',
    textColor: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    stroke: 'transparent',
    strokeWidth: 0,
    desc: 'WhatsApp dark slate bubble'
  },

  // 2. Classic Comic & Callout Layouts
  {
    id: 'speech-left',
    name: 'Speech (Tail Left)',
    category: 'comic',
    platform: 'Comic',
    bgColor: '#ffffff',
    textColor: '#000000',
    fontFamily: 'Montserrat, sans-serif',
    stroke: '#000000',
    strokeWidth: 3,
    desc: 'Classic comic book dialogue bubble'
  },
  {
    id: 'speech-right',
    name: 'Speech (Tail Right)',
    category: 'comic',
    platform: 'Comic',
    bgColor: '#ffffff',
    textColor: '#000000',
    fontFamily: 'Montserrat, sans-serif',
    stroke: '#000000',
    strokeWidth: 3,
    desc: 'Comic speech bubble pointing right'
  },
  {
    id: 'thought',
    name: 'Thought Bubble',
    category: 'comic',
    platform: 'Comic',
    bgColor: '#ffffff',
    textColor: '#000000',
    fontFamily: 'Montserrat, sans-serif',
    stroke: '#000000',
    strokeWidth: 3,
    desc: 'Dreamy cloud thought bubble'
  },
  {
    id: 'shout',
    name: 'Shout / Scream',
    category: 'comic',
    platform: 'Comic',
    bgColor: '#ffe600',
    textColor: '#000000',
    fontFamily: 'Impact, sans-serif',
    stroke: '#000000',
    strokeWidth: 3,
    desc: 'Explosive starburst action shout bubble'
  }
];

export default function BubblePickerModal({
  isOpen,
  onClose,
  onAddBubble,
  initialStyle = 'imessage-send',
  initialText = 'are you free to hop on a quick 5-min call?',
  isEditing = false
}) {
  const [selectedLayoutId, setSelectedLayoutId] = useState(initialStyle);
  const [bubbleText, setBubbleText] = useState(initialText);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'chat' | 'comic'

  React.useEffect(() => {
    if (isOpen) {
      setSelectedLayoutId(initialStyle || 'imessage-send');
      setBubbleText(initialText || 'are you free to hop on a quick 5-min call?');
    }
  }, [isOpen, initialStyle, initialText]);

  if (!isOpen) return null;

  const currentLayout = BUBBLE_LAYOUTS.find(l => l.id === selectedLayoutId) || BUBBLE_LAYOUTS[0];

  const filteredLayouts = BUBBLE_LAYOUTS.filter(l => {
    if (activeTab === 'chat') return l.category === 'chat';
    if (activeTab === 'comic') return l.category === 'comic';
    return true;
  });

  const handleApply = () => {
    onAddBubble({
      style: currentLayout.id,
      text: bubbleText.trim() || 'Wait a minute...'
    });
    onClose();
  };

  const quickPhrases = [
    'are you free to hop on a quick 5-min call?',
    'Wait a minute...',
    'I can explain everything 😂',
    'Bro did you see this?!',
    'Don’t tell anyone 🤫',
    'WHAT JUST HAPPENED?!'
  ];

  return (
    <div
      className="modal-backdrop animate-fade-in"
      style={{
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-card"
        style={{
          width: '100%',
          maxWidth: '540px',
          background: 'rgba(20, 20, 28, 0.96)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.06)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #007aff, #00c6ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 122, 255, 0.35)',
                flexShrink: 0
              }}
            >
              <MessageSquare size={18} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                {isEditing ? 'Edit Bubble Style & Layout' : 'Bubble Style & Layout'}
              </h3>
            </div>
          </div>
          <button
            className="btn btn-icon btn-ghost btn-xs"
            onClick={onClose}
            style={{ borderRadius: '50%', width: 28, height: 28, color: 'var(--text-muted)' }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Category Tabs: All, iPhone & WhatsApp, Comic */}
        <div style={{ padding: '12px 20px 0', background: 'rgba(0,0,0,0.15)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              padding: '4px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              style={{
                padding: '6px 10px',
                borderRadius: '9px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'all' ? 'var(--primary-gradient)' : 'transparent',
                color: activeTab === 'all' ? '#ffffff' : 'rgba(255,255,255,0.65)',
                transition: 'all 0.15s ease'
              }}
            >
              All Bubbles
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              style={{
                padding: '6px 10px',
                borderRadius: '9px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'chat' ? 'var(--primary-gradient)' : 'transparent',
                color: activeTab === 'chat' ? '#ffffff' : 'rgba(255,255,255,0.65)',
                transition: 'all 0.15s ease'
              }}
            >
              iPhone & WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('comic')}
              style={{
                padding: '6px 10px',
                borderRadius: '9px',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'comic' ? 'var(--primary-gradient)' : 'transparent',
                color: activeTab === 'comic' ? '#ffffff' : 'rgba(255,255,255,0.65)',
                transition: 'all 0.15s ease'
              }}
            >
              Comic & Callout
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Live Visual Preview */}
          <div
            style={{
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '14px',
              border: '1px dashed rgba(255,255,255,0.2)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', alignSelf: 'flex-start', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Live Preview: {currentLayout.name}
            </div>

            <div
              style={{
                width: '100%',
                minHeight: '85px',
                background: currentLayout.id === 'whatsapp-receive' ? '#0b141a' : '#111827',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: currentLayout.id.includes('receive') || currentLayout.id === 'speech-left' ? 'flex-start' : 'flex-end',
                boxShadow: 'inset 0 0 16px rgba(0,0,0,0.5)'
              }}
            >
              {/* iMessage Send */}
              {currentLayout.id === 'imessage-send' && (
                <div
                  style={{
                    background: '#007aff',
                    color: '#ffffff',
                    borderRadius: '18px 18px 4px 18px',
                    padding: '9px 15px',
                    maxWidth: '82%',
                    fontSize: '0.88rem',
                    lineHeight: 1.35,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    boxShadow: '0 4px 12px rgba(0, 122, 255, 0.35)'
                  }}
                >
                  {bubbleText || 'Type your message...'}
                </div>
              )}

              {/* iMessage Receive */}
              {currentLayout.id === 'imessage-receive' && (
                <div
                  style={{
                    background: '#e9e9eb',
                    color: '#000000',
                    borderRadius: '18px 18px 18px 4px',
                    padding: '9px 15px',
                    maxWidth: '82%',
                    fontSize: '0.88rem',
                    lineHeight: 1.35,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  {bubbleText || 'Type your message...'}
                </div>
              )}

              {/* WhatsApp Send */}
              {currentLayout.id === 'whatsapp-send' && (
                <div
                  style={{
                    background: '#005c4b',
                    color: '#ffffff',
                    borderRadius: '8px 8px 0px 8px',
                    padding: '8px 12px',
                    maxWidth: '84%',
                    fontSize: '0.86rem',
                    lineHeight: 1.35,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px'
                  }}
                >
                  <span>{bubbleText || 'Type your message...'}</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px', fontSize: '0.62rem', color: 'rgba(255,255,255,0.6)' }}>
                    <span>10:42 AM</span>
                    <span style={{ color: '#53bdeb', fontWeight: 800 }}>✓✓</span>
                  </div>
                </div>
              )}

              {/* WhatsApp Receive */}
              {currentLayout.id === 'whatsapp-receive' && (
                <div
                  style={{
                    background: '#202c33',
                    color: '#ffffff',
                    borderRadius: '8px 8px 8px 0px',
                    padding: '8px 12px',
                    maxWidth: '84%',
                    fontSize: '0.86rem',
                    lineHeight: 1.35,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px'
                  }}
                >
                  <span>{bubbleText || 'Type your message...'}</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px', fontSize: '0.62rem', color: 'rgba(255,255,255,0.6)' }}>
                    <span>10:42 AM</span>
                  </div>
                </div>
              )}

              {/* Comic Left */}
              {currentLayout.id === 'speech-left' && (
                <div
                  style={{
                    background: '#ffffff',
                    color: '#000000',
                    border: '3px solid #000000',
                    borderRadius: '16px 16px 16px 2px',
                    padding: '8px 14px',
                    maxWidth: '80%',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    fontFamily: 'Montserrat, sans-serif',
                    boxShadow: '3px 3px 0 #000'
                  }}
                >
                  {bubbleText || 'Wait a minute...'}
                </div>
              )}

              {/* Comic Right */}
              {currentLayout.id === 'speech-right' && (
                <div
                  style={{
                    background: '#ffffff',
                    color: '#000000',
                    border: '3px solid #000000',
                    borderRadius: '16px 16px 2px 16px',
                    padding: '8px 14px',
                    maxWidth: '80%',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    fontFamily: 'Montserrat, sans-serif',
                    boxShadow: '-3px 3px 0 #000'
                  }}
                >
                  {bubbleText || 'Wait a minute...'}
                </div>
              )}

              {/* Thought */}
              {currentLayout.id === 'thought' && (
                <div
                  style={{
                    background: '#ffffff',
                    color: '#000000',
                    border: '3px solid #000000',
                    borderRadius: '30px',
                    padding: '10px 18px',
                    maxWidth: '82%',
                    fontSize: '0.86rem',
                    fontStyle: 'italic',
                    fontFamily: 'Montserrat, sans-serif',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  💭 {bubbleText || 'Thinking to myself...'}
                </div>
              )}

              {/* Shout */}
              {currentLayout.id === 'shout' && (
                <div
                  style={{
                    background: '#ffe600',
                    color: '#000000',
                    border: '3px solid #000000',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    maxWidth: '85%',
                    fontSize: '0.95rem',
                    fontWeight: 900,
                    fontFamily: 'Impact, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: '4px 4px 0 #000000',
                    transform: 'rotate(-2deg)'
                  }}
                >
                  💥 {bubbleText || 'WHAT ARE YOU DOING?!'}
                </div>
              )}
            </div>
          </div>

          {/* Layout Grid Selector */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              Select Layout ({filteredLayouts.length} Styles)
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px'
              }}
            >
              {filteredLayouts.map(layout => {
                const isSelected = selectedLayoutId === layout.id;
                return (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => setSelectedLayoutId(layout.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: isSelected ? 'rgba(0, 122, 255, 0.15)' : 'rgba(255,255,255,0.04)',
                      border: isSelected ? '2px solid #007aff' : '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Visual Color Swatch Dot */}
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: layout.bgColor,
                        border: layout.stroke !== 'transparent' ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.3)',
                        flexShrink: 0
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {layout.name}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {layout.platform}
                      </div>
                    </div>
                    {isSelected && (
                      <Check size={14} style={{ color: '#007aff', flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text Input */}
          <div>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Message Text
            </label>
            <input
              type="text"
              className="form-input"
              value={bubbleText}
              onChange={(e) => setBubbleText(e.target.value)}
              placeholder="e.g. are you free for a quick call?"
              style={{ width: '100%', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}
            />

            {/* Quick Suggestions */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none', marginTop: '8px', paddingBottom: '2px' }}>
              {quickPhrases.map((phrase, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setBubbleText(phrase)}
                  style={{
                    fontSize: '0.68rem',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0,0,0,0.2)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ borderRadius: '10px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm shadow-glow"
            onClick={handleApply}
            style={{
              borderRadius: '10px',
              padding: '8px 18px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={14} /> {isEditing ? 'Update Bubble' : 'Add Bubble to Meme'}
          </button>
        </div>
      </div>
    </div>
  );
}
