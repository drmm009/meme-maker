import { useState } from 'react';
import MediaPickerSheet from './MediaPickerSheet';
import { EMOJI_CATEGORIES, filterEmojis } from './mediaPickers';
import type { EditorActions } from './selection';

// Media > Emoji: tap one to add it as a sticker (it's then selected, with its floating tools).
export default function EmojiSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('faces');
  const list = filterEmojis(query, category);

  return (
    <MediaPickerSheet
      title="Emoji"
      onClose={onClose}
      tabs={EMOJI_CATEGORIES}
      tab={query ? null : category}
      onTab={(id) => { setCategory(id); setQuery(''); }}
      search={{ value: query, onChange: setQuery, placeholder: 'Search emoji' }}
      grid="emoji"
    >
      {list.map((s) => (
        <button key={s.id} type="button" className="ie-picker-emoji" title={s.name} onClick={() => { actions.handleAddSticker(s); onClose(); }}>
          {s.emoji}
        </button>
      ))}
      {!list.length && <p className="ie-empty">No emoji match “{query}”.</p>}
    </MediaPickerSheet>
  );
}
