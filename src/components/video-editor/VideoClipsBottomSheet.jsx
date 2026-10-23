import React, { useMemo, useState } from 'react';
import { Clapperboard, Play, Search, X } from 'lucide-react';
import BottomSheet from '../BottomSheet';
import { VIDEO_MEME_TEMPLATES } from '../../data/videoTemplates';

// Meme video clips to drop onto the timeline.
export default function VideoClipsBottomSheet({ isOpen, onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const categories = useMemo(() => ['All', ...new Set(VIDEO_MEME_TEMPLATES.map((t) => t.category))], []);
  const q = search.trim().toLowerCase();
  const clips = VIDEO_MEME_TEMPLATES.filter((t) =>
    (!q || t.name.toLowerCase().includes(q)) && (q || category === 'All' || t.category === category)
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Meme clips"
      icon={<Clapperboard size={17} strokeWidth={2.4} />}
      height="min(82vh, 700px)"
      maxHeight="min(82vh, 700px)"
      contentStyle={{ padding: '6px 16px 18px 16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <div className="bs-search-bar">
        <Search className="bs-search-icon" size={16} />
        <input
          type="text"
          placeholder="Search clips"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bs-search-input"
        />
        {search && (
          <button type="button" className="bs-clear-search-btn" onClick={() => setSearch('')} aria-label="Clear search">
            <X size={13} strokeWidth={2.4} />
          </button>
        )}
      </div>

      <div className="bs-category-bar">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`bs-category-btn ${category === cat && !q ? 'active' : ''}`}
            onClick={() => { setCategory(cat); setSearch(''); }}
          >
            <span>{cat}</span>
          </button>
        ))}
      </div>

      <div className="vclip-grid">
        {clips.map((t) => (
          <button key={t.id} type="button" className="vclip-card" onClick={() => { onSelect(t); onClose(); }}>
            <span className="vclip-thumb">
              <img src={t.thumbnailUrl} alt="" loading="lazy" />
              <span className="vclip-play"><Play size={16} fill="currentColor" /></span>
              <span className="vclip-dur">{Math.max(1, Math.round(t.durationMs / 1000))}s</span>
            </span>
            <span className="vclip-name">{t.name}</span>
          </button>
        ))}
        {clips.length === 0 && <div className="bs-empty-state"><span>No clips match "{search}".</span></div>}
      </div>
    </BottomSheet>
  );
}
