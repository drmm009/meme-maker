import React, { useState } from 'react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';

const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY || 'ee2p23yFNztpSHcnlweHygfeBuoFg6Vm'); // fallback to the one provided

export default function GiphyTab({ onSelect }) {
  const [term, setTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchGifs = (offset) => {
    if (searchQuery) {
      return gf.search(searchQuery, { offset, limit: 10 });
    }
    return gf.trending({ offset, limit: 10 });
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
          onKeyDown={(e) => e.key === 'Enter' && setSearchQuery(term)}
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary btn-sm" onClick={() => setSearchQuery(term)}>
          Search
        </button>
      </div>
      
      <div className="giphy-grid-scroll" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
        <Grid
          key={searchQuery}
          fetchGifs={fetchGifs}
          width={280}
          columns={2}
          gutter={6}
          noLink={true}
          onGifClick={(gif, e) => {
            e.preventDefault();
            // We want the original url or a high quality url
            const url = gif.images.original.url;
            onSelect({ id: gif.id, type: 'gif', url, emoji: 'GIF', width: gif.images.original.width, height: gif.images.original.height });
          }}
        />
      </div>
    </div>
  );
}
