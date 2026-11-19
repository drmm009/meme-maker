// The video editor's start cards over the preview (CanvasPreview's children), while the timeline is
// closed. A grid layout of 2 to 4 panels: a small start card in each empty panel (ui/CanvasStartPrompt:
// Add video, then Photo and Clips), which makes that panel the target of the clip added next
// (the store's `targetSlot`); a grid of more panels starts empty, its lines in view. A panel's card
// goes once anything sits in it: a clip or photo given to it, or any clip, photo, sticker or text
// whose middle is there, including while one is dragged over it (panelDrag). Otherwise the
// empty video's start card (StartPrompt), on the picture between the header and footer bars, while
// there is no clip, photo or sticker yet (text, such as a caption layout's, doesn't count).
import type { CSSProperties } from 'react';
import { Clapperboard, Image as ImageIcon, SquarePlay } from 'lucide-react';
import CanvasStartPrompt from '../ui/CanvasStartPrompt';
import StartPrompt from './StartPrompt';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { bandRects } from '../../utils/videoBands';
import type { VideoBand } from '../../utils/videoBands';
import { inkFor } from '../../utils/inkFor';
import { usePanelDrag } from './preview/panelDrag';
import { inSlot, slotTaken } from '../../utils/videoPanels';
import type { DragPoint } from './preview/panelDrag';
import '../editor/imagePanelPrompts.css';

type StartKind = 'video' | 'photo' | 'clips' | 'link';
interface Item { type: string; slotIndex?: number; x?: number; y?: number; width?: number; height?: number; scaleX?: number; scaleY?: number; text?: string }
interface Slot { x: number; y: number; width: number; height: number }
interface State {
  items: Item[];
  layoutId?: string | null;
  layoutSlots: Slot[];
  canvasAspectRatio?: number;
  backgroundColor?: string;
  videoHeader: VideoBand;
  videoFooter: VideoBand;
  setTargetSlot: (index: number | null) => void;
}

const STAGE_WIDTH = 800;
// Grids with more panels than this start empty (their panels are too small for a card).
const MAX_PROMPT_PANELS = 4;
const isMedia = (i: Item) => i.type === 'video' || i.type === 'image' || i.type === 'sticker';
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

// Whether a panel has something in it, or something is being dragged over it.
const panelTaken = (i: number, slot: Slot, items: Item[], dragging: DragPoint | null) => inSlot(slot, dragging) || slotTaken(i, slot, items);

export default function VideoStartArea({ open, onPick }: { open: boolean; onPick: (kind: StartKind) => void }) {
  const items = useEditorStore((s: State) => s.items);
  const layoutId = useEditorStore((s: State) => s.layoutId);
  const slots = useEditorStore((s: State) => s.layoutSlots);
  const aspect = useEditorStore((s: State) => s.canvasAspectRatio || 16 / 9);
  const background = useEditorStore((s: State) => s.backgroundColor);
  const header = useEditorStore((s: State) => s.videoHeader);
  const footer = useEditorStore((s: State) => s.videoFooter);
  const setTargetSlot = useEditorStore((s: State) => s.setTargetSlot);
  const dragging = usePanelDrag((s) => s.point);
  if (!open) return null;

  const stageH = STAGE_WIDTH / aspect;
  const grid = Boolean(layoutId) && layoutId !== '1-panel' && (slots || []).length > 1;

  if (grid) {
    if (slots.length > MAX_PROMPT_PANELS) return null;
    // The panel is the target, then the usual add (the picker, or the Clips sheet).
    const pick = (index: number, kind: StartKind) => {
      setTargetSlot(index);
      onPick(kind);
    };
    return (
      <div className="ie-panel-starts">
        {slots.map((slot, i) => (panelTaken(i, slot, items, dragging) ? null : (
          <div
            key={i}
            className="ie-panel-start"
            style={{ left: pct(slot.x, STAGE_WIDTH), top: pct(slot.y, stageH), width: pct(slot.width, STAGE_WIDTH), height: pct(slot.height, stageH) }}
          >
            <CanvasStartPrompt
              title={`Panel ${i + 1}`}
              ink={inkFor(background)}
              primary={{ id: 'video', label: 'Add video', Icon: SquarePlay, onPick: () => pick(i, 'video') }}
              secondary={[
                { id: 'photo', label: 'Photo', Icon: ImageIcon, onPick: () => pick(i, 'photo') },
                { id: 'clips', label: 'Clips', Icon: Clapperboard, onPick: () => pick(i, 'clips') },
              ]}
            />
          </div>
        )))}
      </div>
    );
  }

  // Nothing but text yet: the start card, between the bars.
  if (items.some(isMedia)) return null;
  const [headerBar] = bandRects(header, null, STAGE_WIDTH, stageH);
  const [footerBar] = bandRects(null, footer, STAGE_WIDTH, stageH);
  const headH = headerBar?.height ?? 0;
  const footH = footerBar?.height ?? 0;
  const area = { '--canvas-img-top': pct(headH, stageH), '--canvas-img-h': pct(stageH - headH - footH, stageH) } as CSSProperties;
  return (
    <div className="ie-image-area" style={area}>
      <StartPrompt onPick={onPick} />
    </div>
  );
}
