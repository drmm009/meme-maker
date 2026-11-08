import type { ReactNode } from 'react';
import { Ban, Blend, FlipHorizontal2, FlipVertical2, MoveRight, ZoomIn } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Slider } from '../ui';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { DEFAULT_TRANSITION_MS, TRANSITIONS } from '../../utils/clipTransitions';

// A video or photo clip as these sheets see it.
interface PlacedClip {
  id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  flipX?: boolean;
  flipY?: boolean;
  transitionIn?: { type?: string | null; durationMs?: number } | null;
}

const update = (id: string, patch: Partial<PlacedClip>) => useEditorStore.getState().updateItem(id, patch);

// A sheet's choices as big black tiles: a picture of what each does, its name and a line under it;
// the picked one (or the ones on) lit.
function OptionTiles({ label, options, columns }: {
  label: string;
  columns: number;
  options: { id: string; label: string; sub?: string; art: ReactNode; on: boolean; onClick: () => void; role?: 'radio' | 'switch' }[];
}) {
  return (
    <div className="vt-options" role="group" aria-label={label} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {options.map((o) => (
        <button key={o.id} type="button" role={o.role} aria-checked={o.role ? o.on : undefined} aria-pressed={o.role ? undefined : o.on}
          className={`vt-option${o.on ? ' is-on' : ''}`} onClick={o.onClick}>
          <span className="vt-option-art" aria-hidden="true">{o.art}</span>
          <span className="vt-option-label">{o.label}</span>
          {o.sub && <span className="vt-option-sub">{o.sub}</span>}
        </button>
      ))}
    </div>
  );
}

type Placement = 'fit' | 'cover' | 'stretch';

// Picture placement on the 800-wide logical stage: contain, cover, or stretch to fill.
const placeMedia = (item: PlacedClip, aspectRatio: number, mode: Placement) => {
  const dims = { width: 800, height: 800 / aspectRatio };
  const w0 = item.width || 200;
  const h0 = item.height || 200;
  if (mode === 'stretch') return { x: 0, y: 0, scaleX: dims.width / w0, scaleY: dims.height / h0 };
  const wider = w0 / h0 > dims.width / dims.height;
  const s = (mode === 'fit') === wider ? dims.width / w0 : dims.height / h0;
  return { x: (dims.width - w0 * s) / 2, y: (dims.height - h0 * s) / 2, scaleX: s, scaleY: s };
};

// Which placement the clip is in now, if any (it may have been moved or sized by hand since).
const currentPlacement = (item: PlacedClip, aspectRatio: number): Placement | null => {
  const near = (a = 0, b = 0) => Math.abs(a - b) < 0.5;
  const nearScale = (a = 1, b = 1) => Math.abs(a - b) < 0.002;
  return (['fit', 'cover', 'stretch'] as const).find((mode) => {
    const p = placeMedia(item, aspectRatio, mode);
    return near(item.x, p.x) && near(item.y, p.y) && nearScale(item.scaleX, p.scaleX) && nearScale(item.scaleY, p.scaleY);
  }) ?? null;
};

// A placement's picture: the canvas as an outline, the clip (a tall picture) as a block in it.
function PlacementArt({ mode }: { mode: Placement }) {
  const pic = { fit: { x: 15, y: 4, w: 14, h: 18 }, cover: { x: 3, y: -5, w: 38, h: 36 }, stretch: { x: 3, y: 4, w: 38, h: 18 } }[mode];
  return (
    <svg width="44" height="26" viewBox="0 0 44 26">
      <defs><clipPath id={`vt-place-${mode}`}><rect x="3" y="4" width="38" height="18" rx="2" /></clipPath></defs>
      <rect x={pic.x} y={pic.y} width={pic.w} height={pic.h} rx="1.5" fill="currentColor" opacity="0.55" clipPath={`url(#vt-place-${mode})`} />
      <rect x="3" y="4" width="38" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

const PLACEMENTS: { mode: Placement; label: string; sub: string }[] = [
  { mode: 'fit', label: 'Fit', sub: 'All of it, bars' },
  { mode: 'cover', label: 'Fill', sub: 'Edges cut off' },
  { mode: 'stretch', label: 'Stretch', sub: 'Pulled to fit' },
];

// Where a picture sits on the canvas. The placement it's in now is lit; moving or sizing it by hand
// leaves none lit.
export function PlacePanel({ item }: { item: PlacedClip }) {
  const aspectRatio = useEditorStore((s) => s.canvasAspectRatio) as number;
  const now = currentPlacement(item, aspectRatio);
  return (
    <OptionTiles label="Fit to canvas" columns={3} options={PLACEMENTS.map((p) => ({
      id: p.mode, label: p.label, sub: p.sub, art: <PlacementArt mode={p.mode} />, on: now === p.mode, role: 'radio' as const,
      onClick: () => update(item.id, placeMedia(item, aspectRatio, p.mode)),
    }))} />
  );
}

// Mirror left-right and/or upside down; each tile is on while that flip is.
export function FlipPanel({ item }: { item: PlacedClip }) {
  const flip = (key: 'flipX' | 'flipY', label: string, sub: string, Icon: LucideIcon) => ({
    id: key, label, sub, art: <Icon size={24} strokeWidth={1.8} />, on: Boolean(item[key]),
    onClick: () => update(item.id, { [key]: !item[key] }),
  });
  return (
    <OptionTiles label="Flip" columns={2} options={[
      flip('flipX', 'Left–right', 'Like a mirror', FlipHorizontal2),
      flip('flipY', 'Upside down', 'Top to bottom', FlipVertical2),
    ]} />
  );
}

const TRANSITION_ICONS: Record<string, LucideIcon> = { none: Ban, fade: Blend, zoom: ZoomIn, slide: MoveRight };

// How this clip comes in from the one before: None, Fade, Zoom or Slide as tiles, then its length.
export function TransitionPanel({ item }: { item: PlacedClip }) {
  const current = item.transitionIn || {};
  const ms = current.durationMs || DEFAULT_TRANSITION_MS;
  const set = (patch: { type?: string; durationMs?: number }) => update(item.id, { transitionIn: { durationMs: ms, ...current, ...patch } });
  return (
    <div className="vt-transition">
      <OptionTiles label="Transition" columns={4} options={TRANSITIONS.map((t) => {
        const Icon = TRANSITION_ICONS[t.id ?? 'none'];
        return {
          id: t.id ?? 'none', label: t.label, art: <Icon size={22} strokeWidth={1.8} />, on: (current.type ?? null) === t.id, role: 'radio' as const,
          onClick: () => (t.id ? set({ type: t.id }) : update(item.id, { transitionIn: null })),
        };
      })} />
      {current.type ? (
        <div className="vt-transition-length">
          <span className="vt-transition-label">Length</span>
          <Slider label="Length" min={200} max={1200} step={50} value={ms} onChange={(v) => set({ durationMs: v })}
            format={(v) => `${(v / 1000).toFixed(2)}s`} />
        </div>
      ) : (
        <p className="vt-panel-hint">Plays where the previous clip ends and this one starts.</p>
      )}
    </div>
  );
}
