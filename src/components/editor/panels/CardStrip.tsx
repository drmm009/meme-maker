import { FileText, Palette } from 'lucide-react';
import { ToolStrip } from '../../ui';
import type { StripItem } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';

// The Social Card maker's own tab: Details (the form, CardFormSheet) and Look (theme and badges).
export default function CardStrip() {
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const closeSheet = useEditorUiStore((s: { closeSheet: () => void }) => s.closeSheet);

  const items: StripItem[] = [
    { id: 'card', label: 'Details', title: 'Names, words and time', Icon: FileText, active: sheet === 'card' },
    { id: 'cardLook', label: 'Look', title: 'Theme and badges', Icon: Palette, active: sheet === 'cardLook' },
  ];

  const onSelect = (id: string) => {
    if (sheet === id) closeSheet();
    else openSheet(id);
  };

  return <ToolStrip ariaLabel="Card tools" layout="stacked" items={items} onSelect={onSelect} />;
}
