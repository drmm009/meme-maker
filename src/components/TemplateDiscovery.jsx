import React, { useState, useMemo } from 'react';
import { MEME_TEMPLATES, CATEGORIES } from '../data/templates';
import { Search, Sparkles, Flame, PlusCircle, Crown, Image as ImageIcon, Video } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TemplateDiscovery({ onSelectTemplate, onCreateCustom }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('trending');

  const filteredTemplates = useMemo(() => {
    return MEME_TEMPLATES.filter((template) => {
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

      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      if (sortBy === 'trending') return b.trendingScore - a.trendingScore;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [searchQuery, selectedCategory, sortBy]);

  return (
    <div className="template-discovery animate-fade-in">
      <div className="discovery-header">
        {/* Prominent Big Hero Banner */}
        <div className="hero-banner glass-card">
          <div className="hero-badge neon-pill neon-pill-cyan">
            <Sparkles className="icon-sm" /> #1 Meme Creator Studio
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

        {/* Horizontal Category Scroll Pills */}
        <div className="horizontal-scroll-pills margin-bottom">
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
                <div className="template-image-wrapper">
                  <img src={template.imageUrl} alt={template.name} loading="lazy" />
                  <div className="card-badges">
                    {template.trendingScore >= 95 && (
                      <span className="badge badge-trending"><Flame className="icon-xs" /> HOT</span>
                    )}
                  </div>
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
