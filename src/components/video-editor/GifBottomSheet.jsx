import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import BottomSheet from '../BottomSheet';
import { hasGiphyKey, searchGiphy } from '../../services/giphy';
import './GifBottomSheet.css';

const KINDS = [
  { id: 'stickers', label: 'Stickers' },
  { id: 'gifs', label: 'GIFs' },
];

// Giphy picker: transparent animated stickers or full GIFs, trending until you search. Used by the
// video editor and the image editor's Media strip.
export default function GifBottomSheet({ isOpen, onClose, onSelect }) {
  const [kind, setKind] = useState('stickers');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | error

  useEffect(() => {
    if (!isOpen || !hasGiphyKey()) return undefined;
    const ctl = new AbortController();
    const timer = setTimeout(() => {
      setStatus('loading');
      searchGiphy({ kind, query, signal: ctl.signal })
        .then((list) => { setResults(list); setStatus('idle'); })
        .catch((e) => { if (e.name !== 'AbortError') setStatus('error'); });
    }, query ? 350 : 0);
    return () => { clearTimeout(timer); ctl.abort(); };
  }, [isOpen, kind, query]);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="GIFs and stickers"
      height="min(82vh, 700px)"
      maxHeight="min(82vh, 700px)"
      contentStyle={{ padding: '6px 16px 12px 16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      {!hasGiphyKey() ? (
        <div className="bs-empty-state">
          <span>GIF search needs a Giphy API key. Add <code>VITE_GIPHY_API_KEY</code> to <code>.env</code>.</span>
        </div>
      ) : (
        <>
          <div className="bs-search-bar">
            <Search className="bs-search-icon" size={16} />
            <input
              type="text"
              placeholder={kind === 'stickers' ? 'Search stickers' : 'Search GIFs'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bs-search-input"
            />
            {query && (
              <button type="button" className="bs-clear-search-btn" onClick={() => setQuery('')} aria-label="Clear search">
                <X size={13} strokeWidth={2.4} />
              </button>
            )}
          </div>

          <div className="bs-category-bar">
            {KINDS.map((k) => (
              <button key={k.id} type="button" className={`bs-category-btn ${kind === k.id ? 'active' : ''}`} onClick={() => setKind(k.id)}>
                <span>{k.label}</span>
              </button>
            ))}
          </div>

          <div className={`gif-grid${kind === 'stickers' ? ' is-stickers' : ''}`} aria-busy={status === 'loading'}>
            {results.map((r) => (
              <button key={r.id} type="button" className="gif-cell" title={r.title} onClick={() => { onSelect(r); onClose(); }}>
                <img src={r.preview} alt={r.title} loading="lazy" />
              </button>
            ))}
            {status === 'error' && <div className="bs-empty-state"><span>Couldn&apos;t reach Giphy. Check your connection and try again.</span></div>}
            {status === 'idle' && results.length === 0 && <div className="bs-empty-state"><span>No results for &quot;{query}&quot;.</span></div>}
          </div>
          <p className="gif-attribution">Powered by GIPHY</p>
        </>
      )}
    </BottomSheet>
  );
}
