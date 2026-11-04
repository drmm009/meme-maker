import { useEffect, useRef, useState } from 'react';
import { Palette, Pencil, Shuffle, Sparkles } from 'lucide-react';
import { HeaderFooterIcon } from './editorIcons';
import { ToolStrip } from '../../ui';
import type { StripItem } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useMemeEditorStore, useMemeEditorStoreApi } from '../store/useMemeEditorStore';
import { generateMemeCaptionsWithGemini } from '../../../data/aiMemeCaptions';
import { safeGet } from '../../../utils/storage';
import { AI_CAPTION_PREFIX, AI_CAPTION_STYLES, aiCaptionStyleOf, aiCaptionedTemplate } from '../aiMeme';
import type { EditorActions } from './selection';
import './aiMemeStudio.css';

interface Caption { id: string; text: string; fontFamily?: string; color?: string }
interface Template { name?: string; aiPrompt?: string; aiCategory?: string; aiIdeas?: string[]; [key: string]: unknown }
interface CaptionStore {
  captions: Caption[];
  activeTemplate: Template | null;
  updateCaptionText: (id: string, text: string | Record<string, unknown>) => void;
  pushHistory: () => void;
  setActiveLayerId: (id: string | null) => void;
}

// The AI Meme maker's strip on its editing page, once its meme is made (before that its page,
// AiMemeStudio, shows): Shuffle, set apart in the accent, puts the next of the AI captions on the
// meme (after the last, it asks for four more); Style opens a row of looks for the caption above the
// tools; Text selects it (its layer pill); Header & Footer opens the bands' sheet (as on the Canvas
// strip); Effects opens the photo filters. New, Move to editor and Export are the
// dock under it (EditorPanels).
export default function AiStrip({ actions }: { actions: EditorActions }) {
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const closeSheet = useEditorUiStore((s: { closeSheet: () => void }) => s.closeSheet);
  const template: Template | null = useMemeEditorStore((s: CaptionStore) => s.activeTemplate);
  const captions: Caption[] = useMemeEditorStore((s: CaptionStore) => s.captions);
  const store = useMemeEditorStoreApi() as unknown as { getState(): CaptionStore };
  const headerOn = useMemeEditorStore((s: { canvasHeader: { enabled: boolean } }) => Boolean(s.canvasHeader?.enabled));
  const footerOn = useMemeEditorStore((s: { canvasFooter: { enabled: boolean } }) => Boolean(s.canvasFooter?.enabled));
  const [ideas, setIdeas] = useState<string[]>(() => template?.aiIdeas ?? []);
  const [busy, setBusy] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const shuffleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (shuffleTimerRef.current) window.clearTimeout(shuffleTimerRef.current);
    };
  }, []);

  const triggerShuffleEffect = () => {
    setShuffling(true);
    if (shuffleTimerRef.current) window.clearTimeout(shuffleTimerRef.current);
    shuffleTimerRef.current = window.setTimeout(() => setShuffling(false), 450);
  };

  // Style's looks, open over the tools.
  const [styling, setStyling] = useState(false);
  const aiCaption = captions.find((c) => c.id.startsWith(AI_CAPTION_PREFIX));
  const index = aiCaption ? ideas.indexOf(aiCaption.text) : -1;

  // A caption takes the AI caption's place (keeping its look); with that caption deleted, the meme
  // starts again with this one.
  const apply = (text: string, list = ideas) => {
    const s = store.getState();
    if (aiCaption) {
      s.updateCaptionText(aiCaption.id, text);
      s.pushHistory();
    } else if (template) {
      actions.handleChangeMeme(aiCaptionedTemplate(template, text, { prompt: template.aiPrompt || '', category: template.aiCategory || 'all', ideas: list }));
    }
  };
  const restyle = (props: Record<string, unknown>) => {
    if (!aiCaption) return;
    const s = store.getState();
    s.updateCaptionText(aiCaption.id, props);
    s.pushHistory();
  };

  // The next caption; past the last (or from one edited by hand), four new ones.
  const next = async () => {
    if (busy) return;
    triggerShuffleEffect();
    if (index >= 0 && index < ideas.length - 1) {
      apply(ideas[index + 1]);
      return;
    }
    setBusy(true);
    const fresh: string[] = await generateMemeCaptionsWithGemini({
      apiKey: String(safeGet('gemini_api_key') || ''), prompt: template?.aiPrompt, templateName: template?.name, category: template?.aiCategory || 'all', count: 4,
    }).catch(() => []);
    setBusy(false);
    if (fresh.length) {
      setIdeas(fresh);
      apply(fresh[0], fresh);
    }
  };

  const look = aiCaption ? aiCaptionStyleOf(aiCaption) : null;

  const items: StripItem[] = [
    { id: 'next', label: busy ? 'Writing…' : 'Shuffle', title: 'Another AI caption on the meme', Icon: Shuffle, className: `ie-ai-shuffle${busy ? ' is-busy' : ''}${shuffling ? ' is-shuffling' : ''}` },
    { id: 'edit', label: 'Text', title: 'Edit the caption: its words, font and colour', Icon: Pencil },
    { id: 'style', label: 'Style', title: 'How the caption looks', Icon: Palette, active: styling },
    { id: 'bands', label: 'Header & Footer', title: 'Bands above and below the meme', Icon: HeaderFooterIcon, active: sheet === 'bands', className: 'ie-strip-btn--two-line' },
    { id: 'effects', label: 'Effects', title: 'Photo effects and filters', Icon: Sparkles, active: sheet === 'filters' },
  ];

  // The sheet each button opens; tapping it again closes it.
  const SHEET: Record<string, string> = { effects: 'filters', bands: 'bands' };
  const onSelect = (id: string) => {
    if (id === 'style') {
      setStyling(!styling);
      return;
    }
    if (id === 'next') {
      void next();
      return;
    }
    setStyling(false);
    if (id === 'edit') {
      if (aiCaption) store.getState().setActiveLayerId(aiCaption.id);
      return;
    }
    if (sheet === SHEET[id]) {
      closeSheet();
      return;
    }
    store.getState().setActiveLayerId(null);
    if (id === 'bands' && !headerOn && !footerOn) actions.handleToggleCanvasHeader();
    openSheet(SHEET[id]);
  };

  return (
    <div className="ie-ai-strip">
      {styling && (
        <div className="ie-ai-choices" role="radiogroup" aria-label="Caption style">
          {AI_CAPTION_STYLES.map((st) => (
            <button key={st.id} type="button" role="radio" aria-checked={look === st.id} className={`ie-ai-choice${look === st.id ? ' is-on' : ''}`} disabled={!aiCaption} onClick={() => restyle({ bgStyle: undefined, shadowColor: undefined, ...st.look })}>
              <span className={`ie-ai-look ie-ai-look--${st.id}`} aria-hidden="true">Aa</span>
              {st.label}
            </button>
          ))}
        </div>
      )}
      <ToolStrip ariaLabel="AI meme tools" layout="stacked" items={items} onSelect={onSelect} />
    </div>
  );
}
