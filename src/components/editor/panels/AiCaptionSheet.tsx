import { useState } from 'react';
import { Shuffle } from 'lucide-react';
import { Sheet } from '../../ui';
import { useMemeEditorStoreApi } from '../store/useMemeEditorStore';
import { AI_MEME_CATEGORIES, generateMemeCaptionsWithGemini } from '../../../data/aiMemeCaptions';
import { safeGet } from '../../../utils/storage';
import { isSocialCardCaption } from '../memeEditorUtils';
import { AI_CAPTION_PREFIX, AI_CAPTION_STYLES } from '../aiMeme';
import type { EditorActions } from './selection';
import './aiMemeStudio.css';

interface Caption { id: string; text: string; zIndex?: number; [key: string]: unknown }
interface Layer { zIndex?: number }
interface Vibe { id: string; label: string; icon: string }
interface CaptionStore {
  captions: Caption[];
  stickers: Layer[];
  imageLayers?: Layer[];
  activeLayerId: string | null;
  activeTemplate: { name?: string } | null;
  setCaptions: (captions: Caption[]) => void;
  patchLayer: (key: string, id: string, patch: Record<string, unknown>) => void;
  pushHistory: () => void;
}

// AI/Filters > AI Caption, the meme's caption writer, laid out like the AI Meme page's composer: the
// vibes as pills over the idea box, whose round Shuffle button asks for four captions and puts them on the meme one tap at a time, asking again
// after the last or once the idea or vibe changes. It writes on the selected caption, else the last
// one it wrote, else the meme's first caption, else a new one across the top.
export default function AiCaptionSheet({ onClose }: { actions: EditorActions; onClose: () => void }) {
  const store = useMemeEditorStoreApi() as unknown as { getState(): CaptionStore };
  const [idea, setIdea] = useState('');
  const [vibe, setVibe] = useState('all');
  const [ideas, setIdeas] = useState<{ ask: string; list: string[] }>({ ask: '', list: [] });
  const [busy, setBusy] = useState(false);

  // The caption to write on, looked up at the time (the selection may have changed).
  const target = () => {
    const { captions, activeLayerId } = store.getState();
    const plain = (c: Caption) => !isSocialCardCaption(c) && !c.isHeaderCaption && !c.isFooterCaption;
    return captions.find((c) => c.id === activeLayerId && plain(c))
      ?? [...captions].reverse().find((c) => c.id.startsWith(AI_CAPTION_PREFIX))
      ?? captions.find(plain);
  };

  const write = (text: string) => {
    const s = store.getState();
    const caption = target();
    if (caption) {
      s.patchLayer('captions', caption.id, { text });
      return;
    }
    const maxZ = Math.max(-1, ...s.captions.map((c) => c.zIndex ?? -1), ...s.stickers.map((l) => l.zIndex ?? -1), ...(s.imageLayers || []).map((l) => l.zIndex ?? -1));
    s.setCaptions([...s.captions, { id: `${AI_CAPTION_PREFIX}${Date.now()}`, text, x: 0.5, y: 0.12, fontSize: 46, align: 'center', width: 0.9, strokeWidth: 4, zIndex: maxZ + 1, ...AI_CAPTION_STYLES[0].look }]);
    s.pushHistory();
  };

  const shuffle = async () => {
    if (busy) return;
    const ask = `${vibe}\n${idea.trim()}`;
    const at = ideas.ask === ask ? ideas.list.indexOf(target()?.text ?? '') : -1;
    if (at >= 0 && at < ideas.list.length - 1) {
      write(ideas.list[at + 1]);
      return;
    }
    setBusy(true);
    const fresh: string[] = await generateMemeCaptionsWithGemini({
      apiKey: String(safeGet('gemini_api_key') || ''), prompt: idea.trim(), templateName: store.getState().activeTemplate?.name, category: vibe, count: 4,
    }).catch(() => []);
    setBusy(false);
    if (fresh.length) {
      setIdeas({ ask, list: fresh });
      write(fresh[0]);
    }
  };

  return (
    <Sheet className="ie-ai-caption-sheet ie-tool-sheet" title="AI Caption" onClose={onClose}>
      <div className="ie-ai-options ie-ai-options--vibes" role="radiogroup" aria-label="Vibe">
        {AI_MEME_CATEGORIES.map((c: Vibe) => (
          <button key={c.id} type="button" role="radio" aria-checked={vibe === c.id} className={`ie-ai-option${vibe === c.id ? ' is-on' : ''}`} onClick={() => setVibe(c.id)}>
            <span aria-hidden="true">{c.icon}</span>
            <span className="ie-ai-option-text">{c.id === 'all' ? 'Anything' : c.label}</span>
          </button>
        ))}
      </div>
      <form className="ie-ai-input" onSubmit={(e) => { e.preventDefault(); void shuffle(); }}>
        <input
          className="ie-ai-input-field"
          type="text"
          aria-label="What's the meme about?"
          enterKeyHint="go"
          placeholder="Type an idea, or just shuffle"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
        />
        <button type="submit" className={`ie-ai-send${busy ? ' is-busy' : ''}`} aria-label={busy ? 'Writing captions' : 'Shuffle captions'} title="Shuffle: the next caption on the meme" disabled={busy}>
          <Shuffle size={19} strokeWidth={2.4} aria-hidden="true" />
        </button>
      </form>
    </Sheet>
  );
}
