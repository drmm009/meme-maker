import React from 'react';
import { RefreshCw, Upload, LayoutGrid, Droplet, FlipHorizontal } from 'lucide-react';
import { COLOR_SWATCHES } from '../../../utils/captionLayout';
import CanvasColorPicker from '../CanvasColorPicker';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';

export default function CanvasTab({
  handleCycleWatermarkPosition,
  handleSetCanvasBgColor,
  handleToggleCanvasFlip,
  handleWatermarkImageUpload,
  watermarkInputRef,
  watermarkTextInputRef,
}) {
  const activeTab = useEditorUiStore((s) => s.activeTab);
  const updateWatermark = useEditorUiStore((s) => s.updateWatermark);
  const watermark = useEditorUiStore((s) => s.watermark);
  const canvasFlipX = useMemeEditorStore((s) => s.canvasFlipX);
  const canvasBgColor = useMemeEditorStore((s) => s.canvasBgColor);

  return (
    <>
      {(activeTab === 'canvas' || activeTab === 'watermark') && (
        <div className="tab-content">
          {/* Canvas Orientation & Settings */}
          <div className="form-group margin-bottom-md" style={{ background: 'var(--bg-surface-1)', padding: '14px', borderRadius: '14px', border: '1px solid var(--glass-border)', marginBottom: '16px' }}>
            <label style={{ fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-main)' }}>
              <LayoutGrid className="icon-sm" style={{ color: 'var(--cyber-cyan)' }} /> Canvas &amp; Template
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                className={`btn btn-sm ${canvasFlipX ? 'btn-primary' : 'btn-secondary'} hover-lift`}
                onClick={handleToggleCanvasFlip}
                title="Flip base template horizontally (Mirror)"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 10px', fontSize: '0.8rem', fontWeight: 600 }}
              >
                <FlipHorizontal size={16} />
                <span>{canvasFlipX ? 'Flipped' : 'Flip Canvas'}</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CanvasColorPicker canvasBgColor={canvasBgColor} setCanvasBgColor={handleSetCanvasBgColor} />
              </div>
            </div>
          </div>
          <div className="form-group margin-bottom-md">
            <div className="flex-between align-center" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1 }}><Droplet className="icon-sm" style={{ transform: 'translateY(1px)' }} /> Watermark</label>
              <label className="switch">
                <input type="checkbox" checked={watermark?.enabled || false} onChange={(e) => updateWatermark('enabled', e.target.checked)} />
                <span className="slider round watermark-toggle"></span>
              </label>
            </div>

            {watermark?.enabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div 
                    className="watermark-unified-box"
                    onClick={() => watermarkTextInputRef.current?.focus()}
                  >
                    <span className="watermark-at-prefix">@</span>
                    <input 
                      ref={watermarkTextInputRef}
                      type="text" 
                      className="watermark-inner-input"
                      placeholder="username" 
                      value={(watermark.text || '').replace(/^@/, '')} 
                      onChange={(e) => {
                        const raw = e.target.value.replace(/^@+/, '');
                        updateWatermark('text', raw ? `@${raw}` : '');
                        if (raw) updateWatermark('imageUrl', null);
                      }} 
                    />
                  </div>
                  <button 
                    type="button"
                    className="watermark-upload-btn" 
                    onClick={() => watermarkInputRef.current?.click()}
                    title="Upload custom watermark logo/image"
                  >
                    <Upload size={18} />
                  </button>
                  <input 
                    ref={watermarkInputRef}
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={handleWatermarkImageUpload} 
                  />
                </div>

                {watermark.imageUrl && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Custom Image Active</span>
                    <button className="btn btn-xs btn-ghost text-red" onClick={() => updateWatermark('imageUrl', null)}>Remove</button>
                  </div>
                )}

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'center' }}>
                   {/* Size Control */}
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                     <label style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                       Size ({watermark.size}px)
                     </label>
                     <div className="size-control-group flex-between gap-xs" style={{ height: '36px', padding: '0 6px', borderRadius: '10px', background: 'var(--bg-surface-1)', border: '1px solid var(--glass-border)', alignItems: 'center' }}>
                       <button type="button" className="btn btn-xs btn-ghost" style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: 'var(--text-main)' }} onClick={() => updateWatermark('size', Math.max(12, watermark.size - 2))} title="Decrease size">-</button>
                       <input type="range" min="12" max="64" step="2" style={{ flex: 1, margin: '0 4px', minWidth: 0, accentColor: 'var(--cyber-cyan)' }} value={watermark.size} onChange={(e) => updateWatermark('size', parseInt(e.target.value))} />
                       <button type="button" className="btn btn-xs btn-ghost" style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: 'var(--text-main)' }} onClick={() => updateWatermark('size', Math.min(64, watermark.size + 2))} title="Increase size">+</button>
                     </div>
                   </div>
                   {/* Opacity Control */}
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                     <label style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                       Opacity ({Math.round(watermark.opacity * 100)}%)
                     </label>
                     <div className="size-control-group flex-between gap-xs" style={{ height: '36px', padding: '0 6px', borderRadius: '10px', background: 'var(--bg-surface-1)', border: '1px solid var(--glass-border)', alignItems: 'center' }}>
                       <button type="button" className="btn btn-xs btn-ghost" style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: 'var(--text-main)' }} onClick={() => updateWatermark('opacity', Math.max(0.1, parseFloat((watermark.opacity - 0.1).toFixed(1))))} title="Decrease opacity">-</button>
                       <input type="range" min="0.1" max="1.0" step="0.1" style={{ flex: 1, margin: '0 4px', minWidth: 0, accentColor: 'var(--cyber-cyan)' }} value={watermark.opacity} onChange={(e) => updateWatermark('opacity', parseFloat(e.target.value))} />
                       <button type="button" className="btn btn-xs btn-ghost" style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: 'var(--text-main)' }} onClick={() => updateWatermark('opacity', Math.min(1.0, parseFloat((watermark.opacity + 0.1).toFixed(1))))} title="Increase opacity">+</button>
                     </div>
                   </div>
                 </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-primary" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      width: '145px', 
                      padding: '8px 14px', 
                      fontSize: '0.88rem', 
                      fontWeight: 600,
                      borderRadius: '10px',
                      flexShrink: 0, 
                      whiteSpace: 'nowrap' 
                    }}
                    onClick={handleCycleWatermarkPosition}
                  >
                    <span>
                      {watermark.position === 'top-left' && 'Top Left'}
                      {watermark.position === 'top-right' && 'Top Right'}
                      {watermark.position === 'bottom-left' && 'Bottom Left'}
                      {watermark.position === 'bottom-right' && 'Bottom Right'}
                    </span>
                    <RefreshCw style={{ width: '15px', height: '15px', flexShrink: 0, color: 'inherit' }} />
                  </button>

                  {!watermark.imageUrl && (
                    <div className="compact-inline-swatches" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1, paddingRight: '8px' }}>
                      {COLOR_SWATCHES.filter(c => c !== '#00ff66').map(color => (
                        <div 
                          key={color} 
                          onClick={() => updateWatermark('color', color)}
                          style={{ 
                            width: '24px', height: '24px', borderRadius: '50%', backgroundColor: color, 
                            border: watermark.color === color ? '2px solid #a855f7' : '1px solid #444', cursor: 'pointer', flexShrink: 0
                          }} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
