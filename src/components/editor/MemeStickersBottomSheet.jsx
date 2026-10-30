import React, { useState } from 'react';
import BottomSheet from '../BottomSheet';
import { Search, X } from 'lucide-react';
import { GRAPHIC_STICKERS, GRAPHIC_STICKER_CATEGORIES } from '../../data/memeStickers';

export default function MemeStickersBottomSheet({ isOpen, onClose, onSelectSticker }) {
  const [stickerSearchQuery, setStickerSearchQuery] = useState('');
  const [activeGraphicStickerCategory, setActiveGraphicStickerCategory] = useState(
    GRAPHIC_STICKER_CATEGORIES[0]?.id || 'memes'
  );

  const filteredStickers = GRAPHIC_STICKERS.filter((s) => {
    if (stickerSearchQuery.trim()) {
      const q = stickerSearchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.id && s.id.toLowerCase().includes(q))
      );
    }
    return s.category === activeGraphicStickerCategory;
  });

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Choose a Sticker"
      height="min(78vh, 640px)"
      maxHeight="min(78vh, 640px)"
      contentStyle={{ padding: '6px 16px 18px 16px', overflow: 'hidden' }}
    >
      {/* Search Input */}
      <div className="bs-search-bar">
        <Search className="bs-search-icon" size={16} />
        <input
          type="text"
          placeholder="Search meme stickers..."
          value={stickerSearchQuery}
          onChange={(e) => setStickerSearchQuery(e.target.value)}
          className="bs-search-input"
          autoFocus={false}
        />
        {stickerSearchQuery && (
          <button
            type="button"
            className="bs-clear-search-btn"
            onClick={() => setStickerSearchQuery('')}
            aria-label="Clear search"
          >
            <X size={13} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* Horizontal Category Pill Bar */}
      <div className="bs-category-bar">
        {GRAPHIC_STICKER_CATEGORIES.map((cat) => {
          const isActive = activeGraphicStickerCategory === cat.id && !stickerSearchQuery;
          return (
            <button
              key={cat.id}
              type="button"
              className={`bs-category-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                setActiveGraphicStickerCategory(cat.id);
                setStickerSearchQuery('');
              }}
              title={cat.label}
            >
              <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Full-Width Grid of Stickers */}
      <div className="bs-sticker-grid">
        {filteredStickers.map((stk) => (
          <button
            key={stk.id}
            type="button"
            className="graphic-sticker-btn bs-sticker-card hover-lift"
            title={stk.name}
            onClick={() => onSelectSticker(stk)}
          >
            <div className="bs-sticker-thumb">
              <img
                src={stk.url}
                alt={stk.name}
                loading="lazy"
              />
            </div>
            <span className="bs-sticker-label">
              {stk.name}
            </span>
          </button>
        ))}
        {filteredStickers.length === 0 && (
          <div className="bs-empty-state">
            <span>No stickers found matching "{stickerSearchQuery}".</span>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
