import { useEffect, useMemo, useState } from 'react';
import { Clock, LayoutGrid, Search, Smile, Star } from 'lucide-react';
import BrowseSheet, { BrowseEmpty, ResultsHead, Shelf } from './BrowseSheet';
import { POPULAR_EMOJIS as POPULAR, filterEmojis } from './mediaPickers';
import type { EmojiItem } from './mediaPickers';
import { EMOJI_GROUPS, loadEmojiLibrary, searchLibrary } from '../../../utils/emojiLibrary';
import type { LibraryEmoji } from '../../../utils/emojiLibrary';
import { safeGet, safeSet } from '../../../utils/storage';
import type { EditorActions } from './selection';

const RECENT_KEY = 'meme_recent_emoji';
const RECENT_MAX = 16;
// Two rows of the shelf grid.
const SHELF_SIZE = 12;

function readRecent(byId: Map<string, EmojiItem>): EmojiItem[] {
  const saved: unknown = safeGet(RECENT_KEY);
  return Array.isArray(saved) ? saved.map((id) => byId.get(id)).filter((e): e is EmojiItem => Boolean(e)) : [];
}

function EmojiCard({ emoji, onPick }: { emoji: EmojiItem; onPick: (e: EmojiItem) => void }) {
  return <button type="button" className="ie-browse-item ie-emoji-card" title={emoji.name} onClick={() => onPick(emoji)}>{emoji.emoji}</button>;
}

// Media > Emoji: the ones used lately, the popular meme ones, then every emoji grouped like a phone
// keyboard, each as two rows of small tiles with See all; a group or a search shows a grid. A pick
// adds the emoji as a sticker (it's then selected, with its floating tools).
export default function EmojiSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [library, setLibrary] = useState<LibraryEmoji[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    loadEmojiLibrary().then((l) => { if (alive) setLibrary(l); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  const byId = useMemo(() => new Map<string, EmojiItem>([...library, ...POPULAR].map((e) => [e.id, e])), [library]);
  const recent = useMemo(() => readRecent(byId), [byId]);
  const shelves = useMemo(() => [
    ...(recent.length ? [{ id: 'recent', label: 'Recent', Icon: Clock, icon: undefined as string | undefined, items: recent }] : []),
    { id: 'popular', label: 'Popular', Icon: Star, icon: undefined as string | undefined, items: POPULAR },
    ...EMOJI_GROUPS.map((g) => ({ id: g.id, label: g.label, Icon: undefined, icon: g.icon as string | undefined, items: library.filter((e) => e.category === g.id) as EmojiItem[] }))
      .filter((g) => g.items.length),
  ], [recent, library]);

  const q = query.trim();
  const browsing = !q && category === 'all';
  const results = useMemo(() => {
    if (!q) return [];
    // The popular ones by their meme names first, then the rest by name and search words.
    const popular = filterEmojis(q, '');
    const seen = new Set(popular.map((e) => e.emoji.replace(/️/g, '')));
    return [...popular, ...searchLibrary(library, q).filter((e) => !seen.has(e.emoji.replace(/️/g, '')))];
  }, [q, library]);
  const list: EmojiItem[] = browsing ? [] : q ? results : shelves.find((s) => s.id === category)?.items ?? [];
  const label = shelves.find((s) => s.id === category)?.label ?? 'Emoji';

  const pick = (e: EmojiItem) => {
    safeSet(RECENT_KEY, [e.id, ...recent.map((r) => r.id).filter((id) => id !== e.id)].slice(0, RECENT_MAX));
    actions.handleAddSticker(e);
    onClose();
  };
  const choose = (id: string) => { setCategory(id); setQuery(''); };

  return (
    <BrowseSheet
      className="ie-emoji-sheet"
      title="Emoji"
      Icon={Smile}
      onClose={onClose}
      search={{ value: query, onChange: setQuery, placeholder: 'Search laugh, fire, skull…', label: 'Search emoji' }}
      chips={[{ id: 'all', label: 'All', Icon: LayoutGrid }, ...shelves.map(({ id, label, Icon, icon, items }) => ({ id, label, Icon, icon, count: items.length }))]}
      active={query ? null : category}
      onChip={choose}
    >
      {browsing && shelves.map((s) => (
        <Shelf key={s.id} grid label={s.label} Icon={s.Icon} icon={s.icon} color={s.Icon ? 'var(--ui-accent)' : undefined} onSeeAll={s.items.length > SHELF_SIZE ? () => choose(s.id) : undefined}>
          {s.items.slice(0, SHELF_SIZE).map((e) => (
            <EmojiCard key={e.id} emoji={e} onPick={pick} />
          ))}
        </Shelf>
      ))}
      {browsing && !library.length && (
        <p className="ie-browse-note">{failed ? 'Couldn’t load the rest of the emoji. Check your connection and reopen.' : 'Loading every emoji…'}</p>
      )}

      {!browsing && (
        <ResultsHead backLabel="All emoji" summary={q ? `${list.length} for “${q}”` : `${label} · ${list.length}`} onBack={() => choose('all')} />
      )}

      {list.length > 0 && (
        <section className="ie-browse-section" aria-label="Results">
          <div className="ie-card-grid ie-card-grid--emoji">
            {list.map((e) => <EmojiCard key={e.id} emoji={e} onPick={pick} />)}
          </div>
        </section>
      )}

      {!browsing && !list.length && (
        <BrowseEmpty Icon={Search} title={`No emoji match “${q}”`} text="Try a word like “happy” or “heart”." action={{ label: 'Clear search', onClick: () => setQuery('') }} />
      )}
    </BrowseSheet>
  );
}
