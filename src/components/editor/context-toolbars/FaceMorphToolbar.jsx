import React from 'react';
import { Check, RefreshCw, X, Eye } from 'lucide-react';
import { useMemeEditorStore } from '../store/useMemeEditorStore';

export default function FaceMorphToolbar({
  activeCaption,
  activeImageLayer,
  activeSticker,
  handleChangeFace,
  handleFinalizeTemplateFace,
  handleRevertTemplateFace,
  isHoldingCanvasCompare,
  setIsHoldingCanvasCompare,
}) {
  const templateFaceMorph = useMemeEditorStore((s) => s.templateFaceMorph);

  return (
    <>
      {templateFaceMorph && !(activeCaption || activeSticker || activeImageLayer) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            className="btn btn-xs vid-ctx-btn"
            title="Pick a different face or photo"
            onClick={handleChangeFace}
            style={{
              padding: '4px 11px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              border: '1px solid var(--glass-border)',
              flexShrink: 0
            }}
          >
            <RefreshCw style={{ width: 12, height: 12, color: 'var(--cyber-cyan)' }} />
            <span>Change Face</span>
          </button>

          <button
            className="btn btn-xs vid-ctx-btn"
            title="Cancel face swap and revert"
            onClick={handleRevertTemplateFace}
            style={{
              padding: '4px 11px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              flexShrink: 0
            }}
          >
            <X style={{ width: 12, height: 12 }} />
            <span>Cancel</span>
          </button>

          <button
            className="btn btn-xs vid-ctx-btn active"
            title="Accept face swap"
            onClick={handleFinalizeTemplateFace}
            style={{
              padding: '4px 14px',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              borderRadius: '8px',
              background: 'var(--primary-gradient)',
              color: '#ffffff',
              border: '1px solid var(--cyber-cyan)',
              flexShrink: 0
            }}
          >
            <Check style={{ width: 12, height: 12 }} />
            <span>Done</span>
          </button>

          <button
            className="btn btn-icon btn-xs vid-ctx-btn"
            title="Hold to see original without face swap"
            onPointerDown={() => setIsHoldingCanvasCompare(true)}
            onPointerUp={() => setIsHoldingCanvasCompare(false)}
            onPointerLeave={() => setIsHoldingCanvasCompare(false)}
            style={{
              padding: '4px 8px',
              borderRadius: '8px',
              background: isHoldingCanvasCompare ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
              border: isHoldingCanvasCompare ? '1px solid var(--cyber-cyan)' : '1px solid var(--glass-border)',
              flexShrink: 0
            }}
          >
            <Eye style={{ width: 14, height: 14, color: isHoldingCanvasCompare ? '#ffffff' : 'var(--cyber-cyan)' }} />
          </button>
        </div>
      )}
    </>
  );
}
