import { useState } from 'react';
import {
  ArrowUp, ArrowDown, Eye, EyeOff, Lock, LockOpen, ListChecks, Check, Square, SquareCheck, Link2,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  AlignHorizontalSpaceAround, AlignVerticalSpaceAround, Group, Ungroup, Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Sheet, Section } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { drawingRows, layerRows } from './layerRows';
import type { LayerRow } from './layerRows';
import type { EditorActions } from './selection';
import type { MemeCaption, MemeImageLayer, MemeSticker } from '../../../model/memeDocument';

const ALIGN: { mode: string; label: string; Icon: LucideIcon }[] = [
  { mode: 'left', label: 'Align left', Icon: AlignStartVertical },
  { mode: 'hcenter', label: 'Centre across', Icon: AlignCenterVertical },
  { mode: 'right', label: 'Align right', Icon: AlignEndVertical },
  { mode: 'top', label: 'Align top', Icon: AlignStartHorizontal },
  { mode: 'vcenter', label: 'Centre up and down', Icon: AlignCenterHorizontal },
  { mode: 'bottom', label: 'Align bottom', Icon: AlignEndHorizontal },
];

function RowTools({ row, first, last, onUp, onDown, onToggle }: {
  row: LayerRow; first: boolean; last: boolean; onUp: () => void; onDown: () => void; onToggle: (patch: object) => void;
}) {
  return (
    <>
      <button type="button" className="ui-icon-btn ui-icon-btn--ghost" title="Bring forward" aria-label={`Bring ${row.label} forward`} disabled={first} onClick={onUp}>
        <ArrowUp size={17} />
      </button>
      <button type="button" className="ui-icon-btn ui-icon-btn--ghost" title="Send backward" aria-label={`Send ${row.label} backward`} disabled={last} onClick={onDown}>
        <ArrowDown size={17} />
      </button>
      <button type="button" className="ui-icon-btn ui-icon-btn--ghost" title={row.hidden ? 'Show' : 'Hide'} aria-label={`${row.hidden ? 'Show' : 'Hide'} ${row.label}`} aria-pressed={row.hidden} onClick={() => onToggle({ hidden: !row.hidden })}>
        {row.hidden ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
      <button type="button" className="ui-icon-btn ui-icon-btn--ghost" title={row.locked ? 'Unlock' : 'Lock'} aria-label={`${row.locked ? 'Unlock' : 'Lock'} ${row.label}`} aria-pressed={row.locked} onClick={() => onToggle({ locked: !row.locked })}>
        {row.locked ? <Lock size={17} /> : <LockOpen size={17} />}
      </button>
    </>
  );
}

// The Layers sheet: every layer, topmost first, with shapes and censor regions (always drawn on
// top) in their own list. Tap one to select it; move it up or down; hide it (not drawn, exported or
// tappable) or lock it (selectable, not draggable). Select picks several to line up (align,
// spread), group (they then move together), ungroup or delete.
export default function LayersSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const captions: MemeCaption[] = useMemeEditorStore((s: { captions: MemeCaption[] }) => s.captions);
  const stickers: MemeSticker[] = useMemeEditorStore((s: { stickers: MemeSticker[] }) => s.stickers);
  const images: MemeImageLayer[] = useMemeEditorStore((s: { imageLayers: MemeImageLayer[] }) => s.imageLayers || []);
  const drawings: unknown[] = useMemeEditorStore((s: { drawings: unknown[] }) => s.drawings || []);
  const activeLayerId: string | null = useMemeEditorStore((s: { activeLayerId: string | null }) => s.activeLayerId);
  const setActiveLayerId = useMemeEditorStore((s: { setActiveLayerId: (id: string | null) => void }) => s.setActiveLayerId);
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  const setDrawings = useMemeEditorStore((s: { setDrawings: (d: unknown[]) => void }) => s.setDrawings);
  const pushHistory = useMemeEditorStore((s: { pushHistory: () => void }) => s.pushHistory);
  const rows = layerRows(captions, stickers, images);
  const shapes = drawingRows(drawings);
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const chosen = picked.filter((id) => rows.some((r) => r.id === id));

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const stopSelecting = () => {
    setSelecting(false);
    setPicked([]);
  };
  // Shapes are drawn in list order: the last is on top.
  const moveShape = (id: string, by: 1 | -1) => {
    const i = drawings.findIndex((d) => (d as { id?: string }).id === id);
    const j = i + by;
    if (i < 0 || j < 0 || j >= drawings.length) return;
    const next = [...drawings];
    [next[i], next[j]] = [next[j], next[i]];
    setDrawings(next);
    pushHistory();
  };
  const grouped = chosen.some((id) => rows.find((r) => r.id === id)?.groupId);

  return (
    <Sheet
      title="Layers"
      badge={rows.length + shapes.length ? String(rows.length + shapes.length) : undefined}
      action={rows.length > 1 || selecting ? (selecting ? { label: 'Done', Icon: Check, onClick: stopSelecting } : { label: 'Select', Icon: ListChecks, onClick: () => setSelecting(true) }) : undefined}
      onClose={onClose}
    >
      {!rows.length && !shapes.length && <p className="ie-empty">No layers yet. Add text, a sticker or a photo.</p>}

      {selecting && (
        <div className="ie-arrange" role="group" aria-label="Arrange chosen layers">
          <p className="ie-inline-label">
            {chosen.length === 0 ? 'Tick the layers to arrange.' : chosen.length === 1 ? '1 chosen: lines up with the meme' : `${chosen.length} chosen`}
          </p>
          <div className="ie-arrange-row">
            {ALIGN.map((a) => (
              <button key={a.mode} type="button" className="ui-icon-btn" title={a.label} aria-label={a.label} disabled={!chosen.length} onClick={() => actions.handleAlignLayers(chosen, a.mode)}>
                <a.Icon size={17} />
              </button>
            ))}
            <button type="button" className="ui-icon-btn" title="Spread out across" aria-label="Spread out across" disabled={chosen.length < 3} onClick={() => actions.handleDistributeLayers(chosen, 'horizontal')}>
              <AlignHorizontalSpaceAround size={17} />
            </button>
            <button type="button" className="ui-icon-btn" title="Spread out up and down" aria-label="Spread out up and down" disabled={chosen.length < 3} onClick={() => actions.handleDistributeLayers(chosen, 'vertical')}>
              <AlignVerticalSpaceAround size={17} />
            </button>
          </div>
          <div className="ie-layer-actions">
            <button type="button" className="ui-btn" disabled={chosen.length < 2} onClick={() => actions.handleGroupLayers(chosen)}><Group size={16} />Group</button>
            <button type="button" className="ui-btn" disabled={!grouped} onClick={() => actions.handleUngroupLayers(chosen)}><Ungroup size={16} />Ungroup</button>
            <button type="button" className="ui-btn ui-btn--danger" disabled={!chosen.length} onClick={() => { actions.handleDeleteLayers(chosen); setPicked([]); }}><Trash2 size={16} />Delete</button>
          </div>
        </div>
      )}

      {shapes.length > 0 && (
        <Section title="Drawn on top">
          <ul className="ie-layers" aria-label="Shapes">
            {shapes.map((row, i) => (
              <li key={row.id} className={`ie-layer-row${row.id === activeLayerId ? ' is-on' : ''}${row.hidden ? ' is-hidden' : ''}`}>
                <button type="button" className="ie-layer-pick" onClick={() => setActiveLayerId(row.id)} aria-pressed={row.id === activeLayerId}>
                  <row.Icon size={17} />
                  <span>{row.label}</span>
                </button>
                <RowTools row={row} first={i === 0} last={i === shapes.length - 1} onUp={() => moveShape(row.id, 1)} onDown={() => moveShape(row.id, -1)} onToggle={(patch) => patchLayer('drawings', row.id, patch)} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {rows.length > 0 && (
        <ul className="ie-layers" aria-label="Layers">
          {rows.map((row, i) => {
            const on = selecting ? chosen.includes(row.id) : row.id === activeLayerId;
            return (
              <li key={row.id} className={`ie-layer-row${on ? ' is-on' : ''}${row.hidden ? ' is-hidden' : ''}`}>
                <button type="button" className="ie-layer-pick" onClick={() => (selecting ? toggle(row.id) : setActiveLayerId(row.id))} aria-pressed={on}>
                  {selecting ? (on ? <SquareCheck size={17} /> : <Square size={17} />) : <row.Icon size={17} />}
                  <span>{row.label}</span>
                  {row.groupId && <Link2 size={14} aria-label="In a group" />}
                </button>
                {!selecting && (
                  <RowTools row={row} first={i === 0} last={i === rows.length - 1} onUp={() => actions.moveLayer(row.id, 'forward')} onDown={() => actions.moveLayer(row.id, 'backward')} onToggle={(patch) => patchLayer(row.key, row.id, patch)} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}
