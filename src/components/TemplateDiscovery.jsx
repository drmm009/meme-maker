import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MEME_TEMPLATES } from '../data/templates';
import { VIDEO_MEME_TEMPLATES } from '../data/videoTemplates';
import { 
  Search, Sparkles, Image as ImageIcon, Video,
  Flame, Star, Drama, Clapperboard, Scale, LayoutGrid, Layers, ChevronDown, Check,
  Compass, Smile, ArrowDownAZ, Zap, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './TemplateDiscovery.css';

const TAGS = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'images', label: 'Images', icon: ImageIcon },
  { id: 'videos', label: 'Videos', icon: Clapperboard },
  { id: 'hot', label: 'Hot', icon: Flame, isFilled: true },
  { id: 'new', label: 'New', icon: Sparkles },
  { id: 'favorites', label: 'Favorites', icon: Star },
  { id: 'classics', label: 'Classics', icon: Drama },
  { id: 'desi', label: 'Desi', icon: Compass },
  { id: 'reaction', label: 'Reaction', icon: Smile },
  { id: 'comparison', label: 'Comparison', icon: Scale },
  { id: 'multi-panel', label: 'Multi-Panel', icon: LayoutGrid },
];

const SORT_OPTIONS = [
  { id: 'trending', label: 'Trending', icon: Flame, color: '#ff5e36' },
  { id: 'popular', label: 'Most Popular', icon: Star, color: '#eab308' },
  { id: 'newest', label: 'Newest', icon: Sparkles, color: '#06b6d4' },
  { id: 'name', label: 'A-Z Name', icon: ArrowDownAZ, color: '#a855f7' }
];

