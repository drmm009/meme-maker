import { useState } from 'react';
import MediaPickerSheet from './MediaPickerSheet';
import { filterStickers } from './mediaPickers';
import { GRAPHIC_STICKER_CATEGORIES } from '../../../data/memeStickers';
import type { EditorActions } from './selection';

// Media > Stickers: the meme stickers (thug life shades, rage faces, bubbles...), by category.
export default function StickersSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(GRAPHIC_STICKER_CATEGORIES[0]?.id || 'memes');
  const list = filterStickers(query, category);

  return (
    <MediaPickerSheet
      title="Stickers"
      onClose={onClose}
      tabs={GRAPHIC_STICKER_CATEGORIES}
      tab={query ? null : category}
      onTab={(id) => { setCategory(id); setQuery(''); }}
      search={{ value: query, onChange: setQuery, placeholder: 'Search stickers' }}
      grid="stickers"
    >
      {list.map((s) => (
        <button key={s.id} type="button" className="ie-picker-card" title={s.name} onClick={() => { actions.handleAddGraphicSticker(s); onClose(); }}>
          <span className="ie-picker-thumb"><img src={s.url} alt="" loading="lazy" /></span>
          <span className="ie-picker-name">{s.name}</span>
        </button>
      ))}
      {!list.length && <p className="ie-empty">No stickers match “{query}”.</p>}
    </MediaPickerSheet>
  );
}
