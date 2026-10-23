import React from 'react';
import { Trash2, Undo, Highlighter, Palette, Brush, SunMedium } from 'lucide-react';
import { DRAW_COLORS } from '../../../utils/captionLayout';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';

export default function DrawTab({
  handleClearDrawings,
  handleUndoDrawing,
}) {
  const activeTab = useEditorUiStore((s) => s.activeTab);
  const brushColor = useEditorUiStore((s) => s.brushColor);
  const brushSize = useEditorUiStore((s) => s.brushSize);
  const drawTool = useEditorUiStore((s) => s.drawTool);
  const setBrushColor = useEditorUiStore((s) => s.setBrushColor);
  const setBrushSize = useEditorUiStore((s) => s.setBrushSize);
  const setDrawTool = useEditorUiStore((s) => s.setDrawTool);
  const drawings = useMemeEditorStore((s) => s.drawings);

  return (
    <>
      {activeTab === 'draw' && (
        <div className="tab-content animate-fade-in">
          {/* Tool Selection: 3 Modes (Brush, Marker, Glow) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '14px' }}>
            <button
              className={`btn ${drawTool === 'brush' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDrawTool('brush')}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '7px 4px', gap: '4px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 600 }}
              title="Solid Brush"
            >
              <Brush className="icon-xs" style={{ width: '14px', height: '14px' }} />
              <span>Brush</span>
            </button>
            <button
              className={`btn ${drawTool === 'highlighter' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDrawTool('highlighter')}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '7px 4px', gap: '4px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 600 }}
              title="Highlighter / Translucent Marker"
            >
              <Highlighter className="icon-xs" style={{ width: '14px', height: '14px' }} />
              <span>Marker</span>
            </button>
            <button
              className={`btn ${drawTool === 'glow' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDrawTool('glow')}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '7px 4px', gap: '4px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 600 }}
              title="Neon Glow / Laser Line"
            >
              <SunMedium className="icon-xs" style={{ width: '14px', height: '14px' }} />
              <span>Glow</span>
            </button>
          </div>

          {/* Quick Drawing Actions: Undo Last Stroke & Clear All */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleUndoDrawing}
              disabled={drawings.length === 0}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '8px', padding: '6px 10px', fontSize: '0.76rem', opacity: drawings.length === 0 ? 0.4 : 1 }}
              title="Undo Last Stroke"
            >
              <Undo style={{ width: 13, height: 13 }} />
              <span>Undo Stroke {drawings.length > 0 ? `(${drawings.length})` : ''}</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClearDrawings}
              disabled={drawings.length === 0}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '8px', padding: '6px 10px', fontSize: '0.76rem', color: drawings.length > 0 ? '#ef4444' : undefined, opacity: drawings.length === 0 ? 0.4 : 1 }}
              title="Clear All Drawings"
            >
              <Trash2 style={{ width: 13, height: 13 }} />
              <span>Clear All</span>
            </button>
          </div>

          {/* 1. Stroke Thickness */}
          <div style={{ marginBottom: '16px', display: drawTool ? 'block' : 'none' }}>
            <div className="flex-between align-center" style={{ marginBottom: '6px', paddingRight: '4px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Stroke Thickness ({brushSize}px)
              </label>
              <div
                style={{
                  width: Math.min(26, Math.max(6, brushSize)),
                  height: Math.min(26, Math.max(6, brushSize)),
                  borderRadius: '50%',
                  background: brushColor,
                  boxShadow: drawTool === 'glow' ? `0 0 8px ${brushColor}` : 'none',
                  border: '1px solid #ffffff',
                  transition: 'all 0.1s ease',
                  flexShrink: 0
                }}
              />
            </div>
            <div className="size-control-group flex-between gap-xs" style={{ height: '36px', padding: '0 6px', borderRadius: '10px', background: 'var(--bg-surface-1)', border: '1px solid var(--glass-border)', alignItems: 'center' }}>
              <button type="button" className="btn btn-xs btn-ghost" style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: 'var(--text-main)' }} onClick={() => setBrushSize(Math.max(2, brushSize - 2))} title="Decrease size">-</button>
              <input type="range" min="2" max="48" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} style={{ flex: 1, margin: '0 4px', minWidth: 0, accentColor: 'var(--cyber-cyan)', touchAction: 'none' }} />
              <button type="button" className="btn btn-xs btn-ghost" style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: 'var(--text-main)' }} onClick={() => setBrushSize(Math.min(48, brushSize + 2))} title="Increase size">+</button>
            </div>
          </div>

          {/* 2. Brush Color: Buttons placed directly next to the label */}
          <div style={{ display: drawTool ? 'block' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingLeft: '4px', paddingRight: '4px', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap' }}>
                Stroke Color:
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {DRAW_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    style={{
                      width: '22px',
                      height: '22px',
                      minWidth: '22px',
                      minHeight: '22px',
                      borderRadius: '50%',
                      background: color,
                      border: brushColor === color ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.25)',
                      boxShadow: brushColor === color ? (drawTool === 'glow' ? `0 0 10px ${color}` : `0 0 8px ${color}`) : 'none',
                      cursor: 'pointer',
                      padding: 0,
                      margin: 0,
                      transform: brushColor === color ? 'scale(1.18)' : 'scale(1)',
                      transition: 'transform 0.15s ease'
                    }}
                    onClick={() => setBrushColor(color)}
                  />
                ))}

                {/* One Color Palette Button at End */}
                <label
                  style={{
                    width: '22px',
                    height: '22px',
                    minWidth: '22px',
                    minHeight: '22px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #ff007f, #00f0ff, #ffe600, #00ff66)',
                    border: '1.5px solid rgba(255,255,255,0.5)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    padding: 0,
                    margin: 0,
                    transition: 'transform 0.15s ease'
                  }}
                  title="Custom Color Palette"
                >
                  <Palette style={{ width: '12px', height: '12px', color: '#ffffff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))', display: 'block', margin: 'auto' }} />
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer'
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
