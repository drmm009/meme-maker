import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Captions, ChevronLeft, ChevronRight, Palette, Plus, Sparkles, Type } from 'lucide-react';
import { BubbleIcon, HeaderFooterIcon } from './editorIcons';
import { Sheet, ToolDock, ToolStrip } from '../../ui';
import type { DockItem, StripItem } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useMemeEditorStore, useMemeEditorStoreApi } from '../store/useMemeEditorStore';
import { generateMemeCaptions } from '../../../data/aiMemeCaptions';
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

// The Text tool's own row, as Sticker Studio's (StickerStrip) and the image editor's Text tab.
const TEXT_TOOLS: StripItem[] = [
  { id: 'add', label: 'Add Text', title: 'Add Text Caption', Icon: Plus },
  { id: 'bubble', label: 'Bubble', title: 'Add Chat & Speech Bubble', Icon: BubbleIcon },
];

// The AI Meme maker's tools on its editing page, once its meme is made (before that its page,
// AiMemeStudio, shows), as Sticker Studio's (StickerStrip): the image editor's floating dock
// (ToolDock) with Text (a row of Add Text and Bubble floating above the dock, as Sticker Studio's;
// open when the page comes up), Style (a sheet of looks for the AI caption), Header (the bands' sheet, as on the Canvas strip), Effects (the photo filters) and
// Caption: a sheet with the caption card, which of the AI captions is on the meme with the caption
// itself, and arrows to step back and on through them (on past the last asks for four more). The
// sheet is drawn here, not by EditorPanels, so the captions written stay when it closes. With the
// caption selected its tools (LayerToolbar, as `tools`) float above the dock. Export is in the header
// (MemeEditor).
export default function AiStrip({ actions, tools }: { actions: EditorActions; tools?: ReactNode }) {
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

  // Text's row floating above the dock, open to start.
  const [textOpen, setTextOpen] = useState(true);
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
    const fresh: string[] = await generateMemeCaptions({
      prompt: template?.aiPrompt, templateName: template?.name, category: template?.aiCategory || 'all', count: 4,
    }).catch(() => []);
    setBusy(false);
    if (fresh.length) {
      setIdeas(fresh);
      apply(fresh[0], fresh);
    }
  };

  // The caption before this one.
  const prev = () => {
    if (busy || index <= 0) return;
    apply(ideas[index - 1]);
  };

  const look = aiCaption ? aiCaptionStyleOf(aiCaption) : null;

  const items: DockItem[] = [
    { id: 'captions', label: 'Caption', title: 'Step through the AI captions', Icon: Captions },
    { id: 'style', label: 'Style', title: 'How the caption looks', Icon: Palette },
    { id: 'text', label: 'Text', title: 'Add text or a speech bubble', Icon: Type },
    { id: 'bands', label: 'Header', title: 'Header & footer: bands above and below the meme', Icon: HeaderFooterIcon },
    { id: 'effects', label: 'Effects', title: 'Photo effects and filters', Icon: Sparkles },
  ];

  // The sheet each button opens; tapping it again closes it.
  const SHEET: Record<string, string> = { style: 'aiCaptionStyle', effects: 'filters', bands: 'bands', captions: 'aiCaptionCard' };
  const onSelect = (id: string) => {
    if (id === 'text') {
      // Its row shows (or hides); a sheet that was open makes way.
      if (sheet) closeSheet();
      setTextOpen(!textOpen || Boolean(sheet));
      return;
    }
    setTextOpen(false);
    if (sheet === SHEET[id]) {
      closeSheet();
      return;
    }
    store.getState().setActiveLayerId(null);
    if (id === 'bands' && !headerOn && !footerOn) actions.handleToggleCanvasHeader();
    openSheet(SHEET[id]);
  };
  const active = sheet === 'bubble' ? 'text' : sheet ? Object.keys(SHEET).find((id) => SHEET[id] === sheet) ?? null : textOpen ? 'text' : null;
  const onText = (id: string) => {
    if (id === 'add') actions.handleAddCaption();
    else if (id === 'bubble') openSheet('bubble');
  };

  return (
    <>
      {tools ?? (!sheet && textOpen ? (
        <div className="ie-ai-float ie-ai-text-tools">
          <ToolStrip ariaLabel="Text tools" layout="stacked" items={TEXT_TOOLS} onSelect={onText} />
        </div>
      ) : null)}
      <ToolDock ariaLabel="AI meme tools" items={items} active={active} onSelect={onSelect} />
      {sheet === 'aiCaptionStyle' && (
        <Sheet Icon={Palette} className="ie-ai-sheet ie-tool-sheet" title="Caption style" onClose={closeSheet}>
          <div className="ie-ai-choices" role="radiogroup" aria-label="Caption style">
            {AI_CAPTION_STYLES.map((st) => (
              <button key={st.id} type="button" role="radio" aria-checked={look === st.id} className={`ie-ai-choice${look === st.id ? ' is-on' : ''}`} disabled={!aiCaption} onClick={() => restyle({ bgStyle: undefined, shadowColor: undefined, ...st.look })}>
                <span className={`ie-ai-look ie-ai-look--${st.id}`} aria-hidden="true">Aa</span>
                {st.label}
              </button>
            ))}
          </div>
        </Sheet>
      )}
      {sheet === 'aiCaptionCard' && (
        <Sheet Icon={Captions} className="ie-ai-sheet ie-tool-sheet" title="Caption" onClose={closeSheet}>
          <div className={`ie-ai-caption${shuffling ? ' is-turning' : ''}`}>
            <div className="ie-ai-caption-main">
              <span className="ie-ai-caption-kicker" aria-live="polite">
                <Sparkles size={13} aria-hidden="true" />
                {busy ? 'Writing new captions…' : index >= 0 ? `Caption ${index + 1} of ${ideas.length}` : 'Your caption'}
              </span>
              <p className="ie-ai-caption-text">{aiCaption?.text || 'Tap › for an AI caption'}</p>
            </div>
            <div className="ie-ai-caption-nav">
              <button type="button" aria-label="Previous caption" title="Previous caption" disabled={busy || index <= 0} onClick={prev}>
                <ChevronLeft size={18} strokeWidth={2.6} />
              </button>
              <button type="button" className="ie-ai-caption-next" aria-label="Next caption" title={index >= 0 && index < ideas.length - 1 ? 'Next caption' : 'Four new captions'} disabled={busy} onClick={() => void next()}>
                <ChevronRight size={18} strokeWidth={2.6} />
              </button>
            </div>
          </div>
        </Sheet>
      )}
    </>
  );
}
