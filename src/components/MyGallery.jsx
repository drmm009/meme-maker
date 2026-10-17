import React, { useState } from 'react';
import ModalPortal from './ModalPortal';
import { Download, Trash2, Edit3, X, Sparkles } from 'lucide-react';
import { downloadImageHelper } from '../utils/downloadHelper';
import './MyGallery.css';

export default function MyGallery({ savedMemes, galleryReady, onDeleteMeme, onSelectMeme, onResolveFullImage }) {
  const [selectedMemeForView, setSelectedMemeForView] = useState(null);
  const [fullViewUrl, setFullViewUrl] = useState('');

  React.useEffect(() => {
    let cancelled = false;
    setFullViewUrl('');
    if (selectedMemeForView && onResolveFullImage) {
      onResolveFullImage(selectedMemeForView).then((url) => {
        if (!cancelled) setFullViewUrl(url);
      });
    } else if (selectedMemeForView) {
      setFullViewUrl(selectedMemeForView.thumbnailUrl || selectedMemeForView.imageUrl || '');
    }
    return () => {
      cancelled = true;
    };
  }, [selectedMemeForView, onResolveFullImage]);

  const thumbOf = (meme) => meme.thumbnailUrl || meme.imageUrl || '';

  const handleDownload = async (meme, e) => {
    if (e) e.stopPropagation();
    const safeBase = String(meme.name || 'meme').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase().slice(0, 60) || 'meme';
    const filename = `${safeBase}-${Date.now()}.png`;
    const full = onResolveFullImage ? await onResolveFullImage(meme) : thumbOf(meme);
    await downloadImageHelper(full, filename);
  };

  const handleEdit = async (meme, e) => {
    if (e) e.stopPropagation();
    const fullUrl = onResolveFullImage ? await onResolveFullImage(meme) : (meme.rawImageUrl || meme.imageUrl);
    const editTemplate = {
      id: meme.id || `custom-saved-${Date.now()}`,
      name: meme.name || 'Saved Meme',
      imageUrl: fullUrl || meme.rawImageUrl || meme.imageUrl,
      rawImageUrl: meme.rawImageUrl || fullUrl || meme.imageUrl,
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
        <h2 className="gallery-title">
          My Saved Memes
        </h2>
        <p className="gallery-subtitle">
          Your creative vault — safely stored on device in IndexedDB
        </p>
      </div>

      {galleryReady === false ? (
        <div className="empty-state glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Loading gallery…</h3>
        </div>
      ) : savedMemes.length > 0 ? (
        <div className="gallery-grid">
          {savedMemes.map((meme) => (
            <div
              key={meme.id}
              className="gallery-card glass-card hover-lift"
              onClick={() => setSelectedMemeForView(meme)}
            >
              <div className="gallery-image-wrapper">
                <img src={thumbOf(meme)} alt={meme.name} decoding="async" loading="lazy" />
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
                    {meme.createdAt ? new Date(meme.createdAt).toLocaleDateString() : 'Unknown date'}
                  </span>
                </div>
                <button
                  className="gallery-delete-btn"
                  onClick={(e) => handleDelete(meme.id, e)}
                  title="Delete Meme"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state glass-card" style={{ padding: '52px 24px', textAlign: 'center' }}>
          <div className="empty-icon-wrap" style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
            <Sparkles className="empty-icon text-cyan" />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main)' }}>No Saved Memes Yet</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            Pick any trending template or design a multi-panel layout, customize it, and hit Save!
          </p>
          <button
            className="btn btn-primary"
            onClick={() => onSelectMeme && onSelectMeme(null)}
          >
            <Sparkles size={16} /> Explore Templates
          </button>
        </div>
      )}

      {/* PORTAL RENDERED TOP-LEVEL MODAL PREVIEW */}
      {selectedMemeForView && (
        <ModalPortal>
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
                  src={fullViewUrl || thumbOf(selectedMemeForView)}
                  alt={selectedMemeForView.name}
                  decoding="async"
                  className="export-preview-img margin-bottom"
                  style={{ maxHeight: '52vh', width: 'auto', margin: '0 auto 16px auto', display: 'block', borderRadius: '16px' }}
                />

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                  <button
                    className="btn btn-primary"
                    onClick={(e) => handleEdit(selectedMemeForView, e)}
                  >
                    <Edit3 className="icon-xs" /> Re-Edit
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={(e) => handleDownload(selectedMemeForView, e)}
                  >
                    <Download className="icon-xs" /> Download
                  </button>

                  <button
                    className="btn btn-danger-pill"
                    onClick={(e) => handleDelete(selectedMemeForView.id, e)}
                  >
                    <Trash2 className="icon-xs" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
