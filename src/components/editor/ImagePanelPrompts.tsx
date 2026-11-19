// A multi-panel layout's start cards, laid over the canvas's image area (CanvasEditor's children,
// placed by its --canvas-img-top / --canvas-img-h): one in each empty panel, a small copy of the blank
// canvas's start card (ui/CanvasStartPrompt): the orange Add photo button, then Text and Templates
// pills. A photo (uploaded or a template) comes in as an image layer fitted inside that panel
// (useLayerActions' handleAddImageLayer, through the UI store's `panelTarget`); text as a caption in
// its middle. Only layouts of 2 to 4 panels get them (smaller panels start empty), only in the full
// editor with no sheet open and not while drawing. A panel's card goes once a photo or a caption
// sits in it, or any layer (photo, sticker, text) is moved there: drags update positions live, so
// the card goes the moment a layer's middle crosses into the panel.
import type { ChangeEvent } from 'react';
import { ImagePlus, LayoutTemplate, Type } from 'lucide-react';
import CanvasStartPrompt from '../ui/CanvasStartPrompt';
import { useMemeEditorStore, WHITE_PIXEL_URL } from './store/useMemeEditorStore';
import { useEditorUiStore } from './store/useEditorUiStore';
import { inPanel, panelRects } from '../canvas/layout/panels';
import type { PanelLayout, PanelRect } from '../canvas/layout/panels';
import { inkFor } from '../../utils/inkFor';
import './imagePanelPrompts.css';

// Layouts with more panels than this start empty (their panels are too small for a card).
const MAX_PROMPT_PANELS = 4;

interface Caption { id: string; x?: number; y?: number; zIndex?: number; isHeaderCaption?: boolean; isFooterCaption?: boolean; hasCustomPos?: boolean }
interface Layered { zIndex?: number; x?: number; y?: number }
interface DocState {
  slotImages: (string | null)[];
  captions: Caption[];
  stickers: Layered[];
  imageLayers: Layered[];
  canvasBgColor?: string;
  canvasBgGradient?: unknown;
  setCaptions: (caps: Caption[]) => void;
  setActiveLayerId: (id: string | null) => void;
  pushHistory: () => void;
}
interface UiState {
  sheet: string | null;
  mode: string;
  openSheet: (sheet: string) => void;
  setPanelTarget: (idx: number | null) => void;
}

// Whether a panel has a photo of its own (an empty one holds the editor's white pixel).
const hasPhoto = (src: string | null | undefined) => Boolean(src) && src !== WHITE_PIXEL_URL;

// Whether a photo or sticker layer sits in a panel (its middle there).
const hasLayerIn = (r: PanelRect, layers: Layered[]) => layers.some((l) => inPanel(r, l.x ?? 0.5, l.y ?? 0.5));

// Whether a panel already has a caption in it (one placed on the image, not in a band).
const hasCaptionIn = (r: PanelRect, captions: Caption[]) =>
  captions.some((c) => !c.isHeaderCaption && !c.isFooterCaption && inPanel(r, c.x ?? 0.5, c.y ?? 0.5));

function PanelCard({ index, rect, ink, onText, onUpload, onTemplates }: {
  index: number;
  rect: PanelRect;
  ink: 'dark' | 'light';
  onText: () => void;
  onUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onTemplates: () => void;
}) {
  return (
    <div
      className="ie-panel-start"
      style={{ left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.width * 100}%`, height: `${rect.height * 100}%` }}
    >
      <CanvasStartPrompt
        title={`Panel ${index + 1}`}
        ink={ink}
        primary={{ id: 'photo', label: 'Add photo', Icon: ImagePlus, accept: 'image/*', onFile: onUpload }}
        secondary={[
          { id: 'text', label: 'Text', Icon: Type, onPick: onText },
          { id: 'templates', label: 'Templates', Icon: LayoutTemplate, onPick: onTemplates },
        ]}
      />
    </div>
  );
}

export default function ImagePanelPrompts({ layoutDef, isDrawingMode, onPhoto }: {
  layoutDef: PanelLayout | null;
  isDrawingMode?: boolean;
  // The editor's photo upload (handleFileUploadImageLayer): with the target set, it fills the panel.
  onPhoto?: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  const slotImages = useMemeEditorStore((s: DocState) => s.slotImages);
  const captions = useMemeEditorStore((s: DocState) => s.captions);
  const stickers = useMemeEditorStore((s: DocState) => s.stickers);
  const imageLayers = useMemeEditorStore((s: DocState) => s.imageLayers);
  const bg = useMemeEditorStore((s: DocState) => (s.canvasBgGradient ? undefined : s.canvasBgColor));
  const setCaptions = useMemeEditorStore((s: DocState) => s.setCaptions);
  const setActiveLayerId = useMemeEditorStore((s: DocState) => s.setActiveLayerId);
  const pushHistory = useMemeEditorStore((s: DocState) => s.pushHistory);
  const sheet = useEditorUiStore((s: UiState) => s.sheet);
  const mode = useEditorUiStore((s: UiState) => s.mode);
  const openSheet = useEditorUiStore((s: UiState) => s.openSheet);
  const setPanelTarget = useEditorUiStore((s: UiState) => s.setPanelTarget);

  const rects = panelRects(layoutDef);
  if (rects.length < 2 || rects.length > MAX_PROMPT_PANELS || sheet || mode !== 'full' || isDrawingMode) return null;

  // A chosen photo: the panel is the target, then the editor's usual upload adds it.
  const upload = (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !onPhoto) return;
    setPanelTarget(index);
    onPhoto(e);
  };

  // A caption in the middle of the panel, about as wide as it, selected for typing.
  const addText = (index: number) => {
    const r = rects[index];
    const maxZ = Math.max(-1, ...[...captions, ...stickers, ...imageLayers].map((l) => l.zIndex ?? -1));
    const cap = {
      id: `cap-panel-${index}-${Date.now()}`,
      text: 'TEXT',
      x: r.x + r.width / 2,
      y: r.y + r.height / 2,
      width: r.width * 0.4,
      hasCustomWidth: true,
      fontSize: rects.length > 2 ? 52 : 64,
      color: '#ffffff',
      stroke: '#000000',
      align: 'center',
      fontFamily: 'Impact, sans-serif',
      rotation: 0,
      zIndex: maxZ + 1,
    };
    setCaptions([...captions, cap]);
    setActiveLayerId(cap.id);
    pushHistory();
  };

  const templates = (index: number) => {
    setPanelTarget(index);
    openSheet('templates');
  };

  return (
    <div className="ie-panel-starts">
      {rects.map((r, i) => (hasPhoto(slotImages?.[i]) || hasLayerIn(r, [...(imageLayers || []), ...(stickers || [])]) || hasCaptionIn(r, captions) ? null : (
        <PanelCard key={i} index={i} rect={r} ink={inkFor(bg)} onText={() => addText(i)} onUpload={upload(i)} onTemplates={() => templates(i)} />
      )))}
    </div>
  );
}
