import { useEffect, useRef, useState } from 'react';
import { Clock, ImagePlay, KeyRound, WifiOff, Search, Flame } from 'lucide-react';
import { BrowseEmpty, ResultsHead, Thumb } from './BrowseSheet';
import { GIPHY_MOODS, GIPHY_PAGE, appendPage, hasMorePages, readRecentGifs, rememberGif, searchGiphy } from '../../../services/giphy';

export interface GifResult { id: string; title: string; preview: string; url: string }

// Placeholder cards while the first results load.
const SKELETONS = Array.from({ length: 6 }, (_, i) => String(i));
// Start the next page this far before the end of the list comes into view.
const PRELOAD_MARGIN = '600px';

function GifCard({ r, stickers, onPick }: { r: GifResult; stickers: boolean; onPick: (r: GifResult) => void }) {
  return (
    <div className="ie-grid-card">
      <button type="button" className={`ie-browse-item ie-card${stickers ? ' ie-card--sticker' : ''}`} title={r.title} aria-label={r.title} onClick={() => onPick(r)}>
        <Thumb src={r.preview} className={`ie-card-media${stickers ? ' ie-card-media--paper' : ''}`} />
      </button>
    </div>
  );
}

// The Stickers sheet's Animated and GIFs tabs: Giphy's transparent animated stickers or full GIFs,
// as even cards like the other library sheets. Recent picks come first, then trending or a mood
// (`mood`, the sheet's chips) until a search; more load as the list scrolls to its end. The one
// tapped is added as a sticker that plays on the meme (canvas/media).
export default function GiphyResults({ kind, query, mood = 'trending', keyed, onClearQuery, onPick }: {
  kind: 'stickers' | 'gifs';
  query: string;
  mood?: string;
  keyed: boolean;
  onClearQuery: () => void;
  onPick: (r: GifResult) => void;
}) {
  const [results, setResults] = useState<GifResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'more' | 'error'>('loading');
  const [hasMore, setHasMore] = useState(false);
  const [retry, setRetry] = useState(0);
  const [recent] = useState<GifResult[]>(() => readRecentGifs(kind));
  const pageRef = useRef<{ ctl: AbortController | null; offset: number }>({ ctl: null, offset: 0 });
  const endRef = useRef<HTMLDivElement>(null);

  const moodInfo = GIPHY_MOODS.find((m) => m.id === mood) ?? GIPHY_MOODS[0];
  const searching = Boolean(query.trim());
  const terms = searching ? query : moodInfo.q;

  // The first page of a search, mood or trending.
  useEffect(() => {
    if (!keyed) return undefined;
    const ctl = new AbortController();
    pageRef.current.ctl?.abort();
    pageRef.current = { ctl, offset: 0 };
    // Wait for a pause in typing before searching.
    const timer = setTimeout(() => {
      setStatus('loading');
      setResults([]);
      searchGiphy({ kind, query: terms, signal: ctl.signal })
        .then((list: GifResult[]) => { setResults(list); setHasMore(hasMorePages(list.length, 0)); setStatus('idle'); })
        .catch((e: Error) => { if (e.name !== 'AbortError') setStatus('error'); });
    }, searching ? 350 : 0);
    return () => { clearTimeout(timer); ctl.abort(); };
  }, [keyed, kind, terms, searching, retry]);

  const loadMore = () => {
    if (status !== 'idle' || !hasMore) return;
    const offset = pageRef.current.offset + GIPHY_PAGE;
    const ctl = new AbortController();
    pageRef.current = { ctl, offset };
    setStatus('more');
    searchGiphy({ kind, query: terms, offset, signal: ctl.signal })
      .then((list: GifResult[]) => { setResults((shown) => appendPage(shown, list)); setHasMore(hasMorePages(list.length, offset)); setStatus('idle'); })
      .catch((e: Error) => { if (e.name !== 'AbortError') { setHasMore(false); setStatus('idle'); } });
  };
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  // Load the next page as the end of the list nears.
  useEffect(() => {
    const end = endRef.current;
    if (!end || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) loadMoreRef.current(); }, { rootMargin: PRELOAD_MARGIN });
    io.observe(end);
    return () => io.disconnect();
  }, [results.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (r: GifResult) => {
    rememberGif(kind, r);
    onPick(r);
  };

  const stickers = kind === 'stickers';
  const first = status === 'loading' && !results.length;
  const trending = mood === 'trending';
  const heading = trending ? (stickers ? 'Trending stickers' : 'Trending GIFs') : moodInfo.label;

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
      <section className="ie-browse-section" aria-label={searching ? 'Results' : heading}>
        {!searching && (
          <div className="ie-shelf-head">
            <span className="ie-shelf-icon" aria-hidden="true"><Flame size={17} strokeWidth={2.2} style={{ color: '#ff3b60' }} /></span>
            <h3 className="ie-shelf-title">{heading}</h3>
          </div>
        )}
        <div className={`ie-card-grid${stickers ? ' ie-card-grid--small' : ''}`}>
          {first
            ? SKELETONS.map((id) => <span key={id} className="ie-gif-skeleton ie-browse-thumb is-loading" />)
            : results.map((r) => <GifCard key={r.id} r={r} stickers={stickers} onPick={pick} />)}
        </div>
        {results.length > 0 && hasMore && (
          <div ref={endRef} className="ie-browse-more">
            <button type="button" className="ie-browse-empty-btn" onClick={loadMore} disabled={status === 'more'}>
              {status === 'more' ? 'Loading…' : 'Show more'}
            </button>
          </div>
        )}
      </section>
    );
  };

  return (
    <div aria-busy={status === 'loading' || status === 'more' || undefined}>
      {searching && status !== 'error' && (
        <ResultsHead backLabel={trending ? 'Trending' : moodInfo.label} summary={first ? 'Searching…' : `${results.length} for “${query.trim()}”`} onBack={onClearQuery} />
      )}
      {!searching && trending && recent.length > 0 && (
        <section className="ie-browse-section" aria-label="Recent">
          <div className="ie-shelf-head">
            <span className="ie-shelf-icon" aria-hidden="true"><Clock size={17} strokeWidth={2.2} style={{ color: 'var(--ui-accent)' }} /></span>
            <h3 className="ie-shelf-title">Recent</h3>
          </div>
          <div className={`ie-card-grid${stickers ? ' ie-card-grid--small' : ''}`}>
            {recent.map((r) => <GifCard key={r.id} r={r} stickers={stickers} onPick={pick} />)}
          </div>
        </section>
      )}
      {body()}
      <p className="ie-giphy-credit">Powered by GIPHY</p>
    </div>
  );
}
