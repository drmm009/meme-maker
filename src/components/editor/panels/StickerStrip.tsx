import { Scissors, Crop, Type, Sparkles } from 'lucide-react';
import { ToolStrip } from '../../ui';
import type { StripItem } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import type { EditorActions } from './selection';

interface LayerItem {
  id: string;
  originalUrl?: string | null;
}

// The Stickers maker's strip on its editing page, once the sticker is made (before that its page,
// StickerStudio, shows): Die-cut (border settings), Crop, Text and Effects (photo filters), above
// New, Editor Pro and Export (EditorPanels).
export default function StickerStrip({ actions }: { actions: EditorActions }) {
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const closeSheet = useEditorUiStore((s: { closeSheet: () => void }) => s.closeSheet);
  const setCropLayerId = useEditorUiStore((s: { setCropLayerId: (id: string | null) => void }) => s.setCropLayerId);
  const imageLayers: LayerItem[] = useMemeEditorStore((s: { imageLayers: LayerItem[] }) => s.imageLayers);
  const setActiveLayerId = useMemeEditorStore((s: { setActiveLayerId: (id: string | null) => void }) => s.setActiveLayerId);
  // The photo the tools work on: the cut-out one, or else the first.
  const photo = imageLayers.find((l) => Boolean(l.originalUrl)) || imageLayers[0];

  const items: StripItem[] = [
    { id: 'diecut', label: 'Die-cut', title: 'Die-cut border settings', Icon: Scissors, active: sheet === 'diecut' },
    { id: 'crop', label: 'Crop', title: 'Crop or turn the picture', Icon: Crop },
    { id: 'text', label: 'Text', title: 'Add text to the sticker', Icon: Type },
    { id: 'effects', label: 'Effects', title: 'Photo effects and filters', Icon: Sparkles, active: sheet === 'filters' },
  ];

  // A sheet button opens its sheet on the photo, or closes it when it is open.
  const toggle = (name: string) => {
    if (sheet === name) closeSheet();
    else {
      if (photo) setActiveLayerId(photo.id);
      openSheet(name);
    }
  };

  const onSelect = (id: string) => {
    if (id === 'diecut') toggle('diecut');
    else if (id === 'effects') toggle('filters');
    else if (id === 'crop') {
      if (photo) setCropLayerId(photo.id);
    } else if (id === 'text') actions.handleAddCaption();
  };

  return <ToolStrip ariaLabel="Sticker tools" layout="stacked" items={items} onSelect={onSelect} />;
}
