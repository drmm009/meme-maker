import { useState } from 'react';
import { LayoutGrid, Share2, Image, Laugh, Star, Trophy, Columns2 } from 'lucide-react';
import MediaPickerSheet from './MediaPickerSheet';
import { TEMPLATE_TAGS, filterTemplates } from './mediaPickers';
import type { PickerTemplate } from './mediaPickers';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { safeGet } from '../../../utils/storage';
import type { EditorActions } from './selection';

const TAG_ICONS = { all: LayoutGrid, social: Share2, images: Image, reaction: Laugh, favorites: Star, classics: Trophy, 'multi-panel': Columns2 };
const TABS = TEMPLATE_TAGS.map((t) => ({ ...t, label: t.id === 'social' ? 'Social' : t.label, Icon: TAG_ICONS[t.id as keyof typeof TAG_ICONS] }));

// Media > Templates: a template's picture, added to the meme as a photo layer.
export default function TemplatesSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const templates: PickerTemplate[] = useEditorUiStore((s: { openSourceTemplates: PickerTemplate[] }) => s.openSourceTemplates);
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('all');
  // Starred on the home screen.
  const [favorites] = useState<string[]>(() => {
    const saved: unknown = safeGet('meme_favorite_templates');
    return Array.isArray(saved) ? saved : [];
  });
  const list = filterTemplates(templates, query, tag, favorites);

  return (
    <MediaPickerSheet
      title="Templates"
      onClose={onClose}
      tabs={TABS}
      tab={query ? null : tag}
      onTab={(id) => { setTag(id); setQuery(''); }}
      search={{ value: query, onChange: setQuery, placeholder: `Search ${templates.length}+ templates` }}
      grid="templates"
    >
      {list.map((t) => (
        <button key={t.id} type="button" className="ie-picker-card" title={t.name} onClick={() => { actions.handleAddImageLayer(t.imageUrl); onClose(); }}>
          <span className="ie-picker-thumb ie-picker-thumb--photo"><img src={t.imageUrl} alt="" loading="lazy" /></span>
          <span className="ie-picker-name">{t.name}</span>
        </button>
      ))}
      {!list.length && (
        <p className="ie-empty">
          {tag === 'favorites' && !query ? 'Star templates on the home screen to find them here.' : `No templates match “${query}”.`}
        </p>
      )}
    </MediaPickerSheet>
  );
}
