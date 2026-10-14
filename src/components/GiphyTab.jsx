import React, { useState } from 'react';

const GIPHY_KEY = import.meta.env.VITE_GIPHY_API_KEY || '';

// Dependency-free Giphy tab (no @giphy SDK). Disabled without an API key.
export default function GiphyTab({ onSelect }) {
  const [term, setTerm] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!GIPHY_KEY) {
    return (
      <div className="giphy-tab-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          GIF search is disabled. Set <code>VITE_GIPHY_API_KEY</code> in <code>.env</code> to enable it.
        </p>
      </div>
    );
  }

  const runSearch = async (q) => {
    setLoading(true);
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 8000);
      const endpoint = q ? 'search' : 'trending';
      const res = await fetch(
        `https://api.giphy.com/v1/gifs/${endpoint}?api_key=${encodeURIComponent(GIPHY_KEY)}&q=${encodeURIComponent(q || '')}&limit=12&rating=g`,
        { signal: ctl.signal }
      );
      clearTimeout(t);
      if (!res.ok) throw new Error(`Giphy HTTP ${res.status}`);
      const data = await res.json();
      setGifs(Array.isArray(data.data) ? data.data : []);
    } catch {
      setGifs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="giphy-tab-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '300px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search Giphy..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runSearch(term)}
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary btn-sm" onClick={() => runSearch(term)}>
          Search
        </button>
      </div>

      <div className="giphy-grid-scroll" style={{ overflowY: 'auto', flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {loading && <p style={{ fontSize: '0.8rem' }}>Loading…</p>}
        {!loading && gifs.length === 0 && <p style={{ fontSize: '0.8rem' }}>No GIFs. Try searching.</p>}
        {gifs.map((gif) => {
          const thumb = gif.images?.fixed_width_small?.url || gif.images?.downsized_medium?.url;
          const full = gif.images?.original?.url || thumb;
          if (!thumb) return null;
          return (
            <button
              key={gif.id}
              type="button"
              onClick={() => full && onSelect({ id: gif.id, type: 'gif', url: full, emoji: 'GIF' })}
              style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <img src={thumb} alt={gif.title || 'GIF'} loading="lazy" style={{ width: '100%', borderRadius: '8px' }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
