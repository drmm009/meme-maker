import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Flame,
  Share2,
  Smile,
  Briefcase,
  Heart,
  Drama,
  LayoutGrid,
  Sparkles,
  Star,
  Clapperboard,
  Layers,
  ArrowRight,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import { MEME_TEMPLATES } from '../data/templates';
import { VIDEO_MEME_TEMPLATES } from '../data/videoTemplates';
import { fetchOpenSourceMemes } from '../services/memeService';
import { safeGet, safeSet } from '../utils/storage';
import './ExploreView.css';

export const EXPLORE_CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: Layers, color: '#ff5e36', description: 'Browse all templates categorically' },
  { id: 'trending', label: 'Trending', icon: Flame, color: '#ff3b60', description: 'Most viral memes right now' },
  { id: 'social', label: 'Social Cards', icon: Share2, color: '#38bdf8', description: 'Twitter, WhatsApp & Instagram cards' },
  { id: 'reaction', label: 'Reactions', icon: Smile, color: '#a855f7', description: 'Expressive moods & face reactions' },
  { id: 'work', label: 'Work & Office', icon: Briefcase, color: '#f59e0b', description: 'Corporate & 9-to-5 relatable humor' },
  { id: 'relatable', label: 'Relatable', icon: Heart, color: '#ec4899', description: 'Everyday life, dating & friendship' },
  { id: 'classic', label: 'Classics', icon: Drama, color: '#eab308', description: 'Timeless legendary meme formats' },
  { id: 'comparison', label: 'Comparison & VS', icon: LayoutGrid, color: '#6366f1', description: 'Side-by-side comparisons & choices' },
  { id: 'desi', label: 'Bollywood & Desi', icon: Sparkles, color: '#10b981', description: 'Iconic cinema & pop culture memes' },
  { id: 'popular', label: 'Popular', icon: Star, color: '#f97316', description: 'All-time favorite community templates' },
  { id: 'videos', label: 'Video Memes', icon: Clapperboard, color: '#06b6d4', description: 'Motion clips & timeline video memes' },
  { id: 'favorites', label: 'My Favorites', icon: Star, color: '#fbbf24', description: 'Templates you have starred' }
];

