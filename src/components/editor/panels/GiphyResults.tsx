import { useEffect, useState } from 'react';
import { ImagePlay, KeyRound, WifiOff, Search, Flame } from 'lucide-react';
import { BrowseEmpty, ResultsHead, Thumb } from './BrowseSheet';
import { searchGiphy } from '../../../services/giphy';

export interface GifResult { id: string; title: string; preview: string; url: string }

// Placeholder cards while the first results load.
const SKELETONS = Array.from({ length: 6 }, (_, i) => String(i));

// The Stickers sheet's Animated and GIFs tabs: Giphy's transparent animated stickers or full GIFs,
// trending until a search (one request each, so no shelves), as even cards like the other library
// sheets. The one tapped is added as a sticker that plays on the meme (canvas/media).
export default function GiphyResults({ kind, query, keyed, onClearQuery, onPick }: {
  kind: 'stickers' | 'gifs';
  query: string;
  keyed: boolean;
  onClearQuery: () => void;
  onPick: (r: GifResult) => void;
}) {
  const [results, setResults] = useState<GifResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('loading');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!keyed) return undefined;
    const ctl = new AbortController();
    // Wait for a pause in typing before searching.
    const timer = setTimeout(() => {
      setStatus('loading');
      searchGiphy({ kind, query, signal: ctl.signal })
        .then((list: GifResult[]) => { setResults(list); setStatus('idle'); })
        .catch((e: Error) => { if (e.name !== 'AbortError') setStatus('error'); });
    }, query ? 350 : 0);
    return () => { clearTimeout(timer); ctl.abort(); };
  }, [keyed, kind, query, retry]);

  const stickers = kind === 'stickers';
  const first = status === 'loading' && !results.length;
  const searching = Boolean(query.trim());

  if (!keyed) {
    return <BrowseEmpty Icon={KeyRound} title="Animated stickers and GIFs need a Giphy key" text={<>Add <code>VITE_GIPHY_API_KEY</code> to <code>.env</code> and restart the app.</>} />;
  }

  const body = () => {
    if (status === 'error') {
      return <BrowseEmpty Icon={WifiOff} title="Couldn't reach Giphy" text="Check your connection and try again." action={{ label: 'Try again', onClick: () => setRetry((n) => n + 1) }} />;
    }
    if (status === 'idle' && !results.length) {
      return searching
        ? <BrowseEmpty Icon={Search} title={`Nothing found for “${query.trim()}”`} text="Try another word." action={{ label: 'Clear search', onClick: onClearQuery }} />
        : <BrowseEmpty Icon={ImagePlay} title="Nothing to show right now" />;
    }
    return (
      <section className="ie-browse-section" aria-label={searching ? 'Results' : stickers ? 'Trending stickers' : 'Trending GIFs'}>
        {!searching && (
          <div className="ie-shelf-head">
            <span className="ie-shelf-icon" aria-hidden="true"><Flame size={17} strokeWidth={2.2} style={{ color: '#ff3b60' }} /></span>
            <h3 className="ie-shelf-title">{stickers ? 'Trending stickers' : 'Trending GIFs'}</h3>
          </div>
        )}
        <div className={`ie-card-grid${stickers ? ' ie-card-grid--small' : ''}`}>
          {first
            ? SKELETONS.map((id) => <span key={id} className="ie-gif-skeleton ie-browse-thumb is-loading" />)
            : results.map((r) => (
              <div key={r.id} className="ie-grid-card">
                <button type="button" className="ie-browse-item ie-card" title={r.title} aria-label={r.title} onClick={() => onPick(r)}>
                  <Thumb src={r.preview} className={`ie-card-media${stickers ? ' ie-card-media--paper' : ''}`} />
                </button>
              </div>
            ))}
        </div>
      </section>
    );
  };

  return (
    <div aria-busy={status === 'loading' || undefined}>
      {searching && status !== 'error' && (
        <ResultsHead backLabel="Trending" summary={first ? 'Searching…' : `${results.length} for “${query.trim()}”`} onBack={onClearQuery} />
      )}
      {body()}
      <p className="ie-giphy-credit">Powered by GIPHY</p>
    </div>
  );
}
