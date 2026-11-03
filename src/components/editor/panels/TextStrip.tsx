import { Plus, MessageSquareQuote, Share2 } from 'lucide-react';
import { ToolStrip } from '../../ui';
import type { StripItem } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useCard } from './socialCard';
import type { EditorActions } from './selection';

// The Text tab's strip: Add Text adds a caption; Bubble adds a speech
// bubble and opens the bubble styles sheet (BubbleSheet); Social Card selects the meme's card (adding
// a post if there is none) and opens its Details under the layer pill, which also has its Look.
export default function TextStrip({ actions }: { actions: EditorActions }) {
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const closeSheet = useEditorUiStore((s: { closeSheet: () => void }) => s.closeSheet);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string, focus?: string | null, fromPill?: boolean) => void }) => s.openSheet);
  const setActiveLayerId = useMemeEditorStore((s: { setActiveLayerId: (id: string) => void }) => s.setActiveLayerId);
  const card = useCard();

  const items: StripItem[] = [
    { id: 'add', label: 'Add Text', title: 'Add Text Caption', Icon: Plus },
    { id: 'bubble', label: 'Bubble', title: 'Add Chat & Speech Bubble', Icon: MessageSquareQuote, active: sheet === 'bubble' },
    { id: 'social', label: 'Social Card', title: 'Fake Tweet, Instagram or WhatsApp card', Icon: Share2 },
  ];

  const onSelect = (id: string) => {
    if (id === 'add') {
      actions.handleAddCaption();
    }
    // Adding a bubble opens its styles (useBubbleActions); tapping Bubble again closes them.
    else if (id === 'bubble') {
      if (sheet === 'bubble') closeSheet();
      else actions.handleAddBubble();
    } else if (id === 'social') {
      if (card) setActiveLayerId(card.id);
      else actions.handleAddTweetCard();
      openSheet('card', null, true);
    }
  };

  return <ToolStrip ariaLabel="Text tools" layout="stacked" items={items} onSelect={onSelect} />;
}
