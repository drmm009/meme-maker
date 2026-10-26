import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';

// Palette categories for each tool section (the editor's activeTab).
const CATEGORY = { text: 'Create', images: 'Create', filters: 'AI Lab', draw: 'Studio', canvas: 'Studio' };
const SECTION_ORDER = ['text', 'images', 'filters', 'draw', 'canvas'];
// Orbit: six favourites on an arc above the "+", as [section, tool id, label].
const ORBIT = [
  ['text', 'add-text', 'Caption'],
  ['text', 'ai', 'AI Roast'],
  ['images', 'stickers', 'Stickers'],
  ['text', 'social', 'Social Card'],
  ['filters', 'face-swap', 'Face Swap'],
  ['filters', 'photo-filters', 'Filters/BG'],
];
const ORBIT_RADIUS = 118;

const matches = (t, section, q) => `${t.label} ${t.title} ${t.keywords || ''} ${CATEGORY[section]}`.toLowerCase().includes(q);

// The "+" overlay (Concept 1, "Orbit & Halo"): a searchable command palette at the top and an
// orbit of favourite tools over the "+". Picking anything closes it; so do the backdrop and Escape.
// Rendered into <body> so it covers the whole editor, canvas included.
export default function OrbitOverlay({ tools, onPick, onClose }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const commands = SECTION_ORDER.flatMap((section) => (tools[section] || [])
    .filter((t) => !q || matches(t, section, q))
    .map((t) => ({ section, t })));
  const pick = (section, t) => { onPick(section, t); onClose(); };

  return createPortal(
    <div className="ie-orbit-backdrop" onClick={onClose} role="dialog" aria-label="Add anything">
      <div className="ie-palette" onClick={(e) => e.stopPropagation()}>
        <div className="ie-palette-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any tool: face swap, deep fry, tweet, bubble…"
            aria-label="Search tools"
          />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={15} /></button>}
        </div>
        <div className="ie-palette-list">
          {commands.length === 0 && <p className="ie-palette-empty">No tool matches “{query}”.</p>}
          {commands.map(({ section, t }) => {
            const row = (
              <>
                <span className="ie-palette-icon"><t.Icon size={15} /></span>
                <span className="ie-palette-label">{t.title}</span>
                <span className="ie-palette-cat">{CATEGORY[section]}</span>
              </>
            );
            return t.onFile ? (
              <label key={t.id} className="ie-palette-row" title={t.title}>
                {row}
                <input type="file" accept={t.accept} hidden onChange={(e) => { onPick(section, t); t.onFile(e); onClose(); }} />
              </label>
            ) : (
              <button key={t.id} type="button" className="ie-palette-row" title={t.title} onClick={() => pick(section, t)}>{row}</button>
            );
          })}
        </div>
      </div>

      <div className="ie-orbit" onClick={(e) => e.stopPropagation()}>
        {ORBIT.map(([section, id, label], i) => {
          const t = tools[section].find((x) => x.id === id);
          if (!t) return null;
          // Evenly spread from upper-left to upper-right over the "+".
          const angle = ((-165 + (150 / (ORBIT.length - 1)) * i) * Math.PI) / 180;
          return (
            <button
              key={id}
              type="button"
              className="ie-orbit-node"
              style={{ '--tx': `${Math.cos(angle) * ORBIT_RADIUS}px`, '--ty': `${Math.sin(angle) * ORBIT_RADIUS}px`, animationDelay: `${i * 25}ms` }}
              onClick={() => pick(section, t)}
            >
              <span className="ie-orbit-bubble"><t.Icon size={20} /></span>
              <span className="ie-orbit-label">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  , document.body);
}
