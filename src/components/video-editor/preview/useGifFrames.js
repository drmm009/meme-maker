import { useEffect } from 'react';
import { useEditorStore } from '../../../store/useVideoEditorStore';
import { decodeGif, frameIndexAt, isGifUrl } from '../../../utils/gif';

// Draws the frame for this playhead into the GIF's canvas; true if the frame changed.
export const drawGifFrame = (gif, playhead, item) => {
  if (!gif) return false;
  const index = frameIndexAt(gif.durations, playhead - item.startMs);
  if (index === gif.index) return false;
  const ctx = gif.canvas.getContext('2d');
  ctx.clearRect(0, 0, gif.canvas.width, gif.canvas.height);
  ctx.drawImage(gif.frames[index], 0, 0);
  gif.index = index;
  return true;
};

// Animated GIF stickers: decode the frames once into gifRef ({ frames, durations, canvas, index }),
// then show the canvas, so they animate in step with the export as the playhead moves.
export function useGifFrames(item, itemRef, gifRef, setImage) {
  useEffect(() => {
    if (item.type === 'video' || !(item.isGif || isGifUrl(item.url))) return undefined;
    let cancelled = false;
    decodeGif(item.url)
      .then((gif) => {
        if (cancelled || !gif) return;
        const canvas = document.createElement('canvas');
        canvas.width = gif.width;
        canvas.height = gif.height;
        gifRef.current = { ...gif, canvas, index: -1 };
        drawGifFrame(gifRef.current, useEditorStore.getState().playhead, itemRef.current);
        setImage(canvas);
      })
      .catch((e) => console.warn('[gif sticker] showing the first frame only', e));
    return () => {
      cancelled = true;
      gifRef.current?.frames.forEach((frame) => frame.close());
      gifRef.current = null;
    };
  }, [item.url, item.type, item.isGif, itemRef, gifRef, setImage]);
}
