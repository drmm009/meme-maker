import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Captions, Trash2, X } from 'lucide-react';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { CAPTION_STYLES, captionItems, captionStyle } from '../../utils/captionChunks';
import { speechClips } from '../../utils/clipAudio';

interface Job { phase: string; progress?: number; clip: number; clips: number }
interface CaptionItem { autoCaption?: boolean; captionStyle?: string }

// A caption style's tile picture: a word drawn in that style over a dark frame.
function StylePreview({ id }: { id: string }) {
  const look = captionStyle(id, { text: 'Caption' }) as {
    fontFamily: string; color: string; stroke: string; bgColor: string; text: string;
  };
  const style: CSSProperties = {
    fontFamily: look.fontFamily,
    color: look.color,
    background: look.bgColor === 'none' ? 'transparent' : look.bgColor,
    // The outline drawn under the letters, as the export draws it.
    WebkitTextStroke: look.stroke && look.stroke !== 'transparent' ? `3px ${look.stroke}` : undefined,
    paintOrder: 'stroke fill',
  };
  return <span className="vt-capstyle-frame"><span className="vt-capstyle-word" style={style}>{look.text}</span></span>;
}

// Auto captions: how many there are, the style as tiles each showing it, a big button to make them
// (or make them again) with Remove beside it, and while it works what it's doing with Cancel.
export default function CaptionsPanel() {
  const captionCount = useEditorStore((s) => s.items.filter((i: CaptionItem) => i.autoCaption).length) as number;
  const currentStyle = useEditorStore((s) => s.items.find((i: CaptionItem) => i.autoCaption)?.captionStyle) as string | undefined;
  const hasSpeech = useEditorStore((s) => speechClips(s.items).length > 0) as boolean;
  const [styleId, setStyleId] = useState(currentStyle || 'classic');
  const [job, setJob] = useState<Job | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const runRef = useRef(0);

  const pickStyle = (id: string) => {
    setStyleId(id);
    if (captionCount) useEditorStore.getState().restyleAutoCaptions((item: object) => captionStyle(id, item));
  };

  const generate = async () => {
    const run = ++runRef.current;
    setMessage(null);
    setJob({ phase: 'listen', clip: 0, clips: 1 });
    try {
      const { generateCaptions } = await import('../../utils/autoCaptions');
      const st = useEditorStore.getState();
      // autoCaptions.js reports its progress as a Job (its default argument types it as taking none).
      const listen = generateCaptions as unknown as (items: unknown, onProgress: (p: Job) => void) => ReturnType<typeof generateCaptions>;
      const { captions } = await listen(st.items, (p) => { if (runRef.current === run) setJob(p); });
      if (runRef.current !== run) return;
      if (!captions.length) { setMessage('No speech heard. Captions work with English speech.'); return; }
      useEditorStore.getState().setAutoCaptions(captionItems(captions, styleId, useEditorStore.getState().canvasDimensions));
      setMessage(`${captions.length} captions added. Tap one to edit it.`);
    } catch (e) {
      if (runRef.current === run && (e as Error)?.name !== 'TranscribeCancelledError') {
        setMessage(navigator.onLine === false ? 'You’re offline. The speech model downloads on first use.' : 'Couldn’t make captions for this video.');
        if (import.meta.env?.DEV) console.warn('[captions]', e);
      }
    } finally {
      if (runRef.current === run) setJob(null);
    }
  };

  const cancel = async () => {
    runRef.current++;
    setJob(null);
    const { cancelTranscription } = await import('../../utils/transcriber');
    cancelTranscription();
  };
  // Closing the panel stops a job in progress.
  useEffect(() => () => {
    runRef.current++;
    import('../../utils/transcriber').then((m) => m.cancelTranscription());
  }, []);

  const status = !job ? null
    : job.phase === 'download'
      ? { text: `Downloading speech model… ${Math.round((job.progress || 0) * 100)}%`, value: job.progress || 0 }
      : { text: job.clips > 1 ? `Listening to clip ${job.clip + 1} of ${job.clips}…` : 'Listening…', value: null };

  return (
    <div className="vt-stack">
      <div className="vt-readout">
        <strong>{captionCount || 'None'}</strong>
        <span>{captionCount ? (captionCount === 1 ? 'caption on the video' : 'captions on the video') : 'Words from the speech, on screen'}</span>
      </div>
      <div className="vt-options vt-capstyles" role="radiogroup" aria-label="Caption style" style={{ gridTemplateColumns: `repeat(${CAPTION_STYLES.length}, 1fr)` }}>
        {CAPTION_STYLES.map((s: { id: string; label: string }) => (
          <button key={s.id} type="button" role="radio" aria-checked={styleId === s.id} className={`vt-option${styleId === s.id ? ' is-on' : ''}`}
            onClick={() => pickStyle(s.id)} disabled={Boolean(job)}>
            <span className="vt-option-art" aria-hidden="true"><StylePreview id={s.id} /></span>
            <span className="vt-option-label">{s.label}</span>
          </button>
        ))}
      </div>
      {status ? (
        <div className="vt-capjob" role="status">
          <div className="vt-capjob-text">
            <span>{status.text}</span>
            <button type="button" className="vt-pill" onClick={cancel}><X size={14} aria-hidden="true" /> Cancel</button>
          </div>
          <div className={`vt-captions-bar${status.value === null ? ' is-busy' : ''}`}>
            <span style={status.value === null ? undefined : { width: `${Math.round(status.value * 100)}%` }} />
          </div>
        </div>
      ) : (
        <div className="vt-capactions">
          <button type="button" className="vt-big-btn" onClick={generate} disabled={!hasSpeech}>
            <Captions size={20} aria-hidden="true" />
            <span>{captionCount ? 'Make them again' : 'Generate captions'}</span>
          </button>
          {captionCount > 0 && (
            <button type="button" className="vt-big-btn vt-capremove" aria-label="Remove captions" title="Remove captions"
              onClick={() => { useEditorStore.getState().removeAutoCaptions(); setMessage(null); }}>
              <Trash2 size={20} aria-hidden="true" />
              <span>Remove</span>
            </button>
          )}
        </div>
      )}
      <p className="vt-panel-hint">
        {message || (hasSpeech
          ? 'English speech, turned into words on your device. The first time downloads a 40 MB model.'
          : 'Add a video with speech or record a voiceover first.')}
      </p>
    </div>
  );
}
