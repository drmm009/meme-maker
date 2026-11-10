import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ImagePlus, KeyRound, LayoutTemplate, Repeat2, Sparkles } from 'lucide-react';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import TemplatesSheet from './TemplatesSheet';
import { PickerSheet } from './MakerPage';
import { AI_MEME_CATEGORIES, AI_MEME_IDEAS, generateMemeCaptionsWithGemini } from '../../../data/aiMemeCaptions';
import { safeGet, safeRemove, safeSet } from '../../../utils/storage';
import { aiCaptionedTemplate, aiMemeTemplate, suitsAiCaption } from '../aiMeme';
import { pictureSize, readFile } from '../faceSwap';
import type { EditorActions } from './selection';
import './faceSwap.css';
import './aiMemeStudio.css';

interface Template { id: string | number; name?: string; imageUrl?: string; width?: number; height?: number; [key: string]: unknown }
interface Vibe { id: string; label: string; icon: string }

const KEY = 'gemini_api_key';
const IDEAS = 4;
const POPULAR = 6;
// 'All Random' reads as Anything.
const vibeLabel = (v: Vibe) => (v.id === 'all' ? 'Anything' : v.label);

// The idea and vibe typed on the page, kept in the UI store so the Gallery (which takes the page's
// place for a moment) carries them to the meme it picks.
function useAsk() {
  const idea: string = useEditorUiStore((s: { aiIdea: string }) => s.aiIdea);
  const vibe: string = useEditorUiStore((s: { aiVibe: string }) => s.aiVibe);
  const setIdea = useEditorUiStore((s: { setAiIdea: (v: string) => void }) => s.setAiIdea);
  const setVibe = useEditorUiStore((s: { setAiVibe: (v: string) => void }) => s.setAiVibe);
  return { idea, vibe, setIdea, setVibe };
}

// The AI Meme maker's Gallery: the Templates browser, whose pick becomes the page's meme.
export function AiMemeGallerySheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const { idea, vibe } = useAsk();
  return <TemplatesSheet actions={actions} onClose={onClose} title="Pick a meme" onPick={(t) => actions.handleChangeMeme(aiMemeTemplate({ ...t }, idea, vibe))} />;
}

