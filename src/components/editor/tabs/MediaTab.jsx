import React from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Smile, Check, X, ImagePlus } from 'lucide-react';
import VideoTrimmer from '../../VideoTrimmer';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';

export default function MediaTab({
  activeImageLayer,
  commitAddImageLayer,
  handleChangeFace,
  handleDeleteLayer,
  handleFileUploadImageLayer,
  handleFinalizeTemplateFace,
  handleRevertTemplateFace,
  handleUpdateTemplateMorphProgress,
  updateActiveImageLayer,
}) {
  const activeTab = useEditorUiStore((s) => s.activeTab);
  const pendingVideoLayer = useEditorUiStore((s) => s.pendingVideoLayer);
  const setImagePickerTarget = useEditorUiStore((s) => s.setImagePickerTarget);
  const setPendingVideoLayer = useEditorUiStore((s) => s.setPendingVideoLayer);
  const templateFaceMorph = useMemeEditorStore((s) => s.templateFaceMorph);

  return (
    <>
      {activeTab === 'images' && (() => {
        return (
          <div className="tab-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Header Action Buttons: Upload Media | Pick Template (+ Delete if media layer selected) */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label
                className="btn btn-xs btn-primary hover-lift"
                title="Upload Image or Video"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '999px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  margin: 0,
                  whiteSpace: 'nowrap'
                }}
              >
                <ImagePlus className="icon-xs" /> Upload Media
                <input
                  type="file"
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                  onChange={handleFileUploadImageLayer}
                />
              </label>


              <button
                type="button"
                className="btn btn-xs btn-secondary hover-lift"
                onClick={() => setImagePickerTarget('layer')}
                title="Add template as an overlay image"
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Plus className="icon-xs" /> Add Overlay
              </button>
              {activeImageLayer && (
                <button
                  type="button"
                  className="btn btn-icon btn-xs hover-lift vid-ctx-btn-delete"
                  onClick={() => handleDeleteLayer()}
                  title="Delete Media Layer"
                  style={{
                    flexShrink: 0,
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.28)',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  <Trash2 className="icon-xs" style={{ color: '#ffffff' }} />
                </button>
              )}
            </div>

            {templateFaceMorph && (
              <div className="form-group margin-bottom-sm glass-card" style={{ padding: '10px 14px', borderRadius: '14px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Smile size={14} style={{ color: 'var(--cyber-cyan)' }} />
                    {templateFaceMorph.faceName || 'Face Morph'}
                  </span>
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost"
                    onClick={handleChangeFace}
                    style={{ fontSize: '0.7rem', color: 'var(--cyber-cyan)', padding: '2px 8px', borderRadius: '6px' }}
                  >
                    Change Face
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Morph Intensity / Blend</span>
                    <span style={{ color: 'var(--cyber-cyan)' }}>
                      {Math.round((templateFaceMorph.morphProgress !== undefined ? templateFaceMorph.morphProgress : 0.85) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={templateFaceMorph.morphProgress !== undefined ? templateFaceMorph.morphProgress : 0.85}
                    onChange={(e) => handleUpdateTemplateMorphProgress(parseFloat(e.target.value))}
                    style={{ accentColor: 'var(--cyber-cyan)', height: '4px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-xs hover-lift"
                    onClick={handleFinalizeTemplateFace}
                    title="Fuse face permanently into the meme template"
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(6, 182, 212, 0.35))',
                      border: '1px solid rgba(52, 211, 153, 0.8)',
                      color: '#34d399',
                      boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)'
                    }}
                  >
                    <Check size={13} /> Fuse Permanently
                  </button>

                  <button
                    type="button"
                    className="btn btn-xs hover-lift"
                    onClick={handleRevertTemplateFace}
                    title="Revert template face to original"
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#f87171'
                    }}
                  >
                    <X size={13} /> Revert
                  </button>
                </div>
              </div>
            )}

            {activeImageLayer && (
              <div className="form-group margin-bottom-sm glass-card" style={{ padding: '8px 12px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Media Fit Mode</label>
                <div className="size-control-group" style={{ display: 'flex', gap: '4px', width: '100%' }}>
                  <button 
                    className={`btn btn-xs ${activeImageLayer.fitMode === 'fit' || !activeImageLayer.fitMode ? 'btn-primary' : 'btn-secondary'}`} 
                    style={{ flex: 1 }}
                    onClick={() => updateActiveImageLayer('fitMode', 'fit')}
                  >
                    Fit
                  </button>
                  <button 
                    className={`btn btn-xs ${activeImageLayer.fitMode === 'crop' ? 'btn-primary' : 'btn-secondary'}`} 
                    style={{ flex: 1 }}
                    onClick={() => updateActiveImageLayer('fitMode', 'crop')}
                  >
                    Crop
                  </button>
                  <button 
                    className={`btn btn-xs ${activeImageLayer.fitMode === 'stretch' ? 'btn-primary' : 'btn-secondary'}`} 
                    style={{ flex: 1 }}
                    onClick={() => updateActiveImageLayer('fitMode', 'stretch')}
                  >
                    Stretch
                  </button>
                </div>
              </div>
            )}

            {/* VideoTrimmer Modal — rendered as portal to escape canvas z-index stacking context */}
            {pendingVideoLayer && createPortal(
              <VideoTrimmer
                videoUrl={pendingVideoLayer}
                trimStart={0}
                trimEnd={null}
                onApply={(start, end) => {
                  commitAddImageLayer(pendingVideoLayer, start, end);
                  setPendingVideoLayer(null);
                }}
                onClose={() => setPendingVideoLayer(null)}
              />,
              document.body
            )}
          </div>
        );
      })()}
    </>
  );
}
