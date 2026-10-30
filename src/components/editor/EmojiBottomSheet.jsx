import React, { useState } from 'react';
import BottomSheet from '../BottomSheet';
import { Search, X } from 'lucide-react';
import { EMOJI_CATEGORIES, filterEmojis } from './panels/mediaPickers';

export default function EmojiBottomSheet({ isOpen, onClose, onSelectEmoji }) {
  const [emojiSearchQuery, setEmojiSearchQuery] = useState('');
  const [activeStickerCategory, setActiveStickerCategory] = useState('faces');

  const filteredEmojis = filterEmojis(emojiSearchQuery, activeStickerCategory);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Choose an Emoji"
      height="min(78vh, 640px)"
      maxHeight="min(78vh, 640px)"
      contentStyle={{ padding: '6px 16px 18px 16px', overflow: 'hidden' }}
    >
      {/* Search Bar */}
      <div className="bs-search-bar">
        <Search className="bs-search-icon" size={16} />
        <input
          type="text"
          placeholder="Search emojis..."
          value={emojiSearchQuery}
          onChange={(e) => setEmojiSearchQuery(e.target.value)}
          className="bs-search-input"
          autoFocus={false}
        />
        {emojiSearchQuery && (
          <button
            type="button"
            className="bs-clear-search-btn"
            onClick={() => setEmojiSearchQuery('')}
            aria-label="Clear search"
          >
            <X size={13} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* Horizontal Category Pill Bar */}
      <div className="bs-category-bar">
        {EMOJI_CATEGORIES.map((cat) => {
          const isActive = activeStickerCategory === cat.id && !emojiSearchQuery;
          return (
            <button
              key={cat.id}
              type="button"
              className={`bs-category-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                setActiveStickerCategory(cat.id);
                setEmojiSearchQuery('');
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
      <div className="bs-emoji-grid">
        {filteredEmojis.map((s) => (
          <button
            key={s.id}
            type="button"
            className="bs-emoji-btn"
            title={s.name}
            onClick={() => onSelectEmoji(s)}
          >
            {s.emoji}
          </button>
        ))}
        {filteredEmojis.length === 0 && (
          <div className="bs-empty-state">
            <span>No emojis found matching "{emojiSearchQuery}".</span>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
