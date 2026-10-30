import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Flame,
  Share2,
  Smile,
  Briefcase,
  Heart,
  Drama,
  Sparkles,
  Star,
  Clapperboard,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  Check,
  ArrowDownAZ,
  Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MEME_TEMPLATES } from '../data/templates';
import { VIDEO_MEME_TEMPLATES } from '../data/videoTemplates';
import { fetchOpenSourceMemes } from '../services/memeService';
import { safeGet, safeSet } from '../utils/storage';
import { templateNumericId } from '../utils/templateOrder';
import { EXPLORE_CATEGORIES } from '../data/exploreCategories';
import './ExploreView.css';



const SORT_OPTIONS = [
  { id: 'trending', label: 'Trending', icon: Flame, color: '#ff5e36' },
  { id: 'popular', label: 'Most Popular', icon: Star, color: '#eab308' },
  { id: 'newest', label: 'Newest', icon: Sparkles, color: '#06b6d4' },
  { id: 'name', label: 'A-Z Name', icon: ArrowDownAZ, color: '#a855f7' }
];


function getTemplateBadge(template, index = 0) {
  if (!template) return { label: 'Popular', icon: Flame, color: '#ff5e36' };
  if (template.type === 'video') {
    return { label: 'Video', icon: Video, color: '#06b6d4' };
  }
  if (template.category === 'social' || (template.tags && template.tags.includes('social'))) {
    return { label: 'Social', icon: Share2, color: '#38bdf8' };
  }
  if (template.category === 'reaction') {
    return { label: 'Reaction', icon: Smile, color: '#a855f7' };
  }
  if (template.category === 'classic' || (template.trendingScore && template.trendingScore >= 135 && template.trendingScore < 140)) {
    return { label: 'Classic', icon: Drama, color: '#f59e0b' };
  }
  if (template.category === 'work') {
    return { label: 'Work', icon: Briefcase, color: '#f59e0b' };
  }
  if (template.category === 'desi') {
    return { label: 'Desi', icon: Sparkles, color: '#10b981' };
  }
  if (template.tag === 'trending' || (template.trendingScore && template.trendingScore >= 140)) {
    return { label: 'Trending', icon: Flame, color: '#ff3b60' };
  }
  if (index % 6 === 4 || (template.trendingScore && template.trendingScore < 30)) {
    return { label: 'New', icon: Sparkles, color: '#10b981' };
  }
  return { label: 'Popular', icon: Flame, color: '#ff5e36' };
}

