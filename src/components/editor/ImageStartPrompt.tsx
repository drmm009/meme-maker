import type { ChangeEvent } from 'react';
import { ImagePlus, LayoutTemplate, Sticker } from 'lucide-react';
import CanvasStartPrompt from '../ui/CanvasStartPrompt';
import { useMemeEditorStore } from './store/useMemeEditorStore';
import { useEditorUiStore } from './store/useEditorUiStore';
import { inkFor } from '../../utils/inkFor';

type Layers = unknown[] | undefined;

// A blank canvas's first step, inside the canvas box (CanvasEditor's children): add a photo, or
// start from a template or stickers. It shows until something is added, and while no sheet is open.
export default function ImageStartPrompt({ onPhoto }: { onPhoto: (e: ChangeEvent<HTMLInputElement>) => void }) {
  const blank = useMemeEditorStore((s: { activeTemplate?: { canvasOnly?: boolean } }) => Boolean(s.activeTemplate?.canvasOnly));
  const empty = useMemeEditorStore((s: { imageLayers: Layers; stickers: Layers; drawings: Layers }) =>
    !s.imageLayers?.length && !s.stickers?.length && !s.drawings?.length);
  const bg = useMemeEditorStore((s: { canvasBgColor?: string; canvasBgGradient?: unknown }) => (s.canvasBgGradient ? undefined : s.canvasBgColor));
  const sheet = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const mode = useEditorUiStore((s: { mode: string }) => s.mode);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);

  if (!blank || !empty || sheet || mode !== 'full') return null;
  return (
    <CanvasStartPrompt
      title="Start your meme"
      ink={inkFor(bg)}
      primary={{ id: 'photo', label: 'Add a photo', Icon: ImagePlus, accept: 'image/*,video/*', onFile: onPhoto }}
      hint="Then tap the captions to write your joke."
      secondary={[
        { id: 'templates', label: 'Templates', Icon: LayoutTemplate, onPick: () => openSheet('templates') },
        { id: 'stickers', label: 'Stickers', Icon: Sticker, onPick: () => openSheet('stickers') },
      ]}
    />
  );
}
