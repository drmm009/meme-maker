import React, { useState } from 'react';
import { X, Plus, User, AtSign, Sparkles, Dices, Check, MessageCircle, Repeat, Heart, Bookmark, Share2 } from 'lucide-react';

export const TwitterVerifiedBadge = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#1d9bf0" style={{ flexShrink: 0, display: 'inline-block' }}>
    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91c-1.31.67-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.72 4.28-3.53-3.53 1.41-1.41 2.12 2.12 5.66-5.66 1.41 1.41-7.07 7.07z" />
  </svg>
);

const XLogo = ({ size = 16, color = '#ffffff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const PERSONA_PRESETS = [
  {
    id: 'elon',
    label: '🚀 Elon Musk',
    name: 'Elon Musk',
    handle: '@elonmusk',
    verified: true,
    avatarBg: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    text: 'thinking about deleting the database and moving to the woods'
  },
  {
    id: 'sama',
    label: '🤖 Sam Altman',
    name: 'Sam Altman',
    handle: '@sama',
    verified: true,
    avatarBg: 'linear-gradient(135deg, #10b981, #06b6d4)',
    text: 'we just achieved AGI internally, it likes cold brew and refuses to attend standup'
  },
  {
    id: 'cat',
    label: '🐱 Wholesome Cat',
    name: 'Cat Thoughts',
    handle: '@catvibes',
    verified: false,
    avatarBg: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    text: 'i am not fat. i am simply storing excess charisma for the upcoming winter.'
  },
  {
    id: 'techlead',
    label: '💼 Tech CEO',
    name: 'Tech Founder',
    handle: '@techfounder_xyz',
    verified: true,
    avatarBg: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    text: 'Just raised $40M pre-seed to replace daily standups with an AI that just nods silently'
  },
  {
    id: 'dev',
    label: '☕ Junior Dev',
    name: 'Junior Developer',
    handle: '@git_commit_push',
    verified: false,
    avatarBg: 'linear-gradient(135deg, #6366f1, #3b82f6)',
    text: 'Pushed directly to main on a Friday at 5:01 PM. Pray for me.'
  }
];

const RANDOM_TWEETS = [
  'thinking about deleting the database and moving to the woods',
  'i have concluded that coffee is just temporary courage in liquid form',
  'pushed directly to main. shutting laptop. see you all on monday.',
  'my code works and i have no idea why',
  'sleeping 8 hours feels like a cheat code that nobody taught me in school',
  'if you feel like nobody cares about you, try missing two credit card payments',
  'the client just asked if we can make the website work without internet',
  'ai will not take your job, but someone who prompts ai while eating snacks might',
  'it worked fine on localhost, therefore it is a cloud infrastructure problem',
  'i have 99 problems and 87 of them are completely made up scenarios in my head'
];

const METRICS_PRESETS = [
  { id: 'viral', label: '🔥 Viral', text: '💬 14.2K    🔁 62.8K    ❤️ 420.5K    📊 18.2M', display: { replies: '14.2K', retweets: '62.8K', likes: '420.5K', views: '18.2M' } },
  { id: 'ratio', label: '📉 Ratioed', text: '💬 84.1K    🔁 412    ❤️ 1.2K    📊 6.4M', display: { replies: '84.1K', retweets: '412', likes: '1.2K', views: '6.4M' } },
  { id: 'normal', label: '💬 Casual', text: '💬 142    🔁 890    ❤️ 4.6K    📊 72K', display: { replies: '142', retweets: '890', likes: '4.6K', views: '72K' } }
];

export default function MemeStylesModal({
  isOpen,
  onClose,
  onAddTweetCard
}) {
  const [activePersona, setActivePersona] = useState('elon');
  const [tweetName, setTweetName] = useState('Elon Musk');
  const [tweetHandle, setTweetHandle] = useState('@elonmusk');
  const [tweetText, setTweetText] = useState('thinking about deleting the database and moving to the woods');
  const [tweetVerified, setTweetVerified] = useState(true);
  const [avatarBg, setAvatarBg] = useState('linear-gradient(135deg, #0ea5e9, #38bdf8)');

  if (!isOpen) return null;

  const handleApplyPersona = (p) => {
    setActivePersona(p.id);
    setTweetName(p.name);
    setTweetHandle(p.handle);
    setTweetVerified(p.verified);
    setTweetText(p.text);
    if (p.avatarBg) setAvatarBg(p.avatarBg);
  };

  const handleRandomTweet = () => {
    const remaining = RANDOM_TWEETS.filter(t => t !== tweetText);
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    setTweetText(pick);
  };

  const previewMetrics = METRICS_PRESETS[0];
  const cardBg = '#000000';
  const cardBorder = 'rgba(255, 255, 255, 0.12)';
  const cardText = '#ffffff';
  const cardMuted = '#71767b';


  return (
    <div
      className="modal-backdrop animate-fade-in"
      style={{
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        overflowY: 'auto',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
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
          background: 'linear-gradient(180deg, rgba(24, 24, 34, 0.98) 0%, rgba(16, 16, 24, 0.99) 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08), 0 0 40px rgba(29, 155, 240, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'min(90vh, 740px)',
          margin: 'auto'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '12px',
                background: '#000000',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                flexShrink: 0
              }}
            >
              <XLogo size={18} color="#ffffff" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
              Tweet Card
            </h3>
          </div>
          <button
            className="btn btn-icon btn-ghost btn-xs"
            onClick={onClose}
            style={{
              borderRadius: '50%',
              width: 30,
              height: 30,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
            title="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Persona Quick-Presets Carousel */}
        <div
          className="horizontal-scroll-only"
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
          style={{
            padding: '10px 20px',
            background: 'rgba(0, 0, 0, 0.25)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            overflowY: 'hidden',
            flexWrap: 'nowrap',
            whiteSpace: 'nowrap',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', marginRight: '2px', flexShrink: 0 }}>
            Presets:
          </span>
          {PERSONA_PRESETS.map((p) => {
            const isSelected = activePersona === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPersona(p)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '0.73rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected ? 'rgba(6, 182, 212, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                  color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Content */}
        <div
          className="tweet-modal-scroll"
          style={{
            padding: '16px 20px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
          }}
        >
          
          {/* Spotlight Live Visual Preview Container */}
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(10, 10, 16, 0.9) 0%, rgba(14, 14, 22, 0.9) 100%)',
              borderRadius: '18px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)'
            }}
          >
            {/* The Actual Rendered Tweet Card */}
            <div
              style={{
                background: cardBg,
                color: cardText,
                border: `1px solid ${cardBorder}`,
                borderRadius: '16px',
                padding: '16px 18px',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
                transition: 'all 0.2s ease',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
              }}
            >
              {/* Profile Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  {/* Avatar */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: avatarBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {(tweetName || 'U').charAt(0).toUpperCase()}
                  </div>

                  {/* Name & Handle */}
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.25 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          color: cardText,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {tweetName || 'Display Name'}
                      </span>
                      {tweetVerified && <TwitterVerifiedBadge size={16} />}
                    </div>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        color: cardMuted,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {tweetHandle ? (tweetHandle.startsWith('@') ? tweetHandle : `@${tweetHandle}`) : '@username'}
                    </span>
                  </div>
                </div>

                {/* 𝕏 Logo */}
                <div style={{ paddingLeft: '8px' }}>
                  <XLogo size={18} color="#ffffff" />
                </div>
              </div>

              {/* Tweet Content */}
              <div
                style={{
                  fontSize: '0.94rem',
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  color: cardText,
                  marginBottom: '12px',
                  fontWeight: 400
                }}
              >
                {tweetText || 'What is happening?!'}
              </div>

              {/* Timestamp & Views */}
              <div
                style={{
                  fontSize: '0.75rem',
                  color: cardMuted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #222528'
                }}
              >
                <span>10:42 PM · Oct 8, 2026</span>
                <span>·</span>
                <span style={{ fontWeight: 600, color: '#e7e9ea' }}>
                  {previewMetrics.display.views} Views
                </span>
              </div>

              {/* Engagement Icons Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '10px',
                  fontSize: '0.74rem',
                  color: cardMuted
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MessageCircle size={14} style={{ opacity: 0.85 }} />
                  <span>{previewMetrics.display.replies}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Repeat size={14} style={{ opacity: 0.85 }} />
                  <span>{previewMetrics.display.retweets}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Heart size={14} style={{ opacity: 0.85 }} />
                  <span>{previewMetrics.display.likes}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Bookmark size={14} style={{ opacity: 0.85 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Share2 size={14} style={{ opacity: 0.85 }} />
                </div>
              </div>
            </div>
          </div>

          {/* Form Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Account Info: Name & Handle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px' }}>
                  <User size={13} style={{ color: 'var(--cyber-cyan)' }} /> Display Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={tweetName}
                  onChange={(e) => {
                    setTweetName(e.target.value);
                    setActivePersona('custom');
                  }}
                  placeholder="e.g. Elon Musk"
                  style={{
                    width: '100%',
                    fontSize: '0.84rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '8px 12px',
                    color: '#ffffff'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px' }}>
                  <AtSign size={13} style={{ color: 'var(--cyber-cyan)' }} /> Handle
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={tweetHandle}
                  onChange={(e) => {
                    setTweetHandle(e.target.value);
                    setActivePersona('custom');
                  }}
                  placeholder="e.g. @elonmusk"
                  style={{
                    width: '100%',
                    fontSize: '0.84rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '8px 12px',
                    color: '#ffffff'
                  }}
                />
              </div>
            </div>



            {/* Tweet Textarea with Random Idea button */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Tweet Text ({tweetText.length}/280)
                </label>
                <button
                  type="button"
                  onClick={handleRandomTweet}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'var(--cyber-cyan)',
                    background: 'rgba(6, 182, 212, 0.12)',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    borderRadius: '7px',
                    padding: '2px 7px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="Insert a funny viral meme tweet"
                >
                  <Dices size={12} /> Surprise Me
                </button>
              </div>
              <textarea
                className="form-input"
                rows={2}
                value={tweetText}
                onChange={(e) => {
                  setTweetText(e.target.value);
                  setActivePersona('custom');
                }}
                placeholder="What is happening?!"
                style={{
                  width: '100%',
                  fontSize: '0.82rem',
                  lineHeight: 1.35,
                  minHeight: '48px',
                  maxHeight: '90px',
                  resize: 'vertical',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '6px 10px',
                  color: '#ffffff',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              />
            </div>
          </div>
        </div>

        {/* Pinned Sticky Footer CTA */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(16, 16, 24, 0.98)',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <button
            type="button"
            className="btn btn-sm btn-primary hover-lift"
            onClick={() => {
              onAddTweetCard({
                name: tweetName,
                handle: tweetHandle,
                text: tweetText,
                verified: tweetVerified,
                theme: 'dark',
                time: '10:42 PM · Oct 8, 2026',
                metrics: '💬 14.2K    🔁 62.8K    ❤️ 420.5K    📊 18.2M'
              });
              onClose();
            }}
            style={{
              width: '100%',
              fontWeight: 800,
              padding: '12px 18px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '0.92rem',
              boxShadow: '0 8px 24px rgba(249, 115, 22, 0.35)'
            }}
          >
            <Plus size={18} strokeWidth={2.5} /> Add Tweet Card to Meme
          </button>
        </div>
      </div>
    </div>
  );
}
