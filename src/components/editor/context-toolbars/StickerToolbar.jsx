import React from 'react';
import { FlipHorizontal, Shield } from 'lucide-react';

export default function StickerToolbar({
  activeSticker,
  handleFlipActiveLayer,
  handleToggleDieCutSticker,
}) {
  return (
    <>
      {activeSticker && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <button
            type="button"
            className={`btn btn-xs vid-ctx-btn ${activeSticker.flipX ? 'active' : ''}`}
            title="Flip Horizontal (Mirror)"
            aria-label="Flip Horizontal"
            onClick={handleFlipActiveLayer}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: activeSticker.flipX ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.08)',
              border: activeSticker.flipX ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              borderRadius: '8px',
              flexShrink: 0
            }}
          >
            <FlipHorizontal style={{ width: 14, height: 14 }} />
            <span>Flip</span>
          </button>

          <div
            role="button"
            tabIndex={0}
            className={`btn btn-xs vid-ctx-btn ${activeSticker.dieCut ? 'active' : ''}`}
            title={activeSticker.dieCut ? "Die-Cut Border (Active - click to disable)" : "Die-Cut Sticker Border (White Vinyl Outline)"}
            onClick={() => handleToggleDieCutSticker()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggleDieCutSticker();
              }
            }}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '8px',
              background: activeSticker.dieCut ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              flexShrink: 0,
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <Shield style={{ width: 13, height: 13 }} />
            <span>Die-Cut</span>
          </div>
        </div>
      )}
    </>
  );
}
