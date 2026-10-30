import { blobToDataURL } from '../../../utils/galleryStore';
import { IMAGE_LINK_MESSAGES, fetchMediaLink, linkIn } from '../../../utils/imageFromLink';
import { useEditorUiStore } from '../store/useEditorUiStore';

const isMedia = (file) => Boolean(file && /^(image|video)\//.test(file.type));

// Pictures and videos that arrive other than through the Photo button: pasted, dropped on the
// canvas, or a web link. Each goes in like an uploaded one (a video opens the trimmer), and the
// toast over the canvas says what happened.
export function useMediaInput({ handleAddImageLayer }) {
  const setPasteToast = useEditorUiStore((s) => s.setPasteToast);
  const toast = (text, error = false) => {
    setPasteToast({ text, error });
    setTimeout(() => setPasteToast(false), error ? 4500 : 2600);
  };

  const addFile = (file, note = 'Added to the meme') => {
    if (!isMedia(file)) return false;
    blobToDataURL(file)
      .then((url) => {
        handleAddImageLayer(url);
        toast(note);
      })
      .catch(() => toast('That file couldn\'t be read.', true));
    return true;
  };

  // Rejects with the ImageLinkError (after showing it), so a sheet can show it too.
  const addLink = (text) => fetchMediaLink(text).then(
    (url) => {
      handleAddImageLayer(url);
      toast('Added from the link');
    },
    (e) => {
      toast(IMAGE_LINK_MESSAGES[e?.problem] || 'That link couldn\'t be added.', true);
      throw e;
    },
  );

  // A drop on the canvas: the first picture or video file, else a dragged link.
  const handleDropMedia = (dataTransfer) => {
    const file = [...(dataTransfer?.files || [])].find(isMedia);
    if (file) return addFile(file);
    const link = linkIn(dataTransfer?.getData('text/uri-list') || dataTransfer?.getData('text/plain'));
    if (link) addLink(link).catch(() => {});
    return Boolean(link);
  };

  return { addFile, addLink, handleDropMedia };
}
