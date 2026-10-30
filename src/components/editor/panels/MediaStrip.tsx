import { ImagePlus, LayoutTemplate, Sticker, Smile, ImagePlay, Link2 } from 'lucide-react';
import { ToolStrip } from '../../ui';
import type { StripItem } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import type { EditorActions } from './selection';

// The Media tab's strip: add a photo or video (file picker), an image from the templates, a meme
// sticker, a GIF from Giphy (it plays on the meme), an emoji, or a picture from a web link. All but
// Photo open a picker sheet under the strip, like the Draw tools. A selected image or sticker is
// adjusted from its floating toolbar (its More / Size opens the Media sheet under this strip).
export default function MediaStrip({ actions }: { actions: EditorActions }) {
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const closeSheet = useEditorUiStore((s: { closeSheet: () => void }) => s.closeSheet);

  const items: StripItem[] = [
    { id: 'photo', label: 'Photo', title: 'Upload Image or Video', Icon: ImagePlus, accept: 'image/*,video/*', onFile: actions.handleFileUploadImageLayer },
    { id: 'templates', label: 'Templates', title: 'Add Image from Templates', Icon: LayoutTemplate },
    { id: 'stickers', label: 'Stickers', title: 'Add Meme Stickers', Icon: Sticker },
    { id: 'gifs', label: 'GIFs', title: 'Add a GIF or animated sticker', Icon: ImagePlay },
    { id: 'emoji', label: 'Emoji', title: 'Add Emojis', Icon: Smile },
    { id: 'link', label: 'Link', title: 'Add a picture or video from a web link', Icon: Link2 },
  ];

  // Each tool's sheet; tapping the open one again closes it.
  const sheetFor = (id: string) => (id === 'link' ? 'mediaLink' : id);
  const onSelect = (id: string) => {
    if (sheet === sheetFor(id)) closeSheet();
    else openSheet(sheetFor(id));
  };
  const active = items.find((i) => sheetFor(i.id) === sheet)?.id ?? null;

  return <ToolStrip ariaLabel="Media tools" layout="stacked" items={items} active={active} onSelect={onSelect} />;
}
