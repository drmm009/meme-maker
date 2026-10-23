import React from 'react';
import { Download, Share2, Copy, ArrowLeft, Save, Check, RefreshCw } from 'lucide-react';

export default function ExportPage({
  clipboardCopied,
  exportFileSize,
  exportFormat,
  exportPreset,
  exportQuality,
  exportedImageUri,
  handleConfirmSave,
  handleCopyToClipboard,
  handleDownloadImage,
  handleSelectExportFormat,
  handleSelectExportPreset,
  handleSelectExportQuality,
  handleShareImage,
  isSaved,
  memeCustomName,
  setIsExportModalOpen,
  setMemeCustomName,
  shareCopied,
}) {
  return (
    <>
      {/* Header */}
      <div className="editor-topbar glass-card flex-between" style={{ gap: '4px' }}>
        <div className="header-left" style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <button className="btn btn-ghost btn-xs export-back-btn back-btn" onClick={() => setIsExportModalOpen(false)}>
            <ArrowLeft className="icon-sm" /> <span>Back</span>
          </button>
        </div>
        <div className="header-center" style={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', color: 'var(--cyber-cyan)' }}>
            <span>Preview & Export</span>
          </h2>
        </div>
        <div className="header-right" style={{ flex: 1 }}></div>
      </div>
      <div className="export-content">
        <div className="export-title-panel" style={{ marginBottom: '16px', width: '100%', padding: '0 8px' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', margin: 0 }}>
            <label style={{ margin: 0, whiteSpace: 'nowrap', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', textTransform: 'none' }}>Title:</label>
            <input type="text" className="form-input" placeholder="e.g. Funny Cat Meme" value={memeCustomName} onChange={(e) => setMemeCustomName(e.target.value)} style={{ fontSize: '1rem', padding: '10px 14px', flex: 1, margin: 0, borderRadius: '24px' }} />
          </div>
        </div>
        <div className="export-preview-panel">
          {exportedImageUri ? (
            <img src={exportedImageUri} alt="Preview Meme" className="export-preview-img shadow-2xl" />
          ) : (
            <div className="flex-center" style={{ height: '300px', width: '100%' }}>
              <RefreshCw className="icon-md animate-spin text-muted" />
            </div>
          )}
        </div>
        <div className="export-controls-panel">
          {/* Format & File Size / Discord Optimizer Panel */}
          <div
            style={{
              background: 'var(--bg-surface-1)',
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              width: '100%',
              marginBottom: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Format:</span>
                <div style={{ display: 'flex', background: 'var(--bg-surface-2)', borderRadius: '8px', padding: '2px', border: '1px solid var(--glass-border)' }}>
                  {['png', 'jpeg', 'webp'].map(fmt => (
                    <button
                      key={fmt}
                      type="button"
                      className={`btn btn-xs ${exportFormat === fmt ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => handleSelectExportFormat(fmt)}
                      style={{ fontSize: '0.72rem', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}
                    >
                      {fmt === 'jpeg' ? 'JPG' : fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Presets */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  className={`btn btn-xs ${exportPreset === 'hd' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleSelectExportPreset('hd')}
                  style={{ fontSize: '0.72rem', borderRadius: '8px', padding: '3px 8px' }}
                >
                  HD Lossless
                </button>
                <button
                  type="button"
                  className={`btn btn-xs ${exportPreset === 'discord' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleSelectExportPreset('discord')}
                  title="Optimized to upload under Discord's 8MB limit"
                  style={{ fontSize: '0.72rem', borderRadius: '8px', padding: '3px 8px' }}
                >
                  Discord &lt;8MB
                </button>
                <button
                  type="button"
                  className={`btn btn-xs ${exportPreset === 'compact' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleSelectExportPreset('compact')}
                  title="Fast compressed WebP/JPG"
                  style={{ fontSize: '0.72rem', borderRadius: '8px', padding: '3px 8px' }}
                >
                  Compact
                </button>
              </div>
            </div>

            {/* Quality & Estimated Size Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              {exportFormat !== 'png' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Quality: {Math.round(exportQuality * 100)}%</span>
                  <input
                    type="range"
                    min="0.3"
                    max="1.0"
                    step="0.05"
                    value={exportQuality}
                    onChange={(e) => handleSelectExportQuality(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--cyber-cyan)', height: '4px' }}
                  />
                </div>
              ) : (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pixel-perfect sharp graphics & text</span>
              )}

              {exportFileSize && (
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--cyber-cyan)', background: 'rgba(6, 182, 212, 0.12)', padding: '2px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                  Size: {exportFileSize > 1024 * 1024 ? `${(exportFileSize / (1024 * 1024)).toFixed(2)} MB` : `${Math.round(exportFileSize / 1024)} KB`}
                </span>
              )}
            </div>
          </div>

          <div className="export-actions">
            <button className={`btn ${isSaved ? 'btn-success' : 'btn-secondary'} hover-lift`} onClick={() => { handleConfirmSave(); }}>
              {isSaved ? <><Check className="icon-sm" /> <span>Saved to Gallery</span></> : <><Save className="icon-sm" /> <span>Save to Gallery</span></>}
            </button>
            <button className="btn btn-primary shadow-glow" onClick={handleDownloadImage}>
              <Download className="icon-sm" /> <span>Download {exportFormat.toUpperCase() === 'JPEG' ? 'JPG' : exportFormat.toUpperCase()}</span>
            </button>
            <button
              className="btn btn-secondary hover-lift"
              onClick={handleCopyToClipboard}
              title={clipboardCopied ? 'Image copied!' : 'Copy image to clipboard — paste into Discord, Twitter, etc.'}
              style={{
                background: clipboardCopied ? 'rgba(34, 197, 94, 0.15)' : undefined,
                borderColor: clipboardCopied ? 'rgba(34, 197, 94, 0.4)' : undefined,
                color: clipboardCopied ? '#22c55e' : undefined,
                transition: 'all 0.2s ease'
              }}
            >
              {clipboardCopied ? <Check className="icon-sm" /> : <Copy className="icon-sm" />}
              <span>{clipboardCopied ? 'Copied!' : 'Copy Image'}</span>
            </button>
            <button
              className="btn btn-secondary hover-lift"
              onClick={handleShareImage}
              title={shareCopied ? 'Copied to clipboard!' : (typeof navigator !== 'undefined' && navigator.canShare ? 'Share' : 'Copy link')}
              style={{
                background: shareCopied ? 'rgba(34, 197, 94, 0.15)' : undefined,
                borderColor: shareCopied ? 'rgba(34, 197, 94, 0.4)' : undefined,
                transition: 'all 0.2s ease'
              }}
            >
              <Share2 className="icon-sm" />
              <span>{shareCopied ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
          <p className="export-help-text">Your meme will be safely stored in your browser's local storage gallery.</p>
        </div>
      </div>
    </>
  );
}
