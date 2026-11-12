import { useEffect, useRef, useState } from 'react';
import { Download, Share2, Copy, Save, X, PenLine } from 'lucide-react';
import { Sheet, Section, Row, Slider, SegmentedControl, Switch } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { downloadImageHelper } from '../../../utils/downloadHelper';
import { triggerConfetti } from '../hooks/useExport';
import { fileNameFor, formatBytes, outputSize } from './exportImage';
import { isMotionFormat, motionDuration, motionSize } from './motionExport';
import type { ExportFormat, ExportPrefs, ExportWidth } from './exportImage';
import type { EditorActions } from '../panels/selection';

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPG' },
  { value: 'webp', label: 'WebP' },
];
const MOTION_FORMATS: { value: ExportPrefs['format']; label: string }[] = [
  { value: 'gif', label: 'GIF' },
  { value: 'mp4', label: 'MP4' },
];
const TYPE_LABEL: Record<string, string> = { 'image/png': 'PNG', 'image/jpeg': 'JPG', 'image/webp': 'WebP' };

// Export: pick the format (PNG, JPG, WebP; GIF or MP4 when a GIF or video layer moves), quality
// and size, name the file, see what the file will be, then download, share, copy or save it to the gallery.
export default function ExportSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const prefs: ExportPrefs = useEditorUiStore((s: { exportPrefs: ExportPrefs }) => s.exportPrefs);
  const setExportPrefs = useEditorUiStore((s: { setExportPrefs: (p: ExportPrefs) => void }) => s.setExportPrefs);
  const [name, setName] = useState<string>(() => actions.memeName?.() || '');
  const [info, setInfo] = useState<{ bytes: number; type: string } | null>(null);
  const [busy, setBusy] = useState(false);
  // 0..1 while a GIF or MP4 renders.
  const [progress, setProgress] = useState<number | null>(null);
  const cancelled = useRef(false);
  const { w, h } = actions.canvasSize();
  const loops: number[] | null = actions.motionLoops?.() || null;
  const moving = Boolean(loops?.length);
  // A remembered GIF/MP4 choice means PNG on a meme that doesn't move.
  const format = isMotionFormat(prefs.format) && !moving ? 'png' : prefs.format;
  const motion = isMotionFormat(format) ? format : null;
  const size = motion ? motionSize(w, h, motion, prefs.width) : outputSize(w, h, prefs.width);
  const set = (patch: Partial<ExportPrefs>) => setExportPrefs({ ...prefs, ...patch });
  const sticker = useEditorUiStore((s: { mode: string }) => s.mode) === 'sticker';
  const ext = motion || (format === 'jpeg' ? 'jpg' : format);

  // What the file will be like with these choices (GIFs and MP4s only once they are made).
  useEffect(() => {
    let alive = true;
    setInfo(null);
    if (motion) return undefined;
    const timer = setTimeout(() => {
      actions.exportBlob({ ...prefs, format }).then((b: Blob) => alive && setInfo({ bytes: b.size, type: b.type })).catch(() => {});
    }, 150);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // Re-measure when the choices change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, prefs.quality, prefs.width, prefs.transparent]);

  const widths: { value: string; label: string }[] = [
    { value: 'full', label: `Full ${w}` },
    ...([720, 480] as const).filter((n) => n < w).map((n) => ({ value: String(n), label: String(n) })),
  ];

  // Copy: Safari only lets a tap write to the clipboard if the write starts during the tap, so the
  // clipboard gets the picture as a promise straight away, before it is made.
  const copy = async () => {
    setBusy(true);
    try {
      if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) throw new Error('No clipboard');
      const png: Promise<Blob> = actions.exportBlob({ ...prefs, format: 'png' });
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
      triggerConfetti();
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') console.warn('[export] copy', e);
    } finally {
      setBusy(false);
    }
  };

  const run = async (what: 'download' | 'share') => {
    setBusy(true);
    cancelled.current = false;
    try {
      let blob: Blob;
      if (motion) {
        setProgress(0);
        blob = await actions.exportMotion({ ...prefs, format: motion }, setProgress, () => cancelled.current);
      } else {
        blob = await actions.exportBlob({ ...prefs, format });
      }
      const rawName = name.trim() || `${sticker ? 'sticker' : 'meme'}-${actions.memeName() || 'custom'}`;
      const slug = rawName.toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-|-$/g, '') || 'meme';
      const fileName = fileNameFor(slug, blob.type);
      if (what === 'share') {
        const file = new File([blob], fileName, { type: blob.type });
        const shareTitle = name.trim() || actions.memeName() || 'Check out this meme!';
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: shareTitle, text: 'Check out this meme! 😂', files: [file] });
        } else {
          await downloadImageHelper(URL.createObjectURL(blob), fileName);
        }
      } else {
        await downloadImageHelper(URL.createObjectURL(blob), fileName);
      }
      triggerConfetti();
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') console.warn('[export]', e);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const typeLabel = info ? TYPE_LABEL[info.type] || 'PNG' : TYPE_LABEL[`image/${format}`];
  const fellBack = info && info.type !== `image/${format}`;
  const seconds = motion && loops ? (motionDuration(loops, motion) / 1000).toFixed(1).replace(/\.0$/, '') : '';

  // A sticker: just its file, see-through PNG or WebP at WhatsApp's 512px or full size, and the
  // ways to save it, Download first.
  if (sticker) {
    return (
      <Sheet Icon={Download} title="Export" onClose={onClose} className="ie-sticker-export">
        <div className="ie-export-name-wrap">
          <label className="ie-export-name-label">
            <PenLine size={15} className="ie-export-name-icon" aria-hidden="true" />
            <input
              type="text"
              className="ie-export-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sticker name"
              aria-label="Sticker name"
              maxLength={60}
            />
            {name ? (
              <button
                type="button"
                className="ie-export-name-clear"
                onClick={() => setName('')}
                aria-label="Clear file name"
                title="Clear"
              >
                <X size={14} />
              </button>
            ) : null}
            <span className="ie-export-name-ext">.{ext}</span>
          </label>
        </div>
        <div className="ie-sticker-export-opts">
          <SegmentedControl ariaLabel="File format" variant="fill" value={format} options={FORMATS.filter((f) => f.value !== 'jpeg')} onChange={(f) => set({ format: f })} />
          <SegmentedControl ariaLabel="Image width" variant="fill" value={prefs.width === 512 ? '512' : 'full'} options={[{ value: '512', label: '512 px' }, { value: 'full', label: `${w} px` }]} onChange={(v) => set({ width: v === 'full' ? 'full' : 512 })} />
        </div>
        <p className="ie-sticker-export-info" aria-live="polite">
          {`${typeLabel} · ${size.w} × ${size.h} · ${info ? `≈ ${formatBytes(info.bytes)}` : 'measuring…'}`}
        </p>
        <div className="ie-sticker-export-actions">
          <button type="button" className="ie-sticker-export-download" disabled={busy} onClick={() => run('download')} aria-label="Download">
            <Download size={18} strokeWidth={2.2} aria-hidden="true" />
            Download
          </button>
          <button type="button" className="ui-icon-btn ie-sticker-export-icon" disabled={busy} onClick={() => run('share')} title="Share" aria-label="Share">
            <Share2 size={19} />
          </button>
          <button type="button" className="ui-icon-btn ie-sticker-export-icon" disabled={busy} onClick={copy} title="Copy as PNG" aria-label="Copy">
            <Copy size={19} />
          </button>
          <button type="button" className="ui-icon-btn ie-sticker-export-icon" disabled={busy} onClick={() => actions.saveToGallery?.(name)} title="Save to Gallery" aria-label="Save to Gallery">
            <Save size={19} />
          </button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet Icon={Download} title="Export" onClose={onClose} className="ie-export-sheet">
      <Section>
        <div className="ie-export-name-wrap">
          <label className="ie-export-name-label">
            <PenLine size={15} className="ie-export-name-icon" aria-hidden="true" />
            <input
              type="text"
              className="ie-export-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Meme name"
              aria-label="Meme name"
              maxLength={60}
            />
            {name ? (
              <button
                type="button"
                className="ie-export-name-clear"
                onClick={() => setName('')}
                aria-label="Clear file name"
                title="Clear"
              >
                <X size={14} />
              </button>
            ) : null}
            <span className="ie-export-name-ext">.{ext}</span>
          </label>
        </div>
        <Row label="Format">
          <SegmentedControl ariaLabel="File format" variant="fill" value={format} options={moving ? [...FORMATS, ...MOTION_FORMATS] : FORMATS} onChange={(f) => set({ format: f })} />
        </Row>
        {moving && !motion && <p className="ie-empty">Your meme moves: GIF and MP4 keep it moving.</p>}
        {!motion && format !== 'png' && (
          <Row label="Quality">
            <Slider label="Quality" min={0.5} max={1} step={0.05} value={prefs.quality} onChange={(quality) => set({ quality })} format={(v) => `${Math.round(v * 100)}%`} />
          </Row>
        )}
        {!motion && format !== 'jpeg' && (
          <Row label="See-through" end>
            <Switch label="Transparent background" checked={Boolean(prefs.transparent)} onChange={(transparent) => set({ transparent })} />
          </Row>
        )}
        {motion !== 'gif' && (
          <Row label="Size">
            <SegmentedControl ariaLabel="Image width" variant="fill" value={String(prefs.width)} options={widths} onChange={(v) => set({ width: (v === 'full' ? 'full' : Number(v)) as ExportWidth })} />
          </Row>
        )}
        <p className="ie-export-info" aria-live="polite">
          {motion
            ? `${motion.toUpperCase()} · ${size.w} × ${size.h} · ${seconds} s${motion === 'mp4' ? ' · no sound' : ''}${progress !== null ? ` · making it… ${Math.round(progress * 100)}%` : ''}`
            : `${typeLabel} · ${size.w} × ${size.h} · ${info ? `≈ ${formatBytes(info.bytes)}` : 'measuring…'}`}
          {!motion && fellBack ? ' (this browser can\'t write WebP)' : ''}
        </p>
      </Section>
      <div className="ie-export-actions">
        <button
          type="button"
          className="ie-export-btn-primary"
          disabled={busy}
          onClick={() => run('download')}
          aria-label="Download"
        >
          <Download size={18} strokeWidth={2.2} aria-hidden="true" />
          <span>Download</span>
        </button>
        <div className="ie-export-actions-row">
          <button
            type="button"
            className="ie-export-action-btn"
            disabled={busy}
            onClick={() => run('share')}
            aria-label="Share"
          >
            <Share2 size={16} strokeWidth={2} aria-hidden="true" />
            <span>Share</span>
          </button>
          {!motion && (
            <button
              type="button"
              className="ie-export-action-btn"
              disabled={busy}
              onClick={copy}
              aria-label="Copy"
            >
              <Copy size={16} strokeWidth={2} aria-hidden="true" />
              <span>Copy</span>
            </button>
          )}
          {!motion && (
            <button
              type="button"
              className="ie-export-action-btn"
              disabled={busy}
              onClick={() => actions.saveToGallery?.(name)}
              aria-label="Save to Gallery"
            >
              <Save size={16} strokeWidth={2} aria-hidden="true" />
              <span>Save to Gallery</span>
            </button>
          )}
          {progress !== null && (
            <button
              type="button"
              className="ie-export-action-btn ie-export-action-btn--cancel"
              onClick={() => { cancelled.current = true; }}
              aria-label="Cancel"
            >
              <X size={16} strokeWidth={2} aria-hidden="true" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
