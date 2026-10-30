import { useEffect, useRef, useState } from 'react';
import { Download, Share2, Copy, Save, X } from 'lucide-react';
import { Sheet, Section, Row, Slider, SegmentedControl, Switch, TileGrid, Tile } from '../../ui';
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
// and size, see what the file will be, then download, share, copy or save it to the gallery. The
// choices are remembered.
export default function ExportSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const prefs: ExportPrefs = useEditorUiStore((s: { exportPrefs: ExportPrefs }) => s.exportPrefs);
  const setExportPrefs = useEditorUiStore((s: { setExportPrefs: (p: ExportPrefs) => void }) => s.setExportPrefs);
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
      const fileName = fileNameFor(`meme-${actions.memeName().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'custom'}`, blob.type);
      if (what === 'share') {
        const file = new File([blob], fileName, { type: blob.type });
        if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ title: actions.memeName(), text: 'Check out this meme! 😂', files: [file] });
        else await downloadImageHelper(URL.createObjectURL(blob), fileName);
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

  return (
    <Sheet title="Export" onClose={onClose}>
      <Section>
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
      <Section rule>
        <TileGrid columns={2}>
          <Tile label="Download" Icon={Download} title={motion ? `Download the ${motion.toUpperCase()}` : 'Download the image'} disabled={busy} onClick={() => run('download')} />
          <Tile label="Share" Icon={Share2} title={motion ? `Share the ${motion.toUpperCase()}` : 'Share the image'} disabled={busy} onClick={() => run('share')} />
          {!motion && <Tile label="Copy" Icon={Copy} sub="as PNG" title="Copy the image" disabled={busy} onClick={copy} />}
          {!motion && <Tile label="Save to Gallery" Icon={Save} title="Save to Gallery" disabled={busy} onClick={actions.saveToGallery} />}
          {progress !== null && <Tile label="Cancel" Icon={X} title="Stop making it" onClick={() => { cancelled.current = true; }} />}
        </TileGrid>
      </Section>
    </Sheet>
  );
}
