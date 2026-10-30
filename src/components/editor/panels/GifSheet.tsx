import { useEffect, useState } from 'react';
import { Sticker, ImagePlay } from 'lucide-react';
import MediaPickerSheet from './MediaPickerSheet';
import { hasGiphyKey, searchGiphy } from '../../../services/giphy';
import type { EditorActions } from './selection';

interface GifResult { id: string; title: string; preview: string; url: string }

const KINDS = [
  { id: 'stickers', label: 'Stickers', Icon: Sticker },
  { id: 'gifs', label: 'GIFs', Icon: ImagePlay },
];

// Media > GIFs: Giphy's transparent animated stickers or full GIFs, trending until you search. The
// one you tap is added as a sticker that plays on the meme (canvas/media).
export default function GifSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const [kind, setKind] = useState('stickers');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GifResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('loading');
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
  }, [keyed, kind, query]);

  return (
    <MediaPickerSheet
      title="GIFs"
      onClose={onClose}
      tabs={KINDS}
      tab={kind}
      onTab={setKind}
      fillTabs
      search={keyed ? { value: query, onChange: setQuery, placeholder: kind === 'stickers' ? 'Search animated stickers' : 'Search GIFs' } : undefined}
      grid={kind === 'stickers' ? 'gifs is-stickers' : 'gifs'}
      busy={status === 'loading'}
      footer={keyed ? <p className="ie-picker-credit">Powered by GIPHY</p> : null}
    >
      {!keyed && <p className="ie-empty">GIF search needs a Giphy API key: add <code>VITE_GIPHY_API_KEY</code> to <code>.env</code>.</p>}
      {results.map((r) => (
        <button key={r.id} type="button" className="ie-picker-gif" title={r.title} onClick={() => { actions.handleAddGraphicSticker({ name: r.title, url: r.url }); onClose(); }}>
          <img src={r.preview} alt={r.title} loading="lazy" />
        </button>
      ))}
      {keyed && status === 'error' && <p className="ie-empty">Couldn't reach Giphy. Check your connection and try again.</p>}
      {keyed && status === 'idle' && !results.length && <p className="ie-empty">{query ? `Nothing found for “${query}”.` : 'Nothing to show right now.'}</p>}
    </MediaPickerSheet>
  );
}
