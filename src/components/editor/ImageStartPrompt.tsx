import type { ChangeEvent } from 'react';
import { ImagePlus, LayoutTemplate, Sticker, Type } from 'lucide-react';
import CanvasStartPrompt from '../ui/CanvasStartPrompt';
import { useMemeEditorStore } from './store/useMemeEditorStore';
import { useEditorUiStore } from './store/useEditorUiStore';
import { inkFor } from '../../utils/inkFor';

type Layers = unknown[] | undefined;
interface Caption { id: string; zIndex?: number }
interface Layered { zIndex?: number }
interface PromptState {
  activeTemplate?: { canvasOnly?: boolean; isNativeLayout?: boolean; defaultCaptions?: unknown[] };
  imageLayers: Layers;
  stickers: Layers;
  drawings: Layers;
  captions: Layers;
  setCaptions: (caps: unknown[]) => void;
  setActiveLayerId: (id: string | null) => void;
  pushHistory: () => void;
}

// A blank canvas's first step, on the canvas's image area (CanvasStage's .ie-image-area, so a
// caption layout's header and footer bars stay clear): add a photo, or start with text (a caption in
// the middle of the picture, selected for typing), a template or stickers. It shows on a blank canvas (not a multi-panel one, whose panels have cards of their own)
// with no photo, sticker or drawing and no text beyond its starting captions (a caption layout's
// band captions count among them), while no sheet is open.
export default function ImageStartPrompt({ onPhoto }: { onPhoto: (e: ChangeEvent<HTMLInputElement>) => void }) {
  const blank = useMemeEditorStore((s: PromptState) => Boolean(s.activeTemplate?.canvasOnly) && !s.activeTemplate?.isNativeLayout);
  const empty = useMemeEditorStore((s: PromptState) =>
    !s.imageLayers?.length && !s.stickers?.length && !s.drawings?.length
    // The starting captions: the template's own, or the editor's TOP TEXT and BOTTOM TEXT.
    && (s.captions?.length ?? 0) <= (s.activeTemplate?.defaultCaptions?.length ?? 2));
  const bg = useMemeEditorStore((s: { canvasBgColor?: string; canvasBgGradient?: unknown }) => (s.canvasBgGradient ? undefined : s.canvasBgColor));
  const sheet = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const mode = useEditorUiStore((s: { mode: string }) => s.mode);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const captions = useMemeEditorStore((s: PromptState) => s.captions) as Caption[] | undefined;
  const stickers = useMemeEditorStore((s: PromptState) => s.stickers) as Layered[] | undefined;
  const imageLayers = useMemeEditorStore((s: PromptState) => s.imageLayers) as Layered[] | undefined;
  const setCaptions = useMemeEditorStore((s: PromptState) => s.setCaptions);
  const setActiveLayerId = useMemeEditorStore((s: PromptState) => s.setActiveLayerId);
  const pushHistory = useMemeEditorStore((s: PromptState) => s.pushHistory);

  if (!blank || !empty || sheet || mode !== 'full') return null;

  // A caption in the middle of the picture, its box a quarter of the canvas wide, selected so it can be typed into.
  const addText = () => {
    const maxZ = Math.max(-1, ...[...(captions || []), ...(stickers || []), ...(imageLayers || [])].map((l) => l.zIndex ?? -1));
    const cap = {
      id: `cap-start-${Date.now()}`,
      text: 'TEXT',
      x: 0.5,
      y: 0.5,
      fontSize: 64,
      color: '#ffffff',
      stroke: '#000000',
      align: 'center',
      fontFamily: 'Impact, sans-serif',
      rotation: 0,
      width: 0.25,
      hasCustomWidth: true,
      zIndex: maxZ + 1,
    };
    setCaptions([...(captions || []), cap]);
    setActiveLayerId(cap.id);
    pushHistory();
  };
  return (
    <CanvasStartPrompt
      title="Start your meme"
      ink={inkFor(bg)}
      primary={{ id: 'photo', label: 'Add a photo', Icon: ImagePlus, accept: 'image/*,video/*', onFile: onPhoto }}
      hint={captions?.length ? 'Then tap the captions to write your joke.' : 'Then add your text on top.'}
      secondary={[
        { id: 'text', label: 'Text', Icon: Type, onPick: addText },
        { id: 'templates', label: 'Templates', Icon: LayoutTemplate, onPick: () => openSheet('templates') },
        { id: 'stickers', label: 'Stickers', Icon: Sticker, onPick: () => openSheet('stickers') },
      ]}
    />
  );
}
