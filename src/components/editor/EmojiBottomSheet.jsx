import React, { useState } from 'react';
import BottomSheet from '../BottomSheet';
import { Smile, Search, X } from 'lucide-react';
import { STICKERS } from '../../data/stickers';

const EMOJI_CATEGORIES = [
  { id: 'faces', icon: '😀', label: 'Faces' },
  { id: 'gestures', icon: '👋', label: 'Hands' },
  { id: 'symbols', icon: '❤️', label: 'Symbols' },
  { id: 'objects', icon: '💡', label: 'Objects' },
  { id: 'flags', icon: '🏳️‍🌈', label: 'Flags' },
];

export default function EmojiBottomSheet({ isOpen, onClose, onSelectEmoji }) {
  const [emojiSearchQuery, setEmojiSearchQuery] = useState('');
  const [activeStickerCategory, setActiveStickerCategory] = useState('faces');

  const filteredEmojis = STICKERS.filter((s) => {
    if (emojiSearchQuery.trim()) {
      const q = emojiSearchQuery.toLowerCase();
      return (
        s.id.toLowerCase().includes(q) ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        s.emoji.includes(q)
      );
    }
    return s.category === activeStickerCategory;
  });

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Choose an Emoji"
      icon={<Smile size={18} style={{ color: 'var(--cyber-cyan)' }} />}
      maxHeight="78vh"
      contentStyle={{ padding: '6px 16px 16px 16px', overflow: 'hidden' }}
    >
      {/* Search Bar */}
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
          placeholder="Search emojis..."
          value={emojiSearchQuery}
          onChange={(e) => setEmojiSearchQuery(e.target.value)}
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
        {emojiSearchQuery && (
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
            onClick={() => setEmojiSearchQuery('')}
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
        {EMOJI_CATEGORIES.map((cat) => {
          const isActive = activeStickerCategory === cat.id && !emojiSearchQuery;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveStickerCategory(cat.id);
                setEmojiSearchQuery('');
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

      {/* Full-Width Grid of Emojis */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
          gap: '8px',
          overflowY: 'auto',
          padding: '4px 2px 14px 2px',
          alignContent: 'start',
          overscrollBehavior: 'contain',
          minHeight: 0
        }}
      >
        {filteredEmojis.map((s) => (
          <button
            key={s.id}
            type="button"
            className="hover-lift"
            title={s.name}
            onClick={() => onSelectEmoji(s)}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              fontSize: '1.85rem',
              cursor: 'pointer',
              padding: '6px 2px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              aspectRatio: '1 / 1',
              minHeight: '48px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.transform = 'scale(1.14)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {s.emoji}
          </button>
        ))}
        {filteredEmojis.length === 0 && (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              color: 'var(--text-muted)',
              padding: '30px 10px',
              fontSize: '0.85rem'
            }}
          >
            No emojis found matching "{emojiSearchQuery}".
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
