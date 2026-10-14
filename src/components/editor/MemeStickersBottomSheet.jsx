import React, { useState } from 'react';
import BottomSheet from '../BottomSheet';
import { Sticker, Search, X } from 'lucide-react';
import { GRAPHIC_STICKERS, GRAPHIC_STICKER_CATEGORIES } from '../../data/memeStickers';

export default function MemeStickersBottomSheet({ isOpen, onClose, onSelectSticker }) {
  const [stickerSearchQuery, setStickerSearchQuery] = useState('');
  const [activeGraphicStickerCategory, setActiveGraphicStickerCategory] = useState('popular');

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
      <div className="search-bar-wrapper margin-bottom-md" style={{ position: 'relative', marginTop: '2px', marginBottom: '12px' }}>
        <Search className="search-icon" size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search meme stickers (glasses, hat, bubble, crown)..."
          value={stickerSearchQuery}
          onChange={(e) => setStickerSearchQuery(e.target.value)}
          className="search-input"
          style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '24px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--cyber-cyan)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--glass-border)')}
        />
        {stickerSearchQuery && (
          <button
            className="btn-clear-search hover-lift"
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setStickerSearchQuery('')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '14px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Category sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '64px', height: '100%', overflowY: 'auto', paddingRight: '4px', overscrollBehavior: 'contain' }}>
          {GRAPHIC_STICKER_CATEGORIES.map((cat) => {
            const isActive = activeGraphicStickerCategory === cat.id && !stickerSearchQuery;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveGraphicStickerCategory(cat.id);
                  setStickerSearchQuery('');
                }}
                style={{
                  padding: '10px 4px',
                  background: isActive ? 'rgba(168, 85, 247, 0.16)' : 'transparent',
                  border: isActive ? '1px solid var(--cyber-cyan)' : '1px solid transparent',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s',
                  color: isActive ? 'var(--cyber-cyan)' : 'var(--text-main)',
                }}
                title={cat.label}
              >
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{cat.icon}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Graphic stickers grid */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(74px, 1fr))', gap: '10px', overflowY: 'auto', padding: '4px', alignContent: 'start', overscrollBehavior: 'contain', height: '100%' }}>
          {filteredStickers.map((stk) => (
            <button
              key={stk.id}
              className="graphic-sticker-btn hover-lift"
              title={stk.name}
              onClick={() => onSelectSticker(stk)}
              style={{
                background: 'var(--bg-surface-1)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '8px 4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                minHeight: '76px',
                position: 'relative',
              }}
            >
              <img
                src={stk.url}
                alt={stk.name}
                style={{ width: '48px', height: '44px', objectFit: 'contain', pointerEvents: 'none' }}
                loading="lazy"
              />
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '68px' }}>
                {stk.name}
              </span>
            </button>
          ))}
          {filteredStickers.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0' }}>
              No stickers found matching "{stickerSearchQuery}".
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
