import React, { useState } from 'react';
import BottomSheet from '../BottomSheet';
import { Sticker, Search, X } from 'lucide-react';
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
      icon={<Sticker size={18} style={{ color: 'var(--cyber-cyan)' }} />}
      maxHeight="78vh"
      contentStyle={{ padding: '6px 16px 16px 16px', overflow: 'hidden' }}
    >
      {/* Search Input */}
      <div className="search-bar-wrapper" style={{ position: 'relative', marginTop: '2px', marginBottom: '10px' }}>
        <Search
          className="search-icon"
          size={16}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none'
          }}
        />
        <input
          type="text"
          placeholder="Search meme stickers (glasses, hat, bubble, crown)..."
          value={stickerSearchQuery}
          onChange={(e) => setStickerSearchQuery(e.target.value)}
          className="search-input"
          style={{
            width: '100%',
            height: '40px',
            padding: '8px 36px 8px 36px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-main)',
            fontSize: '0.84rem',
            outline: 'none',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--cyber-cyan)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--glass-border)')}
        />
        {stickerSearchQuery && (
          <button
            type="button"
            className="btn-clear-search hover-lift"
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              color: 'var(--text-main)',
              cursor: 'pointer',
              borderRadius: '50%',
              width: '22px',
              height: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
            onClick={() => setStickerSearchQuery('')}
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Horizontal Category Pill Bar */}
      <div
        className="horizontal-scroll-only"
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '2px 2px 8px 2px',
          marginBottom: '6px',
          flexShrink: 0
        }}
      >
        {GRAPHIC_STICKER_CATEGORIES.map((cat) => {
          const isActive = activeGraphicStickerCategory === cat.id && !stickerSearchQuery;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveGraphicStickerCategory(cat.id);
                setStickerSearchQuery('');
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: isActive ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.10)',
                background: isActive ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.22), rgba(99, 102, 241, 0.15))' : 'rgba(255, 255, 255, 0.05)',
                color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.70)',
                fontSize: '0.78rem',
                fontWeight: isActive ? 600 : 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.18s ease',
                boxShadow: isActive ? '0 2px 8px rgba(6, 182, 212, 0.3)' : 'none'
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
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(82px, 1fr))',
          gap: '10px',
          overflowY: 'auto',
          padding: '4px 2px 14px 2px',
          alignContent: 'start',
          overscrollBehavior: 'contain',
          minHeight: 0
        }}
      >
        {filteredStickers.map((stk) => (
          <button
            key={stk.id}
            type="button"
            className="graphic-sticker-btn hover-lift"
            title={stk.name}
            onClick={() => onSelectSticker(stk)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '10px 6px 8px 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              minHeight: '84px',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.10)';
              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                width: '52px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <img
                src={stk.url}
                alt={stk.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }}
                loading="lazy"
              />
            </div>
            <span
              style={{
                fontSize: '0.66rem',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.70)',
                marginTop: '6px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '74px'
              }}
            >
              {stk.name}
            </span>
          </button>
        ))}
        {filteredStickers.length === 0 && (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              color: 'var(--text-muted)',
              padding: '30px 10px',
              fontSize: '0.85rem'
            }}
          >
            No stickers found matching "{stickerSearchQuery}".
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
