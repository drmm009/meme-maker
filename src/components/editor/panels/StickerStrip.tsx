import { ImagePlus, LayoutTemplate, Scissors, Crop, Type, Sparkles, Plus } from 'lucide-react';
import { ToolStrip } from '../../ui';
import type { StripItem } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { makeStickerTemplate } from '../stickerMaker';
import type { EditorActions } from './selection';

interface LayerItem {
  id: string;
  originalUrl?: string | null;
}

// The Stickers maker's strip, above its dock (Generate Sticker, then Export and Full editor, in
// EditorPanels). It offers only what can act on the sticker so far:
// - no photo yet: Upload, Gallery (the Templates sheet) and Text;
// - a photo: Crop and Effects (photo filters) too;
// - cut out: Die-cut (border settings), Crop, Text, Effects, and New, which starts a blank sticker.
export default function StickerStrip({ actions }: { actions: EditorActions }) {
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const closeSheet = useEditorUiStore((s: { closeSheet: () => void }) => s.closeSheet);
  const setCropLayerId = useEditorUiStore((s: { setCropLayerId: (id: string | null) => void }) => s.setCropLayerId);
  const imageLayers: LayerItem[] = useMemeEditorStore((s: { imageLayers: LayerItem[] }) => s.imageLayers);
  const setActiveLayerId = useMemeEditorStore((s: { setActiveLayerId: (id: string | null) => void }) => s.setActiveLayerId);
  const generated = imageLayers.length > 0 && imageLayers.every((l) => Boolean(l.originalUrl));
  // The photo the tools work on: the cut-out one, or else the first.
  const photo = imageLayers.find((l) => Boolean(l.originalUrl)) || imageLayers[0];

  const crop: StripItem = { id: 'crop', label: 'Crop', title: 'Crop or turn the picture', Icon: Crop };
  const text: StripItem = { id: 'text', label: 'Text', title: 'Add text to the sticker', Icon: Type };
  const effects: StripItem = { id: 'effects', label: 'Effects', title: 'Photo effects and filters', Icon: Sparkles, active: sheet === 'filters' };
  const add: StripItem[] = [
    { id: 'upload', label: 'Upload', title: 'Upload a picture', Icon: ImagePlus, accept: 'image/*', onFile: actions.handleFileUploadImageLayer },
    { id: 'templates', label: 'Gallery', title: 'Pick a picture from the templates', Icon: LayoutTemplate, active: sheet === 'templates' },
  ];
  const items: StripItem[] = generated
    ? [
      { id: 'diecut', label: 'Die-cut', title: 'Die-cut border settings', Icon: Scissors, active: sheet === 'diecut' },
      crop, text, effects,
      { id: 'new', label: 'New', title: 'Start a new sticker', Icon: Plus },
    ]
    : photo ? [...add, crop, text, effects] : [...add, text];

  // A sheet button opens its sheet on the photo, or closes it when it is open.
  const toggle = (name: string) => {
    if (sheet === name) closeSheet();
    else {
      if (photo && name !== 'templates') setActiveLayerId(photo.id);
      openSheet(name);
    }
  };

  const onSelect = (id: string) => {
    if (id === 'templates') toggle('templates');
    else if (id === 'diecut') toggle('diecut');
    else if (id === 'effects') toggle('filters');
    else if (id === 'crop') {
      if (photo) setCropLayerId(photo.id);
    } else if (id === 'text') actions.handleAddCaption();
    else if (id === 'new') actions.handleChangeMeme(makeStickerTemplate());
  };

  return <ToolStrip ariaLabel="Sticker tools" layout="stacked" items={items} onSelect={onSelect} />;
}
