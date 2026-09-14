import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Trash2, Edit3, X, Sparkles } from 'lucide-react';
import { downloadImageHelper } from '../utils/downloadHelper';

export default function MyGallery({ savedMemes, onDeleteMeme, onSelectMeme }) {
  const [selectedMemeForView, setSelectedMemeForView] = useState(null);

  const handleDownload = async (meme, e) => {
    if (e) e.stopPropagation();
    const filename = `${meme.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
    await downloadImageHelper(meme.imageUrl, filename);
  };

  const handleEdit = (meme, e) => {
    if (e) e.stopPropagation();
    const editTemplate = {
      id: meme.id || `custom-saved-${Date.now()}`,
      name: meme.name || 'Saved Meme',
      imageUrl: meme.rawImageUrl || meme.imageUrl,
      rawImageUrl: meme.rawImageUrl || meme.imageUrl,
      category: 'saved',
      isNativeLayout: meme.isNativeLayout || false,
      layoutDef: meme.layoutDef || null,
      slotImages: meme.slotImages || [],
      slotTransforms: meme.slotTransforms || [],
      aspectRatio: meme.aspectRatio || 'original',
      imageFit: meme.imageFit || 'cover',
      defaultCaptions: meme.captions || [],
      defaultStickers: meme.stickers || [],
      imageLayers: meme.imageLayers || []
    };
    if (onSelectMeme) {
      onSelectMeme(editTemplate);
    }
  };

  const handleDelete = (id, e) => {
    if (e) e.stopPropagation();
    onDeleteMeme(id);
    if (selectedMemeForView?.id === id) {
      setSelectedMemeForView(null);
    }
  };

  return (
    <div className="my-gallery animate-fade-in">
      <div className="gallery-header" style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, background: 'linear-gradient(135deg, #ffffff 30%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
          My Saved Memes
        </h2>
      </div>

      {savedMemes.length > 0 ? (
        <div className="gallery-grid">
          {savedMemes.map((meme) => (
            <div
              key={meme.id}
              className="gallery-card glass-card hover-lift"
              onClick={() => setSelectedMemeForView(meme)}
            >
              <div className="gallery-image-wrapper">
                <img src={meme.imageUrl} alt={meme.name} decoding="async" loading="lazy" />
              </div>
              <div className="gallery-info flex-between align-center" style={{ gap: '8px' }}>
                <div style={{ flex: '1 1 auto', minWidth: '0', overflow: 'hidden' }}>
                  <h4
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      margin: 0
                    }}
                    title={meme.name}
                  >
                    {meme.name}
                  </h4>
                  <span className="gallery-date">
                    {new Date(meme.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  style={{
                    background: 'rgba(255, 51, 102, 0.14)',
                    border: '1px solid rgba(255, 51, 102, 0.35)',
                    color: '#a855f7',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 51, 102, 0.28)';
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 51, 102, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 51, 102, 0.14)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={(e) => handleDelete(meme.id, e)}
                  title="Delete Meme"
                >
                  <Trash2 className="icon-xs" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No Saved Memes Yet</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '360px', margin: '0 auto' }}>
            Create a new meme from templates or custom layouts and hit "Save"!
          </p>
        </div>
      )}

      {/* PORTAL RENDERED TOP-LEVEL MODAL PREVIEW */}
      {selectedMemeForView && createPortal(
        <div className="modal-backdrop animate-fade-in" onClick={() => setSelectedMemeForView(null)}>
          <div
            className="modal-content glass-card modal-md animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header flex-between margin-bottom-xs">
              <h3><Sparkles className="icon-sm text-cyan" /> {selectedMemeForView.name}</h3>
              <button className="btn-close" onClick={() => setSelectedMemeForView(null)} title="Close" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body text-center">
              <img
                src={selectedMemeForView.imageUrl}
                alt={selectedMemeForView.name}
                decoding="async"
                className="export-preview-img margin-bottom"
                style={{ maxHeight: '52vh', width: 'auto', margin: '0 auto 14px auto', display: 'block' }}
              />

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '12px' }}>
                <button
                  className="btn btn-xs btn-primary shadow-glow"
                  onClick={(e) => handleEdit(selectedMemeForView, e)}
                >
                  <Edit3 className="icon-xs" /> Edit
                </button>

                <button
                  className="btn btn-xs btn-secondary"
                  onClick={(e) => handleDownload(selectedMemeForView, e)}
                >
                  <Download className="icon-xs" /> Download
                </button>

                <button
                  style={{
                    background: 'rgba(255, 51, 102, 0.15)',
                    border: '1px solid rgba(255, 51, 102, 0.35)',
                    color: '#a855f7',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 51, 102, 0.3)';
                    e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 51, 102, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 51, 102, 0.15)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={(e) => handleDelete(selectedMemeForView.id, e)}
                >
                  <Trash2 className="icon-xs" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
