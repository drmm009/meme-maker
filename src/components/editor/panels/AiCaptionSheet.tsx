import { useEffect, useState } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import { ArrowLeft, Check, Copy, Plus, RefreshCw, Shuffle, Sparkles, Type, X } from 'lucide-react';
import { Sheet } from '../../ui';
import { useMemeEditorStoreApi } from '../store/useMemeEditorStore';
import { AI_MEME_CATEGORIES, CURATED_CAPTIONS } from '../../../data/aiMemeCaptions';
import { isSocialCardCaption } from '../memeEditorUtils';
import { AI_CAPTION_PREFIX, AI_CAPTION_STYLES } from '../aiMeme';
import type { EditorActions } from './selection';
import './aiCaptionSheet.css';

interface Caption { id: string; text: string; zIndex?: number; [key: string]: unknown }
interface Layer { zIndex?: number }
interface Vibe { id: string; label: string; icon: string }
interface CaptionStore {
  captions: Caption[];
  stickers: Layer[];
  imageLayers?: Layer[];
  activeLayerId: string | null;
  activeTemplate: { id?: string; name?: string } | null;
  setCaptions: (captions: Caption[]) => void;
  patchLayer: (key: string, id: string, patch: Record<string, unknown>) => void;
  pushHistory: () => void;
}

const COUNT = 4;

// What the sheet showed when it was closed (the idea, vibe and captions), so opening it again on the
// same meme comes back to them rather than asking to generate again. Another meme starts afresh.
interface Kept { meme: string; idea: string; vibe: string; ideas: { ask: string; list: string[] }; showing: boolean }
let kept: Kept | null = null;
const memeOf = (t: CaptionStore['activeTemplate']) => String(t?.id ?? t?.name ?? '');

// Four captions for the vibe from the built-in library, trying not to repeat the last four.
function pickCaptions(vibe: string, last: string[]): string[] {
  const pool: string[] = (CURATED_CAPTIONS as { text: string; category: string }[])
    .filter((c) => vibe === 'all' || c.category === vibe)
    .map((c) => c.text);
  const fresh = pool.filter((t) => !last.includes(t));
  const from = fresh.length >= COUNT ? fresh : pool;
  return [...from].sort(() => Math.random() - 0.5).slice(0, COUNT);
}

