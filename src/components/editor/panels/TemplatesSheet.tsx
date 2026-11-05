import { useMemo, useState } from 'react';
import { LayoutGrid, Share2, Image, Smile, Star, Drama, Columns2, Search, Flame } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import BrowseSheet, { BrowseEmpty, ResultsHead, Shelf, Thumb } from './BrowseSheet';
import { TEMPLATE_TAGS, filterTemplates } from './mediaPickers';
import type { PickerTemplate } from './mediaPickers';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { safeGet, safeSet } from '../../../utils/storage';
import type { EditorActions } from './selection';
import './templatesSheet.css';

// Each category's icon and colour, as on the Explore page.
const TAG_META: Record<string, { label: string; Icon: LucideIcon; color: string }> = {
  all: { label: 'All', Icon: LayoutGrid, color: '#ff5e36' },
  social: { label: 'Social', Icon: Share2, color: '#38bdf8' },
  images: { label: 'Images', Icon: Image, color: '#10b981' },
  reaction: { label: 'Reactions', Icon: Smile, color: '#a855f7' },
  favorites: { label: 'Favorites', Icon: Star, color: '#fbbf24' },
  classics: { label: 'Classics', Icon: Drama, color: '#eab308' },
  'multi-panel': { label: 'Multi-Panel', Icon: Columns2, color: '#6366f1' },
};
const TABS = TEMPLATE_TAGS.map((t) => ({ id: t.id, ...TAG_META[t.id] }));
const TRENDING = { label: 'Trending now', Icon: Flame, color: '#ff3b60' };
const SHELF_SIZE = 10;
// The shelves under Trending, in order; a shelf with nothing in it is left out.
const SHELVES = ['reaction', 'classics', 'multi-panel', 'social', 'images'];
const FAVORITES_KEY = 'meme_favorite_templates';

type SizedTemplate = PickerTemplate & { width?: number; height?: number };

// The badge on a grid card: the template's own kind.
function badgeOf(t: SizedTemplate) {
  if (t.category === 'social' || t.category === 'social media' || t.tags?.includes('social')) return TAG_META.social;
  if (t.category === 'reaction') return TAG_META.reaction;
  if (t.category === 'classic') return TAG_META.classics;
  if (t.category === 'multi-panel') return TAG_META['multi-panel'];
  return { label: 'Popular', Icon: Flame, color: '#ff5e36' };
}

interface CardProps {
  template: SizedTemplate;
  starred: boolean;
  onStar: (id: string) => void;
  onPick: (t: SizedTemplate) => void;
}

function StarButton({ template, starred, onStar }: Omit<CardProps, 'onPick'>) {
  const name = template.name || 'template';
  return (
    <button type="button" className={`ie-tpl-star${starred ? ' is-on' : ''}`} aria-label={starred ? `Unstar ${name}` : `Star ${name}`} aria-pressed={starred} onClick={() => onStar(template.id)}>
      <Star size={13} strokeWidth={starred ? 2.2 : 1.8} fill={starred ? '#facc15' : 'none'} aria-hidden="true" />
    </button>
  );
}

