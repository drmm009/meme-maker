import { Plus } from 'lucide-react';
import { ToolStrip } from '../../ui';
import type { StripItem } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import type { EditorActions } from './selection';
import { BubbleIcon, SocialCardIcon } from './editorIcons';

// The Text tab's strip: Add Text adds a caption; Bubble opens the bubble styles
// sheet (BubbleSheet); Social Card opens the social card picker (SocialCardSheet)
// with 3 cards: Instagram, X and WhatsApp.
export default function TextStrip({ actions }: { actions: EditorActions }) {
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const closeSheet = useEditorUiStore((s: { closeSheet: () => void }) => s.closeSheet);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string, focus?: string | null, fromPill?: boolean) => void }) => s.openSheet);

  const items: StripItem[] = [
    { id: 'add', label: 'Add Text', title: 'Add Text Caption', Icon: Plus },
    { id: 'bubble', label: 'Bubble', title: 'Add Chat & Speech Bubble', Icon: BubbleIcon, active: sheet === 'bubble' },
    { id: 'social', label: 'Social Card', title: 'Fake Tweet, Instagram or WhatsApp card', Icon: SocialCardIcon, active: sheet === 'socialCard' },
  ];

  const onSelect = (id: string) => {
    if (id === 'add') {
      actions.handleAddCaption();
    }
    // Opening bubble sheet without auto-adding a bubble; bubble is added when picked
    else if (id === 'bubble') {
      if (sheet === 'bubble') closeSheet();
      else openSheet('bubble');
    } else if (id === 'social') {
      if (sheet === 'socialCard') closeSheet();
      else openSheet('socialCard');
    }
  };

  return <ToolStrip ariaLabel="Text tools" layout="stacked" items={items} onSelect={onSelect} />;
}
