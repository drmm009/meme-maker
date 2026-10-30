import { Plus, Type, MessageSquareQuote, Share2 } from 'lucide-react';
import { ToolStrip } from '../../ui';
import type { StripItem } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import type { EditorActions } from './selection';

// The Text tab's strip. Add Text adds a caption and opens the Text sheet to type in; Edit opens the
// sheet (font, colour, size, style, box, effects); Bubble adds a speech bubble and opens the bubble
// styles sheet (BubbleSheet); Social Card opens the card studio.
export default function TextStrip({ actions }: { actions: EditorActions }) {
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string, focus?: string | null) => void }) => s.openSheet);
  const closeSheet = useEditorUiStore((s: { closeSheet: () => void }) => s.closeSheet);
  const setShowStylesModal = useEditorUiStore((s: { setShowStylesModal: (v: boolean) => void }) => s.setShowStylesModal);
  const setSocialModalPlatform = useEditorUiStore((s: { setSocialModalPlatform: (v: string) => void }) => s.setSocialModalPlatform);

  const items: StripItem[] = [
    { id: 'add', label: 'Add Text', title: 'Add Text Caption', Icon: Plus },
    { id: 'edit', label: 'Edit', title: 'Edit the selected text', Icon: Type, active: sheet === 'text' },
    { id: 'bubble', label: 'Bubble', title: 'Add Chat & Speech Bubble', Icon: MessageSquareQuote, active: sheet === 'bubble' },
    { id: 'social', label: 'Social Card', title: 'Fake Tweet, Instagram or WhatsApp card', Icon: Share2 },
  ];

  const onSelect = (id: string) => {
    if (id === 'add') {
      actions.handleAddCaption();
      openSheet('text');
    } else if (id === 'edit') openSheet('text');
    // Adding a bubble opens its styles (useBubbleActions); tapping Bubble again closes them.
    else if (id === 'bubble') {
      if (sheet === 'bubble') closeSheet();
      else actions.handleAddBubble();
    } else if (id === 'social') {
      setSocialModalPlatform('tweet');
      setShowStylesModal(true);
    }
  };

  return <ToolStrip ariaLabel="Text tools" layout="stacked" items={items} onSelect={onSelect} />;
}
