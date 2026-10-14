import React, { useState } from 'react';
import BottomSheet from '../BottomSheet';
import { Smile, Search, X } from 'lucide-react';
import { STICKERS } from '../../data/stickers';

const EMOJI_CATEGORIES = [
  { id: 'faces', icon: '😀', label: 'Faces' },
  { id: 'gestures', icon: '👋', label: 'Hands' },
  { id: 'flags', icon: '🏳️‍🌈', label: 'Flags' },
  { id: 'symbols', icon: '❤️', label: 'Symbols' },
  { id: 'objects', icon: '💡', label: 'Objects' },
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
      <div className="search-bar-wrapper margin-bottom-md" style={{ position: 'relative', marginTop: '2px', marginBottom: '12px' }}>
        <Search className="search-icon" size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search emojis..."
          value={emojiSearchQuery}
          onChange={(e) => setEmojiSearchQuery(e.target.value)}
          className="search-input"
          style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '24px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--cyber-cyan)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--glass-border)')}
        />
        {emojiSearchQuery && (
          <button
            className="btn-clear-search hover-lift"
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-main)', cursor: 'pointer', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setEmojiSearchQuery('')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '14px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Category sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '60px', height: '100%', overflowY: 'auto', paddingRight: '4px', overscrollBehavior: 'contain' }}>
          {EMOJI_CATEGORIES.map((cat) => {
            const isActive = activeStickerCategory === cat.id && !emojiSearchQuery;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveStickerCategory(cat.id);
                  setEmojiSearchQuery('');
                }}
                style={{
                  padding: '10px 4px',
                  background: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-main)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s',
                }}
                title={cat.label}
              >
                <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{cat.icon}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'inherit' }}>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Emoji grid */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', overflowY: 'auto', padding: '4px', alignContent: 'start', overscrollBehavior: 'contain', height: '100%' }}>
          {filteredEmojis.map((s) => (
            <button
              key={s.id}
              className="hover-lift"
              title={s.name}
              onClick={() => onSelectEmoji(s)}
              style={{ background: 'none', border: 'none', fontSize: '2.2rem', cursor: 'pointer', padding: '4px', textAlign: 'center', transition: 'transform 0.15s' }}
            >
              {s.emoji}
            </button>
          ))}
          {filteredEmojis.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
              No emojis found matching "{emojiSearchQuery}".
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
