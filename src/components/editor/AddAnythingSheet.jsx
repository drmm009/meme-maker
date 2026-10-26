import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';

// Section names for the sheet's groups (keys are the editor's activeTab values).
const GROUP_LABELS = { text: 'Text', images: 'Stickers and media', filters: 'AI and photo', draw: 'Draw', canvas: 'Canvas' };
const GROUP_ORDER = ['text', 'images', 'filters', 'draw', 'canvas'];

const matches = (t, group, q) => `${t.label} ${t.title} ${t.keywords || ''} ${GROUP_LABELS[group]}`.toLowerCase().includes(q);

// The "+" sheet: every tool in one list, grouped, with search. Picking a tool closes the sheet.
// onPick(group, tool) runs it; file tools render as file pickers.
export default function AddAnythingSheet({ tools, onPick, onClose }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const groups = GROUP_ORDER
    .map((g) => ({ g, items: (tools[g] || []).filter((t) => !q || matches(t, g, q)) }))
    .filter(({ items }) => items.length > 0);

  return (
    <div className="ie-sheet-backdrop" onClick={onClose}>
      <div className="ie-sheet" role="dialog" aria-label="Add anything" onClick={(e) => e.stopPropagation()}>
        <div className="ie-sheet-handle" aria-hidden="true" />
        <div className="ie-sheet-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools: tweet, face swap, watermark…"
            aria-label="Search tools"
          />
          {query && (
            <button type="button" className="ie-sheet-clear" onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button>
          )}
        </div>
        <div className="ie-sheet-list">
          {groups.length === 0 && <p className="ie-sheet-empty">No tool matches “{query}”.</p>}
          {groups.map(({ g, items }) => (
            <section key={g} className="ie-sheet-group" aria-label={GROUP_LABELS[g]}>
              <div className="ie-sheet-group-title">{GROUP_LABELS[g]}</div>
              <div className="ie-sheet-grid">
                {items.map((t) => {
                  const body = (
                    <>
                      <span className={`ie-sheet-icon${t.active ? ' is-on' : ''}`}><t.Icon size={20} /></span>
                      <span className="ie-sheet-label">{t.label}</span>
                    </>
                  );
                  return t.onFile ? (
                    <label key={t.id} className="ie-sheet-item" title={t.title}>
                      {body}
                      <input type="file" accept={t.accept} hidden onChange={(e) => { onPick(g, t); t.onFile(e); onClose(); }} />
                    </label>
                  ) : (
                    <button key={t.id} type="button" className="ie-sheet-item" title={t.title} onClick={() => { onPick(g, t); onClose(); }}>
                      {body}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
