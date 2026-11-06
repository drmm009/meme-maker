// Slow jobs on a clip (an FFmpeg render, a frame grab, finding a picture's subject), run under the
// editor's busy label: one at a time, never during export.
import { useEditorStore } from '../../store/useVideoEditorStore';
import { cutOutBackground } from '../../utils/cutOut';
import type { ImageClip, StickerClip } from '../../model/videoProject';

interface EditorState {
  busy: string | null;
  isExporting: boolean;
  items: { id: string; url?: string }[];
  setBusy: (label: string | null) => void;
  updateItem: (id: string, patch: object) => void;
}
const store = () => useEditorStore.getState() as EditorState;
const update = (id: string, patch: object) => store().updateItem(id, patch);

export const CUTTING_OUT = 'Cutting out… the first time takes a while';
export const FINDING_SUBJECT = 'Finding the subject… the first time takes a while';

export async function runJob(label: string, job: () => Promise<void>): Promise<void> {
  const st = store();
  if (st.busy || st.isExporting) return;
  st.setBusy(label);
  try {
    await job();
    store().setBusy(null);
  } catch (e) {
    console.warn('[clip effect]', e);
    const message = (e as Error)?.message || 'That didn’t work. Try again.';
    store().setBusy(message);
    setTimeout(() => { if (store().busy === message) store().setBusy(null); }, 3500);
  }
}

// The clip's url now, if it is still there.
const urlNow = (id: string) => store().items.find((i) => i.id === id)?.url;

// Cut out toggle: removes a picture's background (keeping the original), or puts it back.
export function toggleCutOut(item: Pick<ImageClip | StickerClip, 'id' | 'url' | 'originalUrl'>): void {
  if (item.originalUrl) {
    update(item.id, { url: item.originalUrl, originalUrl: null });
    return;
  }
  runJob(CUTTING_OUT, async () => {
    const url = await cutOutBackground(item.url);
    if (urlNow(item.id) !== item.url) {
      URL.revokeObjectURL(url);
      return;
    }
    update(item.id, { url, originalUrl: item.url });
  });
}

const FULL_BLUR = 30;

// Background blur toggle, as the image editor's: the first time, the photo's subject is cut out
// (the same model as Cut out) and kept, so it is drawn sharp over the blurred photo.
export function toggleBackgroundBlur(item: Pick<ImageClip, 'id' | 'url' | 'bgBlur' | 'subjectUrl' | 'subjectOf'>): void {
  if ((item.bgBlur || 0) > 0) {
    update(item.id, { bgBlur: 0 });
    return;
  }
  if (item.subjectUrl && item.subjectOf === item.url) {
    update(item.id, { bgBlur: FULL_BLUR });
    return;
  }
  runJob(FINDING_SUBJECT, async () => {
    const subjectUrl = await cutOutBackground(item.url);
    if (urlNow(item.id) !== item.url) {
      URL.revokeObjectURL(subjectUrl);
      return;
    }
    update(item.id, { subjectUrl, subjectOf: item.url, bgBlur: FULL_BLUR });
  });
}
