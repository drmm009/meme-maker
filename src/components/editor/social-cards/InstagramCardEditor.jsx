import React from 'react';
import { Upload } from 'lucide-react';
import { InstagramLogo, IG_PRESET_IMAGES } from '../../MemeStylesModal';

export default function InstagramCardEditor({
  activeCaption,
  updateActiveCaption,
  updateActiveCaptionProps,
}) {
  return (
    <>
      {activeCaption.isInstagramCard && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            background: 'var(--bg-surface-1)',
            padding: '10px',
            borderRadius: '10px',
            border: '1px solid var(--glass-border)',
            marginTop: '4px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <InstagramLogo size={16} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>Instagram Card</span>
            </div>
            <div style={{ display: 'flex', gap: '3px' }}>
              {['dark', 'light'].map((th) => (
                <button
                  key={th}
                  type="button"
                  className={`btn btn-xs ${(activeCaption.igTheme || 'dark') === th ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => {
                    const newColor = th === 'light' ? '#262626' : '#f5f5f5';
                    updateActiveCaptionProps({ igTheme: th, color: newColor });
                  }}
                  style={{ fontSize: '0.65rem', padding: '2px 6px', textTransform: 'capitalize' }}
                >
                  {th}
                </button>
              ))}
            </div>
          </div>

          {/* Post Photo Uploader & Presets */}
          <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.70rem', fontWeight: 700, color: '#ff5e36' }}>Post Photo</span>
              <label
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  background: 'rgba(255, 94, 54, 0.25)',
                  border: '1px solid #ff5e36',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Upload size={11} />
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        updateActiveCaptionProps({ igPostImage: ev.target.result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>

            {/* Preset Photo Chips */}
            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
              {IG_PRESET_IMAGES && Object.entries(IG_PRESET_IMAGES).map(([key, src]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateActiveCaptionProps({ igPostImage: src })}
                  style={{
                    padding: '2px 7px',
                    borderRadius: '6px',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    background: activeCaption.igPostImage === src ? 'rgba(255,94,54,0.3)' : 'rgba(255,255,255,0.06)',
                    border: activeCaption.igPostImage === src ? '1px solid #ff5e36' : '1px solid transparent',
                    color: activeCaption.igPostImage === src ? '#ff5e36' : 'rgba(255,255,255,0.7)',
                    cursor: 'pointer'
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Username</label>
              <input
                type="text"
                className="form-input"
                value={activeCaption.igUsername || 'zuck'}
                onChange={(e) => updateActiveCaption('igUsername', e.target.value)}
                style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Subtitle / Audio</label>
              <input
                type="text"
                className="form-input"
                value={activeCaption.igSubtitle || 'Original audio'}
                onChange={(e) => updateActiveCaption('igSubtitle', e.target.value)}
                style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#38bdf8' }}>
              <input
                type="checkbox"
                checked={activeCaption.igVerified !== false}
                onChange={(e) => updateActiveCaption('igVerified', e.target.checked)}
              />
              Verified Rosette
            </label>
            <label style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#f43f5e' }}>
              <input
                type="checkbox"
                checked={activeCaption.igHasStoryRing !== false}
                onChange={(e) => updateActiveCaption('igHasStoryRing', e.target.checked)}
              />
              Story Ring
            </label>
          </div>

          {/* Likes Count + Timestamp (2-col grid) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Likes Count</label>
              <input
                type="text"
                className="form-input"
                value={activeCaption.igLikesCount || '1,583'}
                onChange={(e) => updateActiveCaption('igLikesCount', e.target.value)}
                style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Timestamp</label>
              <input
                type="text"
                className="form-input"
                value={activeCaption.igTime || '28 September'}
                onChange={(e) => updateActiveCaption('igTime', e.target.value)}
                style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
              />
            </div>
          </div>

          {/* Comments Count + Reposts Count */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Comments Count</label>
              <input
                type="text"
                className="form-input"
                value={activeCaption.igCommentsCount ?? '15'}
                onChange={(e) => updateActiveCaption('igCommentsCount', e.target.value)}
                placeholder="e.g. 15"
                style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Reposts Count</label>
              <input
                type="text"
                className="form-input"
                value={activeCaption.igRepostsCount ?? '15'}
                onChange={(e) => updateActiveCaption('igRepostsCount', e.target.value)}
                placeholder="e.g. 15"
                style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
              />
            </div>
          </div>

          {/* Shares Count + Follow Text */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Shares Count</label>
              <input
                type="text"
                className="form-input"
                value={activeCaption.igSharesCount ?? '295'}
                onChange={(e) => updateActiveCaption('igSharesCount', e.target.value)}
                placeholder="e.g. 295"
                style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Follow Text</label>
              <input
                type="text"
                className="form-input"
                value={activeCaption.igFollowText || 'Follow'}
                onChange={(e) => updateActiveCaption('igFollowText', e.target.value)}
                placeholder="e.g. Follow"
                style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
              />
            </div>
          </div>

          {/* Top / Pinned Comment */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Top Commenter</label>
              <input
                type="text"
                className="form-input"
                value={activeCaption.igTopCommentUser || ''}
                onChange={(e) => updateActiveCaption('igTopCommentUser', e.target.value)}
                placeholder="e.g. cristiano"
                style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Comment Text</label>
              <input
                type="text"
                className="form-input"
                value={activeCaption.igTopCommentText || ''}
                onChange={(e) => updateActiveCaption('igTopCommentText', e.target.value)}
                placeholder="e.g. AGI when? 😂👏"
                style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
              />
            </div>
          </div>

          {/* Caption (Below Likes) */}
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Caption (Below Likes)</label>
            <textarea
              className="form-input"
              rows={2}
              value={activeCaption.text || ''}
              onChange={(e) => updateActiveCaption('text', e.target.value)}
              style={{ width: '100%', fontSize: '0.82rem', padding: '4px 8px', resize: 'vertical' }}
            />
          </div>
        </div>
      )}
    </>
  );
}
