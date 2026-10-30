import { ArrowUp, ArrowDown, Eye, EyeOff, Lock, LockOpen } from 'lucide-react';
import { Sheet } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { layerRows } from './layerRows';
import type { EditorActions } from './selection';
import type { MemeCaption, MemeImageLayer, MemeSticker } from '../../../model/memeDocument';

// The Layers sheet: every layer, topmost first. Tap one to select it; move it up or down the stack;
// hide it (it isn't drawn, exported or tappable) or lock it (it can be selected but not dragged).
export default function LayersSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const captions: MemeCaption[] = useMemeEditorStore((s: { captions: MemeCaption[] }) => s.captions);
  const stickers: MemeSticker[] = useMemeEditorStore((s: { stickers: MemeSticker[] }) => s.stickers);
  const images: MemeImageLayer[] = useMemeEditorStore((s: { imageLayers: MemeImageLayer[] }) => s.imageLayers || []);
  const activeLayerId: string | null = useMemeEditorStore((s: { activeLayerId: string | null }) => s.activeLayerId);
  const setActiveLayerId = useMemeEditorStore((s: { setActiveLayerId: (id: string | null) => void }) => s.setActiveLayerId);
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  const rows = layerRows(captions, stickers, images);

  return (
    <Sheet title="Layers" badge={rows.length ? String(rows.length) : undefined} onClose={onClose}>
      {!rows.length && <p className="ie-empty">No layers yet. Add text, a sticker or a photo.</p>}
      <ul className="ie-layers" aria-label="Layers">
        {rows.map((row, i) => (
          <li key={row.id} className={`ie-layer-row${row.id === activeLayerId ? ' is-on' : ''}${row.hidden ? ' is-hidden' : ''}`}>
            <button type="button" className="ie-layer-pick" onClick={() => setActiveLayerId(row.id)} aria-pressed={row.id === activeLayerId}>
              <row.Icon size={17} />
              <span>{row.label}</span>
            </button>
            <button type="button" className="ui-icon-btn ui-icon-btn--ghost" title="Bring forward" aria-label={`Bring ${row.label} forward`} disabled={i === 0} onClick={() => actions.moveLayer(row.id, 'forward')}>
              <ArrowUp size={17} />
            </button>
            <button type="button" className="ui-icon-btn ui-icon-btn--ghost" title="Send backward" aria-label={`Send ${row.label} backward`} disabled={i === rows.length - 1} onClick={() => actions.moveLayer(row.id, 'backward')}>
              <ArrowDown size={17} />
            </button>
            <button type="button" className="ui-icon-btn ui-icon-btn--ghost" title={row.hidden ? 'Show' : 'Hide'} aria-label={`${row.hidden ? 'Show' : 'Hide'} ${row.label}`} aria-pressed={row.hidden} onClick={() => patchLayer(row.key, row.id, { hidden: !row.hidden })}>
              {row.hidden ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
            <button type="button" className="ui-icon-btn ui-icon-btn--ghost" title={row.locked ? 'Unlock' : 'Lock'} aria-label={`${row.locked ? 'Unlock' : 'Lock'} ${row.label}`} aria-pressed={row.locked} onClick={() => patchLayer(row.key, row.id, { locked: !row.locked })}>
              {row.locked ? <Lock size={17} /> : <LockOpen size={17} />}
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
