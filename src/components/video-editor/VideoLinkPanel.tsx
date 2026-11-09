import { useEffect, useRef, useState } from 'react';
import { ClipboardPaste, Link2, X } from 'lucide-react';
import { addMediaFile } from './mediaFile';
import { LINK_SERVER_COMMAND, LinkError, loadVideoLink, parseVideoLink, takeOfferedLink } from '../../utils/videoLink';
import type { LinkErrorCode } from '../../utils/videoLink';

type Status =
  | { state: 'idle' }
  | { state: 'loading'; loaded: number; total: number | null }
  | { state: 'error'; code: LinkErrorCode; message: string };

const mb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
const canReadClipboard = () => typeof navigator !== 'undefined' && Boolean(navigator.clipboard?.readText);

// Add video > Link: paste a link to a video (a TikTok, Reel, Short, X post, or a video file) and it
// loads onto the timeline (utils/videoLink; social posts through the local helper). Pasting starts
// it straight away.
export default function VideoLinkPanel({ onClose }: { onClose?: () => void }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<Status>({ state: 'idle' });
  const job = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const link = parseVideoLink(text);
  const loading = status.state === 'loading';

  const start = async (value: string) => {
    const target = parseVideoLink(value);
    if (!target) return;
    setText(target.url);
    job.current?.abort();
    const ctrl = new AbortController();
    job.current = ctrl;
    setStatus({ state: 'loading', loaded: 0, total: null });
    try {
      const file = await loadVideoLink(target, {
        signal: ctrl.signal,
        onProgress: (loaded, total) => { if (!ctrl.signal.aborted) setStatus({ state: 'loading', loaded, total }); },
      });
      if (ctrl.signal.aborted) return;
      if (!(await addMediaFile(file, 'video'))) throw new LinkError('unplayable');
      if (ctrl.signal.aborted) return;
      setStatus({ state: 'idle' });
      onClose?.();
    } catch (e) {
      if (ctrl.signal.aborted) return;
      const err = e instanceof LinkError ? e : new LinkError('failed');
      setStatus({ state: 'error', code: err.code, message: err.message });
    } finally {
      if (job.current === ctrl) job.current = null;
    }
  };

  const cancel = () => {
    job.current?.abort();
    job.current = null;
    setStatus({ state: 'idle' });
  };

  // Opened by a paste onto the editor: start on that link. Leaving stops any download.
  useEffect(() => {
    const offered = takeOfferedLink();
    const offeredLink = offered ? parseVideoLink(offered) : null;
    if (offeredLink) {
      setText(offeredLink.url);
      start(offeredLink.url);
    } else {
      input.current?.focus({ preventScroll: true });
    }
    return () => job.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      const clipLink = parseVideoLink(clip);
      setText(clipLink ? clipLink.url : clip);
      if (clipLink) start(clipLink.url);
      else setStatus({ state: 'error', code: 'unsupported', message: 'There\'s no link on your clipboard.' });
    } catch {
      input.current?.focus();
    }
  };

  const percent = status.state === 'loading' && status.total ? Math.min(100, Math.round((status.loaded / status.total) * 100)) : null;
  const from = link?.site ?? (link?.kind === 'file' ? 'the link' : 'the site');

  return (
    <div className="vt-link">
      <label className={`vt-link-field${link ? ' has-link' : ''}`}>
        <Link2 size={18} strokeWidth={2} aria-hidden="true" className="vt-link-icon" />
        <input
          ref={input}
          type="url"
          inputMode="url"
          enterKeyHint="go"
          autoComplete="off"
          spellCheck={false}
          aria-label="Video link"
          placeholder="Paste a TikTok, Reel, Short or X link"
          value={text}
          disabled={loading}
          onChange={(e) => { setText(e.target.value); if (status.state === 'error') setStatus({ state: 'idle' }); }}
          onPaste={(e) => {
            // Shared text ("look at this! https://…") becomes just its link.
            const pasted = parseVideoLink(e.clipboardData.getData('text'));
            if (!pasted) return;
            e.preventDefault();
            setText(pasted.url);
            start(pasted.url);
          }}
          onKeyDown={(e) => { if (e.key === 'Enter' && link && !loading) start(text); }}
        />
        {text && !loading ? (
          <button type="button" className="vt-link-clear" aria-label="Clear link" onClick={() => { setText(''); setStatus({ state: 'idle' }); input.current?.focus(); }}>
            <X size={16} strokeWidth={2.4} aria-hidden="true" />
          </button>
        ) : !text && canReadClipboard() ? (
          <button type="button" className="vt-link-paste" onClick={paste}>
            <ClipboardPaste size={15} strokeWidth={2.2} aria-hidden="true" />
            Paste
          </button>
        ) : null}
      </label>

      {status.state === 'loading' ? (
        <div className="vt-link-progress" role="status" aria-live="polite">
          <div className={`vt-link-bar${percent === null ? ' is-busy' : ''}`}>
            <span style={percent === null ? undefined : { width: `${percent}%` }} />
          </div>
          <span className="vt-link-note">
            {status.loaded > 0
              ? `Downloading… ${mb(status.loaded)}${status.total ? ` of ${mb(status.total)}` : ''}`
              : `Getting the video from ${from}…`}
          </span>
        </div>
      ) : status.state === 'error' ? (
        <div className="vt-link-error" role="alert">
          <p>{status.message}</p>
          {status.code === 'server-off' && (
            <p className="vt-link-help">Run <code>{LINK_SERVER_COMMAND}</code> in the app folder on your computer, then try again.</p>
          )}
        </div>
      ) : (
        <p className="vt-panel-hint vt-link-hint">
          {link
            ? link.site ? `${link.site} link` : link.kind === 'file' ? 'Video file link' : 'Web link'
            : 'Public posts from TikTok, Instagram, YouTube, X, Reddit and more.'}
        </p>
      )}

      <div className="vt-link-actions">
        {loading ? (
          <button type="button" className="vt-link-btn" onClick={cancel}>Cancel</button>
        ) : (
          <button type="button" className="vt-link-btn is-primary" disabled={!link} onClick={() => start(text)}>
            {status.state === 'error' ? 'Try again' : 'Get video'}
          </button>
        )}
      </div>
      <p className="vt-link-fine">Only use videos you have the right to use.</p>
    </div>
  );
}
