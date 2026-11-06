import { Droplets, Eraser, Undo2, LoaderCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Sheet, Row, Slider } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useSelection } from './selection';
import type { EditorActions } from './selection';

export const MAX_BLUR = 30;

interface CardProps {
  label: string;
  name: string;
  sub: string;
  Icon: LucideIcon;
  on?: boolean;
  busy?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

// One of the sheet's two actions: a plain orange icon, a short name (`label` is the full one, for
// screen readers) and a few words under it; ringed in orange while applied, a spinner while the
// subject is being found.
function BgCard({ label, name, sub, Icon, on = false, busy = false, disabled = false, onClick }: CardProps) {
  return (
    <button type="button" className={`ie-bg-card${on ? ' is-on' : ''}`} aria-label={label} aria-pressed={on} disabled={disabled} onClick={onClick}>
      <span className="ie-bg-card-icon" aria-hidden="true">
        {busy ? <LoaderCircle size={20} strokeWidth={1.8} className="animate-spin" /> : <Icon size={20} strokeWidth={1.8} />}
      </span>
      <span className="ie-bg-card-text">
        <span className="ie-bg-card-label">{name}</span>
        <span className="ie-bg-card-sub">{sub}</span>
      </span>
    </button>
  );
}

interface BackgroundControlsProps {
  // Background blur (0 off .. MAX_BLUR), and whether the subject is being found for it.
  blur: number;
  blurring?: boolean;
  removed: boolean;
  removing?: boolean;
  // A layout of several photos has no single subject to blur.
  layout?: boolean;
  onToggleBlur: () => void;
  onBlur: (v: number) => void;
  onToggleRemove: () => void;
}

// A photo's Background, in both editors: Blur keeps the subject sharp over a blurred background (its
// strength shows while on; tap again to turn it off), Remove cuts the subject out (tap again to
// bring the background back).
export function BackgroundControls({ blur, blurring = false, removed, removing = false, layout = false, onToggleBlur, onBlur, onToggleRemove }: BackgroundControlsProps) {
  const busy = removing || blurring;
  return (
    <>
      <div className="ie-bg-cards">
        <BgCard
          label={blurring ? 'Finding the subject…' : 'Blur Background'}
          name={blurring ? 'Finding subject…' : 'Blur'}
          sub={layout ? 'Single photos only' : 'Soft backdrop'}
          Icon={Droplets}
          on={blur > 0 && !blurring}
          busy={blurring}
          disabled={layout || busy}
          onClick={onToggleBlur}
        />
        <BgCard
          label={removing ? 'Removing background…' : removed ? 'Restore Background' : 'Remove Background'}
          name={removing ? 'Removing…' : removed ? 'Restore' : 'Remove'}
          sub={removed ? 'Bring it back' : 'Cut out subject'}
          Icon={removed ? Undo2 : Eraser}
          on={removed && !removing}
          busy={removing}
          disabled={busy}
          onClick={onToggleRemove}
        />
      </div>
      {blur > 0 && !blurring && !layout && (
        <Row label="Blur">
          <Slider
            label="Blur intensity"
            min={1}
            max={MAX_BLUR}
            value={blur}
            format={(v) => `${Math.round((v / MAX_BLUR) * 100)}%`}
            onChange={onBlur}
          />
        </Row>
      )}
    </>
  );
}

// AI > Background, for the selected photo or else the main one.
export default function BackgroundSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const imageFilters = useMemeEditorStore((s: { imageFilters: Record<string, unknown> }) => s.imageFilters) || {};
  const templateBgRemoved = useMemeEditorStore((s: { activeTemplate?: { originalUrl?: string } }) => Boolean(s.activeTemplate?.originalUrl));
  const { image } = useSelection();

  const isLayout = Boolean(actions.isNativeLayout) && !image;
  const bgRemoved = image ? Boolean(image.originalUrl) : templateBgRemoved;
  const blurValue = Number((image ? image.bgBlur : imageFilters.bgBlur) || 0);

  const toggleBlur = () => {
    if (blurValue > 0) actions.setPortraitBlur(0);
    else if (actions.handleApplyBackgroundBlur) actions.handleApplyBackgroundBlur();
    else actions.setPortraitBlur(MAX_BLUR);
  };

  return (
    <Sheet className="ie-background-sheet ie-tool-sheet" title="Background" onClose={onClose}>
      <BackgroundControls
        blur={blurValue}
        blurring={Boolean(actions.isBlurringBg)}
        removed={bgRemoved}
        removing={Boolean(actions.isRemovingBg)}
        layout={isLayout}
        onToggleBlur={toggleBlur}
        onBlur={(v) => actions.setPortraitBlur(v)}
        onToggleRemove={() => actions.handleRemoveBackground()}
      />
    </Sheet>
  );
}
