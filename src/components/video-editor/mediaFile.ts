import { useEditorStore } from '../../store/useVideoEditorStore';
import { canvasIsEmpty, fitCanvasToVideo } from './videoCanvas';

type MediaType = 'image' | 'video' | 'audio';

const addItem = (item: Record<string, unknown>) => (useEditorStore.getState() as { addItem: (i: Record<string, unknown>) => void }).addItem(item);

// One frame from ~1s in, used as the clip's filmstrip on the timeline.
export const generateThumbnail = (url: string): Promise<string | null> => new Promise((resolve) => {
  let done = false;
  const finish = (val: string | null) => { if (!done) { done = true; resolve(val); } };
  const video = document.createElement('video');
  video.src = url;
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  setTimeout(() => finish(null), 2000);
  const capture = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 90;
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      finish(canvas.toDataURL('image/jpeg', 0.5));
    } catch {
      finish(null);
    }
  };
  video.onseeked = capture;
  video.onerror = () => finish(null);
  video.onloadeddata = () => {
    if (video.duration > 1) video.currentTime = 1;
    else capture();
  };
});

// A file from the phone (or a video link) on the timeline; false if this browser can't play it.
// `fitCanvas`: a video going onto an empty canvas sets the canvas to its shape first.
export const addMediaFile = (file: File, type: MediaType, { fitCanvas = false } = {}): Promise<boolean> => {
  const url = URL.createObjectURL(file);
  if (type === 'image') {
    addItem({ type, url, name: file.name });
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const media = document.createElement(type);
    media.onloadedmetadata = async () => {
      const durationMs = Math.round(media.duration * 1000);
      const video = type === 'video' ? (media as HTMLVideoElement) : null;
      const thumbnailUrl = video ? await generateThumbnail(url) : null;
      if (video && fitCanvas && canvasIsEmpty()) fitCanvasToVideo(video.videoWidth, video.videoHeight);
      addItem({ type, url, durationMs, width: video?.videoWidth, height: video?.videoHeight, name: file.name, thumbnailUrl, mimeType: file.type || undefined });
      resolve(true);
    };
    media.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    media.src = url;
  });
};
