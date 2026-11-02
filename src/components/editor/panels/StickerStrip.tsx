import { ImagePlus, LayoutTemplate, Scissors, Plus } from 'lucide-react';
import { ToolStrip } from '../../ui';
import type { StripItem } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { makeStickerTemplate } from '../stickerMaker';
import type { EditorActions } from './selection';

// The Stickers maker's strip, above its one dock button, Generate Sticker (EditorPanels), which
// cuts the picture out (hooks/useStickerMaker.ts). Before that: Upload image (file picker) and
// Gallery (the Templates sheet) add the picture. Once every picture is cut out: Die-cut turns its
// white outline on or off, and Generate more starts a new, blank sticker.
export default function StickerStrip({ actions }: { actions: EditorActions }) {
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const closeSheet = useEditorUiStore((s: { closeSheet: () => void }) => s.closeSheet);
  const dieCut: boolean = useEditorUiStore((s: { stickerDieCut: boolean }) => s.stickerDieCut);
  const generated: boolean = useMemeEditorStore((s: { imageLayers: { originalUrl?: string | null }[] }) =>
    s.imageLayers.length > 0 && s.imageLayers.every((l) => Boolean(l.originalUrl)));

  const items: StripItem[] = generated
    ? [
      { id: 'diecut', label: 'Die-cut', title: 'White die-cut outline', Icon: Scissors, active: dieCut },
      { id: 'more', label: 'Generate more', title: 'Start a new sticker', Icon: Plus },
    ]
    : [
      { id: 'upload', label: 'Upload image', title: 'Upload a picture', Icon: ImagePlus, accept: 'image/*', onFile: actions.handleFileUploadImageLayer },
      { id: 'templates', label: 'Gallery', title: 'Pick a picture from the templates', Icon: LayoutTemplate, active: sheet === 'templates' },
    ];

  const onSelect = (id: string) => {
    if (id === 'templates') {
      if (sheet === 'templates') closeSheet();
      else openSheet('templates');
    } else if (id === 'diecut') actions.handleStickerDieCut(!dieCut);
    else if (id === 'more') actions.handleChangeMeme(makeStickerTemplate());
  };

  return <ToolStrip ariaLabel="Sticker tools" layout="stacked" items={items} onSelect={onSelect} />;
}
