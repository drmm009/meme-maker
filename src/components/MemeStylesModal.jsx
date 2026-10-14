import React, { useState } from 'react';
import { X, Plus, User, AtSign, Sparkles, Dices, Check, MessageCircle, Repeat, Heart, Bookmark, Share2 } from 'lucide-react';
import BottomSheet from './BottomSheet';

export const TwitterVerifiedBadge = ({ size = 16, color = '#1d9bf0', checkColor = '#ffffff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0, display: 'inline-block' }}>
    <path fill={color} d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91c-1.31.67-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z" />
    <path fill={checkColor} d="M10.53 16.28l-3.53-3.53 1.41-1.41 2.12 2.12 5.66-5.66 1.41 1.41-7.07 7.07z" />
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

/* ─── Elegant input style helper ─── */
const inputStyle = {
  width: '100%',
  fontSize: '0.84rem',
  background: 'rgba(255, 255, 255, 0.04)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.10)',
  padding: '10px 14px',
  color: '#ffffff',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};

const inputFocusHandler = (e) => {
  e.target.style.borderColor = 'rgba(29, 155, 240, 0.5)';
  e.target.style.boxShadow = '0 0 0 3px rgba(29, 155, 240, 0.12)';
};
const inputBlurHandler = (e) => {
  e.target.style.borderColor = 'rgba(255, 255, 255, 0.10)';
  e.target.style.boxShadow = 'none';
};

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
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Tweet Card"
      icon={
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '8px',
            background: '#000000',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <XLogo size={14} color="#ffffff" />
        </div>
      }
      maxHeight="86vh"
      contentStyle={{ padding: '0', gap: '0' }}
      footer={
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
            padding: '13px 18px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.92rem',
            boxShadow: '0 8px 24px rgba(249, 115, 22, 0.35)',
            letterSpacing: '-0.01em'
          }}
        >
          <Plus size={18} strokeWidth={2.5} /> Add Tweet Card to Meme
        </button>
      }
    >

        {/* ─── Persona Presets Carousel ─── */}
        <div
          className="horizontal-scroll-only"
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
          style={{
            padding: '12px 20px',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
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
          <span style={{
            fontSize: '0.62rem',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
            marginRight: '4px',
            flexShrink: 0
          }}>
            Personas
          </span>
          {PERSONA_PRESETS.map((p) => {
            const isSelected = activePersona === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPersona(p)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid rgba(29, 155, 240, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(29, 155, 240, 0.20), rgba(29, 155, 240, 0.08))'
                    : 'rgba(255, 255, 255, 0.04)',
                  color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  flexShrink: 0,
                  boxShadow: isSelected ? '0 2px 8px rgba(29, 155, 240, 0.15)' : 'none'
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* ─── Scrollable Content ─── */}
        <div
          className="tweet-modal-scroll bs-content-scroll"
          style={{
            padding: '18px 20px 20px 20px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.15) transparent'
          }}
        >
          
          {/* ─── Live Preview Card ─── */}
          <div
            style={{
              background: 'linear-gradient(145deg, rgba(14, 14, 22, 0.95) 0%, rgba(8, 8, 14, 0.95) 100%)',
              borderRadius: '18px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 4px 16px rgba(0,0,0,0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Subtle gradient overlay for depth */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '60px',
              background: 'linear-gradient(180deg, rgba(29, 155, 240, 0.04) 0%, transparent 100%)',
              pointerEvents: 'none',
              borderRadius: '18px 18px 0 0'
            }} />

            {/* "PREVIEW" label */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '10px',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#1d9bf0',
                boxShadow: '0 0 8px rgba(29, 155, 240, 0.5)'
              }} />
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                color: 'rgba(255,255,255,0.30)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em'
              }}>
                Live Preview
              </span>
            </div>

            {/* The Tweet Card */}
            <div
              style={{
                background: cardBg,
                color: cardText,
                border: `1px solid ${cardBorder}`,
                borderRadius: '16px',
                padding: '16px 18px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                position: 'relative',
                zIndex: 1
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

          {/* ─── Form Controls ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Section Label */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                height: '1px',
                flex: 1,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)'
              }} />
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                color: 'rgba(255,255,255,0.25)',
                textTransform: 'uppercase',
                letterSpacing: '0.10em',
                flexShrink: 0
              }}>
                Customize
              </span>
              <div style={{
                height: '1px',
                flex: 1,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08))'
              }} />
            </div>

            {/* Account Info: Name & Handle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
              <div>
                <label style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginBottom: '6px'
                }}>
                  <User size={12} style={{ color: '#1d9bf0' }} /> Display Name
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
                  style={inputStyle}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                />
              </div>

              <div>
                <label style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginBottom: '6px'
                }}>
                  <AtSign size={12} style={{ color: '#1d9bf0' }} /> Handle
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
                  style={inputStyle}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                />
              </div>
            </div>

            {/* Tweet Textarea with Random Idea button */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px'
              }}>
                <label style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.45)'
                }}>
                  Tweet Text
                  <span style={{
                    marginLeft: '6px',
                    fontSize: '0.66rem',
                    fontWeight: 500,
                    color: tweetText.length > 240 ? '#ef4444' : 'rgba(255,255,255,0.25)'
                  }}>
                    {tweetText.length}/280
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleRandomTweet}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.70rem',
                    fontWeight: 700,
                    color: '#1d9bf0',
                    background: 'rgba(29, 155, 240, 0.10)',
                    border: '1px solid rgba(29, 155, 240, 0.20)',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
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
                  ...inputStyle,
                  lineHeight: 1.4,
                  minHeight: '52px',
                  maxHeight: '100px',
                  resize: 'vertical'
                }}
                onFocus={inputFocusHandler}
                onBlur={inputBlurHandler}
              />
            </div>
          </div>
        </div>
      </BottomSheet>
  );
}
