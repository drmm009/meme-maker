import { useState } from 'react';
import { LayoutGrid, Search } from 'lucide-react';
import BrowseSheet, { BrowseEmpty, ResultsHead, Shelf, Thumb } from './BrowseSheet';
import { filterStickers } from './mediaPickers';
import type { GraphicSticker } from './mediaPickers';
import { GRAPHIC_STICKER_CATEGORIES } from '../../../data/memeStickers';
import type { EditorActions } from './selection';

const CATEGORIES = GRAPHIC_STICKER_CATEGORIES.map((c) => ({ ...c, items: filterStickers('', c.id) }));
const TOTAL = CATEGORIES.reduce((n, c) => n + c.items.length, 0);
const SHELF_SIZE = 10;
const CHIPS = [
  { id: 'all', label: 'All', Icon: LayoutGrid },
  ...CATEGORIES.map(({ id, label, icon, items }) => ({ id, label, icon, count: items.length })),
];

function StickerCard({ sticker, onPick }: { sticker: GraphicSticker; onPick: (s: GraphicSticker) => void }) {
  return (
    <button type="button" className="ie-browse-item ie-card" title={sticker.name} aria-label={sticker.name} onClick={() => onPick(sticker)}>
      <Thumb src={sticker.url} className="ie-card-media ie-card-media--paper" />
      <span className="ie-card-name">{sticker.name}</span>
    </button>
  );
}

// Media > Stickers, laid out like the Explore page: a shelf per category (thug life shades, rage
// faces, bubbles...) with See all; a category or a search shows a grid.
export default function StickersSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const browsing = !query.trim() && category === 'all';
  const list = browsing ? [] : query.trim() ? filterStickers(query, '') : filterStickers('', category);
  const label = CATEGORIES.find((c) => c.id === category)?.label ?? 'Stickers';

  const pick = (s: GraphicSticker) => {
    actions.handleAddGraphicSticker(s);
    onClose();
  };
  const choose = (id: string) => { setCategory(id); setQuery(''); };

  return (
    <BrowseSheet
      title="Stickers"
      total={TOTAL}
      onClose={onClose}
      search={{ value: query, onChange: setQuery, placeholder: 'Search doge, shades, wow…', label: 'Search stickers' }}
      chips={CHIPS}
      active={query ? null : category}
      onChip={choose}
    >
      {browsing && CATEGORIES.map((c) => (
        <Shelf key={c.id} label={c.label} icon={c.icon} onSeeAll={() => choose(c.id)}>
          {c.items.slice(0, SHELF_SIZE).map((s) => (
            <div key={s.id} className="ie-shelf-card ie-shelf-card--small"><StickerCard sticker={s} onPick={pick} /></div>
          ))}
        </Shelf>
      ))}

      {!browsing && (
        <ResultsHead backLabel="All stickers" summary={query.trim() ? `${list.length} for “${query.trim()}”` : `${label} · ${list.length}`} onBack={() => choose('all')} />
      )}

      {list.length > 0 && (
        <section className="ie-browse-section" aria-label="Results">
          <div className="ie-card-grid ie-card-grid--small">
            {list.map((s) => <div key={s.id} className="ie-grid-card"><StickerCard sticker={s} onPick={pick} /></div>)}
          </div>
        </section>
      )}

      {!browsing && !list.length && (
        <BrowseEmpty Icon={Search} title={`No stickers match “${query.trim()}”`} text="Try a feeling, like “angry” or “cool”." action={{ label: 'Clear search', onClick: () => setQuery('') }} />
      )}
    </BrowseSheet>
  );
}
