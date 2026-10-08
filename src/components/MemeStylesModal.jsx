import React, { useState } from 'react';
import { Flame, X, Plus, Check, MessageCircle, Sparkles } from 'lucide-react';

const TwitterVerifiedBadge = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="#1d9bf0" style={{ flexShrink: 0 }}>
    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91c-1.31.67-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.72 4.28-3.53-3.53 1.41-1.41 2.12 2.12 5.66-5.66 1.41 1.41-7.07 7.07z" />
  </svg>
);

export default function MemeStylesModal({
  isOpen,
  onClose,
  onAddTweetCard,
  onAddChatBubble
}) {
  const [selectedStyle, setSelectedStyle] = useState('tweet'); // 'tweet' | 'chat'

  // 2. Fake Tweet state
  const [tweetName, setTweetName] = useState('Elon Musk');
  const [tweetHandle, setTweetHandle] = useState('@elonmusk');
  const [tweetText, setTweetText] = useState('thinking about deleting the database and moving to the woods');
  const [tweetVerified, setTweetVerified] = useState(true);
  const [tweetTheme, setTweetTheme] = useState('dark'); // 'dark' | 'dim' | 'light'

  // 3. Chat Bubble state
  const [chatStyle, setChatStyle] = useState('imessage-send');
  const [chatText, setChatText] = useState('are you free to hop on a quick 5-min call?');

  if (!isOpen) return null;

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
          maxWidth: '560px',
          background: 'rgba(20, 20, 28, 0.96)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.06)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '88vh'
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
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
                flexShrink: 0
              }}
            >
              <Flame size={18} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                Meme Style
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

        {/* Unified All-in-One Format Switcher (No categories) */}
        <div style={{ padding: '12px 20px 0', background: 'rgba(0,0,0,0.15)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '6px',
              padding: '4px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            {/* 1. Tweet Card */}
            <button
              type="button"
              onClick={() => setSelectedStyle('tweet')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 10px',
                borderRadius: '999px',
                borderRadius: '9px',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: selectedStyle === 'tweet' ? 'var(--primary-gradient)' : 'transparent',
                color: selectedStyle === 'tweet' ? '#ffffff' : 'rgba(255,255,255,0.65)',
                boxShadow: selectedStyle === 'tweet' ? '0 4px 12px rgba(249, 115, 22, 0.3)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '0.95rem', fontWeight: 900, lineHeight: 1 }}>𝕏</span>
              <span>Tweet Card</span>
            </button>

            {/* 3. Chat Bubble */}
            <button
              type="button"
              onClick={() => setSelectedStyle('chat')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 10px',
                borderRadius: '9px',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: selectedStyle === 'chat' ? 'var(--primary-gradient)' : 'transparent',
                color: selectedStyle === 'chat' ? '#ffffff' : 'rgba(255,255,255,0.65)',
                boxShadow: selectedStyle === 'chat' ? '0 4px 12px rgba(249, 115, 22, 0.3)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <MessageCircle size={14} />
              <span>Chat Bubble</span>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* FORMAT 1: FAKE TWEET / X POST CARD */}
          {selectedStyle === 'tweet' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Live Visual Preview */}
              <div
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  borderRadius: '14px',
                  border: '1px dashed rgba(255,255,255,0.2)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Live Preview
                  </span>
                  {/* Theme switcher */}
                  <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '2px' }}>
                    {['dark', 'dim', 'light'].map((th) => (
                      <button
                        key={th}
                        type="button"
                        onClick={() => setTweetTheme(th)}
                        style={{
                          border: 'none',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                          background: tweetTheme === th ? 'var(--primary-gradient)' : 'transparent',
                          color: tweetTheme === th ? '#ffffff' : 'rgba(255,255,255,0.6)'
                        }}
                      >
                        {th}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    background: tweetTheme === 'light' ? '#ffffff' : (tweetTheme === 'dim' ? '#15202b' : '#000000'),
                    color: tweetTheme === 'light' ? '#0f1419' : '#ffffff',
                    border: `1px solid ${tweetTheme === 'light' ? '#e1e8ed' : (tweetTheme === 'dim' ? '#38444d' : '#2f3336')}`,
                    borderRadius: '16px',
                    padding: '14px 16px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #06b6d4, #a855f7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        color: '#fff',
                        fontSize: '0.85rem',
                        flexShrink: 0
                      }}
                    >
                      {(tweetName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tweetName || 'Display Name'}
                        </span>
                        {tweetVerified && <TwitterVerifiedBadge />}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: tweetTheme === 'light' ? '#536471' : '#71767b' }}>
                        {tweetHandle ? (tweetHandle.startsWith('@') ? tweetHandle : `@${tweetHandle}`) : '@username'}
                      </div>
                    </div>
                    <span style={{ fontSize: '1.05rem', fontWeight: 900, color: tweetTheme === 'light' ? '#0f1419' : '#fff' }}>𝕏</span>
                  </div>

                  <div style={{ fontSize: '0.88rem', lineHeight: 1.4, wordBreak: 'break-word', whiteSpace: 'pre-wrap', marginBottom: '10px' }}>
                    {tweetText || 'What is happening?!'}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderTop: `1px solid ${tweetTheme === 'light' ? '#f0f3f4' : (tweetTheme === 'dim' ? '#2f3b44' : '#222528')}`,
                      paddingTop: '8px',
                      fontSize: '0.72rem',
                      color: tweetTheme === 'light' ? '#536471' : '#71767b'
                    }}
                  >
                    <span>💬 1.2K</span>
                    <span>🔁 8.4K</span>
                    <span>❤️ 42.6K</span>
                    <span>📊 1.8M</span>
                  </div>
                </div>
              </div>

              {/* Form Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Display Name
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={tweetName}
                      onChange={(e) => setTweetName(e.target.value)}
                      placeholder="e.g. Elon Musk"
                      style={{ width: '100%', fontSize: '0.82rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Handle (@username)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={tweetHandle}
                      onChange={(e) => setTweetHandle(e.target.value)}
                      placeholder="e.g. @elonmusk"
                      style={{ width: '100%', fontSize: '0.82rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      Tweet Text
                    </label>
                    <label style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#38bdf8', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={tweetVerified}
                        onChange={(e) => setTweetVerified(e.target.checked)}
                        style={{ cursor: 'pointer', accentColor: '#1d9bf0' }}
                      />
                      Verified Badge
                    </label>
                  </div>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={tweetText}
                    onChange={(e) => setTweetText(e.target.value)}
                    placeholder="What is happening?!"
                    style={{ width: '100%', fontSize: '0.85rem', resize: 'vertical', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}
                  />
                </div>
              </div>

              {/* CTA */}
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => {
                  onAddTweetCard({
                    name: tweetName,
                    handle: tweetHandle,
                    text: tweetText,
                    verified: tweetVerified,
                    theme: tweetTheme
                  });
                  onClose();
                }}
                style={{
                  fontWeight: 700,
                  padding: '10px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} /> Add Tweet Card to Meme
              </button>
            </div>
          )}

          {/* FORMAT 3: CHAT BUBBLE (iMessage / WhatsApp) */}
          {selectedStyle === 'chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Live Visual Preview */}
              <div
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  borderRadius: '14px',
                  border: '1px dashed rgba(255,255,255,0.2)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Live Preview
                </div>

                <div style={{ display: 'flex', justifyContent: chatStyle.includes('send') ? 'flex-end' : 'flex-start', padding: '6px 0' }}>
                  <div
                    style={{
                      maxWidth: '82%',
                      padding: '10px 14px',
                      borderRadius: '18px',
                      borderBottomRightRadius: chatStyle === 'imessage-send' || chatStyle === 'whatsapp-send' ? '4px' : '18px',
                      borderBottomLeftRadius: chatStyle === 'imessage-receive' || chatStyle === 'whatsapp-receive' ? '4px' : '18px',
                      background: chatStyle === 'imessage-send'
                        ? 'linear-gradient(135deg, #007aff, #0062cc)'
                        : (chatStyle === 'whatsapp-send'
                          ? '#005c4b'
                          : (chatStyle === 'imessage-receive' ? '#26252a' : '#202c33')),
                      color: '#ffffff',
                      fontSize: '0.86rem',
                      lineHeight: 1.35,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      wordBreak: 'break-word'
                    }}
                  >
                    {chatText || 'Type your message...'}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '3px', marginTop: '4px', fontSize: '0.62rem', opacity: 0.7 }}>
                      <span>10:42 AM</span>
                      {chatStyle.includes('whatsapp') && <span>✓✓</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Platform & Bubble Style
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {[
                      { id: 'imessage-send', label: 'iMessage (Sent Blue)' },
                      { id: 'imessage-receive', label: 'iMessage (Received)' },
                      { id: 'whatsapp-send', label: 'WhatsApp (Sent Green)' },
                      { id: 'whatsapp-receive', label: 'WhatsApp (Received)' }
                    ].map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setChatStyle(style.id)}
                        style={{
                          border: chatStyle === style.id ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px',
                          padding: '7px 8px',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: chatStyle === style.id ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.04)',
                          color: chatStyle === style.id ? 'var(--cyber-cyan)' : '#ffffff',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Message Text
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder="Type message..."
                    style={{ width: '100%', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}
                  />
                </div>
              </div>

              {/* CTA */}
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => {
                  onAddChatBubble({ style: chatStyle, text: chatText });
                  onClose();
                }}
                style={{
                  fontWeight: 700,
                  padding: '10px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} /> Add Chat Bubble
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
