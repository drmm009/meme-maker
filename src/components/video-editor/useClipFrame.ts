import { useEffect, useState } from 'react';
import { useEditorStore, sourceTimeMs } from '../../store/useVideoEditorStore';
import { captureFrame } from '../../utils/clipEffects';

type FramedClip = { type: string; url?: string; startMs: number; endMs: number };

// A still of a clip for a sheet to show: the photo or sticker itself, or the video's frame at the
// playhead (grabbed once per clip; moving the playhead later doesn't re-grab it). '' until ready.
export default function useClipFrame(item: FramedClip): string {
  const [src, setSrc] = useState('');
  const isVideo = item.type === 'video';
  const atMs = isVideo ? sourceTimeMs(item, Math.min(Math.max(useEditorStore.getState().playhead, item.startMs), item.endMs)) : 0;
  useEffect(() => {
    if (!item.url) return undefined;
    if (!isVideo) {
      setSrc(item.url);
      return undefined;
    }
    let alive = true;
    let frame = '';
    captureFrame(item.url, atMs).then((url: string) => {
      frame = url;
      if (alive) setSrc(url);
      else URL.revokeObjectURL(url);
    }).catch(() => {});
    return () => {
      alive = false;
      if (frame) URL.revokeObjectURL(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.url, isVideo]);
  return src;
}
