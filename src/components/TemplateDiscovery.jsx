import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MEME_TEMPLATES } from '../data/templates';
import { VIDEO_MEME_TEMPLATES } from '../data/videoTemplates';
import { fetchOpenSourceMemes } from '../services/memeService';
import { 
  Search, Sparkles, Image as ImageIcon, Video,
  Flame, Star, Drama, Clapperboard, Scale, LayoutGrid, Layers, ChevronDown, Check,
  Compass, Smile, ArrowDownAZ, Zap, ShieldCheck, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { safeGet, safeSet } from '../utils/storage';
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

// Stable numeric order for mixed string ids ("imgflip-123", "giphy-abc", "custom-...").
// Trailing digits win; otherwise fall back to trendingScore so sort is deterministic (never NaN).
export function templateNumericId(t) {
  const m = String(t.id || '').match(/(\d+)$/);
  if (m) return Number(m[1]);
  return t.trendingScore || 0;
}

export default function TemplateDiscovery({ onSelectTemplate, onCreateCustom }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [sortBy, setSortBy] = useState('trending');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  // Favorites persistence (quota-safe: falls back to session-only on write failure)
  const [favorites, setFavorites] = useState(() => {
    const saved = safeGet('meme_favorite_templates', []);
    return Array.isArray(saved) ? saved : [];
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
      safeSet('meme_favorite_templates', next);
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

  const [templatesList, setTemplatesList] = useState(() => [...MEME_TEMPLATES, ...VIDEO_MEME_TEMPLATES]);

  useEffect(() => {
    let isCancelled = false;
    fetchOpenSourceMemes().then((online) => {
      if (!isCancelled && Array.isArray(online) && online.length > 0) {
        setTemplatesList([...online, ...VIDEO_MEME_TEMPLATES]);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredTemplates = useMemo(() => {
    return templatesList.filter((template) => {
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
        matchesTag = favorites.includes(template.id);
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
        return templateNumericId(b) - templateNumericId(a);
      }
      if (sortBy === 'trending' || sortBy === 'popular') {
        return (b.trendingScore || 0) - (a.trendingScore || 0);
      }
      if (sortBy === 'newest') {
        return templateNumericId(b) - templateNumericId(a);
      }
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });
  }, [searchQuery, selectedTag, sortBy, favorites, templatesList]);

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
                className="studio-pill-btn studio-pill-primary"
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onCreateCustom('image')}
              >
                <ImageIcon size={19} className="studio-pill-icon" />
                <span className="studio-pill-text">Custom Image</span>
              </motion.button>

              <motion.button
                className="studio-pill-btn studio-pill-video"
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onCreateCustom('video')}
              >
                <Video size={19} className="studio-pill-icon video-accent-icon" />
                <span className="studio-pill-text">Video Builder</span>
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
            {filteredTemplates.map((template, index) => {
              // CSS-only stagger: every 7th card starting at 3. No DOM measuring.
              const isLight = index % 7 === 3;
              return (
                <motion.div
                  key={template.id}
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
                  <img
                    src={template.type === 'video' ? template.thumbnailUrl : template.imageUrl}
                    alt={template.name}
                    loading="lazy"
                    onError={(e) => {
                      // One-shot fallback for dead hotlinks (Imgflip rotation/CORS takedowns)
                      const el = e.currentTarget;
                      if (el.dataset.fbk || !template.fallbackUrl) return;
                      el.dataset.fbk = '1';
                      el.src = template.fallbackUrl;
                    }}
                  />
                  
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
                      {typeof template.durationMs === 'number' && Number.isFinite(template.durationMs)
                        ? `🎬 ${Math.round(template.durationMs / 1000)}s`
                        : '🎬 Video'}
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
