// The tweet card as it will look on the meme (Social Cards Studio's preview, MemeStylesModal).
// `s` is the modal's state and handlers.
import { MessageCircle, Repeat, Heart, Bookmark, Share2 } from 'lucide-react';
import { TwitterVerifiedBadge, XLogo } from './badges';

export default function TweetPreview({ s }) {
  const {
    tweetName, tweetHandle, tweetText, tweetVerified, tweetTheme, tweetAvatarBg,
  } = s;

  return (
    <div
      style={{
        background: tweetTheme === 'light' ? '#ffffff' : (tweetTheme === 'dim' ? '#15202b' : '#000000'),
        color: tweetTheme === 'light' ? '#0f1419' : '#ffffff',
        border: tweetTheme === 'light' ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        padding: '14px 16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: tweetAvatarBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: '#ffffff',
              fontSize: '1rem',
              flexShrink: 0
            }}
          >
            {(tweetName || 'U').charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: tweetTheme === 'light' ? '#0f1419' : '#ffffff' }}>
                {tweetName || 'Name'}
              </span>
              {tweetVerified && <TwitterVerifiedBadge size={15} checkColor={tweetTheme === 'light' ? '#ffffff' : '#000000'} />}
            </div>
            <span style={{ fontSize: '0.78rem', color: tweetTheme === 'light' ? '#536471' : '#71767b' }}>
              {tweetHandle || '@handle'}
            </span>
          </div>
        </div>
        <XLogo size={18} color={tweetTheme === 'light' ? '#0f1419' : '#ffffff'} />
      </div>

      <div style={{ fontSize: '0.95rem', lineHeight: 1.38, marginBottom: '12px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
        {tweetText || 'Tweet something...'}
      </div>

      <div style={{ fontSize: '0.74rem', color: tweetTheme === 'light' ? '#536471' : '#71767b', marginBottom: '10px', display: 'flex', gap: '6px' }}>
        <span>10:42 PM · Oct 8, 2026</span>
        <span>·</span>
        <strong style={{ color: tweetTheme === 'light' ? '#0f1419' : '#ffffff' }}>18.2M Views</strong>
      </div>

      <div style={{ borderTop: tweetTheme === 'light' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', color: tweetTheme === 'light' ? '#536471' : '#71767b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem' }}>
          <MessageCircle size={15} /> 14.2K
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem' }}>
          <Repeat size={15} /> 62.8K
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem' }}>
          <Heart size={15} /> 420.5K
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem' }}>
          <Bookmark size={15} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem' }}>
          <Share2 size={15} />
        </div>
      </div>
    </div>
  );
}
