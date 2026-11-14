import { useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, KeyRound, LayoutTemplate, Sparkles, Wand2 } from 'lucide-react';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import TemplatesSheet from './TemplatesSheet';
import { PickerSheet } from './MakerPage';
import { AI_MEME_CATEGORIES, AI_MEME_IDEAS, generateMemeCaptionsWithGemini } from '../../../data/aiMemeCaptions';
import { safeGet, safeRemove, safeSet } from '../../../utils/storage';
import { aiCaptionedTemplate, aiMemeTemplate } from '../aiMeme';
import { pictureSize, readFile } from '../faceSwap';
import type { EditorActions } from './selection';
import './faceSwap.css';
import './aiMemeStudio.css';

interface Template { id: string | number; name?: string; imageUrl?: string; width?: number; height?: number; [key: string]: unknown }
interface Vibe { id: string; label: string; icon: string }
interface Idea { text: string; icon: string; category: string }

const KEY = 'gemini_api_key';
const IDEAS = 4;
// The idea cards on the page: the first few, each tinted its own colour.
const IDEA_CARDS = 4;
const TINTS = ['violet', 'orange', 'teal', 'pink'] as const;
// 'All Random' reads as Anything.
const vibeLabel = (v: Vibe) => (v.id === 'all' ? 'Anything' : v.label);

// The idea and vibe typed on the page, kept in the UI store so the Templates sheet (which takes the
// page's place for a moment) carries them to the meme it picks.
function useAsk() {
  const idea: string = useEditorUiStore((s: { aiIdea: string }) => s.aiIdea);
  const vibe: string = useEditorUiStore((s: { aiVibe: string }) => s.aiVibe);
  const setIdea = useEditorUiStore((s: { setAiIdea: (v: string) => void }) => s.setAiIdea);
  const setVibe = useEditorUiStore((s: { setAiVibe: (v: string) => void }) => s.setAiVibe);
  return { idea, vibe, setIdea, setVibe };
}

// The AI Meme maker's Templates: the Templates browser, whose pick becomes the page's meme.
export function AiMemeGallerySheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const { idea, vibe } = useAsk();
  return <TemplatesSheet actions={actions} onClose={onClose} title="Pick a meme" onPick={(t) => actions.handleChangeMeme(aiMemeTemplate({ ...t }, idea, vibe))} />;
}

