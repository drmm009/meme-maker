import React, { useState } from 'react';
import { X, Plus, User, AtSign, Sparkles, Dices, Check, MessageCircle, Repeat, Heart, Bookmark, Share2 } from 'lucide-react';
import BottomSheet from './BottomSheet';

export const TwitterVerifiedBadge = ({ size = 16, color = '#1d9bf0', checkColor = '#ffffff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0, display: 'inline-block' }}>
    <path fill={color} d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91c-1.31.67-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z" />
    <path fill={checkColor} d="M10.53 16.28l-3.53-3.53 1.41-1.41 2.12 2.12 5.66-5.66 1.41 1.41-7.07 7.07z" />
  </svg>
);

const XLogo = ({ size = 16, color = 'currentColor' }) => (
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

/* ─── Editor Dock Input Style Helper ─── */
const inputStyle = {
  width: '100%',
  fontSize: '0.86rem',
  background: '#16181f',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.14)',
  padding: '10px 14px',
  color: '#ffffff',
  outline: 'none',
  boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.25)',
  transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  boxSizing: 'border-box'
};

const inputFocusHandler = (e) => {
  e.target.style.borderColor = '#ff5e36';
  e.target.style.background = '#1c1e26';
  e.target.style.boxShadow = '0 0 0 3px rgba(255, 94, 54, 0.18), inset 0 1px 2px rgba(0, 0, 0, 0.3)';
};
const inputBlurHandler = (e) => {
  e.target.style.borderColor = 'rgba(255, 255, 255, 0.14)';
  e.target.style.background = '#16181f';
  e.target.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.25)';
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
      icon={<XLogo size={17} />}
      maxHeight="86vh"
      contentStyle={{ padding: '8px 18px 24px 18px', overflowY: 'auto' }}
      footer={
        <button
          type="button"
          className="btn btn-sm hover-lift"
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
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.92rem',
            background: 'linear-gradient(135deg, #ff5e36 0%, #ff3b30 100%)',
            border: 'none',
            color: '#ffffff',
            boxShadow: '0 6px 20px rgba(255, 94, 54, 0.45)',
            letterSpacing: '-0.01em',
            cursor: 'pointer'
          }}
        >
          <Plus size={18} strokeWidth={2.5} /> Add Tweet Card to Meme
        </button>
      }
    >
      {/* ─── Persona Presets Carousel (Editor Secondary Toolbar Pill UI) ─── */}
      <div
        className="bs-category-bar"
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
        style={{
          padding: '2px 2px 10px 2px',
          marginBottom: '12px'
        }}
      >
        {PERSONA_PRESETS.map((p) => {
          const isSelected = activePersona === p.id;
          return (
            <button
              key={p.id}
              type="button"
              className={`bs-category-btn ${isSelected ? 'active' : ''}`}
              onClick={() => handleApplyPersona(p)}
            >
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Content Stack ─── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* ─── Live Preview Container (Editor Dock UI) ─── */}
        <div
          style={{
            background: '#16181f',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
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
              background: '#ff5e36',
              boxShadow: '0 0 8px rgba(255, 94, 54, 0.6)'
            }} />
            <span style={{
              fontSize: '0.66rem',
              fontWeight: 800,
              color: 'rgba(255, 255, 255, 0.45)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em'
            }}>
              Live Preview
            </span>
          </div>

          {/* The Tweet Card */}
          <div
            style={{
              background: '#0a0b0e',
              color: cardText,
              border: '1px solid rgba(255, 255, 255, 0.10)',
              borderRadius: '16px',
              padding: '16px 18px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
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

        {/* ─── Form Controls (Editor Dock Container & Pill Buttons) ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Section Divider with Label */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '2px'
          }}>
            <div style={{
              height: '1px',
              flex: 1,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)'
            }} />
            <span style={{
              fontSize: '0.64rem',
              fontWeight: 800,
              color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
              flexShrink: 0
            }}>
              Customize Card
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
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.65)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginBottom: '6px'
              }}>
                <User size={13} style={{ color: '#ff5e36' }} /> Display Name
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
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.65)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginBottom: '6px'
              }}>
                <AtSign size={13} style={{ color: '#ff5e36' }} /> Handle
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
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.65)'
              }}>
                Tweet Text
                <span style={{
                  marginLeft: '6px',
                  fontSize: '0.68rem',
                  fontWeight: 500,
                  color: tweetText.length > 240 ? '#ef4444' : 'rgba(255,255,255,0.35)'
                }}>
                  {tweetText.length}/280
                </span>
              </label>
              <button
                type="button"
                onClick={handleRandomTweet}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: '#ff5e36',
                  background: '#16181f',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '9999px',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
                  transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1c1e26';
                  e.currentTarget.style.borderColor = 'rgba(255, 94, 54, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#16181f';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                  e.currentTarget.style.transform = 'none';
                }}
                title="Insert a funny viral meme tweet"
              >
                <Dices size={13} strokeWidth={2.4} /> Surprise Me
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
                minHeight: '56px',
                maxHeight: '120px',
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
