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
      icon={<ImageIcon size={18} style={{ color: 'var(--cyber-cyan)' }} />}
      maxHeight="82vh"
      contentStyle={{ padding: '6px 16px 16px 16px', overflow: 'hidden' }}
    >
      <div className="picker-search-bar" style={{ position: 'relative', marginTop: '2px', marginBottom: '10px' }}>
        <Search
          className="search-icon"
          size={16}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: 'var(--text-muted)'
          }}
        />
        <input
          type="text"
          placeholder={`Search ${templates.length}+ meme templates...`}
          value={imagePickerSearch}
          onChange={(e) => setImagePickerSearch(e.target.value)}
          className="search-input"
          style={{
            paddingLeft: '36px',
            paddingRight: imagePickerSearch ? '36px' : '14px',
            height: '40px',
            width: '100%',
            boxSizing: 'border-box',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-main)',
            fontSize: '0.84rem',
            outline: 'none',
            transition: 'all 0.2s ease'
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--cyber-cyan)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--glass-border)')}
        />
        {imagePickerSearch && (
          <button
            type="button"
            onClick={() => setImagePickerSearch('')}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              borderRadius: '50%',
              width: '22px',
              height: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 0
            }}
            aria-label="Clear search"
          >
            <X className="icon-xs" style={{ width: '13px', height: '13px' }} />
          </button>
        )}
      </div>

      {/* Category Pills - Horizontal scroll only */}
      <div
        className="horizontal-scroll-only"
        onWheel={(e) => {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          alignItems: 'center',
          gap: '8px',
          padding: '2px 2px 8px 2px',
          overflowX: 'auto',
          overflowY: 'hidden',
          flexShrink: 0,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          marginBottom: '8px',
        }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = imagePickerCategory === cat.id && !imagePickerSearch;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setImagePickerCategory(cat.id);
                setImagePickerSearch('');
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: isActive ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.10)',
                background: isActive ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.22), rgba(99, 102, 241, 0.15))' : 'rgba(255, 255, 255, 0.05)',
                color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.70)',
                fontSize: '0.78rem',
                fontWeight: isActive ? 600 : 500,
                boxShadow: isActive ? '0 2px 8px rgba(6, 182, 212, 0.3)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.18s ease',
              }}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      <div
        className="template-picker-mini"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gridAutoRows: 'max-content',
          alignContent: 'start',
          gap: '12px',
          padding: '4px 2px 16px 2px',
          boxSizing: 'border-box',
          overscrollBehavior: 'contain',
        }}
      >
        {filteredImageTemplates.length > 0 ? (
          filteredImageTemplates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="template-card glass-card hover-lift"
              style={{
                minWidth: 0,
                width: '100%',
                height: 'auto',
                minHeight: '165px',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '14px',
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                boxSizing: 'border-box',
                transition: 'all 0.18s ease'
              }}
              onClick={() => handleCardClick(tmpl)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div
                className="template-image-wrapper"
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  height: '130px',
                  minHeight: '120px',
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'rgba(0, 0, 0, 0.4)',
                  flexShrink: 0,
                }}
              >
                <img
                  src={tmpl.imageUrl}
                  alt={tmpl.name}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '120px',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'transform 0.25s ease'
                  }}
                />
              </div>
              <div className="template-info" style={{ padding: '8px', minHeight: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxSizing: 'border-box' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, textAlign: 'center', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)', width: '100%' }}>{tmpl.name}</span>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            <ImageIcon className="icon-lg" style={{ opacity: 0.4, marginBottom: '8px' }} />
            <p>No matching templates found for "{imagePickerSearch}"</p>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
