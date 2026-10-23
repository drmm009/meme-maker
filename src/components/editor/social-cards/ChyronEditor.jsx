import React from 'react';
import { Tv } from 'lucide-react';

export default function ChyronEditor({
  activeCaption,
  updateActiveCaption,
  updateActiveCaptionProps,
}) {
  return (
    <>
      {activeCaption.isBreakingNews && (
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tv size={14} style={{ color: '#ef4444' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>TV Chyron Overlay</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Channel / Bug</label>
              <input
                type="text"
                className="form-input"
                value={activeCaption.newsChannel || 'BREAKING NEWS'}
                onChange={(e) => updateActiveCaption('newsChannel', e.target.value)}
                style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Bottom Ticker</label>
              <input
                type="text"
                className="form-input"
                value={activeCaption.newsTicker || 'DEVELOPING STORY - DETAILS TO FOLLOW'}
                onChange={(e) => updateActiveCaption('newsTicker', e.target.value)}
                style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Headline</label>
            <input
              type="text"
              className="form-input"
              value={activeCaption.newsHeadline || activeCaption.text || ''}
              onChange={(e) => updateActiveCaptionProps({ text: e.target.value, newsHeadline: e.target.value })}
              style={{ width: '100%', fontSize: '0.82rem', padding: '4px 8px' }}
            />
          </div>
        </div>
      )}
    </>
  );
}
