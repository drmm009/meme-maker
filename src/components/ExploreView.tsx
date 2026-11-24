// Explore: every template, in the pages' iOS look (pages/iosLook.css, ExploreView.css). A large
// title with a Sort menu, a search field, and a row of category chips, just their names (the picked
// one black, kept in view); how many there are shows only on a category's or a search's results. With All picked and nothing searched it shows a shelf per category, each with See All;
// a category or a search shows a grid. A card opens its template in the editor; its star keeps it
// under My Favorites (on this device). A template with a `previewUrl` (the social cards: their own
// picture is a plain white mock-up) shows that on its card instead. Trending leaves out the social
// cards (they have their own shelf).
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowUpDown,
  Briefcase,
  ChevronRight,
  Clapperboard,
  Drama,
  Flame,
  Heart,
  Search,
  Share2,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import { MEME_TEMPLATES } from '../data/templates';
import { VIDEO_MEME_TEMPLATES } from '../data/videoTemplates';
import { fetchOpenSourceMemes } from '../services/memeService';
import { safeGet, safeSet } from '../utils/storage';
import { templateNumericId } from '../utils/templateOrder';
import { durationClock } from '../utils/timeLabels';
import { EXPLORE_CATEGORIES } from '../data/exploreCategories';
import TemplateThumb from './TemplateThumb';
import SearchField from './pages/SearchField';
import PullDownMenu from './pages/PullDownMenu';
import useSlidingKey from './pages/useSlidingKey';
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
  // A livelier picture for its card here than the template's own (the social cards).
  previewUrl?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  durationMs?: number;
  width?: number;
  height?: number;
}

interface ExploreViewProps {
  onSelectTemplate?: (template: Template) => void;
  initialCategory?: string;
}

interface TemplateCardProps {
  template: Template;
  // Its place in a chart (the Trending shelf), shown before the name.
  rank?: number;
  // The made-up view count: [spread, lowest], in thousands, steady per template.
  views: [number, number];
  isFavorite: boolean;
  onToggleFavorite: (templateId: string) => void;
  onSelectTemplate?: (template: Template) => void;
}

const SORT_OPTIONS = [
  { id: 'trending', label: 'Trending' },
  { id: 'popular', label: 'Most Popular' },
  { id: 'newest', label: 'Newest' },
  { id: 'name', label: 'Name' },
];

// The shelves shown under All, in order, with how many each holds.
const SHELVES = [
  { id: 'trending', label: 'Trending Memes', size: 10, Icon: Flame, subtitle: 'Updated today' },
  { id: 'social', label: 'Social Media Cards', size: 8, Icon: Share2, subtitle: 'Twitter, WhatsApp & Instagram' },
  { id: 'videos', label: 'Motion Video Templates', size: 8, Icon: Clapperboard, subtitle: 'Motion clips & video templates' },
  { id: 'work', label: 'Work & 9-to-5 Memes', size: 10, Icon: Briefcase, subtitle: 'Relatable 9-to-5 & tech humor' },
  { id: 'reaction', label: 'Expressive Reactions', size: 10, Icon: Zap, subtitle: 'Timeless internet gold' },
  { id: 'relatable', label: 'Relationships Memes', size: 10, Icon: Heart, subtitle: 'Dating, couples & friendships' },
  { id: 'desi', label: 'Bollywood Culture', size: 10, Icon: Sparkles, subtitle: 'Iconic cinema & pop culture memes' },
  { id: 'classic', label: 'Classic Legends', size: 10, Icon: Drama, subtitle: 'Historic meme hall of fame' },
];

// A category's icon, beside its title when it is picked.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  trending: Flame,
  social: Share2,
  videos: Clapperboard,
  work: Briefcase,
  reaction: Zap,
  relatable: Heart,
  desi: Sparkles,
  classic: Drama,
  favorites: Star,
  popular: Star,
};

