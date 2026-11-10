// Explore: search, sort and category chips over rows of templates (one row per category), or a grid
// of one category or a search's results. In the editors' look (pages/pageLook.css).
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { MouseEvent } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  Check,
  X,
  Video
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MEME_TEMPLATES } from '../data/templates';
import { VIDEO_MEME_TEMPLATES } from '../data/videoTemplates';
import { fetchOpenSourceMemes } from '../services/memeService';
import { safeGet, safeSet } from '../utils/storage';
import { templateNumericId } from '../utils/templateOrder';
import { EXPLORE_CATEGORIES } from '../data/exploreCategories';
import './pages/pageLook.css';
import './ExploreView.css';

interface Template {
  id: string;
  name?: string;
  type?: string;
  category?: string;
  tag?: string;
  tags?: string[];
  trendingScore?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  durationMs?: number;
  width?: number;
  height?: number;
}

type SortId = 'trending' | 'popular' | 'newest' | 'name';

const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: 'trending', label: 'Trending' },
  { id: 'popular', label: 'Most popular' },
  { id: 'newest', label: 'Newest' },
  { id: 'name', label: 'Name A–Z' }
];

interface ExploreViewProps {
  onSelectTemplate?: (template: Template) => void;
  initialCategory?: string;
}

export default function ExploreView({ onSelectTemplate, initialCategory = 'all' }: ExploreViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState<SortId>('trending');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => (safeGet('meme_favorite_templates') as string[] | null) ?? []);
  const [templatesList, setTemplatesList] = useState<Template[]>(() => [...MEME_TEMPLATES, ...VIDEO_MEME_TEMPLATES] as Template[]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const tagsScrollRef = useRef<HTMLDivElement>(null);

  const handleSelectCategory = (catId: string, shouldScrollTop = false) => {
    setSelectedCategory(catId);
    if (shouldScrollTop && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Sync category if initialCategory changes from parent navigation
  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
  }, [initialCategory]);

  // Keep the picked chip in view: centre it in the row.
  useEffect(() => {
    const scrollActiveIntoView = () => {
      const container = tagsScrollRef.current;
      if (!container) return;
      const activeBtn = container.querySelector<HTMLElement>('.pg-chip.active');
      if (!activeBtn) return;
      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      const offsetInside = btnRect.left - containerRect.left + container.scrollLeft;
      const left = Math.max(0, offsetInside - container.clientWidth / 2 + btnRect.width / 2);
      if (typeof container.scrollTo === 'function') container.scrollTo({ left, behavior: 'smooth' });
      else container.scrollLeft = left;
    };
    const rafId = requestAnimationFrame(scrollActiveIntoView);
    return () => cancelAnimationFrame(rafId);
  }, [selectedCategory]);

  // Close the sort menu on a press outside it, or Escape.
  useEffect(() => {
    if (!isSortOpen) return;
    const handleOutside = (e: Event) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setIsSortOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSortOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isSortOpen]);

  useEffect(() => {
    let isCancelled = false;
    fetchOpenSourceMemes().then((online: Template[] | null | undefined) => {
      if (!isCancelled && online && online.length > 0) {
        setTemplatesList((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          return [...prev, ...online.filter((t) => !existingIds.has(t.id))];
        });
      }
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  const toggleFavorite = (e: MouseEvent, templateId: string) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(templateId) ? prev.filter((id) => id !== templateId) : [...prev, templateId];
      safeSet('meme_favorite_templates', next);
      return next;
    });
  };

  // Helper keyword matchers
  const matchesCategory = useCallback((t: Template | undefined, catId: string): boolean => {
    if (!t) return false;
    const nameLower = (t.name || '').toLowerCase();
    const tags = t.tags || [];
    const score = t.trendingScore || 0;

    switch (catId) {
      case 'all':
        return true;
      case 'trending':
        return score >= 140 || t.tag === 'trending';
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
        return t.category === 'classic' || (score >= 135 && score < 140) || classicKeys.some((k) => nameLower.includes(k));
      }
      case 'comparison':
        return t.category === 'comparison' || nameLower.includes('vs') || nameLower.includes('comparison') || nameLower.includes('buttons');
      case 'desi': {
        const desiKeys = ['akshay', 'arjun', 'hera pheri', 'jethalal', 'babu bhaiya', 'majnu', 'modi'];
        return t.category === 'desi' || desiKeys.some((k) => nameLower.includes(k));
      }
      case 'popular':
        return score >= 50 || t.tag === 'popular';
      case 'videos':
        return t.type === 'video';
      case 'favorites':
        return favorites.includes(t.id);
      default:
        return t.category === catId;
    }
  }, [favorites]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    EXPLORE_CATEGORIES.forEach((cat) => {
      counts[cat.id] = templatesList.filter((t) => matchesCategory(t, cat.id)).length;
    });
    return counts;
  }, [templatesList, matchesCategory]);

  const query = searchQuery.trim().toLowerCase();

  const filteredTemplates = useMemo(() => {
    let result = templatesList;
    if (selectedCategory !== 'all') result = result.filter((t) => matchesCategory(t, selectedCategory));
    if (query.length > 0) {
      result = result.filter((t) =>
        (t.name || '').toLowerCase().includes(query) ||
        (t.tags || []).some((tg) => tg.toLowerCase().includes(query)) ||
        (t.category || '').toLowerCase().includes(query)
      );
    }
    const sorted = [...result];
    if (sortBy === 'trending') sorted.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
    else if (sortBy === 'popular') sorted.sort((a, b) => templateNumericId(b) - templateNumericId(a));
    else if (sortBy === 'name') sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (sortBy === 'newest') sorted.reverse();
    return sorted;
  }, [templatesList, selectedCategory, query, sortBy, matchesCategory]);

  // One row per category while browsing everything.
  const categoricalSections = useMemo(() => {
    if (query.length > 0 || selectedCategory !== 'all') return null;
    const pick = (id: string, n: number) => templatesList.filter((t) => matchesCategory(t, id)).slice(0, n);
    const sections: { id: string; label: string; icon: LucideIcon; templates: Template[] }[] = [
      { id: 'trending', label: 'Trending Memes', icon: Flame, templates: pick('trending', 10) },
      { id: 'social', label: 'Social Media Cards', icon: Share2, templates: pick('social', 8) },
      { id: 'videos', label: 'Video Templates', icon: Clapperboard, templates: pick('videos', 8) },
      { id: 'work', label: 'Work & 9-to-5', icon: Briefcase, templates: pick('work', 10) },
      { id: 'reaction', label: 'Reactions', icon: Smile, templates: pick('reaction', 10) },
      { id: 'relatable', label: 'Relationships', icon: Heart, templates: pick('relatable', 10) },
      { id: 'desi', label: 'Bollywood Culture', icon: Sparkles, templates: pick('desi', 10) },
      { id: 'classic', label: 'Classic Legends', icon: Drama, templates: pick('classic', 10) }
    ];
    return sections.filter((s) => s.templates.length > 0);
  }, [templatesList, query, selectedCategory, matchesCategory]);

  const currentSort = SORT_OPTIONS.find((s) => s.id === sortBy) || SORT_OPTIONS[0];
  const activeCategory = EXPLORE_CATEGORIES.find((c) => c.id === selectedCategory) || EXPLORE_CATEGORIES[0];

  return (
    <div className="pg ex explore-view-page">
      <div className="pg-head">
        <h1 className="pg-title">Explore</h1>
      </div>

      <div className="ex-top">
        <label className="pg-search">
          <Search aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Search templates"
            aria-label="Search templates"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              className="ex-clear"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              aria-label="Clear search"
            >
              <X size={14} strokeWidth={2.6} />
            </button>
          )}
        </label>

        <div className="ex-sort" ref={sortRef}>
          <button
            type="button"
            className={`pg-btn pg-btn--icon ex-sort-btn${isSortOpen ? ' is-open' : ''}`}
            onClick={() => setIsSortOpen((prev) => !prev)}
            aria-expanded={isSortOpen}
            aria-haspopup="menu"
            title={`Sorted by: ${currentSort.label}`}
            aria-label="Sort templates"
          >
            <SlidersHorizontal />
          </button>
          {isSortOpen && (
            <div className="ex-sort-menu" role="menu" aria-label="Sort by">
              <div className="ex-sort-head">Sort by</div>
              {SORT_OPTIONS.map((opt) => {
                const on = sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={on}
                    className={`ex-sort-item${on ? ' is-on' : ''}`}
                    onClick={() => {
                      setSortBy(opt.id);
                      setIsSortOpen(false);
                    }}
                  >
                    <span>{opt.label}</span>
                    {on && <Check size={18} strokeWidth={2.4} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="pg-chips ex-chips" role="tablist" aria-label="Categories" ref={tagsScrollRef}>
        {EXPLORE_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          const count = categoryCounts[cat.id] || 0;
          return (
            <button
              key={cat.id}
              type="button"
              className={`pg-chip${isActive ? ' is-on active' : ''}`}
              onClick={() => handleSelectCategory(cat.id)}
              role="tab"
              aria-selected={isActive}
            >
              <span>{cat.label}</span>
              {count > 0 && <span className="pg-chip-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {categoricalSections && categoricalSections.length > 0 ? (
        categoricalSections.map((section) => (
          <section key={section.id} className="pg-section ex-shelf">
            <div className="pg-section-head">
              <section.icon className="pg-section-icon" aria-hidden="true" />
              <h2 className="pg-section-title">{section.label}</h2>
              <button type="button" className="pg-section-aside" onClick={() => handleSelectCategory(section.id, true)}>
                See all <ChevronRight aria-hidden="true" />
              </button>
            </div>
            <div className="pg-rail">
              {section.templates.map((template, idx) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  rank={section.id === 'trending' && idx < 3 ? idx + 1 : undefined}
                  views={(templateNumericId(template) % 28) + 20}
                  isFavorite={favorites.includes(template.id)}
                  onToggleFavorite={toggleFavorite}
                  onSelectTemplate={onSelectTemplate}
                  className="ex-card--rail"
                />
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="ex-browse">
          <div className="ex-browse-head">
            <button
              type="button"
              className="ex-back"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
            >
              <ChevronLeft aria-hidden="true" /> All
            </button>
            <span className="ex-browse-count">
              {query.length > 0
                ? `${filteredTemplates.length} ${filteredTemplates.length === 1 ? 'result' : 'results'}`
                : `${activeCategory.label} · ${filteredTemplates.length}`}
            </span>
          </div>

          {filteredTemplates.length > 0 ? (
            <div className="ex-grid">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  views={(templateNumericId(template) % 30) + 12}
                  isFavorite={favorites.includes(template.id)}
                  onToggleFavorite={toggleFavorite}
                  onSelectTemplate={onSelectTemplate}
                />
              ))}
            </div>
          ) : (
            <div className="pg-empty">
              <Search className="pg-empty-icon" aria-hidden="true" />
              <h3 className="pg-empty-title">No meme templates found</h3>
              <p className="pg-empty-text">
                {query.length > 0
                  ? `Nothing matched “${searchQuery.trim()}”. Try another word or browse all templates.`
                  : selectedCategory === 'favorites'
                    ? 'Star a template and it shows up here.'
                    : 'Nothing in this category yet.'}
              </p>
              <button
                type="button"
                className="pg-btn pg-btn--accent"
                onClick={() => {
                  setSearchQuery('');
                  handleSelectCategory('all', true);
                }}
              >
                Browse all templates
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: Template;
  rank?: number;
  views: number;
  isFavorite: boolean;
  onToggleFavorite: (e: MouseEvent, id: string) => void;
  onSelectTemplate?: (template: Template) => void;
  className?: string;
}

function TemplateCard({ template, rank, views, isFavorite, onToggleFavorite, onSelectTemplate, className = '' }: TemplateCardProps) {
  const isVideo = template.type === 'video';
  const seconds = typeof template.durationMs === 'number' && Number.isFinite(template.durationMs) ? `${Math.round(template.durationMs / 1000)}s` : 'HD';
  const src = isVideo ? template.thumbnailUrl : template.imageUrl || template.thumbnailUrl;

  return (
    <div
      className={`pg-card ex-card ${className}`}
      onClick={() => onSelectTemplate?.(template)}
      role="button"
      tabIndex={0}
      aria-label={template.name}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectTemplate?.(template);
        }
      }}
    >
      <div className="ex-thumb pg-pic">
        {src && <img src={src} alt="" loading="lazy" decoding="async" />}
        {rank && <span className="pg-tag ex-rank">#{rank}</span>}
        <button
          type="button"
          className={`ex-fav${isFavorite ? ' is-on' : ''}`}
          onClick={(e) => onToggleFavorite(e, template.id)}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={isFavorite}
        >
          <Star size={15} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
        <span className="ex-tags">
          {isVideo ? <span className="pg-tag"><Video aria-hidden="true" />{seconds}</span> : <span />}
          <span className="pg-tag"><Eye aria-hidden="true" />{views}K</span>
        </span>
      </div>
      <span className="ex-name" title={template.name}>{template.name}</span>
    </div>
  );
}
