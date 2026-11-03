import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ArrowUp, ChevronDown, ImagePlus, KeyRound, LayoutTemplate, Sparkles } from 'lucide-react';
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
const vibeOf = (id: string): Vibe => AI_MEME_CATEGORIES.find((c: Vibe) => c.id === id) ?? AI_MEME_CATEGORIES[0];
// 'All Random' reads as Anything in a sentence-like pill.
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
// laid out like a chat: a greeting with ideas to start from (a tap sends one), and at the bottom a
// composer of the meme, the vibe and the Gemini key (each a pill opening its sheet) over
// the message box. Sending asks for four captions (the user's Gemini key, or else the built-in
// library), the idea showing as a sent message with the AI writing back, then puts the first on
// the meme and opens the editing page.
export default function AiMemeStudio({ actions }: { actions: EditorActions; onClose?: () => void }) {
  const template: Template | null = useMemeEditorStore((s: { activeTemplate: Template | null }) => s.activeTemplate);
  const templates: Template[] = useEditorUiStore((s: { openSourceTemplates: Template[] }) => s.openSourceTemplates);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const { idea, vibe, setIdea, setVibe } = useAsk();
  const [picker, setPicker] = useState<'meme' | 'vibe' | 'key' | null>(null);
  // What was sent, while the captions are being written.
  const [sent, setSent] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>(() => String(safeGet(KEY) || ''));
  const [keyDraft, setKeyDraft] = useState('');
  const popular = useMemo(() => templates.filter((t) => suitsAiCaption(t) && t.id !== template?.id).slice(0, POPULAR), [templates, template]);
  const busy = sent !== null;
  const currentVibe = vibeOf(vibe);

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
    <section className="ie-swap ie-ai-page" aria-label="Make an AI meme">
      <div className="ie-ai-chat">
        {sent === null ? (
          <div className="ie-ai-hello">
            <span className="ie-ai-hello-icon" aria-hidden="true"><Sparkles size={26} strokeWidth={2} /></span>
            <h2 className="ie-ai-hello-title">What's the meme about today?</h2>
            <p className="ie-ai-hello-hint">Type an idea, or tap one to start</p>
            <div className="ie-ai-suggestions" role="group" aria-label="Ideas">
              {AI_MEME_IDEAS.map((s: { text: string; icon: string; category: string }) => (
                <button key={s.text} type="button" className="ie-ai-suggestion" onClick={() => void send(s.text, s.category)}>
                  <span aria-hidden="true">{s.icon}</span>{s.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="ie-ai-thread" role="status">
            <p className="ie-ai-bubble ie-ai-bubble--me">{sent}</p>
            <div className="ie-ai-bubble ie-ai-bubble--ai">
              {template?.imageUrl && <img src={template.imageUrl} alt="" />}
              <span>
                Writing captions on {template?.name || 'your meme'}
                <span className="ie-ai-dots" aria-hidden="true"><i /><i /><i /></span>
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="ie-ai-composer">
        <div className="ie-ai-options">
          <button type="button" className="ie-ai-option" aria-label={`Meme: ${template?.name || 'none'}`} disabled={busy} onClick={() => setPicker('meme')}>
            {template?.imageUrl ? <img src={template.imageUrl} alt="" /> : <LayoutTemplate size={15} aria-hidden="true" />}
            <span className="ie-ai-option-text">{template?.name || 'Pick a meme'}</span>
            <ChevronDown size={14} aria-hidden="true" />
          </button>
          <button type="button" className="ie-ai-option" aria-label={`Vibe: ${vibeLabel(currentVibe)}`} disabled={busy} onClick={() => setPicker('vibe')}>
            <span aria-hidden="true">{currentVibe.icon}</span>
            <span className="ie-ai-option-text">{vibeLabel(currentVibe)}</span>
            <ChevronDown size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`ie-ai-option ie-ai-option--icon${apiKey ? ' is-on' : ''}`}
            aria-label={apiKey ? 'Captions by Gemini with your key' : 'Built-in captions: add a Gemini key'}
            title={apiKey ? 'Captions by Gemini with your key' : 'Built-in captions: add a Gemini key'}
            onClick={() => setPicker('key')}
          >
            <KeyRound size={15} aria-hidden="true" />
          </button>
        </div>
        <form className="ie-ai-input" onSubmit={(e) => { e.preventDefault(); void send(); }}>
          <input
            className="ie-ai-input-field"
            type="text"
            aria-label="What's it about?"
            enterKeyHint="send"
            placeholder="Type an idea…"
            value={idea}
            disabled={busy}
            onChange={(e) => setIdea(e.target.value)}
          />
          <button type="submit" className="ie-ai-send" aria-label="Generate captions" disabled={busy || !template}>
            <ArrowUp size={20} strokeWidth={2.6} aria-hidden="true" />
          </button>
        </form>
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

      {picker === 'vibe' && (
        <PickerSheet title="Choose a vibe" onClose={() => setPicker(null)}>
          <div className="ie-ai-vibes" role="radiogroup" aria-label="Choose a vibe">
            {AI_MEME_CATEGORIES.map((c: Vibe) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={vibe === c.id}
                className={`ie-ai-vibe${vibe === c.id ? ' is-on' : ''}`}
                onClick={() => {
                  setVibe(c.id);
                  setPicker(null);
                }}
              >
                <span className="ie-ai-vibe-icon" aria-hidden="true">{c.icon}</span>{vibeLabel(c)}
              </button>
            ))}
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
