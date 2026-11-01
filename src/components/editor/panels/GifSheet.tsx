import { useEffect, useState } from 'react';
import { Sticker, ImagePlay, KeyRound, WifiOff, Search, Flame } from 'lucide-react';
import BrowseSheet, { BrowseEmpty, ResultsHead, Thumb } from './BrowseSheet';
import { hasGiphyKey, searchGiphy } from '../../../services/giphy';
import type { EditorActions } from './selection';

interface GifResult { id: string; title: string; preview: string; url: string }

const KINDS = [
  { id: 'stickers', label: 'Stickers', Icon: Sticker },
  { id: 'gifs', label: 'GIFs', Icon: ImagePlay },
];
// Placeholder cards while the first results load.
const SKELETONS = Array.from({ length: 6 }, (_, i) => String(i));

// Media > GIFs: Giphy's transparent animated stickers or full GIFs, trending until you search, as
// even cards like the other library sheets. The one you tap is added as a sticker that plays on the
// meme (canvas/media).
export default function GifSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const [kind, setKind] = useState('stickers');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GifResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  const keyed = hasGiphyKey();

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

  const pick = (r: GifResult) => {
    actions.handleAddGraphicSticker({ name: r.title, url: r.url });
    onClose();
  };
  const switchKind = (id: string) => {
    if (id === kind) return;
    setResults([]);
    setKind(id);
  };

  const stickers = kind === 'stickers';
  const first = status === 'loading' && !results.length;
  const searching = Boolean(query.trim());

  const body = () => {
    if (!keyed) {
      return <BrowseEmpty Icon={KeyRound} title="GIFs need a Giphy key" text={<>Add <code>VITE_GIPHY_API_KEY</code> to <code>.env</code> and restart the app.</>} />;
    }
    if (status === 'error') {
      return <BrowseEmpty Icon={WifiOff} title="Couldn't reach Giphy" text="Check your connection and try again." action={{ label: 'Try again', onClick: () => setRetry((n) => n + 1) }} />;
    }
    if (status === 'idle' && !results.length) {
      return searching
        ? <BrowseEmpty Icon={Search} title={`Nothing found for “${query.trim()}”`} text="Try another word." action={{ label: 'Clear search', onClick: () => setQuery('') }} />
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
                <button type="button" className="ie-browse-item ie-card" title={r.title} aria-label={r.title} onClick={() => pick(r)}>
                  <Thumb src={r.preview} className={`ie-card-media${stickers ? ' ie-card-media--paper' : ''}`} />
                </button>
              </div>
            ))}
        </div>
      </section>
    );
  };

  return (
    <BrowseSheet
      title="GIFs"
      onClose={onClose}
      search={keyed ? { value: query, onChange: setQuery, placeholder: stickers ? 'Search animated stickers' : 'Search GIFs', label: stickers ? 'Search animated stickers' : 'Search GIFs' } : undefined}
      chips={KINDS}
      active={kind}
      onChip={switchKind}
      fillChips
      busy={status === 'loading'}
    >
      {keyed && searching && status !== 'error' && (
        <ResultsHead backLabel="Trending" summary={first ? 'Searching…' : `${results.length} for “${query.trim()}”`} onBack={() => setQuery('')} />
      )}
      {body()}
      {keyed && <p className="ie-giphy-credit">Powered by GIPHY</p>}
    </BrowseSheet>
  );
}