export default function TemplateDiscovery({ onSelectTemplate, onCreateCustom }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [sortBy, setSortBy] = useState('trending');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  // Favorites persistence
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('meme_favorite_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Responsive mobile check for search placeholder
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 640;
    }
    return false;
  });

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const updateMatch = (e) => setIsMobile(e.matches);
    setIsMobile(media.matches);
    if (media.addEventListener) {
      media.addEventListener('change', updateMatch);
      return () => media.removeEventListener('change', updateMatch);
    } else {
      media.addListener(updateMatch);
      return () => media.removeListener(updateMatch);
    }
  }, []);

  const toggleFavorite = (e, templateId) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId];
      try {
        localStorage.setItem('meme_favorite_templates', JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  // Close sort menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
    };
    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortOpen]);

  const allTemplates = useMemo(() => {
    return [...MEME_TEMPLATES, ...VIDEO_MEME_TEMPLATES];
  }, []);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((template) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (template.name && template.name.toLowerCase().includes(q)) ||
        (template.category && template.category.toLowerCase().includes(q));

      let matchesTag = true;
      if (selectedTag === 'hot') {
        matchesTag = (template.trendingScore && template.trendingScore >= 90) || template.category === 'popular';
      } else if (selectedTag === 'new') {
        matchesTag = true;
      } else if (selectedTag === 'favorites') {
        if (favorites.length > 0) {
          matchesTag = favorites.includes(template.id);
        } else {
          matchesTag = (template.trendingScore && template.trendingScore >= 95) || template.category === 'classic';
        }
      } else if (selectedTag === 'classics') {
        matchesTag = template.category === 'classic' || template.category === 'popular';
      } else if (selectedTag === 'videos') {
        matchesTag = template.type === 'video';
      } else if (selectedTag === 'images') {
        matchesTag = template.type !== 'video';
      } else if (selectedTag === 'desi') {
        matchesTag = template.category === 'desi';
      } else if (selectedTag === 'reaction') {
        matchesTag = template.category === 'reaction';
      } else if (selectedTag === 'comparison') {
        matchesTag = template.category === 'comparison';
      } else if (selectedTag === 'multi-panel') {
        matchesTag = template.category === 'multi-panel';
      } else if (selectedTag === 'all') {
        matchesTag = true;
      }

      return matchesSearch && matchesTag;
    }).sort((a, b) => {
      if (selectedTag === 'new') {
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      }
      if (sortBy === 'trending' || sortBy === 'popular') {
        return (b.trendingScore || 0) - (a.trendingScore || 0);
      }
      if (sortBy === 'newest') {
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      }
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });
  }, [searchQuery, selectedTag, sortBy, favorites, allTemplates]);

  // Dynamic conflict-free spatial scattering of light cards so they never appear side-by-side
  const [lightCardIds, setLightCardIds] = useState(() => new Set());

  useEffect(() => {
    const updateLightCards = () => {
      const cards = Array.from(document.querySelectorAll('.template-grid > .template-card'));
      if (!cards.length) return;
      
      const cardData = cards.map((el) => {
        const rect = el.getBoundingClientRect();
        const id = el.getAttribute('data-template-id');
        return { id, left: Math.round(rect.left), top: Math.round(rect.top), height: Math.round(rect.height) };
      });

      // Group cards by distinct column (cluster left coordinates within 25px)
      const colBuckets = [];
      for (const card of cardData) {
        let bucket = colBuckets.find(b => Math.abs(b.left - card.left) < 25);
        if (!bucket) {
          bucket = { left: card.left, items: [] };
          colBuckets.push(bucket);
        }
        bucket.items.push(card);
      }
      colBuckets.sort((a, b) => a.left - b.left);

      // Selected set of light card IDs
      const selected = new Set();
      const selectedList = [];

      // Stagger starting indices per column to interleave vertically
      const numCols = colBuckets.length;
      const colOffsets = [1, 4, 2, 5, 0, 3];

      for (let cIdx = 0; cIdx < numCols; cIdx++) {
        const col = colBuckets[cIdx];
        const offset = colOffsets[cIdx % colOffsets.length];
        
        for (let i = offset; i < col.items.length; i += 5) {
          const cand = col.items[i];
          if (!cand || !cand.id) continue;

          // Check for horizontal or vertical conflicts with any already selected light card
          const hasConflict = selectedList.some(sel => {
            const sameCol = Math.abs(sel.left - cand.left) < 30;
            const vDist = Math.abs(sel.top - cand.top);
            if (sameCol) {
              return vDist < 250;
            } else {
              // Never allow light cards in adjacent/other columns within 140px vertically
              return vDist < 140;
            }
          });

          if (!hasConflict) {
            selected.add(cand.id);
            selectedList.push(cand);
          }
        }
      }

      setLightCardIds(selected);
    };

    const frameId = requestAnimationFrame(() => {
      updateLightCards();
    });
    const timer = setTimeout(updateLightCards, 100);
    window.addEventListener('resize', updateLightCards);
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timer);
      window.removeEventListener('resize', updateLightCards);
    };
  }, [filteredTemplates]);

  const currentSortOption = SORT_OPTIONS.find(opt => opt.id === sortBy) || SORT_OPTIONS[0];

  return (
    <div className="template-discovery animate-fade-in">
      <div className="discovery-header">
        {/* Prominent Hero Banner with Frosted Glass Backdrop Glows */}
        <div className="hero-banner-wrapper">
          <div className="hero-glow-orb hero-glow-orb-1" aria-hidden="true" />
          <div className="hero-glow-orb hero-glow-orb-2" aria-hidden="true" />
          <div className="hero-glow-orb hero-glow-orb-3" aria-hidden="true" />
          <div className="hero-banner glass-card">
            <div className="hero-badge" style={{ margin: '0 auto' }}>
              <Sparkles className="icon-sm" /> #1 Meme Creator Studio
            </div>
            <h2>Unleash Your Inner Meme Lord 🚀</h2>
            <p>Pick a trending template, or compose your own custom multi-panel layout!</p>

            <div className="hero-actions">
              <motion.button
                className="btn btn-primary shadow-glow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCreateCustom('image')}
              >
                <ImageIcon className="icon-md" /> Custom Image
              </motion.button>
              <motion.button
                className="btn btn-outline hero-btn-video"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCreateCustom('video')}
              >
                <Video className="icon-md hero-btn-video-icon" />
                <span className="hero-btn-video-text">Video Builder</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-side Search & Standalone Sort Pill */}
      <div className="search-filter-row">
        <div className="search-pill-container">
          <Search className="search-pill-icon" size={19} />
          <input
            type="text"
            placeholder={isMobile ? "Search templates" : "Search templates (Drake, Wojak, Cat)"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-pill-input"
          />
          {searchQuery && (
            <button 
              type="button" 
              className="search-pill-clear" 
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Standalone Sort Container */}
        <div className="sort-pill-wrapper" ref={sortRef}>
          <button
            type="button"
            className="sort-pill-standalone-btn"
            onClick={() => setIsSortOpen(!isSortOpen)}
            aria-expanded={isSortOpen}
            title={`Sorted by: ${currentSortOption.label}`}
          >
            <span className="sort-trigger-icon-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(() => {
                const SortIcon = currentSortOption.icon;
                return <SortIcon size={18} color={currentSortOption.color || '#ff5e36'} />;
              })()}
            </span>
          </button>

          {/* Floating Sort Dropdown */}
          <AnimatePresence>
            {isSortOpen && (
              <motion.div
                className="sort-dropdown-popover"
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
              >
                <div className="sort-dropdown-header">Sort By</div>
                {SORT_OPTIONS.map((opt) => {
                  const OptIcon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`sort-dropdown-item ${sortBy === opt.id ? 'active' : ''}`}
                      onClick={() => {
                        setSortBy(opt.id);
                        setIsSortOpen(false);
                      }}
                    >
                      <span className="sort-item-icon" style={{ display: 'flex', alignItems: 'center' }}>
                        <OptIcon size={16} color={opt.color || '#94a3b8'} />
                      </span>
                      <span className="sort-item-label">{opt.label}</span>
                      {sortBy === opt.id && <Check size={14} className="sort-check" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tags / Categories Row Matching UI */}
      <div className="discovery-tags-scroll">
        {TAGS.map((tag) => {
          const isActive = selectedTag === tag.id;
          const IconComponent = tag.icon;
          return (
            <button
              key={tag.id}
              type="button"
              className={`discovery-tag-pill ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedTag(tag.id)}
            >
              {IconComponent && (
                <IconComponent 
                  size={16} 
                  className="tag-icon" 
                  fill={tag.isFilled && isActive ? 'currentColor' : 'none'} 
                />
              )}
              {tag.emoji && <span className="tag-emoji">{tag.emoji}</span>}
              <span className="tag-label">{tag.label}</span>
              {tag.id === 'favorites' && favorites.length > 0 && (
                <span className="tag-count-badge">{favorites.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Template Grid */}
      <div className="templates-section">
        {filteredTemplates.length > 0 ? (
          <div className="template-grid">
            {filteredTemplates.map((template) => {
              const isLight = lightCardIds.has(String(template.id));
              return (
                <motion.div
                  key={template.id}
                  data-template-id={String(template.id)}
                  className={`template-card glass-card ${isLight ? 'template-card-light' : ''}`}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectTemplate(template)}
                >
                {(template.category && template.category.toLowerCase().includes('popular')) && (
                  <span className="card-sticker-tag">
                    <Flame size={11} strokeWidth={2.8} />
                    Popular
                  </span>
                )}

                {/* Star Favorite Button */}
                <button
                  type="button"
                  className={`card-favorite-btn ${favorites.includes(template.id) ? 'active' : ''}`}
                  onClick={(e) => toggleFavorite(e, template.id)}
                  title={favorites.includes(template.id) ? 'Remove favorite' : 'Add to favorites'}
                >
                  <Star 
                    size={14} 
                    fill={favorites.includes(template.id) ? '#ffb703' : 'none'} 
                    color={favorites.includes(template.id) ? '#ffb703' : '#cbd5e1'} 
                  />
                </button>

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
                </div>
              </motion.div>
            );
          })}
          </div>
        ) : (
          <div className="empty-state glass-card">
            <ImageIcon className="empty-icon" />
            <h3>No Meme Templates Found</h3>
            <p>
              {selectedTag === 'favorites' 
                ? 'You haven\'t starred any templates yet. Click the star on any meme to save it here!' 
                : 'Try searching for a different keyword or browse all categories!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