// AI/Filters > AI Caption, the caption generator. First the composer (the idea, Shuffle and
// Generate) and a row of vibes; once captions are written they take the sheet's place: one list to
// tap onto the meme, copy or add as a new caption, with More under it, and Change idea back and
// Shuffle over it.
export default function AiCaptionSheet({ onClose }: { actions: EditorActions; onClose: () => void }) {
  const store = useMemeEditorStoreApi() as unknown as { getState(): CaptionStore };
  const [meme] = useState(() => memeOf(store.getState().activeTemplate));
  const [last] = useState(() => (kept?.meme === meme ? kept : null));
  const [idea, setIdea] = useState(last?.idea ?? '');
  const [vibe, setVibe] = useState(last?.vibe ?? 'all');
  const [ideas, setIdeas] = useState<{ ask: string; list: string[] }>(last?.ideas ?? { ask: '', list: [] });
  // The captions list instead of the composer, from Generate (or Shuffle) until Change idea.
  const [showing, setShowing] = useState(last?.showing ?? false);
  useEffect(() => {
    kept = { meme, idea, vibe, ideas, showing };
  }, [meme, idea, vibe, ideas, showing]);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // The caption to write on, looked up at the time (the selection may have changed).
  const target = () => {
    const { captions, activeLayerId } = store.getState();
    const plain = (c: Caption) => !isSocialCardCaption(c) && !c.isHeaderCaption && !c.isFooterCaption;
    return captions.find((c) => c.id === activeLayerId && plain(c))
      ?? [...captions].reverse().find((c) => c.id.startsWith(AI_CAPTION_PREFIX))
      ?? captions.find(plain);
  };

  const currentText = target()?.text || '';

  const write = (text: string, forceNew = false) => {
    const s = store.getState();
    const caption = !forceNew ? target() : null;
    if (caption) {
      s.patchLayer('captions', caption.id, { text });
      return;
    }
    const maxZ = Math.max(-1, ...s.captions.map((c) => c.zIndex ?? -1), ...s.stickers.map((l) => l.zIndex ?? -1), ...(s.imageLayers || []).map((l) => l.zIndex ?? -1));
    s.setCaptions([...s.captions, {
      id: `${AI_CAPTION_PREFIX}${Date.now()}`,
      text,
      x: 0.5,
      y: s.captions.length > 0 ? 0.85 : 0.12,
      fontSize: 44,
      align: 'center',
      width: 0.9,
      strokeWidth: 4,
      zIndex: maxZ + 1,
      ...AI_CAPTION_STYLES[0].look,
    }]);
    s.pushHistory();
  };

  // Four new captions, the first straight onto the meme.
  const generate = () => {
    const list = pickCaptions(vibe, ideas.list);
    setIdeas({ ask: `${vibe}\n${idea.trim()}`, list });
    setShowing(true);
    if (list.length) write(list[0]);
  };

  // The next of the four on the meme; after the last, or once the idea or vibe changed, four more.
  const shuffle = () => {
    const at = ideas.ask === `${vibe}\n${idea.trim()}` ? ideas.list.indexOf(target()?.text ?? '') : -1;
    if (at >= 0 && at < ideas.list.length - 1) {
      write(ideas.list[at + 1]);
      setShowing(true);
      return;
    }
    generate();
  };

  const handleCopy = (e: MouseEvent, text: string) => {
    e.stopPropagation();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1600);
  };

  const activeTarget = target();

  return (
    <Sheet className="ie-ai-caption-sheet ie-tool-sheet" title="AI Caption" onClose={onClose}>
      {!showing ? (
        <>
          {/* The composer, as on the AI Meme page: the idea on top, Shuffle and Generate under it. */}
          <form
            className="ie-aic-composer"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              generate();
            }}
          >
            <div className="ie-aic-field">
              <Sparkles size={17} className="ie-aic-field-icon" aria-hidden="true" />
              <input
                className="ie-ai-input-field"
                type="text"
                aria-label="What's the meme about?"
                enterKeyHint="go"
                placeholder="What's the meme about?"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
              />
              {idea && (
                <button type="button" className="ie-aic-btn ie-aic-clear" aria-label="Clear the idea" onClick={() => setIdea('')}>
                  <X size={13} strokeWidth={2.6} />
                </button>
              )}
            </div>
            <div className="ie-aic-bar">
              <button type="button" className="ie-aic-btn ie-aic-shuffle" aria-label="Shuffle captions" title="Shuffle: the next caption on the meme" onClick={shuffle}>
                <Shuffle size={15} strokeWidth={2.4} aria-hidden="true" />
                Shuffle
              </button>
              <button type="submit" className="ie-aic-btn ie-aic-generate">
                <Sparkles size={15} strokeWidth={2.4} aria-hidden="true" />
                Generate
              </button>
            </div>
          </form>

          {/* Vibes: one row of pills, the picked one lit. */}
          <div className="ie-aic-label">Vibe</div>
          <div className="ie-aic-vibes" role="radiogroup" aria-label="Vibe">
            {AI_MEME_CATEGORIES.map((c: Vibe) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={vibe === c.id}
                className={`ie-aic-btn ie-aic-vibe${vibe === c.id ? ' is-on' : ''}`}
                onClick={() => setVibe(c.id)}
              >
                <span aria-hidden="true">{c.icon}</span>
                {c.id === 'all' ? 'Anything' : c.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* The captions alone: back to the composer and Shuffle, the list, then More. */}
          <div className="ie-aic-head">
            <button type="button" className="ie-aic-btn ie-aic-back" onClick={() => setShowing(false)}>
              <ArrowLeft size={15} strokeWidth={2.4} aria-hidden="true" />
              Change idea
            </button>
            <button type="button" className="ie-aic-btn ie-aic-shuffle ie-aic-shuffle--head" aria-label="Shuffle captions" title="Shuffle: the next caption on the meme" onClick={shuffle}>
              <Shuffle size={14} strokeWidth={2.4} aria-hidden="true" />
              Shuffle
            </button>
          </div>
          <div className="ie-aic-results">
            <div className="ie-aic-list" role="list">
              {ideas.list.map((text, i) => {
                const applied = currentText === text;
                return (
                  <div key={`${text}-${i}`} role="listitem" className={`ie-aic-row${applied ? ' is-on' : ''}`}>
                    <button type="button" className="ie-aic-btn ie-aic-pick" aria-pressed={applied} onClick={() => write(text)}>
                      <span className="ie-aic-mark" aria-hidden="true">{applied ? <Check size={13} strokeWidth={3} /> : i + 1}</span>
                      <span className="ie-aic-text">{text}</span>
                    </button>
                    <button type="button" className="ie-aic-btn ie-aic-tool" title="Copy caption" aria-label="Copy caption" onClick={(e) => handleCopy(e, text)}>
                      {copiedText === text ? <Check size={15} strokeWidth={2.6} className="ie-aic-copied" /> : <Copy size={15} />}
                    </button>
                    <button type="button" className="ie-aic-btn ie-aic-tool" title="Add as a new caption" aria-label="Add as new layer" onClick={() => write(text, true)}>
                      <Plus size={16} strokeWidth={2.4} />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="ie-aic-bar">
              <button type="button" className="ie-aic-btn ie-aic-generate ie-aic-more" title="Four new captions" onClick={generate}>
                <RefreshCw size={15} strokeWidth={2.4} aria-hidden="true" />
                More
              </button>
            </div>
          </div>
        </>
      )}

      <p className="ie-aic-target">
        <Type size={12} strokeWidth={2.4} aria-hidden="true" />
        Writes on <strong>{activeTarget ? `“${activeTarget.text.slice(0, 28)}${activeTarget.text.length > 28 ? '…' : ''}”` : 'a new caption'}</strong>
      </p>
    </Sheet>
  );
}