export default function ExploreView({ onSelectTemplate, onCreateCustom: _onCreateCustom, initialCategory = 'all' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('trending');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [favorites, setFavorites] = useState(() => safeGet('meme_favorite_templates', []));
  const [templatesList, setTemplatesList] = useState(() => [...MEME_TEMPLATES, ...VIDEO_MEME_TEMPLATES]);

  const searchInputRef = useRef(null);
  const sortRef = useRef(null);
  const tagsScrollRef = useRef(null);

  const handleSelectCategory = (catId, shouldScrollTop = false) => {
    setSelectedCategory(catId);
    if (shouldScrollTop && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Sync category if initialCategory changes from parent navigation
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  // Keep active category button visible on screen by auto-centering it in the horizontal slider
  useEffect(() => {
    const scrollActiveIntoView = () => {
      const container = tagsScrollRef.current;
      if (!container) return;

      const activeBtn = container.querySelector('.explore-tag-pill.active');
      if (!activeBtn) return;

      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();

      // Absolute offset of active button from the left edge of scrollable content
      const offsetInside = (btnRect.left - containerRect.left) + container.scrollLeft;
      const targetScrollLeft = offsetInside - (container.clientWidth / 2) + (btnRect.width / 2);

      if (typeof container.scrollTo === 'function') {
        container.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: 'smooth',
        });
      } else {
        container.scrollLeft = Math.max(0, targetScrollLeft);
      }
    };

    const rafId = requestAnimationFrame(scrollActiveIntoView);
    return () => cancelAnimationFrame(rafId);
  }, [selectedCategory]);

  // Click outside listener for sort popover
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
    };
    if (isSortOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isSortOpen]);

  useEffect(() => {
    let isCancelled = false;
    fetchOpenSourceMemes().then((online) => {
      if (!isCancelled && online && online.length > 0) {
        setTemplatesList((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const uniqueNew = online.filter((t) => !existingIds.has(t.id));
          return [...prev, ...uniqueNew];
        });
      }
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  const toggleFavorite = (e, templateId) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId];
      safeSet('meme_favorite_templates', next);
      return next;
    });
  };

  // Helper keyword matchers
  const matchesCategory = useCallback((t, catId) => {
    if (!t) return false;
    const nameLower = (t.name || '').toLowerCase();
    const tags = t.tags || [];

    switch (catId) {
      case 'all':
        return true;
      case 'trending':
        return (t.trendingScore && t.trendingScore >= 140) || t.tag === 'trending';
      case 'social':
        return t.category === 'social' || tags.includes('social');
      case 'reaction': {
        const reactKeys = ['hotline', 'disaster', 'change my mind', 'spiderman pointing', 'pikachu', 'roll safe', 'simply', 'batman'];
        return t.category === 'reaction' || tags.includes('reaction') || reactKeys.some((k) => nameLower.includes(k));
      }
      case 'work': {
        const workKeys = ['meeting', 'fine', 'skeleton', 'clown', 'bernie', 'same picture', 'paid', 'lenny', 'harold', 'brain', 'homies', 'scientist', 'kermit'];
        return t.category !== 'social' && (workKeys.some((k) => nameLower.includes(k)) || tags.some((tg) => workKeys.some((k) => tg.toLowerCase().includes(k))));
      }
      case 'relatable': {
        const relKeys = ['boyfriend', 'cat', 'thinking about other', 'padme', 'friendship ended', 'drake', 'buttons', 'couple'];
        return t.category !== 'social' && (relKeys.some((k) => nameLower.includes(k)) || tags.some((tg) => relKeys.some((k) => tg.toLowerCase().includes(k))));
      }
      case 'classic': {
        const classicKeys = ['ancient', 'doge', 'wonka', 'y u no', 'philosoraptor', 'success kid'];
        return t.category === 'classic' || (t.trendingScore && t.trendingScore >= 135 && t.trendingScore < 140) || classicKeys.some((k) => nameLower.includes(k));
      }
      case 'comparison':
        return t.category === 'comparison' || nameLower.includes('vs') || nameLower.includes('comparison') || nameLower.includes('buttons');
      case 'desi': {
        const desiKeys = ['akshay', 'arjun', 'hera pheri', 'jethalal', 'babu bhaiya', 'majnu', 'modi'];
        return t.category === 'desi' || desiKeys.some((k) => nameLower.includes(k));
      }
      case 'popular':
        return (t.trendingScore && t.trendingScore >= 50) || t.tag === 'popular';
      case 'videos':
        return t.type === 'video';
      case 'favorites':
        return favorites.includes(t.id);
      default:
        return t.category === catId;
    }
  }, [favorites]);

  // Counts for all categories
  const categoryCounts = useMemo(() => {
    const counts = {};
    EXPLORE_CATEGORIES.forEach((cat) => {
      counts[cat.id] = templatesList.filter((t) => matchesCategory(t, cat.id)).length;
    });
    return counts;
  }, [templatesList, matchesCategory]);

  // Filtered and sorted templates
  const filteredTemplates = useMemo(() => {
    let result = templatesList;

    if (selectedCategory !== 'all') {
      result = result.filter((t) => matchesCategory(t, selectedCategory));
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((t) => {
        const nameMatch = (t.name || '').toLowerCase().includes(q);
        const tagMatch = (t.tags || []).some((tg) => tg.toLowerCase().includes(q));
        const catMatch = (t.category || '').toLowerCase().includes(q);
        return nameMatch || tagMatch || catMatch;
      });
    }

    const sorted = [...result];
    if (sortBy === 'trending') {
      sorted.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
    } else if (sortBy === 'popular') {
      sorted.sort((a, b) => templateNumericId(b) - templateNumericId(a));
    } else if (sortBy === 'name') {
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'newest') {
      sorted.reverse();
    }

    return sorted;
  }, [templatesList, selectedCategory, searchQuery, sortBy, matchesCategory]);

  // Curated shelf sections for "All Templates" view
  const categoricalSections = useMemo(() => {
    if (searchQuery.trim().length > 0 || selectedCategory !== 'all') {
      return null;
    }

    const sections = [
      { id: 'trending', label: 'Trending Memes', subtext: 'Most viral memes right now', icon: Flame, color: '#ff3b60', templates: templatesList.filter((t) => matchesCategory(t, 'trending')).slice(0, 10) },
      { id: 'social', label: 'Social Media Cards', subtext: 'Twitter, WhatsApp & Instagram cards', icon: Share2, color: '#38bdf8', templates: templatesList.filter((t) => matchesCategory(t, 'social')).slice(0, 8) },
      { id: 'videos', label: 'Motion Video Templates', subtext: 'Video clips with synchronized audio', icon: Clapperboard, color: '#06b6d4', templates: templatesList.filter((t) => matchesCategory(t, 'videos')).slice(0, 8) },
      { id: 'work', label: 'Work & 9-to-5 Memes', subtext: 'Relatable corporate & office humor', icon: Briefcase, color: '#f59e0b', templates: templatesList.filter((t) => matchesCategory(t, 'work')).slice(0, 10) },
      { id: 'reaction', label: 'Expressive Reactions', subtext: 'Timeless facial moods & expressions', icon: Smile, color: '#a855f7', templates: templatesList.filter((t) => matchesCategory(t, 'reaction')).slice(0, 10) },
      { id: 'relatable', label: 'Relationships Memes', subtext: 'Everyday life, dating & friends', icon: Heart, color: '#ec4899', templates: templatesList.filter((t) => matchesCategory(t, 'relatable')).slice(0, 10) },
      { id: 'desi', label: 'Bollywood Culture', subtext: 'Iconic cinema & pop culture memes', icon: Sparkles, color: '#10b981', templates: templatesList.filter((t) => matchesCategory(t, 'desi')).slice(0, 10) },
      { id: 'classic', label: 'Classic Legends', subtext: 'Timeless vintage internet gold', icon: Drama, color: '#eab308', templates: templatesList.filter((t) => matchesCategory(t, 'classic')).slice(0, 10) },
    ];

    return sections.filter((s) => s.templates.length > 0);
  }, [templatesList, searchQuery, selectedCategory, matchesCategory]);

  const currentSortMeta = useMemo(() => {
    return SORT_OPTIONS.find((s) => s.id === sortBy) || SORT_OPTIONS[0];
  }, [sortBy]);

  const activeCategoryMeta = useMemo(() => {
    return EXPLORE_CATEGORIES.find((c) => c.id === selectedCategory) || EXPLORE_CATEGORIES[0];
  }, [selectedCategory]);

  return (
    <div className="explore-view-page">
      {/* Top Search & Filter Bar */}
      <div className="explore-top-bar">
        <div className="search-pill-container explore-search-pill-container">
          <Search className="search-pill-icon explore-search-pill-icon" size={18} />
          <input
            ref={searchInputRef}
            type="text"
            className="search-pill-input explore-search-pill-input"
            placeholder="Search templates (Drake, Cat, Wojak, Reaction, Tweet)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              className="search-pill-clear explore-search-pill-clear"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort Popover Button */}
        <div className="explore-sort-pill-wrapper" ref={sortRef}>
          <button
            type="button"
            className="explore-search-filter-toggle-btn"
            onClick={() => setIsSortOpen((prev) => !prev)}
            aria-expanded={isSortOpen}
            title={`Sorted by: ${currentSortMeta.label}`}
            aria-label="Sort templates"
          >
            <SlidersHorizontal size={18} />
          </button>

          <AnimatePresence>
            {isSortOpen && (
              <motion.div
                className="explore-sort-dropdown-popover"
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
              >
                <div className="explore-sort-dropdown-header">Sort By</div>
                {SORT_OPTIONS.map((opt) => {
                  const OptIcon = opt.icon;
                  const isOptActive = sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`explore-sort-dropdown-item ${isOptActive ? 'active' : ''}`}
                      onClick={() => {
                        setSortBy(opt.id);
                        setIsSortOpen(false);
                      }}
                    >
                      <span className="explore-sort-item-icon">
                        <OptIcon size={16} color={opt.color || '#ff5e36'} />
                      </span>
                      <span className="explore-sort-item-label">{opt.label}</span>
                      {isOptActive && <Check size={14} className="explore-sort-check" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Horizontal Smooth-Scrolling Category Pills Rail */}
      <div className="explore-tags-scroll" role="tablist" ref={tagsScrollRef}>
        {EXPLORE_CATEGORIES.map((cat) => {
          const IconComp = cat.icon;
          const isActive = selectedCategory === cat.id;
          const count = categoryCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              type="button"
              className={`explore-tag-pill ${isActive ? 'active' : ''}`}
              onClick={() => {
                handleSelectCategory(cat.id);
              }}
              role="tab"
              aria-selected={isActive}
            >
              <IconComp size={15} style={{ color: isActive ? '#ffffff' : cat.color }} />
              <span>{cat.label}</span>
              {count > 0 && <span className="explore-tag-count-badge">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* 4. Categorical Shelves (When "All" is active and not searching) */}
      {categoricalSections && categoricalSections.length > 0 ? (
        <div className="explore-shelves-container">
          {categoricalSections.map((section) => (
            <section key={section.id} className="explore-shelf-section">
              <div className="explore-shelf-header-row">
                <div className="explore-shelf-title-left">
                  <div className="explore-shelf-icon-badge">
                    <section.icon size={19} color={section.color} style={{ color: section.color }} />
                  </div>
                  <h3 className="explore-shelf-heading">{section.label}</h3>
                </div>
                <button
                  type="button"
                  className="explore-shelf-see-all-btn"
                  onClick={() => handleSelectCategory(section.id, true)}
                >
                  <span>See all</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="explore-shelf-horizontal-scroll">
                {section.templates.map((template, idx) => (
                  <ExploreShelfCard
                    key={template.id}
                    template={template}
                    rank={section.id === 'trending' ? idx + 1 : null}
                    isFavorite={favorites.includes(template.id)}
                    onToggleFavorite={toggleFavorite}
                    onSelectTemplate={onSelectTemplate}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        /* 5. Responsive Grid View (When a category or search is active) */
        <div className="explore-grid-browse-container">
          <div className="explore-grid-header-actions">
            <button
              type="button"
              className="explore-back-to-all-btn"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
            >
              <span>← Back to All Categories</span>
            </button>
            <div className="explore-grid-results-count">
              {searchQuery.trim().length > 0
                ? `Found ${filteredTemplates.length} matching "${searchQuery}"`
                : `${activeCategoryMeta.label} • ${filteredTemplates.length} templates`}
            </div>
          </div>

          {filteredTemplates.length > 0 ? (
            <div className="explore-template-grid">
              {filteredTemplates.map((template, idx) => (
                <ExploreGridCard
                  key={template.id}
                  template={template}
                  index={idx}
                  isFavorite={favorites.includes(template.id)}
                  onToggleFavorite={toggleFavorite}
                  onSelectTemplate={onSelectTemplate}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="explore-empty-state">
              <div className="explore-empty-icon">🔍</div>
              <h3 className="explore-empty-title">No Meme Templates Found</h3>
              <p className="explore-empty-desc">
                {searchQuery.trim().length > 0
                  ? `No templates matched "${searchQuery}". Try a different keyword or browse all categories.`
                  : selectedCategory === 'favorites'
                  ? "You haven't starred any templates yet. Tap the star on any meme to add it here!"
                  : 'No templates available in this category yet.'}
              </p>
              <button
                type="button"
                className="explore-empty-reset-btn"
                onClick={() => {
                  setSearchQuery('');
                  handleSelectCategory('all', true);
                }}
              >
                Browse All Templates
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* Horizontal Shelf Card matching Home Screen Shelf Cards */
function ExploreShelfCard({ template, rank, isFavorite, onToggleFavorite, onSelectTemplate }) {
  const isVideo = template.type === 'video';

  return (
    <div
      className="explore-shelf-card"
      onClick={() => onSelectTemplate?.(template)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelectTemplate?.(template);
        }
      }}
    >
      {/* Star rank badge for top 3 trending */}
      {rank && rank <= 3 && (
        <div className="explore-shelf-rank-badge" title={`Rank #${rank}`}>
          <span className="explore-shelf-rank-num">#{rank}</span>
        </div>
      )}

      {/* Favorite Star Button */}
      <button
        type="button"
        className={`explore-card-fav-btn ${isFavorite ? 'active' : ''}`}
        onClick={(e) => onToggleFavorite(e, template.id)}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star
          size={12}
          fill={isFavorite ? '#facc15' : 'none'}
          color={isFavorite ? '#facc15' : 'rgba(255, 255, 255, 0.8)'}
          strokeWidth={isFavorite ? 2.2 : 1.8}
        />
      </button>

      <div className="explore-shelf-thumb-wrap">
        <img
          src={isVideo ? template.thumbnailUrl : (template.imageUrl || template.thumbnailUrl)}
          alt={template.name}
          loading="lazy"
          className="explore-shelf-card-img"
        />

        {isVideo && (
          <div className="explore-card-video-badge">
            <Video size={10} />
            <span>
              {typeof template.durationMs === 'number' && Number.isFinite(template.durationMs)
                ? `${Math.round(template.durationMs / 1000)}s`
                : 'HD'}
            </span>
          </div>
        )}

        <div className="explore-shelf-card-views">
          <Eye size={10} />
          <span>{((templateNumericId(template) % 28) + 20)}K</span>
        </div>
      </div>

      <div className="explore-shelf-card-info">
        <span className="explore-shelf-card-name" title={template.name}>
          {template.name}
        </span>
      </div>
    </div>
  );
}

/* Grid Template Card matching Home Screen Masonry Cards */
function ExploreGridCard({ template, index, isFavorite, onToggleFavorite, onSelectTemplate }) {
  const isVideo = template.type === 'video';
  const badge = getTemplateBadge(template, index);
  const BadgeIcon = badge.icon;

  return (
    <div
      className="explore-grid-card"
      onClick={() => onSelectTemplate?.(template)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelectTemplate?.(template);
        }
      }}
    >
      {/* Top-Left Category Badge */}
      <span
        className="explore-card-sticker-tag"
        style={{ borderColor: `${badge.color}45` }}
        title={isVideo ? 'Video Template' : badge.label}
      >
        <BadgeIcon size={11} strokeWidth={2.4} style={{ color: badge.color }} />
        <span>{badge.label}</span>
      </span>

      {/* Top-Right Favorite Star Button */}
      <button
        type="button"
        className={`explore-card-fav-btn ${isFavorite ? 'active' : ''}`}
        onClick={(e) => onToggleFavorite(e, template.id)}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star
          size={13}
          fill={isFavorite ? '#facc15' : 'none'}
          color={isFavorite ? '#facc15' : 'rgba(255, 255, 255, 0.8)'}
          strokeWidth={isFavorite ? 2.2 : 1.8}
        />
      </button>

      <div
        className="explore-grid-image-wrap"
        style={{
          position: 'relative',
          aspectRatio: template.width && template.height
            ? `${Math.max(0.75, Math.min(1.15, template.width / template.height))}`
            : '1 / 1'
        }}
      >
        <img
          src={isVideo ? template.thumbnailUrl : (template.imageUrl || template.thumbnailUrl)}
          alt={template.name}
          loading="lazy"
          decoding="async"
          className="explore-grid-img"
        />

        {isVideo && (
          <div className="explore-card-video-badge">
            <Video size={10} />
            <span>
              {typeof template.durationMs === 'number' && Number.isFinite(template.durationMs)
                ? `${Math.round(template.durationMs / 1000)}s`
                : 'HD'}
            </span>
          </div>
        )}

        <div className="explore-card-views-badge">
          <Eye size={11} />
          <span>{((templateNumericId(template) % 30) + 12)}K</span>
        </div>
      </div>

      <div className="explore-grid-card-footer">
        <span className="explore-grid-footer-title" title={template.name}>
          {template.name}
        </span>
      </div>
    </div>
  );
}
