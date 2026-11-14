// The Instagram post card as it will look on the meme (Social Cards Studio's preview, MemeStylesModal).
// `s` is the modal's state and handlers.
import { MessageCircle, Repeat, Heart, Bookmark, Send, Upload, Image as ImageIcon } from 'lucide-react';
import { InstagramVerifiedBadge } from './badges';

export default function InstagramPreview({ s }) {
  const {
    igUsername, igSubtitle, igText, igVerified, igHasStoryRing, igLikesCount,
    igCommentsCount, igRepostsCount, igSharesCount, igFollowText, igTopCommentUser, igTopCommentText,
    igTime, igShowTranslation, igTheme, igAvatarBg, igPostImage, handleUploadPostImage,
  } = s;

  return (
    <div
      style={{
        background: igTheme === 'light' ? '#ffffff' : '#000000',
        color: igTheme === 'light' ? '#262626' : '#ffffff',
        border: igTheme === 'light' ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}
    >
      {/* Header: Avatar, Username, Subtitle, 3-dots */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Avatar with Rainbow Story Ring */}
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              padding: igHasStoryRing ? 2 : 0,
              background: igHasStoryRing
                ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: igHasStoryRing ? (igTheme === 'light' ? '2px solid #ffffff' : '2px solid #000000') : 'none',
                background: igAvatarBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#ffffff',
                fontSize: '0.95rem'
              }}
            >
              {(igUsername || 'U').charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Username & Subtitle */}
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.25 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.90rem', color: igTheme === 'light' ? '#262626' : '#ffffff' }}>
                {igUsername || 'username'}
              </span>
              {igVerified && <InstagramVerifiedBadge size={14} />}
            </div>
            {igSubtitle && (
              <span style={{ fontSize: '0.72rem', color: igTheme === 'light' ? '#737373' : '#a8a8a8' }}>
                {igSubtitle}
              </span>
            )}
          </div>
        </div>

        {/* Follow button + 3-dots menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            style={{
              background: igTheme === 'dark' ? '#262626' : '#efefef',
              border: 'none',
              borderRadius: 8,
              padding: '5px 14px',
              fontWeight: 700,
              fontSize: '0.84rem',
              color: igTheme === 'light' ? '#000000' : '#ffffff',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {igFollowText || 'Follow'}
          </button>
          <div style={{ display: 'flex', gap: '3px', color: igTheme === 'light' ? '#262626' : '#ffffff' }}>
            <span style={{ fontSize: '1.2rem', lineHeight: 0.5, letterSpacing: '1px' }}>•••</span>
          </div>
        </div>
      </div>

      {/* Post Image (User Editable / Custom Uploaded) */}
      <div
        style={{
          width: '100%',
          maxHeight: '220px',
          aspectRatio: '16 / 11',
          background: igTheme === 'light' ? '#f3f4f6' : '#111827',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {igPostImage ? (
          <img
            src={igPostImage}
            alt="Post preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#9ca3af' }}>
            <ImageIcon size={32} strokeWidth={1.5} />
            <span style={{ fontSize: '0.76rem' }}>No photo uploaded</span>
          </div>
        )}

        {/* Quick Image Upload Button on Preview */}
        <label
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            padding: '4px 10px',
            borderRadius: '999px',
            fontSize: '0.70rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)'
          }}
        >
          <Upload size={11} />
          <span>Change Photo</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleUploadPostImage}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Content Area Below Image: Actions -> Caption -> Time */}
      <div style={{ padding: '10px 14px 14px 14px' }}>
        {/* Modern Action Icons Row — inline icon + count */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px',
            color: igTheme === 'light' ? '#262626' : '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Heart size={21} strokeWidth={2} style={{ color: '#ff3040', fill: '#ff3040' }} />
              <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>{igLikesCount || '1,583'}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MessageCircle size={21} strokeWidth={2} />
              <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>{igCommentsCount || '15'}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Repeat size={21} strokeWidth={2} />
              <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>{igRepostsCount || '15'}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Send size={20} strokeWidth={2} />
              <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>{igSharesCount || '295'}</span>
            </span>
          </div>
          <Bookmark size={21} strokeWidth={2} />
        </div>

        {/* Caption Content (BELOW LIKES ICON & LIKES COUNT) */}
        <div
          style={{
            fontSize: '0.86rem',
            lineHeight: 1.4,
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            color: igTheme === 'light' ? '#262626' : '#ffffff',
            marginBottom: '6px'
          }}
        >
          <strong style={{ marginRight: '6px', fontWeight: 700 }}>{igUsername || 'username'}</strong>
          <span>{igText || 'Caption here...'}</span>
        </div>

        {/* Optional Top / Pinned Comment */}
        {igTopCommentUser && igTopCommentText && (
          <div style={{ fontSize: '0.80rem', lineHeight: 1.35, marginBottom: '4px', color: igTheme === 'light' ? '#262626' : '#ffffff' }}>
            <strong style={{ marginRight: '6px', fontWeight: 700 }}>{igTopCommentUser}</strong>
            <span>{igTopCommentText}</span>
          </div>
        )}

        {/* Timestamp & Translation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
          <span style={{ fontSize: '0.68rem', color: igTheme === 'light' ? '#8e8e8e' : '#737373', textTransform: 'none' }}>
            {igTime || '28 September'}
          </span>
          {igShowTranslation === true && (
            <>
              <span style={{ fontSize: '0.68rem', color: igTheme === 'light' ? '#8e8e8e' : '#737373' }}>·</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: igTheme === 'light' ? '#262626' : '#ffffff', cursor: 'pointer' }}>
                See translation
              </span>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
