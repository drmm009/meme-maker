import { useEffect, useMemo, useState } from 'react';
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
import { GIPHY_MOODS, hasGiphyKey } from '../../../services/giphy';
import { filterStickers } from './mediaPickers';
import type { GraphicSticker } from './mediaPickers';
import { GRAPHIC_STICKER_CATEGORIES } from '../../../data/memeStickers';
import { loadStickerPack, packGroups, searchPack } from '../../../utils/stickerPack';
import type { PackSticker } from '../../../utils/stickerPack';
import { loadEmojiLibrary } from '../../../utils/emojiLibrary';
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
const MEME_TOTAL = CATEGORIES.reduce((n, c) => n + c.items.length, 0);

// The 3D pack and its emoji's search words, loaded the first time the Stickers tab shows.
function useStickerPack(active: boolean) {
  const [pack, setPack] = useState<PackSticker[]>([]);
  const [tags, setTags] = useState<Map<string, string[]>>(() => new Map());
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!active || pack.length) return undefined;
    let alive = true;
    loadStickerPack().then((p) => { if (alive) setPack(p); }).catch(() => { if (alive) setFailed(true); });
    loadEmojiLibrary().then((l) => { if (alive) setTags(new Map(l.map((e) => [e.emoji, e.tags]))); }).catch(() => {});
    return () => { alive = false; };
  }, [active, pack.length]);
  return { pack, tags, failed };
}
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
// See all, then the 3D pack (src/utils/stickerPack.ts) a shelf per keyboard group; a category or
// a search (both kinds) shows a grid; Animated and GIFs come from Giphy (GiphyResults),
// with mood chips (Trending, Reactions, LOL…) to browse by.
// `only` narrows it to one job (the video editor's separate Stickers and GIFs sheets): 'stickers'
// keeps Stickers / Animated without GIFs, 'gifs' is a GIFs sheet with no track.
export default function StickersSheet({ actions, onClose, only }: { actions: EditorActions; onClose: () => void; only?: 'stickers' | 'gifs' }) {
  const [kind, setKind] = useState<Kind>(only === 'gifs' ? 'gifs' : 'stickers');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  // Animated and GIFs: a mood to browse (the chips), until a search.
  const [mood, setMood] = useState('trending');
  const keyed = hasGiphyKey();
  const local = kind === 'stickers';
  const { pack, tags, failed } = useStickerPack(local);
  const groups = useMemo(() => packGroups(pack), [pack]);
  const browsing = !query.trim() && category === 'all';
  const list: GraphicSticker[] = browsing ? []
    : query.trim() ? [...filterStickers(query, ''), ...searchPack(pack, query, tags)]
    : CATEGORIES.find((c) => c.id === category)?.items ?? groups.find((g) => g.id === category)?.items ?? [];
  const label = CATEGORIES.find((c) => c.id === category)?.label ?? groups.find((g) => g.id === category)?.label ?? 'Stickers';

  const pick = (s: GraphicSticker) => {
    actions.handleAddGraphicSticker(s);
    onClose();
  };
  const pickGif = (r: GifResult) => {
    actions.handleAddGraphicSticker({ name: r.title, url: r.url, isGif: true });
    onClose();
  };
  const choose = (id: string) => { setCategory(id); setQuery(''); };
  const switchKind = (id: string) => { setKind(id as Kind); setQuery(''); setMood('trending'); };
  const chooseMood = (id: string) => { setMood(id); setQuery(''); };

  return (
    <BrowseSheet
      className="ie-stickers-sheet"
      title={only === 'gifs' ? 'GIFs' : 'Stickers'}
      Icon={only === 'gifs' ? ImagePlay : Sticker}
      total={local ? MEME_TOTAL + pack.length : undefined}
      onClose={onClose}
      search={local || keyed ? { value: query, onChange: setQuery, ...SEARCH[kind] } : undefined}
      tabs={only === 'gifs' ? undefined : { items: SWITCH_KINDS, extra: only ? undefined : GIF_KIND, active: kind, onPick: switchKind }}
      chips={!local && keyed ? GIPHY_MOODS.map(({ id, label }) => ({ id, label })) : undefined}
      active={!local && !query.trim() ? mood : null}
      onChip={chooseMood}
    >
      {!local && <GiphyResults key={kind} kind={kind === 'gifs' ? 'gifs' : 'stickers'} query={query} mood={mood} keyed={keyed} onClearQuery={() => setQuery('')} onPick={pickGif} />}

      {local && browsing && CATEGORIES.map((c) => (
        <Shelf key={c.id} twoRow label={c.label} Icon={c.Icon} color={c.color} icon={c.icon} onSeeAll={() => choose(c.id)}>
          {c.items.slice(0, SHELF_SIZE).map((s) => (
            <div key={s.id} className="ie-shelf-card ie-shelf-card--small"><StickerCard sticker={s} onPick={pick} /></div>
          ))}
        </Shelf>
      ))}

      {local && browsing && groups.map((g) => (
        <Shelf key={g.id} twoRow label={g.label} icon={g.icon} onSeeAll={() => choose(g.id)}>
          {g.items.slice(0, SHELF_SIZE).map((s) => (
            <div key={s.id} className="ie-shelf-card ie-shelf-card--small"><StickerCard sticker={s} onPick={pick} /></div>
          ))}
        </Shelf>
      ))}
      {local && browsing && !pack.length && (
        <p className="ie-browse-note">{failed ? 'Couldn’t load the 3D stickers. Check your connection and reopen.' : 'Loading 3D stickers…'}</p>
      )}

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
      {local && pack.length > 0 && <p className="ie-giphy-credit">3D stickers: Fluent Emoji by Microsoft</p>}
    </BrowseSheet>
  );
}
