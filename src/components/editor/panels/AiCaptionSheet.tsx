import { useState } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import { Check, Copy, ExternalLink, KeyRound, Plus, RefreshCw, Shuffle, Sparkles, Type, X } from 'lucide-react';
import { Sheet } from '../../ui';
import { useMemeEditorStoreApi } from '../store/useMemeEditorStore';
import { AI_MEME_CATEGORIES, AI_MEME_IDEAS, generateMemeCaptionsWithGemini } from '../../../data/aiMemeCaptions';
import { safeGet, safeRemove, safeSet } from '../../../utils/storage';
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

const KEY = 'gemini_api_key';

// AI/Filters > AI Caption, the revamped AI meme caption generator: vibes and quick inspiration
// chips, custom topic input with Gemini Pro or curated library, and an interactive list of generated
// punchlines to preview, copy or tap to apply to the canvas.
export default function AiCaptionSheet({ onClose }: { actions: EditorActions; onClose: () => void }) {
  const store = useMemeEditorStoreApi() as unknown as { getState(): CaptionStore };
  const [idea, setIdea] = useState('');
  const [vibe, setVibe] = useState('all');
  const [ideas, setIdeas] = useState<{ ask: string; list: string[] }>({ ask: '', list: [] });
  const [busy, setBusy] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>(() => String(safeGet(KEY) || ''));
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState('');

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

  const generate = async (promptText = idea, vibeCategory = vibe) => {
    if (busy) return;
    setBusy(true);
    const ask = `${vibeCategory}\n${promptText.trim()}`;
    const fresh: string[] = await generateMemeCaptionsWithGemini({
      apiKey,
      prompt: promptText.trim(),
      templateName: store.getState().activeTemplate?.name,
      category: vibeCategory,
      count: 4,
    }).catch(() => []);
    setBusy(false);
    if (fresh.length) {
      setIdeas({ ask, list: fresh });
      write(fresh[0]);
    }
  };

  const shuffle = async () => {
    if (busy) return;
    const ask = `${vibe}\n${idea.trim()}`;
    const at = ideas.ask === ask ? ideas.list.indexOf(target()?.text ?? '') : -1;
    if (at >= 0 && at < ideas.list.length - 1) {
      write(ideas.list[at + 1]);
      return;
    }
    await generate(idea, vibe);
  };

  const handleCopy = (e: MouseEvent, text: string) => {
    e.stopPropagation();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1600);
  };

  const handleSaveKey = () => {
    const trimmed = keyInput.trim();
    if (trimmed) safeSet(KEY, trimmed);
    else safeRemove(KEY);
    setApiKey(trimmed);
    setShowKeyModal(false);
  };

  const handleClearKey = () => {
    safeRemove(KEY);
    setApiKey('');
    setKeyInput('');
    setShowKeyModal(false);
  };

  const pickVibe = (id: string) => {
    setVibe(id);
    if (ideas.list.length > 0) {
      void generate(idea, id);
    }
  };

  const pickIdea = (text: string, category?: string) => {
    setIdea(text);
    const cat = category || vibe;
    if (category) setVibe(category);
    void generate(text, cat);
  };

  const activeTarget = target();

  return (
    <Sheet
      className="ie-ai-caption-sheet ie-tool-sheet"
      title="AI Caption"
      aside={
        <button
          type="button"
          className={`ie-ai-key-pill${apiKey ? ' is-set' : ''}`}
          title={apiKey ? 'Using your Gemini key (tap to manage)' : 'Using built-in captions (tap to add Gemini key)'}
          onClick={() => {
            setKeyInput(apiKey);
            setShowKeyModal(!showKeyModal);
          }}
        >
          <KeyRound size={13} strokeWidth={2.4} aria-hidden="true" />
          <span>{apiKey ? 'Gemini Pro' : 'Built-in'}</span>
        </button>
      }
      onClose={onClose}
    >
      {showKeyModal && (
        <div className="ie-ai-key-drawer" role="region" aria-label="Gemini API Key Settings">
          <div className="ie-ai-key-head">
            <span className="ie-ai-key-title">Gemini API Key</span>
            <button
              type="button"
              className="ie-ai-key-close"
              aria-label="Close API key settings"
              onClick={() => setShowKeyModal(false)}
            >
              <X size={14} />
            </button>
          </div>
          <p className="ie-ai-key-desc">
            Use your free Gemini API key from Google AI Studio for custom real-time captions.
          </p>
          <div className="ie-ai-key-input-row">
            <input
              type="password"
              className="ie-ai-key-input"
              aria-label="Gemini API Key"
              placeholder="Paste API key (AIza...)"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
            />
            <button type="button" className="ie-ai-key-save" onClick={handleSaveKey}>Save</button>
            {apiKey && (
              <button type="button" className="ie-ai-key-clear" onClick={handleClearKey}>Clear</button>
            )}
          </div>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="ie-ai-key-link"
          >
            Get a free Gemini API key <ExternalLink size={12} />
          </a>
        </div>
      )}

      {/* Vibe categories */}
      <div className="ie-ai-options ie-ai-options--vibes" role="radiogroup" aria-label="Vibe">
        {AI_MEME_CATEGORIES.map((c: Vibe) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={vibe === c.id}
            className={`ie-ai-option${vibe === c.id ? ' is-on' : ''}`}
            onClick={() => pickVibe(c.id)}
          >
            <span aria-hidden="true">{c.icon}</span>
            <span className="ie-ai-option-text">{c.id === 'all' ? 'Anything' : c.label}</span>
          </button>
        ))}
      </div>

      {/* Quick inspiration chips */}
      <div className="ie-ai-ideas-strip" role="group" aria-label="Quick ideas">
        {AI_MEME_IDEAS.slice(0, 6).map((item) => (
          <button
            key={item.text}
            type="button"
            className={`ie-ai-idea-chip${idea === item.text ? ' is-active' : ''}`}
            onClick={() => pickIdea(item.text, item.category)}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.text}</span>
          </button>
        ))}
      </div>

      {/* Input Composer */}
      <form
        className="ie-ai-caption-form"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void generate(idea, vibe);
        }}
      >
        <div className="ie-ai-input-wrap">
          <Sparkles size={16} className="ie-ai-input-icon" aria-hidden="true" />
          <input
            className="ie-ai-input-field"
            type="text"
            aria-label="What's the meme about?"
            enterKeyHint="go"
            placeholder="Type a topic, or tap Generate..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
          />
          {idea && (
            <button
              type="button"
              className="ie-ai-input-clear"
              aria-label="Clear input"
              onClick={() => setIdea('')}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="ie-ai-form-actions">
          <button
            type="submit"
            className={`ie-ai-btn-gen${busy ? ' is-busy' : ''}`}
            disabled={busy}
            title="Generate AI captions"
          >
            <Sparkles size={15} strokeWidth={2.4} aria-hidden="true" />
            <span>{busy ? 'Writing…' : 'Generate'}</span>
          </button>
          <button
            type="button"
            className={`ie-ai-send ie-ai-btn-shuffle${busy ? ' is-busy' : ''}`}
            aria-label={busy ? 'Writing captions' : 'Shuffle captions'}
            title="Shuffle: the next caption on the meme"
            disabled={busy}
            onClick={() => void shuffle()}
          >
            <Shuffle size={16} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>
      </form>

      {/* Target status */}
      <div className="ie-ai-target-info">
        <span className="ie-ai-target-label">
          <Type size={12} strokeWidth={2.4} aria-hidden="true" />
          {activeTarget ? (
            <>Writing on: <strong className="ie-ai-target-name">"{activeTarget.text.slice(0, 24)}{activeTarget.text.length > 24 ? '…' : ''}"</strong></>
          ) : (
            <>Writing on: <strong>Top Caption</strong></>
          )}
        </span>
      </div>

      {/* Generated Captions Cards */}
      <div className="ie-ai-results">
        {busy ? (
          <div className="ie-ai-skeletons" aria-label="Generating captions..." role="status">
            <div className="ie-ai-card-skeleton" />
            <div className="ie-ai-card-skeleton" />
            <div className="ie-ai-card-skeleton" />
          </div>
        ) : ideas.list.length > 0 ? (
          <>
            <div className="ie-ai-results-head">
              <span className="ie-ai-results-title">Pick a punchline:</span>
              <button
                type="button"
                className="ie-ai-regen-link"
                onClick={() => void generate(idea, vibe)}
              >
                <RefreshCw size={12} strokeWidth={2.4} />
                <span>More</span>
              </button>
            </div>
            <div className="ie-ai-cards" role="list">
              {ideas.list.map((text, i) => {
                const applied = currentText === text;
                return (
                  <div key={`${text}-${i}`} role="listitem" className={`ie-ai-card${applied ? ' is-applied' : ''}`}>
                    <button type="button" className="ie-ai-card-content" aria-pressed={applied} onClick={() => write(text)}>
                      <span className="ie-ai-card-text">{text}</span>
                      {applied && (
                        <span className="ie-ai-applied-badge">
                          <Check size={11} strokeWidth={3} aria-hidden="true" /> On canvas
                        </span>
                      )}
                    </button>
                    <div className="ie-ai-card-tools">
                      <button
                        type="button"
                        className="ie-ai-card-btn"
                        title="Copy caption"
                        aria-label="Copy caption"
                        onClick={(e) => handleCopy(e, text)}
                      >
                        {copiedText === text ? <Check size={13} className="ie-ai-copied" /> : <Copy size={13} />}
                      </button>
                      <button
                        type="button"
                        className="ie-ai-card-btn"
                        title="Add as new layer"
                        aria-label="Add as new layer"
                        onClick={() => write(text, true)}
                      >
                        <Plus size={13} strokeWidth={2.4} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="ie-ai-empty-prompt">
            <p className="ie-ai-empty-hint">
              Tap <strong>Generate</strong> or pick any idea above to write AI punchlines!
            </p>
          </div>
        )}
      </div>
    </Sheet>
  );
}