// The AI Meme maker's page, until its meme is made (EditorPanels shows it in the canvas's place),
// the meme first: the meme as large as fits, with Change (popular memes, upload or the whole
// gallery) on its corner; under it the idea box with ideas to start from (a tap sends one), then
// the vibes as a row of chips; Generate captions pinned at the bottom with a line saying where the
// captions come from (the user's Gemini key, opening its sheet). Sending asks for four captions
// (with the key, or else the built-in library), the meme dimmed while they're written, then puts
// the first on the meme and opens the editing page.
export default function AiMemeStudio({ actions }: { actions: EditorActions; onClose?: () => void }) {
  const template: Template | null = useMemeEditorStore((s: { activeTemplate: Template | null }) => s.activeTemplate);
  const templates: Template[] = useEditorUiStore((s: { openSourceTemplates: Template[] }) => s.openSourceTemplates);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const { idea, vibe, setIdea, setVibe } = useAsk();
  const [picker, setPicker] = useState<'meme' | 'key' | null>(null);
  // What was sent, while the captions are being written.
  const [sent, setSent] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>(() => String(safeGet(KEY) || ''));
  const [keyDraft, setKeyDraft] = useState('');
  const popular = useMemo(() => templates.filter((t) => suitsAiCaption(t) && t.id !== template?.id).slice(0, POPULAR), [templates, template]);
  const busy = sent !== null;
  const memeName = template?.name || 'your meme';

  const pickMeme = (t: Template) => {
    setPicker(null);
    actions.handleChangeMeme(aiMemeTemplate(t, idea, vibe));
  };
  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setPicker(null);
    if (!file) return;
    const src = await readFile(file);
    const size = await pictureSize(src);
    pickMeme({ id: `upload-${Date.now()}`, name: 'Your photo', imageUrl: src, rawImageUrl: src, width: size.width, height: size.height, category: 'custom', defaultCaptions: [] });
  };

  const send = async (prompt = idea, category = vibe) => {
    if (busy || !template) return;
    setIdea(prompt);
    setVibe(category);
    setSent(prompt.trim() || 'Surprise me');
    const ideas: string[] = await generateMemeCaptionsWithGemini({ apiKey, prompt, templateName: template.name, category, count: IDEAS }).catch(() => []);
    setSent(null);
    if (ideas.length) actions.handleChangeMeme(aiCaptionedTemplate(template, ideas[0], { prompt, category, ideas }));
  };

  const saveKey = () => {
    const key = keyDraft.trim();
    if (key) safeSet(KEY, key);
    else safeRemove(KEY);
    setApiKey(key);
    setKeyDraft('');
    setPicker(null);
  };

  return (
    <section className="ie-swap ie-aim" aria-label="Make an AI meme">
      <div className="ie-aim-body">
        <div className="ie-aim-stage">
          <div className="ie-aim-meme">
            {template?.imageUrl ? (
              <img src={template.imageUrl} alt={memeName} />
            ) : (
              <span className="ie-aim-meme-empty"><LayoutTemplate size={26} aria-hidden="true" />Pick a meme to caption</span>
            )}
            {!busy && (
              <button type="button" className="ie-aim-change" aria-label={`Meme: ${template?.name || 'none'}`} onClick={() => setPicker('meme')}>
                <Repeat2 aria-hidden="true" />
                Change
              </button>
            )}
            {busy && (
              <div className="ie-aim-busy" role="status">
                <span className="ie-swap-spinner" aria-hidden="true" />
                <span className="ie-aim-busy-title">Writing captions on {memeName}…</span>
                <span className="ie-aim-busy-idea">“{sent}”</span>
              </div>
            )}
          </div>
        </div>

        <form className="ie-aim-ask" onSubmit={(e) => { e.preventDefault(); void send(); }}>
          <Sparkles className="ie-aim-ask-icon" aria-hidden="true" />
          <input
            className="ie-ai-input-field ie-aim-ask-field"
            type="text"
            aria-label="What's it about?"
            enterKeyHint="send"
            placeholder="What's it about?"
            value={idea}
            disabled={busy}
            onChange={(e) => setIdea(e.target.value)}
          />
        </form>

        <div className="ie-aim-row">
          <h2 className="ie-aim-row-title">Ideas</h2>
          <div className="ie-aim-chips" role="group" aria-label="Ideas">
            {AI_MEME_IDEAS.map((s: { text: string; icon: string; category: string }) => (
              <button key={s.text} type="button" className="ie-aim-chip" disabled={busy} onClick={() => void send(s.text, s.category)}>
                <span aria-hidden="true">{s.icon}</span>{s.text}
              </button>
            ))}
          </div>
        </div>

        <div className="ie-aim-row">
          <h2 className="ie-aim-row-title">Vibe</h2>
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

      <div className="ie-swap-actions ie-aim-actions">
        <button type="button" className="ie-swap-btn ie-swap-btn--primary ie-aim-go" aria-label="Generate captions" disabled={busy || !template} onClick={() => void send()}>
          <Sparkles aria-hidden="true" />
          {busy ? 'Writing captions…' : 'Generate captions'}
        </button>
        <button
          type="button"
          className="ie-aim-source"
          aria-label={apiKey ? 'Captions by Gemini with your key' : 'Built-in captions: add a Gemini key'}
          onClick={() => setPicker('key')}
        >
          <KeyRound aria-hidden="true" />
          {apiKey ? <>Captions by Gemini · <b>Change key</b></> : <>Built-in captions · <b>Add a Gemini key</b></>}
        </button>
      </div>

      {picker === 'meme' && (
        <PickerSheet title="Your meme" onClose={() => setPicker(null)}>
          <div className="ie-ai-popular" role="group" aria-label="Popular memes">
            {popular.map((t) => (
              <button key={t.id} type="button" className="ie-ai-popular-item" aria-label={t.name || 'Meme'} onClick={() => pickMeme(t)}>
                <img src={t.imageUrl} alt="" loading="lazy" />
              </button>
            ))}
          </div>
          <div className="ie-swap-sources">
            <label className="ie-swap-source">
              <ImagePlus size={22} aria-hidden="true" />
              Upload photo
              <input type="file" accept="image/*" aria-label="Upload a photo" onChange={(e) => void upload(e)} hidden />
            </label>
            <button
              type="button"
              className="ie-swap-source"
              onClick={() => {
                setPicker(null);
                openSheet('aiGallery');
              }}
            >
              <LayoutTemplate size={22} aria-hidden="true" />
              All memes
            </button>
          </div>
        </PickerSheet>
      )}

      {picker === 'key' && (
        <PickerSheet title="Gemini key" onClose={() => setPicker(null)}>
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
