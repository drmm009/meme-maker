import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Clapperboard, X, PlayCircle } from 'lucide-react';
import { VIDEO_MEME_TEMPLATES } from '../../data/videoTemplates';

export default function VideoTemplateModal({ isOpen = false, onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  if (!isOpen) return null;

  const categories = ['All', ...new Set(VIDEO_MEME_TEMPLATES.map(t => t.category))];

  const filtered = VIDEO_MEME_TEMPLATES.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === 'All' || t.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return createPortal(
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-content glass-card modal-lg animate-scale-up" onClick={e => e.stopPropagation()}>
        <div className="modal-header flex-between align-center margin-bottom-sm">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Clapperboard className="icon-sm text-cyan" />
            <span>Video Templates</span>
          </h3>
          <button className="btn-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <div className="search-container margin-bottom" style={{ position: 'relative' }}>
            <Search className="icon-sm search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input
              type="text"
              placeholder="Search video templates..."
              className="search-input input-field w-full"
              style={{ paddingLeft: '40px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <X 
                className="icon-sm clear-search cursor-pointer" 
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}
                onClick={() => setSearch('')}
              />
            )}
          </div>

          <div className="categories-scrollable margin-bottom-sm" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
            {categories.map(cat => (
              <button
                key={cat}
                className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: '1px solid var(--border-color)',
                  background: activeCategory === cat ? 'var(--accent-cyan)' : 'transparent',
                  color: activeCategory === cat ? '#000' : 'var(--text-primary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="template-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '16px'
          }}>
            {filtered.map(template => (
              <div 
                key={template.id} 
                className="template-card glass-panel interactive cursor-pointer animate-scale-up"
                style={{ padding: '8px', position: 'relative', overflow: 'hidden' }}
                onClick={() => {
                  onSelect(template);
                  onClose();
                }}
              >
                <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                  <img 
                    src={template.thumbnailUrl} 
                    alt={template.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 2
                  }}>
                    <PlayCircle size={32} color="white" style={{ opacity: 0.9, dropShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    zIndex: 2
                  }}>
                    {Math.round(template.durationMs / 1000)}s
                  </div>
                </div>
                <div className="template-info" style={{ marginTop: '8px', textAlign: 'center' }}>
                  <div className="template-name text-sm" style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {template.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="empty-state text-center text-secondary margin-top-lg">
              <p>No video templates found.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
