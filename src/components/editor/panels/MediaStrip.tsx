import { ImagePlus, LayoutTemplate, Sticker, Smile, ImagePlay, Link2 } from 'lucide-react';
import { ToolStrip } from '../../ui';
import type { StripItem } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import type { EditorActions } from './selection';

// The Media tab's strip: add a photo or video (file picker), an image from the templates, a meme
// sticker, a GIF from Giphy (it plays on the meme), an emoji, or a picture from a web link. A selected image or sticker is adjusted from its floating toolbar (its More /
// Size opens the Media sheet under this strip).
export default function MediaStrip({ actions }: { actions: EditorActions }) {
  const setImagePickerTarget = useEditorUiStore((s: { setImagePickerTarget: (v: unknown) => void }) => s.setImagePickerTarget);
  const setShowMemeStickersModal = useEditorUiStore((s: { setShowMemeStickersModal: (v: boolean) => void }) => s.setShowMemeStickersModal);
  const setShowEmojiModal = useEditorUiStore((s: { setShowEmojiModal: (v: boolean) => void }) => s.setShowEmojiModal);
  const setShowGifSheet = useEditorUiStore((s: { setShowGifSheet: (v: boolean) => void }) => s.setShowGifSheet);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);

  const items: StripItem[] = [
    { id: 'photo', label: 'Photo', title: 'Upload Image or Video', Icon: ImagePlus, accept: 'image/*,video/*', onFile: actions.handleFileUploadImageLayer },
    { id: 'templates', label: 'Templates', title: 'Add Image from Templates', Icon: LayoutTemplate },
    { id: 'stickers', label: 'Stickers', title: 'Add Meme Stickers', Icon: Sticker },
    { id: 'gifs', label: 'GIFs', title: 'Add a GIF or animated sticker', Icon: ImagePlay },
    { id: 'emoji', label: 'Emoji', title: 'Add Emojis', Icon: Smile },
    { id: 'link', label: 'Link', title: 'Add a picture or video from a web link', Icon: Link2 },
  ];

  const onSelect = (id: string) => {
    if (id === 'templates') setImagePickerTarget('layer');
    else if (id === 'stickers') setShowMemeStickersModal(true);
    else if (id === 'emoji') setShowEmojiModal(true);
    else if (id === 'gifs') setShowGifSheet(true);
    else if (id === 'link') openSheet('mediaLink');
  };

  return <ToolStrip ariaLabel="Media tools" layout="stacked" items={items} onSelect={onSelect} />;
}
