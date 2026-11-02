import { FileText, Palette, SlidersHorizontal } from 'lucide-react';
import { ToolStrip } from '../../ui';
import type { StripItem } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useCard, platformOf } from './socialCard';
import type { EditorActions } from './selection';

// The Social Card maker's own tab: Details (the form, CardFormSheet), Look (theme and badges) and
// Studio, the full social card studio for everything else.
export default function CardStrip({ actions }: { actions: EditorActions }) {
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const closeSheet = useEditorUiStore((s: { closeSheet: () => void }) => s.closeSheet);
  const card = useCard();

  const items: StripItem[] = [
    { id: 'card', label: 'Details', title: 'Names, words and time', Icon: FileText, active: sheet === 'card' },
    { id: 'cardLook', label: 'Look', title: 'Theme and badges', Icon: Palette, active: sheet === 'cardLook' },
    { id: 'studio', label: 'Studio', title: 'Every setting, in the social card studio', Icon: SlidersHorizontal },
  ];

  const onSelect = (id: string) => {
    if (id === 'studio') {
      if (card) actions.handleOpenSocialModalForActiveCard(platformOf(card));
    } else if (sheet === id) closeSheet();
    else openSheet(id);
  };

  return <ToolStrip ariaLabel="Card tools" layout="stacked" items={items} onSelect={onSelect} />;
}
