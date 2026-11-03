import { Type, Sparkles } from 'lucide-react';
import { ToolStrip } from '../../ui';
import type { StripItem } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import type { EditorActions } from './selection';

// The Face Swap maker's strip, above its dock (Swap face, then Export and Swap again, in
// EditorPanels; the swap itself is on its page, FaceSwapStudio): Text adds a caption, Effects opens
// the photo filters.
export default function FaceSwapStrip({ actions }: { actions: EditorActions }) {
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const closeSheet = useEditorUiStore((s: { closeSheet: () => void }) => s.closeSheet);

  const items: StripItem[] = [
    { id: 'text', label: 'Text', title: 'Add a caption', Icon: Type },
    { id: 'effects', label: 'Effects', title: 'Photo effects and filters', Icon: Sparkles, active: sheet === 'filters' },
  ];

  const onSelect = (id: string) => {
    if (id === 'text') actions.handleAddCaption();
    else if (sheet === 'filters') closeSheet();
    else openSheet('filters');
  };

  return <ToolStrip ariaLabel="Face swap tools" layout="stacked" items={items} onSelect={onSelect} />;
}
