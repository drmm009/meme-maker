import { useMemo, useState } from 'react';
import { Sparkles, KeyRound, X, RefreshCw } from 'lucide-react';
import { Sheet } from '../../ui';
import { Thumb } from './BrowseSheet';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { AI_MEME_CATEGORIES, generateMemeCaptionsWithGemini } from '../../../data/aiMemeCaptions';
import { safeGet, safeSet, safeRemove } from '../../../utils/storage';
import { aiCaptionedTemplate, suitsAiCaption } from '../aiMeme';
import type { EditorActions } from './selection';
import './browseSheet.css';
import './aiMeme.css';

interface Template { id: string | number; name?: string; imageUrl?: string; category?: string; tags?: string[]; width?: number; height?: number; [key: string]: unknown }

const RAIL_SIZE = 16;
const IDEAS = 4;
const KEY = 'gemini_api_key';

// The template rail: the meme it opened on first, then popular memes an AI caption suits.
function useRail(current: Template | null): Template[] {
  const templates: Template[] = useEditorUiStore((s: { openSourceTemplates: Template[] }) => s.openSourceTemplates);
  return useMemo(() => {
    const memes = templates.filter((t) => suitsAiCaption(t) && t.id !== current?.id);
    return [...(current?.imageUrl ? [current] : []), ...memes].slice(0, RAIL_SIZE);
  }, [templates, current]);
}

// The AI Meme maker's prompt screen, over the meme before there is one: pick a template, say
// what the meme is about (and a theme), Generate, then pick one of four captions shown on the
// template; the maker starts afresh on that meme. Uses the user's own Gemini key when there is
// one, or else the built-in caption library.
export default function AiMemeSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const activeTemplate: Template | null = useMemeEditorStore((s: { activeTemplate: Template | null }) => s.activeTemplate);
  const rail = useRail(activeTemplate);
  const [picked, setPicked] = useState<Template | null>(null);
  const template = picked ?? rail[0] ?? null;
  const [prompt, setPrompt] = useState(() => String(activeTemplate?.aiPrompt || ''));
  const [category, setCategory] = useState('all');
  const [ideas, setIdeas] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => String(safeGet(KEY) || ''));
  const [keyOpen, setKeyOpen] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    try {
      setIdeas(await generateMemeCaptionsWithGemini({ apiKey, prompt, templateName: template?.name, category, count: IDEAS }));
    } catch {
      setIdeas([]);
    } finally {
      setBusy(false);
    }
  };

  const saveKey = () => {
    const key = keyDraft.trim();
    if (key) safeSet(KEY, key);
    else safeRemove(KEY);
    setApiKey(key);
    setKeyDraft('');
    setKeyOpen(false);
  };

  const ratio = template?.width && template?.height ? `${template.width} / ${template.height}` : '1';

  return (
    <Sheet className="ie-ai-sheet" title="AI Meme" hideTitle onClose={onClose}>
      <header className="ie-browse-head">
        <h2 className="ie-browse-title">AI Meme</h2>
        <button type="button" className="ie-browse-close" aria-label="Close AI meme" onClick={onClose}>
          <X size={18} strokeWidth={2.2} />
        </button>
      </header>

      <div className="ie-ai-body">
        <section aria-labelledby="ie-ai-template">
          <h3 className="ie-ai-label" id="ie-ai-template">Template</h3>
          <div className="ie-ai-rail" role="radiogroup" aria-labelledby="ie-ai-template">
            {rail.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={t.id === template?.id}
                aria-label={t.name || 'Template'}
                className={`ie-ai-template${t.id === template?.id ? ' is-on' : ''}`}
                onClick={() => setPicked(t)}
              >
                <Thumb src={t.imageUrl} />
              </button>
            ))}
          </div>
          {template?.name && <p className="ie-ai-template-name">{template.name}</p>}
        </section>

        <section>
          <label className="ie-ai-label" htmlFor="ie-ai-prompt">What's it about?</label>
          <textarea
            id="ie-ai-prompt"
            className="ui-field ie-ai-prompt"
            rows={2}
            placeholder="Mondays, my code finally working, group projects…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="ie-ai-themes" role="radiogroup" aria-label="Theme">
            {AI_MEME_CATEGORIES.map((c: { id: string; label: string; icon: string }) => (
              <button key={c.id} type="button" role="radio" aria-checked={category === c.id} className={`ie-browse-chip${category === c.id ? ' is-on' : ''}`} onClick={() => setCategory(c.id)}>
                <span aria-hidden="true">{c.icon}</span>{c.label}
              </button>
            ))}
          </div>
        </section>

        <button type="button" className="ie-ai-generate" onClick={generate} disabled={busy || !template}>
          {ideas.length ? <RefreshCw size={18} /> : <Sparkles size={18} />}
          {busy ? 'Writing captions…' : ideas.length ? 'New captions' : 'Generate captions'}
        </button>

        {(busy || ideas.length > 0) && (
          <section aria-labelledby="ie-ai-ideas" aria-busy={busy}>
            <h3 className="ie-ai-label" id="ie-ai-ideas">Pick one</h3>
            <div className="ie-ai-ideas">
              {busy
                ? Array.from({ length: IDEAS }, (_, i) => <span key={i} className="ie-ai-idea is-loading" style={{ aspectRatio: ratio }} />)
                : ideas.map((text, i) => (
                  <button key={`${i}-${text}`} type="button" className="ie-ai-idea" style={{ aspectRatio: ratio }} aria-label={`Use: ${text}`} onClick={() => template && actions.handleChangeMeme(aiCaptionedTemplate(template, text))}>
                    <Thumb src={template?.imageUrl} />
                    <span className="ie-ai-idea-text">{text}</span>
                  </button>
                ))}
            </div>
          </section>
        )}

        <div className="ie-ai-key">
          <KeyRound size={15} aria-hidden="true" />
          <span>{apiKey ? 'Using your Gemini key.' : 'No Gemini key: captions come from the built-in library.'}</span>
          <button type="button" className="ie-ai-key-btn" aria-expanded={keyOpen} onClick={() => setKeyOpen((o) => !o)}>{apiKey ? 'Change' : 'Add key'}</button>
        </div>
        {keyOpen && (
          <form className="ie-ai-key-form" onSubmit={(e) => { e.preventDefault(); saveKey(); }}>
            <input className="ui-field" type="password" autoComplete="off" aria-label="Gemini API key" placeholder={apiKey ? 'Leave empty to remove it' : 'Paste your Gemini API key'} value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} />
            <button type="submit" className="ie-ai-key-btn">Save</button>
          </form>
        )}
      </div>
    </Sheet>
  );
}