// The AI Meme maker's page, until its meme is made (EditorPanels shows it in the canvas's place),
// the idea first, as in an AI chat: the Back chevron and the title; a big question over the prompt
// box, which holds the idea to type and, along its foot, the meme it is for (a tap opens Templates)
// and Upload; then ideas to start from as tinted cards (a tap sends one), the vibes as a row of
// chips, and Generate captions at the bottom over a line saying where captions come from (the
// user's Gemini key, opening its sheet). Sending asks for four captions (with the key, or else the
// built-in library), the prompt box saying it's writing, then puts the first on the meme and opens
// the editing page.
export default function AiMemeStudio({ actions, onBack }: { actions: EditorActions; onClose?: () => void; onBack?: () => void }) {
  const template: Template | null = useMemeEditorStore((s: { activeTemplate: Template | null }) => s.activeTemplate);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const { idea, vibe, setIdea, setVibe } = useAsk();
  const [keySheet, setKeySheet] = useState(false);
  // What was sent, while the captions are being written.
  const [sent, setSent] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>(() => String(safeGet(KEY) || ''));
  const [keyDraft, setKeyDraft] = useState('');
  const busy = sent !== null;
  const memeName = template?.name || 'your meme';
  const hasMeme = Boolean(template?.imageUrl);

  const pickMeme = (t: Template) => actions.handleChangeMeme(aiMemeTemplate(t, idea, vibe));
  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const src = await readFile(file);
    const size = await pictureSize(src);
    pickMeme({ id: `upload-${Date.now()}`, name: 'Your photo', imageUrl: src, rawImageUrl: src, width: size.width, height: size.height, category: 'custom', defaultCaptions: [] });
  };
  const openTemplates = () => openSheet('aiGallery');

  const send = async (prompt = idea, category = vibe) => {
    if (busy || !template) return;
    setIdea(prompt);
    setVibe(category);
    setSent(prompt.trim() || 'Surprise me');
    const ideas: string[] = await generateMemeCaptionsWithGemini({ apiKey, prompt, templateName: template.name, category, count: IDEAS }).catch(() => []);
    setSent(null);
    if (ideas.length) actions.handleChangeMeme(aiCaptionedTemplate(template, ideas[0], { prompt, category, ideas }));
  };
  // Enter sends, as in a chat; Shift+Enter starts a new line.
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const saveKey = () => {
    const key = keyDraft.trim();
    if (key) safeSet(KEY, key);
    else safeRemove(KEY);
    setApiKey(key);
    setKeyDraft('');
    setKeySheet(false);
  };

  return (
    <section className="ie-swap ie-aim" aria-label="Make an AI meme">
      <header className="ie-aim-header">
        <button type="button" className="ie-aim-back" onClick={() => (onBack ? onBack() : window.history.back())} aria-label="Back" title="Back">
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>
        <h1 className="ie-aim-title ui-topbar-title">
          <Wand2 size={16} strokeWidth={2.4} className="ie-aim-title-icon" aria-hidden="true" />
          <span>AI Meme Studio</span>
        </h1>
        {/* Said for screen readers (and the tests): where the meme stands. */}
        <p className="ie-aim-status ui-topbar-subtitle" aria-live="polite">{hasMeme ? 'Pick a meme and an idea' : 'Pick a meme'}</p>
      </header>

      <div className="ie-aim-body">
        <div className="ie-aim-hero">
          <h2 className="ie-aim-question">What should the meme be about?</h2>
          <p className="ie-aim-lede">Say it in a few words. You get four captions to pick from.</p>
        </div>

        {/* The prompt box: the idea, and the meme it's for along its foot. */}
        <form className={`ie-aim-prompt${busy ? ' is-busy' : ''}`} onSubmit={(e) => { e.preventDefault(); void send(); }}>
          <textarea
            className="ie-aim-prompt-field"
            rows={3}
            aria-label="What's it about?"
            enterKeyHint="send"
            placeholder="Mondays at work, my code finally running, the group chat at 2am…"
            value={idea}
            disabled={busy}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={onKey}
          />
          <div className="ie-aim-prompt-foot">
            <button type="button" className="ie-aim-meme-chip" aria-label={`Meme: ${template?.name || 'none'}`} disabled={busy} onClick={openTemplates}>
              <span className="ie-aim-meme-thumb" aria-hidden="true">
                {hasMeme ? <img src={template?.imageUrl} alt="" /> : <LayoutTemplate size={18} />}
              </span>
              <span className="ie-aim-meme-text">
                <span className="ie-aim-meme-kicker">Meme</span>
                <span className="ie-aim-meme-name">{hasMeme ? memeName : 'Pick a meme'}</span>
              </span>
              <ChevronRight size={18} className="ie-aim-meme-go" aria-hidden="true" />
            </button>
            <label className={`ie-aim-upload${busy ? ' is-disabled' : ''}`} title="Use your own photo">
              <ImagePlus size={19} aria-hidden="true" />
              <input type="file" accept="image/*" aria-label="Upload a photo" onChange={(e) => void upload(e)} disabled={busy} hidden />
            </label>
          </div>
          {busy && (
            <div className="ie-aim-writing" role="status">
              <Sparkles className="ie-aim-writing-icon" aria-hidden="true" />
              <span className="ie-aim-writing-title">Writing captions on {memeName}…</span>
              <span className="ie-aim-writing-idea">“{sent}”</span>
            </div>
          )}
        </form>

        {/* Ideas to start from: a tinted card each; a tap sends it. */}
        <div className="ie-aim-section">
          <h3 className="ie-aim-section-title">Try one</h3>
          <div className="ie-aim-ideas" role="group" aria-label="Ideas">
            {(AI_MEME_IDEAS as Idea[]).slice(0, IDEA_CARDS).map((s, i) => (
              <button key={s.text} type="button" className={`ie-aim-idea is-${TINTS[i % TINTS.length]}`} disabled={busy || !template} onClick={() => void send(s.text, s.category)}>
                <span className="ie-aim-idea-icon" aria-hidden="true">{s.icon}</span>
                <span className="ie-aim-idea-text">{s.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* The vibe: a row of chips. */}
        <div className="ie-aim-section">
          <h3 className="ie-aim-section-title">Vibe</h3>
          <div className="ie-aim-chips" role="radiogroup" aria-label="Choose a vibe">
            {AI_MEME_CATEGORIES.map((c: Vibe) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={vibe === c.id}
                className={`ie-aim-chip${vibe === c.id ? ' is-on' : ''}`}
                disabled={busy}
                onClick={() => setVibe(c.id)}
              >
                <span aria-hidden="true">{c.icon}</span>{vibeLabel(c)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ie-aim-actions">
        <button type="button" className="ie-aim-go" aria-label="Generate captions" disabled={busy || !template} onClick={() => void send()}>
          <Sparkles aria-hidden="true" />
          {busy ? 'Writing captions…' : 'Generate captions'}
        </button>
        <button
          type="button"
          className="ie-aim-key"
          aria-label={apiKey ? 'Captions by Gemini with your key' : 'Built-in captions: add a Gemini key'}
          onClick={() => setKeySheet(true)}
        >
          <KeyRound aria-hidden="true" />
          {apiKey ? <>Captions by Gemini · <b>Change key</b></> : <>Built-in captions · <b>Add a Gemini key</b></>}
        </button>
      </div>

      {keySheet && (
        <PickerSheet title="Gemini key" onClose={() => setKeySheet(false)}>
          <p className="ie-ai-key-note">
            {apiKey ? 'Captions are written by Gemini with your key.' : 'Without a key, captions come from the built-in library.'} Your key stays on this device.
          </p>
          <form className="ie-ai-key-form" onSubmit={(e) => { e.preventDefault(); saveKey(); }}>
            <input className="ie-ai-key-field" type="password" autoComplete="off" aria-label="Gemini API key" placeholder={apiKey ? 'Leave empty to remove it' : 'Paste your Gemini API key'} value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} />
            <button type="submit" className="ie-swap-btn ie-swap-btn--primary">Save</button>
          </form>
        </PickerSheet>
      )}
    </section>
  );
}
