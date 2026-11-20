import { useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { ChevronLeft, ImagePlus, LayoutTemplate, Palette, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import TemplatesSheet from './TemplatesSheet';
import { AI_MEME_CATEGORIES, AI_MEME_IDEAS, generateMemeCaptions } from '../../../data/aiMemeCaptions';
import { aiCaptionedTemplate, aiMemeTemplate, hasAiMeme } from '../aiMeme';
import { pictureSize, readFile } from '../faceSwap';
import type { EditorActions } from './selection';
import './faceSwap.css';
import './aiMemeStudio.css';
import './aiMemePage.css';

interface Template { id: string | number; name?: string; imageUrl?: string; width?: number; height?: number; [key: string]: unknown }
interface Vibe { id: string; label: string; icon: string }
interface Idea { text: string; icon: string; category: string }

const IDEAS = 4;
// The idea chips under the prompt.
const IDEA_CHIPS = 6;
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

// The AI Meme maker's Templates: the Templates browser, whose pick becomes the page's meme, in
// Sticker Studio's Templates look (`sst-templates`) in the AI maker's violet (`aip-templates`).
export function AiMemeGallerySheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const { idea, vibe } = useAsk();
  return <TemplatesSheet actions={actions} onClose={onClose} title="Pick a meme" className="sst-templates aip-templates" onPick={(t) => actions.handleChangeMeme(aiMemeTemplate({ ...t }, idea, vibe))} />;
}

// The AI Meme maker's page, until its meme is made (EditorPanels shows it in the canvas's place), in
// Sticker Studio's design (aiMemePage.css) with the AI maker's violet (#a78bfa, its colour in the
// Creator sheet): a round Back button and the title centred with a bare violet wand; the meme on a
// rounded stage (Change opens Templates, a round button uploads your own photo, its name on a
// frosted pill; while captions are written a violet light sweeps across). It opens with no meme
// (aiBlankTemplate): the stage asks for one, Templates or Upload, and Generate waits; then one card with the
// question, the idea to type and ideas to start from as chips (a tap sends one); the vibes as
// emoji tiles in their own card; and Generate captions, the wide violet button over a short note.
// Sending asks for four captions (from the built-in library until a backend writes them), then puts
// the first on the meme and opens the editing page.
export default function AiMemeStudio({ actions, onBack }: { actions: EditorActions; onClose?: () => void; onBack?: () => void }) {
  const template: Template | null = useMemeEditorStore((s: { activeTemplate: Template | null }) => s.activeTemplate);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const { idea, vibe, setIdea, setVibe } = useAsk();
  // What was sent, while the captions are being written.
  const [sent, setSent] = useState<string | null>(null);
  const busy = sent !== null;
  const memeName = template?.name || 'your meme';
  // The maker opens with none (aiBlankTemplate): the stage asks for one first.
  const hasMeme = hasAiMeme(template);
  const picked = AI_MEME_CATEGORIES.find((c: Vibe) => c.id === vibe) as Vibe | undefined;

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
    if (busy || !template || !hasMeme) return;
    setIdea(prompt);
    setVibe(category);
    setSent(prompt.trim() || 'Surprise me');
    const ideas: string[] = await generateMemeCaptions({ prompt, templateName: template.name, category, count: IDEAS }).catch(() => []);
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

  return (
    <section className="ie-swap aip" aria-label="Make an AI meme">
      <header className="aip-header">
        <button type="button" className="aip-back" onClick={() => (onBack ? onBack() : window.history.back())} aria-label="Back" title="Back">
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>
        <h1 className="aip-title ui-topbar-title">
          <span className="aip-title-icon" aria-hidden="true"><Wand2 size={17} strokeWidth={2.4} /></span>
          <span>AI Meme Studio</span>
        </h1>
        {/* Said for screen readers (and the tests): where the meme stands. */}
        <p className="aip-status ui-topbar-subtitle" aria-live="polite">{hasMeme ? 'Pick a meme and an idea' : 'Pick a meme'}</p>
      </header>

      <div className="aip-body">
        {/* The stage: the meme the captions are for. */}
        <div className={`aip-stage${busy ? ' is-busy' : ''}${hasMeme ? ' has-meme' : ''}`}>
          {hasMeme ? (
            <img className="aip-meme" src={template?.imageUrl} alt="" />
          ) : (
            <div className="aip-empty">
              {/* A blank meme card, tilted, waiting for its picture. */}
              <span className="aip-empty-art" aria-hidden="true"><LayoutTemplate size={32} strokeWidth={1.8} /></span>
              <span className="aip-empty-title">Pick a meme to caption</span>
              <span className="aip-empty-hint">A template, or a photo of your own</span>
              <div className="aip-empty-actions">
                <button type="button" className="aip-pick" aria-label="Meme: none" disabled={busy} onClick={openTemplates}>
                  <LayoutTemplate size={17} strokeWidth={2.3} aria-hidden="true" />
                  Templates
                </button>
                <label className="aip-pick aip-pick--quiet">
                  <ImagePlus size={17} strokeWidth={2.3} aria-hidden="true" />
                  Upload
                  <input type="file" accept="image/*" aria-label="Upload a photo" onChange={(e) => void upload(e)} hidden />
                </label>
              </div>
            </div>
          )}
          {hasMeme && !busy && (
            <div className="aip-stage-tools">
              <button type="button" className="aip-chip" aria-label={`Meme: ${template?.name || 'none'}`} onClick={openTemplates}>
                <RefreshCw size={14} strokeWidth={2.4} aria-hidden="true" />
                Change
              </button>
              <label className="aip-chip aip-chip--round" title="Use your own photo">
                <ImagePlus size={16} strokeWidth={2.3} aria-hidden="true" />
                <input type="file" accept="image/*" aria-label="Upload a photo" onChange={(e) => void upload(e)} hidden />
              </label>
            </div>
          )}
          {hasMeme && !busy && <span className="aip-meme-name">{memeName}</span>}
          {busy && (
            <div className="aip-busy" role="status">
              <span className="aip-sweep" aria-hidden="true" />
              <span className="aip-busy-pill">
                <span className="aip-spinner" aria-hidden="true" />
                <span>Writing captions on {memeName}… <i>“{sent}”</i></span>
              </span>
            </div>
          )}
        </div>

        {/* The idea: the question, the box to type in, and ideas to start from. */}
        <form className="aip-card aip-ask" onSubmit={(e) => { e.preventDefault(); void send(); }}>
          <h2 className="aip-question"><Sparkles size={17} strokeWidth={2.3} aria-hidden="true" />What should the meme be about?</h2>
          <textarea
            className="aip-field"
            rows={2}
            aria-label="What's it about?"
            enterKeyHint="send"
            placeholder="Mondays at work, my code finally running…"
            value={idea}
            disabled={busy}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={onKey}
          />
          <div className="aip-ideas" role="group" aria-label="Ideas">
            {(AI_MEME_IDEAS as Idea[]).slice(0, IDEA_CHIPS).map((s) => (
              <button key={s.text} type="button" className="aip-idea" disabled={busy || !hasMeme} onClick={() => void send(s.text, s.category)}>
                <span aria-hidden="true">{s.icon}</span>{s.text}
              </button>
            ))}
          </div>
        </form>

        {/* The vibe: emoji tiles in a row, the picked one ringed in violet. */}
        <div className="aip-card aip-vibes">
          <div className="aip-card-head">
            <span className="aip-card-title"><Palette size={17} strokeWidth={2.3} aria-hidden="true" />Vibe</span>
            <span className="aip-picked" aria-hidden="true">{picked ? vibeLabel(picked) : 'Anything'}</span>
          </div>
          <div className="aip-vibe-row" role="radiogroup" aria-label="Choose a vibe">
            {AI_MEME_CATEGORIES.map((c: Vibe) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={vibe === c.id}
                className={`aip-vibe${vibe === c.id ? ' is-on' : ''}`}
                disabled={busy}
                onClick={() => setVibe(c.id)}
              >
                <span className="aip-vibe-icon" aria-hidden="true">{c.icon}</span>
                <span className="aip-vibe-name">{vibeLabel(c)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="aip-actions">
        <button type="button" className="aip-go" aria-label="Generate captions" disabled={busy || !hasMeme} onClick={() => void send()}>
          <Sparkles size={18} aria-hidden="true" />
          <span>{busy ? 'Writing captions…' : 'Generate captions'}</span>
        </button>
        <p className="aip-note">{busy ? 'This takes a moment' : hasMeme ? 'Four captions to pick from' : 'Pick a meme to start'}</p>
      </div>
    </section>
  );
}
