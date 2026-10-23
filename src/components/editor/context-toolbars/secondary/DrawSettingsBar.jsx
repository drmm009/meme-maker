import React from 'react';
import { Trash2 } from 'lucide-react';
import { DRAW_COLORS } from '../../../../utils/captionLayout';
import { useMemeEditorStore } from '../../store/useMemeEditorStore';
import { useEditorUiStore } from '../../store/useEditorUiStore';

export default function DrawSettingsBar({
  handleClearDrawings,
}) {
  const brushColor = useEditorUiStore((s) => s.brushColor);
  const brushSize = useEditorUiStore((s) => s.brushSize);
  const drawTool = useEditorUiStore((s) => s.drawTool);
  const setBrushColor = useEditorUiStore((s) => s.setBrushColor);
  const setBrushSize = useEditorUiStore((s) => s.setBrushSize);
  const drawings = useMemeEditorStore((s) => s.drawings);

  return (
    <>
      <div className="sec-bar-btn-container" style={{ padding: '0 6px', gap: '4px' }}>
        {DRAW_COLORS.map((c) => {
          const isSelected = brushColor === c;
          return (
            <button
              key={c}
              type="button"
              className={`color-swatch-btn ${isSelected ? 'active' : ''}`}
              title={`Set color ${c}`}
              onClick={() => setBrushColor(c)}
              style={{
                width: 17.5,
                height: 17.5,
                borderRadius: '50%',
                background: c,
                border: isSelected ? '2px solid var(--cyber-cyan)' : '1px solid rgba(255,255,255,0.4)',
                transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                boxShadow: isSelected ? (drawTool === 'glow' ? `0 0 10px ${c}` : '0 0 6px rgba(6,182,212,0.6)') : 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.15s ease'
              }}
            />
          );
        })}
        <div
          title="Custom brush color"
          style={{
            position: 'relative',
            width: 17.5,
            height: 17.5,
            borderRadius: '50%',
            background: 'conic-gradient(from 180deg at 50% 50%, #ff0055, #ffaa00, #00ff66, #00bbff, #aa00ff, #ff0055)',
            border: '1px solid rgba(255,255,255,0.4)',
            cursor: 'pointer',
            overflow: 'hidden',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', width: '100%', height: '100%' }}
          />
        </div>
      </div>

      {/* Size Slider for Draw Tools (Neutral Glass Pill) */}
      <div className="sec-bar-accent-slider">
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            border: '1.5px solid currentColor',
            opacity: 0.6,
            boxSizing: 'border-box',
            flexShrink: 0
          }}
          title="Min stroke size"
        />
        <input
          type="range"
          min="2"
          max="50"
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
          title={`Size: ${brushSize}px`}
          style={{ touchAction: 'none' }}
        />
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            border: '1.5px solid currentColor',
            opacity: 0.6,
            boxSizing: 'border-box',
            flexShrink: 0
          }}
          title="Max stroke size"
        />
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'inherit', minWidth: '22px' }}>{brushSize}px</span>
      </div>

      <button
        type="button"
        className="btn btn-icon btn-xs vid-ctx-btn vid-ctx-btn-delete"
        onClick={handleClearDrawings}
        disabled={drawings.length === 0}
        style={{
          width: 36,
          height: 36,
          minWidth: 36,
          minHeight: 36,
          borderRadius: '50%',
          padding: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: drawings.length > 0 ? 'linear-gradient(135deg, #ef4444, #dc2626)' : undefined,
          border: drawings.length > 0 ? '1px solid rgba(255, 255, 255, 0.28)' : undefined,
          boxShadow: drawings.length > 0 ? '0 2px 10px rgba(239, 68, 68, 0.45)' : undefined,
          opacity: drawings.length === 0 ? 0.35 : 1,
          cursor: drawings.length === 0 ? 'not-allowed' : 'pointer',
          color: '#ffffff'
        }}
        title={drawings.length > 0 ? `Clear all drawings (${drawings.length})` : 'Clear drawings'}
        aria-label="Clear all drawings"
      >
        <Trash2 style={{ width: 14, height: 14, color: '#ffffff' }} />
      </button>
    </>
  );
}
