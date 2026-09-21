import React, { useState, useMemo } from 'react';
import { MEME_TEMPLATES, CATEGORIES } from '../data/templates';
import { VIDEO_MEME_TEMPLATES } from '../data/videoTemplates';
import { Search, Sparkles, PlusCircle, Crown, Image as ImageIcon, Video } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TemplateDiscovery({ onSelectTemplate, onCreateCustom }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('trending');
  const [mediaType, setMediaType] = useState('all'); // 'all', 'image', 'video'

  const allTemplates = useMemo(() => {
    return [...MEME_TEMPLATES, ...VIDEO_MEME_TEMPLATES];
  }, []);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((template) => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.category.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesCategory = true;
      if (selectedCategory === 'trending') {
        matchesCategory = template.trendingScore >= 93;
      } else if (selectedCategory === 'pro') {
        matchesCategory = template.tag === 'pro';
      } else if (selectedCategory !== 'all') {
        matchesCategory = template.category === selectedCategory;
      }

      let matchesMediaType = true;
      if (mediaType !== 'all') {
        matchesMediaType = template.type === mediaType || (mediaType === 'image' && !template.type);
      }

      return matchesSearch && matchesCategory && matchesMediaType;
    }).sort((a, b) => {
      if (sortBy === 'trending') return (b.trendingScore || 0) - (a.trendingScore || 0);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });
  }, [searchQuery, selectedCategory, sortBy, mediaType, allTemplates]);

  return (
    <div className="template-discovery animate-fade-in">
      <div className="discovery-header">
        {/* Prominent Big Hero Banner */}
        <div className="hero-banner glass-card">
          <div className="hero-badge" style={{ margin: '0 auto', background: '#000000', color: '#f97316', fontSize: '0.72rem', padding: '4px 12px' }}>
            <Sparkles style={{ width: '13px', height: '13px', color: '#f97316', stroke: '#f97316' }} /> #1 Meme Creator Studio
          </div>
          <h2>Unleash Your Inner Meme Lord 🚀</h2>
          <p>Pick a trending template, or compose your own custom multi-panel layout!</p>

          <div className="hero-actions">
            <motion.button
              className="btn shadow-glow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCreateCustom('image')}
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 45%, #9a3412 100%)',
                color: '#ffffff',
                borderColor: '#ea580c',
                borderRadius: '28px',
                fontWeight: 600,
                boxShadow: '0 4px 18px rgba(234, 88, 12, 0.45)'
              }}
            >
              <ImageIcon className="icon-md" /> Custom Image Builder
            </motion.button>
            <motion.button
              className="btn shadow-glow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCreateCustom('video')}
              style={{ backgroundColor: '#000000', color: '#ffffff', borderColor: '#000000', borderRadius: '28px' }}
            >
              <Video className="icon-md" /> Custom Video Builder
            </motion.button>
          </div>
        </div>
      </div>

        {/* Guaranteed Side-by-Side Search & Sort Bar */}
        <div className="search-filter-bar" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <div className="search-input-wrapper" style={{ flex: '1 1 auto', minWidth: '0' }}>
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>

          <div className="sort-wrapper" style={{ flex: '0 0 auto' }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select glass-card"
              style={{ padding: '0 10px', height: '42px', fontSize: '0.78rem', fontWeight: '700', borderRadius: '8px', cursor: 'pointer' }}
            >
              <option value="trending">🔥 Trending</option>
              <option value="name">A-Z Name</option>
            </select>
          </div>
        </div>

        <div className="horizontal-scroll-pills margin-bottom">
          <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid var(--glass-border)', paddingRight: '8px', marginRight: '4px' }}>
            <button className={`category-pill ${mediaType === 'all' ? 'active' : ''}`} onClick={() => setMediaType('all')}>All</button>
            <button className={`category-pill ${mediaType === 'image' ? 'active' : ''}`} onClick={() => setMediaType('image')}>🖼️ Images</button>
            <button className={`category-pill ${mediaType === 'video' ? 'active' : ''}`} onClick={() => setMediaType('video')}>🎬 Videos</button>
          </div>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

      {/* Main Template Grid */}
      <div className="templates-section">
        {filteredTemplates.length > 0 ? (
          <div className="template-grid">
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                className="template-card glass-card hover-lift"
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectTemplate(template)}
              >
                {template.category && (
                  <span className="card-sticker-tag">
                    {template.category}
                  </span>
                )}
                <div className="template-image-wrapper" style={{ position: 'relative' }}>
                  <img src={template.type === 'video' ? template.thumbnailUrl : template.imageUrl} alt={template.name} loading="lazy" />
                  
                  {template.type === 'video' && (
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
                      zIndex: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      🎬 {Math.round(template.durationMs / 1000)}s
                    </div>
                  )}
                </div>
                <div className="template-info">
                  <h4>{template.name}</h4>
                  <span className="template-category">{template.category}</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="empty-state glass-card">
            <ImageIcon className="empty-icon" />
            <h3>No Meme Templates Found</h3>
            <p>Try searching for a different keyword or browse all categories!</p>
          </div>
        )}
      </div>
    </div>
  );
}
