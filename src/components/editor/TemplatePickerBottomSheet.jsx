import React, { useState, useRef } from 'react';
import BottomSheet from '../BottomSheet';
import { Image as ImageIcon, Search, X } from 'lucide-react';
import { CATEGORIES } from '../../data/templates';

export default function TemplatePickerBottomSheet({ isOpen, onClose, templates = [], onSelectTemplate }) {
  const [imagePickerSearch, setImagePickerSearch] = useState('');
  const [imagePickerCategory, setImagePickerCategory] = useState('all');
  const pickingTemplateRef = useRef(false);

  const filteredImageTemplates = templates.filter((t) => {
    if (imagePickerSearch.trim()) {
      const q = imagePickerSearch.toLowerCase();
      return (
        t.name?.toLowerCase().includes(q) ||
        (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
      );
    }
    if (imagePickerCategory === 'all') return true;
    return t.category === imagePickerCategory;
  });

  const handleCardClick = (tmpl) => {
    if (pickingTemplateRef.current) return;
    pickingTemplateRef.current = true;
    setTimeout(() => {
      pickingTemplateRef.current = false;
    }, 400);

    onSelectTemplate(tmpl);
    setImagePickerSearch('');
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Add Template"
      icon={<ImageIcon size={17} strokeWidth={2.4} />}
      maxHeight="82vh"
      contentStyle={{ padding: '6px 16px 18px 16px', overflow: 'hidden' }}
    >
      {/* Search Bar */}
      <div className="bs-search-bar">
        <Search className="bs-search-icon" size={16} />
        <input
          type="text"
          placeholder={`Search ${templates.length}+ meme templates...`}
          value={imagePickerSearch}
          onChange={(e) => setImagePickerSearch(e.target.value)}
          className="bs-search-input"
          autoFocus={false}
        />
        {imagePickerSearch && (
          <button
            type="button"
            className="bs-clear-search-btn"
            onClick={() => setImagePickerSearch('')}
            aria-label="Clear search"
          >
            <X size={13} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div
        className="bs-category-bar"
        onWheel={(e) => {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = imagePickerCategory === cat.id && !imagePickerSearch;
          return (
            <button
              key={cat.id}
              type="button"
              className={`bs-category-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                setImagePickerCategory(cat.id);
                setImagePickerSearch('');
              }}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="template-picker-mini bs-template-grid">
        {filteredImageTemplates.length > 0 ? (
          filteredImageTemplates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="template-card glass-card hover-lift bs-template-card"
              onClick={() => handleCardClick(tmpl)}
            >
              <div className="bs-template-thumb-wrap">
                <img
                  src={tmpl.imageUrl}
                  alt={tmpl.name}
                  loading="lazy"
                />
              </div>
              <div className="bs-template-info">
                <span className="bs-template-title">{tmpl.name}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="bs-empty-state">
            <ImageIcon size={32} strokeWidth={1.5} style={{ opacity: 0.4 }} />
            <span>No matching templates found for "{imagePickerSearch}"</span>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
