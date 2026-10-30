import { useEffect, useState } from 'react';
import { Download, Share2, Copy, Save } from 'lucide-react';
import { Sheet, Section, Row, Slider, SegmentedControl, TileGrid, Tile } from '../../ui';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { downloadImageHelper } from '../../../utils/downloadHelper';
import { triggerConfetti } from '../hooks/useExport';
import { fileNameFor, formatBytes, outputSize } from './exportImage';
import type { ExportFormat, ExportPrefs, ExportWidth } from './exportImage';
import type { EditorActions } from '../panels/selection';

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPG' },
  { value: 'webp', label: 'WebP' },
];
const TYPE_LABEL: Record<string, string> = { 'image/png': 'PNG', 'image/jpeg': 'JPG', 'image/webp': 'WebP' };

// Export: pick the format (PNG, JPG, WebP), quality and size, see what the file will be, then
// download, share, copy or save it to the gallery. The choices are remembered.
export default function ExportSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const prefs: ExportPrefs = useEditorUiStore((s: { exportPrefs: ExportPrefs }) => s.exportPrefs);
  const setExportPrefs = useEditorUiStore((s: { setExportPrefs: (p: ExportPrefs) => void }) => s.setExportPrefs);
  const [info, setInfo] = useState<{ bytes: number; type: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const { w, h } = actions.canvasSize();
  const size = outputSize(w, h, prefs.width);
  const set = (patch: Partial<ExportPrefs>) => setExportPrefs({ ...prefs, ...patch });

  // What the file will be like with these choices.
  useEffect(() => {
    let alive = true;
    setInfo(null);
    const timer = setTimeout(() => {
      actions.exportBlob(prefs).then((b: Blob) => alive && setInfo({ bytes: b.size, type: b.type })).catch(() => {});
    }, 150);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // Re-measure when the choices change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.format, prefs.quality, prefs.width]);

  const widths: { value: string; label: string }[] = [
    { value: 'full', label: `Full ${w}` },
    ...([720, 480] as const).filter((n) => n < w).map((n) => ({ value: String(n), label: String(n) })),
  ];

  const run = async (what: 'download' | 'share' | 'copy') => {
    setBusy(true);
    try {
      const blob: Blob = await actions.exportBlob(what === 'copy' ? { ...prefs, format: 'png' } : prefs);
      const fileName = fileNameFor(`meme-${actions.memeName().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'custom'}`, blob.type);
      if (what === 'copy') {
        if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      } else if (what === 'share') {
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
    }
  };

  const typeLabel = info ? TYPE_LABEL[info.type] || 'PNG' : TYPE_LABEL[`image/${prefs.format}`];
  const fellBack = info && info.type !== `image/${prefs.format}`;

  return (
    <Sheet title="Export" onClose={onClose}>
      <Section>
        <Row label="Format">
          <SegmentedControl ariaLabel="File format" variant="fill" value={prefs.format} options={FORMATS} onChange={(format) => set({ format })} />
        </Row>
        {prefs.format !== 'png' && (
          <Row label="Quality">
            <Slider label="Quality" min={0.5} max={1} step={0.05} value={prefs.quality} onChange={(quality) => set({ quality })} format={(v) => `${Math.round(v * 100)}%`} />
          </Row>
        )}
        <Row label="Size">
          <SegmentedControl ariaLabel="Image width" variant="fill" value={String(prefs.width)} options={widths} onChange={(v) => set({ width: (v === 'full' ? 'full' : Number(v)) as ExportWidth })} />
        </Row>
        <p className="ie-export-info" aria-live="polite">
          {typeLabel} · {size.w} × {size.h} · {info ? `≈ ${formatBytes(info.bytes)}` : 'measuring…'}
          {fellBack ? ' (this browser can\'t write WebP)' : ''}
        </p>
      </Section>
      <Section rule>
        <TileGrid columns={2}>
          <Tile label="Download" Icon={Download} title="Download the image" disabled={busy} onClick={() => run('download')} />
          <Tile label="Share" Icon={Share2} title="Share the image" disabled={busy} onClick={() => run('share')} />
          <Tile label="Copy" Icon={Copy} sub="as PNG" title="Copy the image" disabled={busy} onClick={() => run('copy')} />
          <Tile label="Save to Gallery" Icon={Save} title="Save to Gallery" disabled={busy} onClick={actions.saveToGallery} />
        </TileGrid>
      </Section>
    </Sheet>
  );
}
