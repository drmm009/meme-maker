import { ScanFace, LayoutTemplate } from 'lucide-react';
import { ToolStrip } from '../../ui';
import type { StripItem } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useSelection } from './selection';
import type { EditorActions } from './selection';

// The Face Swap maker's own tab: Your face opens the face picker (onto the selected photo, or else
// the meme), Meme picks another meme to swap into (starting it afresh).
export default function FaceSwapStrip({ actions }: { actions: EditorActions }) {
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const closeSheet = useEditorUiStore((s: { closeSheet: () => void }) => s.closeSheet);
  const { image } = useSelection();

  const items: StripItem[] = [
    { id: 'face', label: 'Your face', title: 'Pick the face to swap in', Icon: ScanFace },
    { id: 'memes', label: 'Meme', title: 'Pick another meme', Icon: LayoutTemplate, active: sheet === 'memes' },
  ];

  const onSelect = (id: string) => {
    if (id === 'face') {
      if (image) actions.handleStartMorphFace(image);
      else actions.setShowFaceMorphModal(true);
    } else if (sheet === 'memes') closeSheet();
    else openSheet('memes');
  };

  return <ToolStrip ariaLabel="Face swap tools" layout="stacked" items={items} onSelect={onSelect} />;
}
