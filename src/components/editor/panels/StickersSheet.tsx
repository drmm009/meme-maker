import { useState } from 'react';
import {
  BadgeCheck,
  Crown,
  Flame,
  Glasses,
  ImagePlay,
  Laugh,
  MessageSquare,
  Search,
  Sparkles,
  Sticker,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import BrowseSheet, { BrowseEmpty, ResultsHead, Shelf, Thumb } from './BrowseSheet';
import GiphyResults from './GiphyResults';
import type { GifResult } from './GiphyResults';
import { hasGiphyKey } from '../../../services/giphy';
import { filterStickers } from './mediaPickers';
import type { GraphicSticker } from './mediaPickers';
import { GRAPHIC_STICKER_CATEGORIES } from '../../../data/memeStickers';
import type { EditorActions } from './selection';

// High-utility Lucide icons and vibrant colors for category shelves
const STICKER_CATEGORY_META: Record<string, { label: string; Icon: LucideIcon; color: string }> = {
  memes: { label: 'Memes', Icon: Glasses, color: '#a855f7' },
  faces: { label: 'Faces', Icon: Laugh, color: '#fbbf24' },
  props: { label: 'Props', Icon: Crown, color: '#fb923c' },
  bubbles: { label: 'Bubbles', Icon: MessageSquare, color: '#38bdf8' },
  badges: { label: 'Badges', Icon: BadgeCheck, color: '#34d399' },
  reactions: { label: 'Reactions', Icon: Flame, color: '#f43f5e' },
};

const CATEGORIES = GRAPHIC_STICKER_CATEGORIES.map((c) => ({
  ...c,
  Icon: STICKER_CATEGORY_META[c.id]?.Icon,
  color: STICKER_CATEGORY_META[c.id]?.color,
  items: filterStickers('', c.id),
}));
const TOTAL = CATEGORIES.reduce((n, c) => n + c.items.length, 0);
// Two rows of compact stickers per shelf.
const SHELF_SIZE = 12;
const SWITCH_KINDS = [
  { id: 'stickers', label: 'Stickers', Icon: Sticker },
  { id: 'animated', label: 'Animated', Icon: Sparkles },
];
const GIF_KIND = { id: 'gifs', label: 'GIFs', Icon: ImagePlay };
const SEARCH = {
  stickers: { placeholder: 'Search doge, shades, wow…', label: 'Search stickers' },
  animated: { placeholder: 'Search animated stickers', label: 'Search animated stickers' },
  gifs: { placeholder: 'Search GIFs', label: 'Search GIFs' },
} as const;
type Kind = keyof typeof SEARCH;

function StickerCard({ sticker, onPick }: { sticker: GraphicSticker; onPick: (s: GraphicSticker) => void }) {
  return (
    <button
      type="button"
      className="ie-browse-item ie-card ie-card--sticker"
      title={sticker.name}
      aria-label={sticker.name}
      onClick={() => onPick(sticker)}
    >
      <Thumb src={sticker.url} className="ie-card-media ie-card-media--paper" />
    </button>
  );
}

// Media > Stickers: Stickers / Animated / GIFs in a track at the top. The built-in stickers are laid
// out like the Explore page, a shelf per category (thug life shades, rage faces, bubbles...) with
// See all, and a category or a search shows a grid; Animated and GIFs come from Giphy (GiphyResults).
// The video editor opens it on GIFs too (`initialKind`).
export default function StickersSheet({ actions, onClose, initialKind = 'stickers' }: { actions: EditorActions; onClose: () => void; initialKind?: Kind }) {
  const [kind, setKind] = useState<Kind>(initialKind);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const keyed = hasGiphyKey();
  const local = kind === 'stickers';
  const browsing = !query.trim() && category === 'all';
  const list = browsing ? [] : query.trim() ? filterStickers(query, '') : filterStickers('', category);
  const label = CATEGORIES.find((c) => c.id === category)?.label ?? 'Stickers';

  const pick = (s: GraphicSticker) => {
    actions.handleAddGraphicSticker(s);
    onClose();
  };
  const pickGif = (r: GifResult) => {
    actions.handleAddGraphicSticker({ name: r.title, url: r.url, isGif: true });
    onClose();
  };
  const choose = (id: string) => { setCategory(id); setQuery(''); };
  const switchKind = (id: string) => { setKind(id as Kind); setQuery(''); };

  return (
    <BrowseSheet
      title="Stickers"
      total={local ? TOTAL : undefined}
      onClose={onClose}
      search={local || keyed ? { value: query, onChange: setQuery, ...SEARCH[kind] } : undefined}
      tabs={{ items: SWITCH_KINDS, extra: GIF_KIND, active: kind, onPick: switchKind }}
    >
      {!local && <GiphyResults key={kind} kind={kind === 'gifs' ? 'gifs' : 'stickers'} query={query} keyed={keyed} onClearQuery={() => setQuery('')} onPick={pickGif} />}

      {local && browsing && CATEGORIES.map((c) => (
        <Shelf key={c.id} twoRow label={c.label} Icon={c.Icon} color={c.color} icon={c.icon} onSeeAll={() => choose(c.id)}>
          {c.items.slice(0, SHELF_SIZE).map((s) => (
            <div key={s.id} className="ie-shelf-card ie-shelf-card--small"><StickerCard sticker={s} onPick={pick} /></div>
          ))}
        </Shelf>
      ))}

      {local && !browsing && (
        <ResultsHead backLabel="All stickers" summary={query.trim() ? `${list.length} for “${query.trim()}”` : `${label} · ${list.length}`} onBack={() => choose('all')} />
      )}

      {local && list.length > 0 && (
        <section className="ie-browse-section" aria-label="Results">
          <div className="ie-card-grid ie-card-grid--small">
            {list.map((s) => <div key={s.id} className="ie-grid-card"><StickerCard sticker={s} onPick={pick} /></div>)}
          </div>
        </section>
      )}

      {local && !browsing && !list.length && (
        <BrowseEmpty Icon={Search} title={`No stickers match “${query.trim()}”`} text="Try a feeling, like “angry” or “cool”." action={{ label: 'Clear search', onClick: () => setQuery('') }} />
      )}
    </BrowseSheet>
  );
}
