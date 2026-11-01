import { useState } from 'react';
import { Clock, LayoutGrid, Search } from 'lucide-react';
import BrowseSheet, { BrowseEmpty, ResultsHead, Shelf } from './BrowseSheet';
import { EMOJI_CATEGORIES, filterEmojis } from './mediaPickers';
import type { EmojiItem } from './mediaPickers';
import { safeGet, safeSet } from '../../../utils/storage';
import type { EditorActions } from './selection';

const RECENT_KEY = 'meme_recent_emoji';
const RECENT_MAX = 16;
const SHELF_SIZE = 14;
const CATEGORIES = EMOJI_CATEGORIES.map((c) => ({ ...c, items: filterEmojis('', c.id) }));
const BY_ID = new Map(CATEGORIES.flatMap((c) => c.items).map((e) => [e.id, e]));

function readRecent(): EmojiItem[] {
  const saved: unknown = safeGet(RECENT_KEY);
  return Array.isArray(saved) ? saved.map((id) => BY_ID.get(id)).filter((e): e is EmojiItem => Boolean(e)) : [];
}

function EmojiCard({ emoji, onPick }: { emoji: EmojiItem; onPick: (e: EmojiItem) => void }) {
  return <button type="button" className="ie-browse-item ie-emoji-card" title={emoji.name} onClick={() => onPick(emoji)}>{emoji.emoji}</button>;
}

// Media > Emoji, laid out like the Explore page: the ones used lately, then a shelf per category
// with See all; a category or a search shows a grid. A pick adds the emoji as a sticker (it's then
// selected, with its floating tools).
export default function EmojiSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [recent] = useState(readRecent);
  const shelves = [
    ...(recent.length ? [{ id: 'recent', label: 'Recent', Icon: Clock, icon: undefined, items: recent }] : []),
    ...CATEGORIES.map((c) => ({ ...c, Icon: undefined })),
  ];
  const browsing = !query.trim() && category === 'all';
  const list = browsing ? [] : query.trim() ? filterEmojis(query, '') : shelves.find((s) => s.id === category)?.items ?? [];
  const label = shelves.find((s) => s.id === category)?.label ?? 'Emoji';

  const pick = (e: EmojiItem) => {
    safeSet(RECENT_KEY, [e.id, ...recent.map((r) => r.id).filter((id) => id !== e.id)].slice(0, RECENT_MAX));
    actions.handleAddSticker(e);
    onClose();
  };
  const choose = (id: string) => { setCategory(id); setQuery(''); };

  return (
    <BrowseSheet
      title="Emoji"
      onClose={onClose}
      search={{ value: query, onChange: setQuery, placeholder: 'Search laugh, fire, skull…', label: 'Search emoji' }}
      chips={[{ id: 'all', label: 'All', Icon: LayoutGrid }, ...shelves.map(({ id, label, Icon, icon, items }) => ({ id, label, Icon, icon, count: items.length }))]}
      active={query ? null : category}
      onChip={choose}
    >
      {browsing && shelves.map((s) => (
        <Shelf key={s.id} label={s.label} Icon={s.Icon} icon={s.icon} color={s.Icon ? 'var(--ui-accent)' : undefined} onSeeAll={s.items.length > SHELF_SIZE ? () => choose(s.id) : undefined}>
          {s.items.slice(0, SHELF_SIZE).map((e) => (
            <div key={e.id} className="ie-shelf-card ie-shelf-card--emoji"><EmojiCard emoji={e} onPick={pick} /></div>
          ))}
        </Shelf>
      ))}

      {!browsing && (
        <ResultsHead backLabel="All emoji" summary={query.trim() ? `${list.length} for “${query.trim()}”` : `${label} · ${list.length}`} onBack={() => choose('all')} />
      )}

      {list.length > 0 && (
        <section className="ie-browse-section" aria-label="Results">
          <div className="ie-card-grid ie-card-grid--emoji">
            {list.map((e) => <EmojiCard key={e.id} emoji={e} onPick={pick} />)}
          </div>
        </section>
      )}

      {!browsing && !list.length && (
        <BrowseEmpty Icon={Search} title={`No emoji match “${query.trim()}”`} text="Try a word like “happy” or “heart”." action={{ label: 'Clear search', onClick: () => setQuery('') }} />
      )}
    </BrowseSheet>
  );
}