export default function ExploreView({ onSelectTemplate, initialCategory = 'all' }: ExploreViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('trending');
  const [favorites, setFavorites] = useState<string[]>(() => safeGet('meme_favorite_templates') || []);
  const [templatesList, setTemplatesList] = useState<Template[]>(() => [...MEME_TEMPLATES, ...VIDEO_MEME_TEMPLATES]);

  const chipsRef = useRef<HTMLDivElement>(null);
  // The black key behind the picked chip: it slides between chips and grows in as the page opens.
  useSlidingKey(chipsRef, selectedCategory);

  const handleSelectCategory = (catId: string, shouldScrollTop = false) => {
    setSelectedCategory(catId);
    if (shouldScrollTop && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Follow the category the page was opened on (Home's See all).
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  // Keep the picked chip in view, centred in the row.
  useEffect(() => {
    const centre = () => {
      const row = chipsRef.current;
      const on = row?.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!row || !on) return;

      const rowBox = row.getBoundingClientRect();
      const onBox = on.getBoundingClientRect();
      const left = Math.max(0, onBox.left - rowBox.left + row.scrollLeft - row.clientWidth / 2 + onBox.width / 2);

      if (typeof row.scrollTo === 'function') {
        row.scrollTo({ left, behavior: 'smooth' });
      } else {
        row.scrollLeft = left;
      }
    };

    const rafId = requestAnimationFrame(centre);
    return () => cancelAnimationFrame(rafId);
  }, [selectedCategory]);

  useEffect(() => {
    let isCancelled = false;
    fetchOpenSourceMemes().then((online: Template[]) => {
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

  const toggleFavorite = (templateId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId];
      safeSet('meme_favorite_templates', next);
      return next;
    });
  };

  // Which templates a category holds: by its own category or tag, or by words in its name.
  const matchesCategory = useCallback((t: Template, catId: string) => {
    if (!t) return false;
    const nameLower = (t.name || '').toLowerCase();
    const tags = t.tags || [];

    switch (catId) {
      case 'all':
        return true;
      case 'trending':
        // Memes only: the social cards have their own shelf.
        if (t.category === 'social' || tags.includes('social')) return false;
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

  // The shelves, shown only under All with nothing searched.
  const shelves = useMemo(() => {
    if (searchQuery.trim().length > 0 || selectedCategory !== 'all') return null;
    return SHELVES
      .map((s) => ({ ...s, templates: templatesList.filter((t) => matchesCategory(t, s.id)).slice(0, s.size) }))
      .filter((s) => s.templates.length > 0);
  }, [templatesList, searchQuery, selectedCategory, matchesCategory]);

  const categoryLabel = (EXPLORE_CATEGORIES.find((c) => c.id === selectedCategory) || EXPLORE_CATEGORIES[0]).label;
  const query = searchQuery.trim();
  const CategoryIcon = !query && selectedCategory !== 'all' ? CATEGORY_ICONS[selectedCategory] : undefined;
  const found = filteredTemplates.length;

  return (
    <div className="explore-view-page ex ios ios-page">
      <header className="ex-nav">
        <div className="ios-nav-row">
          <h1 className="ios-title">Explore</h1>
          <PullDownMenu
            label="Sort templates"
            menuLabel="Sort by"
            buttonClassName="ios-menu-btn--filled"
            actions={SORT_OPTIONS.map((opt) => ({
              id: opt.id,
              label: opt.label,
              checked: sortBy === opt.id,
              run: () => setSortBy(opt.id),
            }))}
          >
            <ArrowUpDown size={18} aria-hidden="true" />
          </PullDownMenu>
        </div>
        <p className="ios-subtitle">Find a template to start from</p>
        <SearchField value={searchQuery} onChange={setSearchQuery} label="Search templates" placeholder="Search templates" />
      </header>

      <div className="ex-chips" role="tablist" aria-label="Categories" ref={chipsRef}>
        <span className="ex-chips-key" aria-hidden="true" />
        {EXPLORE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={selectedCategory === cat.id}
            className="ex-chip"
            onClick={() => handleSelectCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {shelves && shelves.length > 0 ? (
        shelves.map((shelf) => {
          const ShelfIcon = shelf.Icon;
          return (
            <section key={shelf.id} className="ex-section">
              <div className="ex-section-head">
                <div className="ex-head-left">
                  <span className="ex-head-icon" aria-hidden="true">
                    <ShelfIcon size={18} />
                  </span>
                  <div className="ex-head-words">
                    <h2 className="ios-section-title">{shelf.label}</h2>
                    <span className="ex-head-sub">{shelf.subtitle}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="ios-text-btn ex-see-all"
                  onClick={() => handleSelectCategory(shelf.id, true)}
                  aria-label={`See all ${shelf.label}`}
                >
                  <span>See all</span>
                  <ChevronRight size={14} aria-hidden="true" />
                </button>
              </div>
              <div className={`ex-shelf${shelf.id === 'trending' ? ' ex-shelf--ranked' : ''}`}>
                {shelf.templates.map((template, idx) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    rank={shelf.id === 'trending' ? idx + 1 : undefined}
                    views={[28, 20]}
                    isFavorite={favorites.includes(template.id)}
                    onToggleFavorite={toggleFavorite}
                    onSelectTemplate={onSelectTemplate}
                  />
                ))}
              </div>
            </section>
          );
        })
      ) : found > 0 ? (
        <section className="ex-section">
          <div className="ex-section-head">
            <div className="ex-head-left">
              {CategoryIcon && (
                <span className="ex-head-icon" aria-hidden="true">
                  <CategoryIcon size={18} />
                </span>
              )}
              <div className="ex-head-words">
                <h2 className="ios-section-title">{query ? `Results for “${query}”` : categoryLabel}</h2>
                <span className="ex-head-sub">
                  {found} {found === 1 ? 'template' : 'templates'}
                  {query && selectedCategory !== 'all' ? ` in ${categoryLabel}` : ''}
                </span>
              </div>
            </div>
          </div>
          <div className="ex-grid">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                views={[30, 12]}
                isFavorite={favorites.includes(template.id)}
                onToggleFavorite={toggleFavorite}
                onSelectTemplate={onSelectTemplate}
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="ios-empty">
          {selectedCategory === 'favorites' && !query ? (
            <Star className="ios-empty-icon" aria-hidden="true" />
          ) : (
            <Search className="ios-empty-icon" aria-hidden="true" />
          )}
          <h2 className="ios-empty-title">No Meme Templates Found</h2>
          <p className="ios-empty-text">
            {query
              ? `Nothing matches “${query}”. Check the spelling or try another word.`
              : selectedCategory === 'favorites'
                ? 'Tap the star on a template to keep it here.'
                : 'There are no templates in this category yet.'}
          </p>
          <button
            type="button"
            className="ios-btn ios-btn--gray ios-btn--capsule"
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
  );
}

// A template: its picture (a video's frame, with its length), then its name and views. Tapping it
// opens it; the star on the picture keeps it as a favourite. On a chart (Trending) its place stands
// beside it as a huge outlined numeral, the picture sliding over its edge, as on a streaming app.
function TemplateCard({ template, rank, views, isFavorite, onToggleFavorite, onSelectTemplate }: TemplateCardProps) {
  const isVideo = template.type === 'video';
  const [spread, lowest] = views;
  const hasLength = typeof template.durationMs === 'number' && Number.isFinite(template.durationMs);

  return (
    <article className={`ex-card${rank !== undefined ? ' ex-card--ranked' : ''}`}>
      {rank !== undefined && <span className={`ex-rank${rank >= 10 ? ' ex-rank--wide' : ''}`} aria-hidden="true">{rank}</span>}
      <button type="button" className="ex-card-open" onClick={() => onSelectTemplate?.(template)}>
        <span className="ex-card-pic">
          <TemplateThumb
            src={isVideo ? template.thumbnailUrl : (template.previewUrl || template.imageUrl || template.thumbnailUrl)}
            videoUrl={isVideo ? template.videoUrl : undefined}
            className="ex-card-img"
          />
          {isVideo && <span className="ex-card-time">{hasLength ? durationClock(template.durationMs as number) : 'Video'}</span>}
        </span>
        <span className="ex-card-text">
          <span className="ex-card-words">
            {rank !== undefined && <span className="ex-sr">Number {rank}: </span>}
            <span className="ex-card-name" title={template.name}>{template.name}</span>
            <span className="ex-card-views">{(templateNumericId(template) % spread) + lowest}K views</span>
          </span>
        </span>
      </button>
      <button
        type="button"
        className="ex-card-star"
        aria-pressed={isFavorite}
        aria-label={isFavorite ? `Remove ${template.name} from favorites` : `Add ${template.name} to favorites`}
        onClick={() => onToggleFavorite(template.id)}
      >
        <Star size={15} fill={isFavorite ? 'currentColor' : 'none'} strokeWidth={2} aria-hidden="true" />
      </button>
    </article>
  );
}