// A shelf card: square picture, the name under it; the top three trending carry their rank.
function ShelfCard({ template, rank, ...rest }: CardProps & { rank?: number }) {
  const name = template.name || 'Template';
  return (
    <div className="ie-shelf-card">
      <button type="button" className="ie-browse-item ie-card" aria-label={name} onClick={() => rest.onPick(template)}>
        <Thumb src={template.imageUrl} className="ie-card-media" />
        <span className="ie-card-name">{name}</span>
      </button>
      {rank && rank <= 3 && <span className="ie-tpl-rank" aria-hidden="true">#{rank}</span>}
      <StarButton template={template} starred={rest.starred} onStar={rest.onStar} />
    </div>
  );
}

// A grid card: a square picture like every other, its kind as a badge, the name under it.
function GridCard({ template, ...rest }: CardProps) {
  const name = template.name || 'Template';
  const badge = badgeOf(template);
  return (
    <div className="ie-grid-card">
      <button type="button" className="ie-browse-item ie-card" aria-label={name} onClick={() => rest.onPick(template)}>
        <Thumb src={template.imageUrl} className="ie-card-media" />
        <span className="ie-card-name">{name}</span>
      </button>
      <span className="ie-tpl-badge" style={{ borderColor: `${badge.color}55` }} aria-hidden="true">
        <badge.Icon size={11} strokeWidth={2.4} style={{ color: badge.color }} />
        {badge.label}
      </span>
      <StarButton template={template} starred={rest.starred} onStar={rest.onStar} />
    </div>
  );
}

// Media > Templates, laid out like the Explore page: shelves by category, trending first, each with
// See all; a category or a search shows a grid. A pick adds the template's picture as a photo layer;
// the star is shared with the home screen and Explore. `onPick` and `title` reuse it for another
// job (the Face Swap maker's meme picker).
export default function TemplatesSheet(props: Omit<TemplatesBrowserProps, 'templates'>) {
  const templates: SizedTemplate[] = useEditorUiStore((s: { openSourceTemplates: SizedTemplate[] }) => s.openSourceTemplates);
  return <TemplatesBrowser {...props} templates={templates} />;
}

interface TemplatesBrowserProps {
  templates: SizedTemplate[];
  actions: EditorActions;
  onClose: () => void;
  onPick?: (t: SizedTemplate) => void;
  title?: string;
}

// The sheet itself, on any list of templates (the video editor's, outside the image editor's store).
export function TemplatesBrowser({ templates, actions, onClose, onPick, title = 'Templates' }: TemplatesBrowserProps) {
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('all');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved: unknown = safeGet(FAVORITES_KEY);
    return Array.isArray(saved) ? saved : [];
  });

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.id, filterTemplates(templates, '', t.id, favorites).length])), [templates, favorites]);
  const browsing = !query.trim() && tag === 'all';
  const shelves = useMemo(() => {
    if (!browsing) return [];
    // Trending leads with real memes; social cards (a post mockup) have a shelf of their own.
    const trending = filterTemplates(templates, '', 'all', favorites).filter((t) => t.category !== 'social').slice(0, SHELF_SIZE);
    return [
      { id: 'trending', ...TRENDING, items: trending },
      ...SHELVES.map((id) => ({ id, ...TAG_META[id], label: id === 'social' ? 'Social cards' : TAG_META[id].label, items: filterTemplates(templates, '', id, favorites).slice(0, SHELF_SIZE) })),
    ].filter((s) => s.items.length);
  }, [browsing, templates, favorites]);
  const list: SizedTemplate[] = browsing ? [] : filterTemplates(templates, query, tag, favorites);

  const pick = (t: SizedTemplate) => {
    if (!t.imageUrl) return;
    if (onPick) onPick(t);
    else actions.handleAddImageLayer(t.imageUrl);
    onClose();
  };
  const star = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      safeSet(FAVORITES_KEY, next);
      return next;
    });
  };
  const choose = (id: string) => { setTag(id); setQuery(''); };
  const backToAll = () => { setTag('all'); setQuery(''); };
  const card = (t: SizedTemplate) => ({ template: t, starred: favorites.includes(t.id), onStar: star, onPick: pick });

  return (
    <BrowseSheet
      title={title}
      total={counts.all}
      onClose={onClose}
      search={{ value: query, onChange: setQuery, placeholder: 'Search Drake, Doge, Chad…', label: 'Search templates' }}
      chips={TABS.map((t) => ({ ...t, count: t.id === 'all' ? undefined : counts[t.id] }))}
      active={query ? null : tag}
      onChip={choose}
    >
      {shelves.map((s) => (
        <Shelf key={s.id} label={s.label} Icon={s.Icon} color={s.color} onSeeAll={s.id === 'trending' ? undefined : () => choose(s.id)}>
          {s.items.map((t, i) => <ShelfCard key={t.id} {...card(t)} rank={s.id === 'trending' ? i + 1 : undefined} />)}
        </Shelf>
      ))}

      {!browsing && (
        <ResultsHead backLabel="All templates" summary={query.trim() ? `${list.length} for “${query.trim()}”` : `${TAG_META[tag]?.label ?? 'Templates'} · ${list.length}`} onBack={backToAll} />
      )}

      {list.length > 0 && (
        <section className="ie-browse-section" aria-label="Results">
          <div className="ie-card-grid">
            {list.map((t) => <GridCard key={t.id} {...card(t)} />)}
          </div>
        </section>
      )}

      {!browsing && !list.length && (tag === 'favorites' && !query
        ? <BrowseEmpty Icon={Star} title="No favourites yet" text="Tap the star on any template and it’ll wait for you here." />
        : <BrowseEmpty Icon={Search} title={`Nothing matches “${query.trim()}”`} text="Try a shorter word, or a meme’s nickname." action={{ label: 'Clear search', onClick: () => setQuery('') }} />)}
    </BrowseSheet>
  );
}

// The Face Swap maker's Meme: the same browser, a pick starting the maker afresh on that meme.
export function MemePickerSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  return <TemplatesSheet actions={actions} onClose={onClose} title="Pick a meme" onPick={(t) => actions.handleChangeMeme(t)} />;
}
