import React, { useState } from 'react';
import { Sparkles, MessageCircle, Tv, Flame, X, Check, Eye, Plus, ChevronRight } from 'lucide-react';

export default function MemeStylesModal({
  isOpen,
  onClose,
  demotivational,
  onToggleDemotivational,
  onAddBreakingNews,
  onAddTweetCard,
  onAddChatBubble,
  onAddLaserEyes
}) {
  const [activeTab, setActiveTab] = useState('staples'); // 'staples' | 'social'

  // Demotivational state
  const [demoTitle, setDemoTitle] = useState(demotivational?.title || 'PROCRASTINATION');
  const [demoSubtitle, setDemoSubtitle] = useState(
    demotivational?.subtitle || 'Hard work pays off in the future, laziness pays off now.'
  );

  // Breaking News state
  const [newsChannel, setNewsChannel] = useState('MEME NEWS 24');
  const [newsHeadline, setNewsHeadline] = useState("LOCAL MAN ADMITS HE HAS NO IDEA WHAT HE'S DOING");
  const [newsTicker, setNewsTicker] = useState('OFFICIALS RECOMMEND NOT ASKING HIM ANY FOLLOW-UP QUESTIONS');

  // Fake Tweet state
  const [tweetName, setTweetName] = useState('Elon Musk');
  const [tweetHandle, setTweetHandle] = useState('@elonmusk');
  const [tweetText, setTweetText] = useState("thinking about deleting the database and moving to the woods");
  const [tweetVerified, setTweetVerified] = useState(true);
  const [tweetTheme, setTweetTheme] = useState('dark'); // 'dark' | 'dim' | 'light'

  // Chat Bubble state
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
        padding: '16px'
      }}
    >
      <div
        className="modal-card"
        style={{
          width: '100%',
          maxWidth: '580px',
          background: 'var(--bg-surface-2, #18181b)',
          borderRadius: '16px',
          border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
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
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Flame size={18} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main, #ffffff)' }}>
                Meme Styles & Social Formats
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted, #a1a1aa)' }}>
                1-click classic frames, news chyrons, tweets & chat bubbles
              </p>
            </div>
          </div>
          <button className="btn btn-icon btn-ghost btn-xs" onClick={onClose} style={{ borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setActiveTab('staples')}
            style={{
              flex: 1,
              borderRadius: 0,
              padding: '12px 16px',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: activeTab === 'staples' ? 'var(--cyber-cyan)' : 'var(--text-muted)',
              borderBottom: activeTab === 'staples' ? '2px solid var(--cyber-cyan)' : '2px solid transparent'
            }}
          >
            <Flame size={16} /> Meme Culture Staples
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setActiveTab('social')}
            style={{
              flex: 1,
              borderRadius: 0,
              padding: '12px 16px',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: activeTab === 'social' ? 'var(--cyber-cyan)' : 'var(--text-muted)',
              borderBottom: activeTab === 'social' ? '2px solid var(--cyber-cyan)' : '2px solid transparent'
            }}
          >
            <MessageCircle size={16} /> Social Formats (Tweets & Chat)
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {activeTab === 'staples' && (
            <>
              {/* 1. Demotivational Poster */}
              <div
                style={{
                  background: 'var(--bg-surface-1, rgba(255,255,255,0.03))',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 14, height: 14, border: '2px solid #fff', background: '#000' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>
                      Demotivational Poster Frame
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Classic 2000s Web Meme</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Main Title (Serif Uppercase)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={demoTitle}
                      onChange={(e) => setDemoTitle(e.target.value)}
                      placeholder="e.g. MOTIVATION, PROCRASTINATION"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Subtitle / Punchline
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={demoSubtitle}
                      onChange={(e) => setDemoSubtitle(e.target.value)}
                      placeholder="e.g. Hard work pays off in the future..."
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className={`btn btn-sm ${demotivational?.enabled ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => {
                    onToggleDemotivational({ title: demoTitle, subtitle: demoSubtitle });
                    onClose();
                  }}
                  style={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  {demotivational?.enabled ? 'Remove Poster Frame' : 'Apply Demotivational Frame'}
                </button>
              </div>

              {/* 2. Breaking News TV Chyron */}
              <div
                style={{
                  background: 'var(--bg-surface-1, rgba(255,255,255,0.03))',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tv size={16} style={{ color: '#ef4444' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>
                      Breaking News TV Chyron
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700 }}>● LIVE BROADCAST</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Station / Channel Bug
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={newsChannel}
                        onChange={(e) => setNewsChannel(e.target.value)}
                        placeholder="e.g. CNN, MEME NEWS 24"
                        style={{ width: '100%', fontSize: '0.82rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Bottom Ticker Text
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={newsTicker}
                        onChange={(e) => setNewsTicker(e.target.value)}
                        placeholder="e.g. DEVELOPING STORY..."
                        style={{ width: '100%', fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Main Breaking Headline
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={newsHeadline}
                      onChange={(e) => setNewsHeadline(e.target.value)}
                      placeholder="e.g. LOCAL MAN ADMITS..."
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    onAddBreakingNews({ headline: newsHeadline, channel: newsChannel, ticker: newsTicker });
                    onClose();
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                    border: 'none',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={16} /> Add Breaking News Overlay
                </button>
              </div>

              {/* 3. Laser Eyes Snap */}
              <div
                style={{
                  background: 'var(--bg-surface-1, rgba(255,255,255,0.03))',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Eye size={16} style={{ color: '#ef4444' }} /> Laser Eyes / Lens Flare
                  </span>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Slap glowing "Triggered" laser eyes onto faces
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-xs btn-secondary"
                    onClick={() => { onAddLaserEyes('red'); onClose(); }}
                    style={{ padding: '6px 12px', fontWeight: 700, color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)' }}
                  >
                    🔴 Red Lasers
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-secondary"
                    onClick={() => { onAddLaserEyes('blue'); onClose(); }}
                    style={{ padding: '6px 12px', fontWeight: 700, color: '#06b6d4', border: '1px solid rgba(6,182,212,0.4)' }}
                  >
                    🔵 Cyan Lasers
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'social' && (
            <>
              {/* 1. Fake Tweet / X Post */}
              <div
                style={{
                  background: 'var(--bg-surface-1, rgba(255,255,255,0.03))',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>𝕏</span>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>
                      Fake Tweet / X Post Card
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['dark', 'dim', 'light'].map((th) => (
                      <button
                        key={th}
                        type="button"
                        className={`btn btn-xs ${tweetTheme === th ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setTweetTheme(th)}
                        style={{ fontSize: '0.68rem', padding: '2px 8px', textTransform: 'capitalize' }}
                      >
                        {th}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Display Name
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={tweetName}
                      onChange={(e) => setTweetName(e.target.value)}
                      placeholder="e.g. Elon Musk"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Handle (@username)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={tweetHandle}
                      onChange={(e) => setTweetHandle(e.target.value)}
                      placeholder="e.g. @elonmusk"
                      style={{ width: '100%', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Tweet Text
                    </label>
                    <label style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#38bdf8' }}>
                      <input
                        type="checkbox"
                        checked={tweetVerified}
                        onChange={(e) => setTweetVerified(e.target.checked)}
                      />
                      Blue Checkmark
                    </label>
                  </div>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={tweetText}
                    onChange={(e) => setTweetText(e.target.value)}
                    placeholder="What is happening?!"
                    style={{ width: '100%', fontSize: '0.85rem', resize: 'vertical' }}
                  />
                </div>

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
                  style={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Add Tweet Card to Meme
                </button>
              </div>

              {/* 2. Fake iMessage / WhatsApp Chat Bubble */}
              <div
                style={{
                  background: 'var(--bg-surface-1, rgba(255,255,255,0.03))',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageCircle size={16} style={{ color: '#06b6d4' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>
                      Fake Chat Bubble (iMessage / WhatsApp)
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Bubble Style & Platform
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {[
                      { id: 'imessage-send', label: 'iMessage (Sent - Blue)' },
                      { id: 'imessage-receive', label: 'iMessage (Received - Gray)' },
                      { id: 'whatsapp-send', label: 'WhatsApp (Sent - Green)' },
                      { id: 'whatsapp-receive', label: 'WhatsApp (Received)' }
                    ].map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        className={`btn btn-xs ${chatStyle === style.id ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setChatStyle(style.id)}
                        style={{ fontSize: '0.72rem', padding: '6px', textAlign: 'center' }}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Message Text
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder="Type message..."
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    onAddChatBubble({ style: chatStyle, text: chatText });
                    onClose();
                  }}
                  style={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Add Chat Bubble
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