export default function ExploreView({ onSelectTemplate, onCreateCustom, initialCategory = 'all' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [favorites, setFavorites] = useState(() => safeGet('meme_favorite_templates', []));
  const [templatesList, setTemplatesList] = useState(() => [...MEME_TEMPLATES, ...VIDEO_MEME_TEMPLATES]);
  const searchInputRef = useRef(null);

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
  const matchesCategory = (t, catId) => {
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
  };

  // Counts for all categories
  const categoryCounts = useMemo(() => {
    const counts = {};
    EXPLORE_CATEGORIES.forEach((cat) => {
      counts[cat.id] = templatesList.filter((t) => matchesCategory(t, cat.id)).length;
    });
    return counts;
  }, [templatesList, favorites]);

  // Filtered templates by search and active category
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

    return result;
  }, [templatesList, selectedCategory, searchQuery, favorites]);

  // Categorical groups for the "All Templates" view when not searching
  const categoricalSections = useMemo(() => {
    if (searchQuery.trim().length > 0 || selectedCategory !== 'all') {
      return null;
    }

    const sections = [
      { id: 'trending', label: '🔥 Trending Memes', templates: templatesList.filter((t) => matchesCategory(t, 'trending')).slice(0, 8) },
      { id: 'social', label: '📱 Social Media Cards', templates: templatesList.filter((t) => matchesCategory(t, 'social')).slice(0, 6) },
      { id: 'work', label: '💼 Work & 9-to-5 Memes', templates: templatesList.filter((t) => matchesCategory(t, 'work')).slice(0, 8) },
      { id: 'reaction', label: '😂 Expressive Reactions', templates: templatesList.filter((t) => matchesCategory(t, 'reaction')).slice(0, 8) },
      { id: 'relatable', label: '❤️ Relatable & Relationships', templates: templatesList.filter((t) => matchesCategory(t, 'relatable')).slice(0, 8) },
      { id: 'desi', label: '✨ Bollywood & Desi Pop Culture', templates: templatesList.filter((t) => matchesCategory(t, 'desi')).slice(0, 8) },
      { id: 'classic', label: '🎭 Classic Legendary Memes', templates: templatesList.filter((t) => matchesCategory(t, 'classic')).slice(0, 8) },
      { id: 'videos', label: '🎬 Motion Video Templates', templates: templatesList.filter((t) => matchesCategory(t, 'videos')).slice(0, 6) }
    ];

    return sections.filter((s) => s.templates.length > 0);
  }, [templatesList, searchQuery, selectedCategory]);

  const activeCategoryMeta = useMemo(() => {
    return EXPLORE_CATEGORIES.find((c) => c.id === selectedCategory) || EXPLORE_CATEGORIES[0];
  }, [selectedCategory]);

  return (
    <div className="explore-view-page">
      {/* Top Search & Filter Header */}
      <div className="explore-header-container">
        <div className="explore-header-titles">
          <h2 className="explore-page-title">Explore Templates</h2>
          <p className="explore-page-subtitle">
            Browse 100+ viral meme templates, interactive social cards & video clips
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="explore-search-bar-wrap">
          <div className="explore-search-input-box">
            <Search size={18} className="explore-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="explore-search-input"
              placeholder="Search all templates (Drake, Cat, Wojak, Reaction, Tweet)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                className="explore-search-clear-btn"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {searchQuery.trim().length > 0 && (
            <div className="explore-search-results-badge">
              Found {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'}
            </div>
          )}
        </div>
      </div>

      {/* Main Split Layout: Left Vertically Scrolled Category Tags + Right Templates */}
      <div className="explore-main-layout">
        {/* LEFT COLUMN: Vertically Scrolled Category Tags Rail */}
        <aside className="explore-categories-aside" aria-label="Template Categories">
          <div className="explore-categories-header">
            <span className="explore-categories-title">Categories</span>
            <span className="explore-categories-total">{EXPLORE_CATEGORIES.length}</span>
          </div>

          <div className="explore-categories-vertical-scroll" role="tablist">
            {EXPLORE_CATEGORIES.map((cat) => {
              const IconComp = cat.icon;
              const isActive = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;

              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`explore-category-vertical-tag ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                  }}
                  role="tab"
                  aria-selected={isActive}
                >
                  <span
                    className="explore-cat-icon-wrap"
                    style={{ background: isActive ? cat.color : undefined }}
                  >
                    <IconComp size={16} color={isActive ? '#ffffff' : cat.color} />
                  </span>
                  <div className="explore-cat-text-wrap">
                    <span className="explore-cat-name">{cat.label}</span>
                    <span className="explore-cat-desc">{cat.description}</span>
                  </div>
                  <span className="explore-cat-count-pill">{count}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* RIGHT COLUMN: Categorical Templates Content Area */}
        <section className="explore-templates-content" aria-label="Templates Grid">
          {/* Active Category Header when specific category or search active */}
          {(selectedCategory !== 'all' || searchQuery.trim().length > 0) && (
            <div className="explore-active-category-header">
              <div className="explore-active-cat-title-row">
                <div
                  className="explore-active-icon-badge"
                  style={{ background: activeCategoryMeta.color }}
                >
                  <activeCategoryMeta.icon size={20} color="#ffffff" />
                </div>
                <div>
                  <h3 className="explore-active-cat-title">
                    {searchQuery.trim().length > 0 ? `Search: "${searchQuery}"` : activeCategoryMeta.label}
                  </h3>
                  <span className="explore-active-cat-subtext">
                    {searchQuery.trim().length > 0
                      ? `Showing ${filteredTemplates.length} matching templates`
                      : activeCategoryMeta.description}
                  </span>
                </div>
              </div>

              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  className="explore-reset-category-btn"
                  onClick={() => setSelectedCategory('all')}
                >
                  <span>Show All</span>
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {/* 1. Categorical Sections View (When 'All Templates' is selected and no search) */}
          {categoricalSections && categoricalSections.length > 0 && (
            <div className="explore-categorical-sections">
              {categoricalSections.map((section) => (
                <div key={section.id} className="explore-section-group">
                  <div className="explore-section-header">
                    <h4 className="explore-section-title">{section.label}</h4>
                    <button
                      type="button"
                      className="explore-section-see-all-btn"
                      onClick={() => setSelectedCategory(section.id)}
                    >
                      <span>View all ({categoryCounts[section.id] || section.templates.length})</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="explore-templates-grid">
                    {section.templates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        isFavorite={favorites.includes(template.id)}
                        onToggleFavorite={toggleFavorite}
                        onSelectTemplate={onSelectTemplate}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. Direct Filtered Grid View (When a specific category is selected or searching) */}
          {(!categoricalSections || categoricalSections.length === 0) && (
            <div className="explore-templates-grid">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isFavorite={favorites.includes(template.id)}
                  onToggleFavorite={toggleFavorite}
                  onSelectTemplate={onSelectTemplate}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredTemplates.length === 0 && (
            <div className="explore-empty-state">
              <div className="explore-empty-icon">🔍</div>
              <h4 className="explore-empty-title">No templates found</h4>
              <p className="explore-empty-desc">
                {searchQuery.trim().length > 0
                  ? `No templates matched "${searchQuery}". Try a different keyword or category.`
                  : selectedCategory === 'favorites'
                  ? "You haven't starred any favorites yet! Tap the star on any template to add it."
                  : 'No templates available in this category.'}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                Browse All Templates
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function TemplateCard({ template, isFavorite, onToggleFavorite, onSelectTemplate }) {
  const isVideo = template.type === 'video';
  const isSocial = template.category === 'social' || (template.tags && template.tags.includes('social'));
  const isTrending = template.tag === 'trending' || (template.trendingScore && template.trendingScore >= 140);

  return (
    <div
      className="explore-template-card"
      onClick={() => onSelectTemplate && onSelectTemplate(template)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelectTemplate && onSelectTemplate(template);
        }
      }}
    >
      <div className="explore-card-thumb-wrap">
        <img
          src={template.imageUrl || template.thumbnailUrl}
          alt={template.name}
          loading="lazy"
          className="explore-card-img"
        />

        {/* Favorite Star Button */}
        <button
          type="button"
          className={`explore-card-fav-btn ${isFavorite ? 'active' : ''}`}
          onClick={(e) => onToggleFavorite(e, template.id)}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star size={14} fill={isFavorite ? '#fbbf24' : 'none'} color={isFavorite ? '#fbbf24' : '#ffffff'} />
        </button>

        {/* Badges */}
        {isSocial && <span className="explore-card-tag tag-social">Social Card</span>}
        {isVideo && (
          <span className="explore-card-tag tag-video">
            <Clapperboard size={12} /> Video
          </span>
        )}
        {isTrending && !isSocial && !isVideo && <span className="explore-card-tag tag-trending">🔥 Viral</span>}
      </div>

      <div className="explore-card-info">
        <span className="explore-card-name" title={template.name}>
          {template.name}
        </span>
      </div>
    </div>
  );
}
