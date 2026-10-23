import React from 'react';

export default function TweetCardEditor({
  activeCaption,
  updateActiveCaption,
  updateActiveCaptionProps,
}) {
  return (
    <>
      {activeCaption.isTweetCard && (
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
              <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>𝕏</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>X / Tweet Card</span>
            </div>
            <div style={{ display: 'flex', gap: '3px' }}>
              {['dark', 'dim', 'light'].map((th) => (
                <button
                  key={th}
                  type="button"
                  className={`btn btn-xs ${(activeCaption.tweetTheme || 'dark') === th ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => {
                    const newColor = th === 'light' ? '#0f1419' : '#ffffff';
                    updateActiveCaptionProps({ tweetTheme: th, color: newColor });
                  }}
                  style={{ fontSize: '0.65rem', padding: '2px 6px', textTransform: 'capitalize' }}
                >
                  {th}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Display Name</label>
              <input
                type="text"
                className="form-input"
                value={activeCaption.tweetName || 'Elon Musk'}
                onChange={(e) => updateActiveCaption('tweetName', e.target.value)}
                style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Handle</label>
              <input
                type="text"
                className="form-input"
                value={activeCaption.tweetHandle || '@elonmusk'}
                onChange={(e) => updateActiveCaption('tweetHandle', e.target.value)}
                style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
              />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>Tweet Content</label>
              <label style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#38bdf8' }}>
                <input
                  type="checkbox"
                  checked={activeCaption.tweetVerified !== false}
                  onChange={(e) => updateActiveCaption('tweetVerified', e.target.checked)}
                />
                Verified
              </label>
            </div>
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
