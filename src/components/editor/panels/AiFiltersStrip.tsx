import { ScanFace, Eraser, Undo2, LoaderCircle, Captions, SlidersHorizontal } from 'lucide-react';
import { ToolStrip } from '../../ui';
import type { StripItem } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useSelection } from './selection';
import type { EditorActions } from './selection';

// The AI/Filters tab's strip. Face Swap and AI Caption open their studios; Remove BG works straight
// away (on the selected image, else the template; tap again to restore); Filters opens its sheet.
export default function AiFiltersStrip({ actions }: { actions: EditorActions }) {
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string, focus?: string | null) => void }) => s.openSheet);
  const setShowAiModal = useEditorUiStore((s: { setShowAiModal: (v: boolean) => void }) => s.setShowAiModal);
  const templateBgRemoved = useMemeEditorStore((s: { activeTemplate?: { originalUrl?: string } }) => Boolean(s.activeTemplate?.originalUrl));
  const { image } = useSelection();
  const busy = Boolean(actions.isRemovingBg);
  const bgRemoved = image ? Boolean(image.originalUrl) : templateBgRemoved;

  const items: StripItem[] = [
    { id: 'faceswap', label: 'Face Swap', title: 'Swap faces with another photo using AI', Icon: ScanFace },
    {
      id: 'removebg',
      label: busy ? 'Removing…' : bgRemoved ? 'Restore BG' : 'Remove BG',
      title: image ? 'Remove the selected image\'s background' : 'Remove the meme background',
      Icon: busy ? LoaderCircle : bgRemoved ? Undo2 : Eraser,
      active: bgRemoved,
    },
    { id: 'caption', label: 'AI Caption', title: 'AI meme captions', Icon: Captions },
    { id: 'filters', label: 'Filters', title: 'Photo filters and adjustments', Icon: SlidersHorizontal, active: sheet === 'filters' },
  ];

  const onSelect = (id: string) => {
    if (id === 'faceswap') {
      if (image) actions.handleStartMorphFace(image);
      else actions.setShowFaceMorphModal(true);
    } else if (id === 'removebg') {
      if (!busy) actions.handleRemoveBackground();
    } else if (id === 'caption') setShowAiModal(true);
    else if (id === 'filters') openSheet('filters');
  };

  return <ToolStrip ariaLabel="AI and filter tools" layout="stacked" items={items} onSelect={onSelect} />;
}
