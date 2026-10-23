import React from 'react';
import { Sparkles, Wand2, ScanFace } from 'lucide-react';

export default function ImageLayerToolbar({
  activeImageLayer,
  handleRemoveBackground,
  handleStartMorphFace,
  isRemovingBg,
  setShowFiltersModal,
  showFiltersModal,
}) {
  return (
    <>
      {activeImageLayer && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <button
            className="btn btn-xs vid-ctx-btn"
            title="AI Face Swap"
            onClick={() => handleStartMorphFace(activeImageLayer)}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.08)',
              flexShrink: 0
            }}
          >
            <ScanFace style={{ width: 13, height: 13, color: 'var(--cyber-cyan)' }} />
            <span>Face Swap</span>
          </button>

          <button
            className="btn btn-xs vid-ctx-btn"
            title="Magic Eraser (Remove Background)"
            onClick={handleRemoveBackground}
            disabled={isRemovingBg}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: isRemovingBg ? 'rgba(255,255,255,0.1)' : 'var(--primary-gradient)',
              color: '#fff',
              borderRadius: '8px',
              flexShrink: 0
            }}
          >
            <Wand2 style={{ width: 13, height: 13 }} className={isRemovingBg ? "spin" : ""} />
            <span>{activeImageLayer?.originalUrl ? 'Undo BG' : 'BG Eraser'}</span>
          </button>

          <button
            className={`btn btn-xs vid-ctx-btn ${showFiltersModal ? 'active' : ''}`}
            title="Filters"
            onClick={() => setShowFiltersModal(true)}
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              borderRadius: '8px',
              background: showFiltersModal ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.08)'
            }}
          >
            <Sparkles style={{ width: 13, height: 13 }} />
            <span>Filters</span>
          </button>
        </div>
      )}
    </>
  );
}
