import { ScanFace, Eraser, Captions, SlidersHorizontal } from 'lucide-react';
import { ToolStrip } from '../../ui';
import type { StripItem } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useSelection } from './selection';
import type { EditorActions } from './selection';

// The AI/Filters tab's strip: Face Swap, Background (blur & removal), AI Caption, Filters.
export default function AiFiltersStrip({ actions }: { actions: EditorActions }) {
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string, focus?: string | null) => void }) => s.openSheet);
  const closeSheet = useEditorUiStore((s: { closeSheet: () => void }) => s.closeSheet);
  const setShowAiModal = useEditorUiStore((s: { setShowAiModal: (v: boolean) => void }) => s.setShowAiModal);
  const { image } = useSelection();

  const items: StripItem[] = [
    { id: 'faceswap', label: 'Face Swap', title: 'Swap faces with another photo using AI', Icon: ScanFace },
    {
      id: 'background',
      label: 'Background',
      title: 'Background blur and background removal',
      Icon: Eraser,
      active: sheet === 'background',
    },
    { id: 'caption', label: 'AI Caption', title: 'AI meme captions', Icon: Captions },
    { id: 'filters', label: 'Filters', title: 'Photo filters and adjustments', Icon: SlidersHorizontal, active: sheet === 'filters' },
  ];

  const onSelect = (id: string) => {
    if (id === 'faceswap') {
      if (image) actions.handleStartMorphFace(image);
      else actions.setShowFaceMorphModal(true);
    } else if (id === 'background') {
      if (sheet === 'background') closeSheet();
      else openSheet('background');
    } else if (id === 'caption') setShowAiModal(true);
    else if (id === 'filters') {
      if (sheet === 'filters') closeSheet();
      else openSheet('filters');
    }
  };

  return <ToolStrip ariaLabel="AI and filter tools" layout="stacked" items={items} onSelect={onSelect} />;
}
