import { Droplets, Eraser, Undo2, LoaderCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Sheet, Row, Slider } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useSelection } from './selection';
import type { EditorActions } from './selection';

const MAX_BLUR = 30;

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

// AI > Background, for the selected photo or else the main one: Blur keeps the subject
// sharp over a blurred background (its strength shows while on; tap again to turn it off), Remove
// cuts the subject out (tap again to bring the background back).
export default function BackgroundSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const imageFilters = useMemeEditorStore((s: { imageFilters: Record<string, unknown> }) => s.imageFilters) || {};
  const templateBgRemoved = useMemeEditorStore((s: { activeTemplate?: { originalUrl?: string } }) => Boolean(s.activeTemplate?.originalUrl));
  const { image } = useSelection();

  const isLayout = Boolean(actions.isNativeLayout) && !image;
  const isRemovingBg = Boolean(actions.isRemovingBg);
  const isBlurringBg = Boolean(actions.isBlurringBg);
  const busy = isRemovingBg || isBlurringBg;
  const bgRemoved = image ? Boolean(image.originalUrl) : templateBgRemoved;
  const blurValue = Number((image ? image.bgBlur : imageFilters.bgBlur) || 0);
  const blurOn = blurValue > 0;

  const toggleBlur = () => {
    if (blurOn) actions.setPortraitBlur(0);
    else if (actions.handleApplyBackgroundBlur) actions.handleApplyBackgroundBlur();
    else actions.setPortraitBlur(MAX_BLUR);
  };

  return (
    <Sheet className="ie-background-sheet ie-tool-sheet" title="Background" onClose={onClose}>
      <div className="ie-bg-cards">
        <BgCard
          label={isBlurringBg ? 'Finding the subject…' : 'Blur Background'}
          name={isBlurringBg ? 'Finding subject…' : 'Blur'}
          sub={isLayout ? 'Single photos only' : 'Soft backdrop'}
          Icon={Droplets}
          on={blurOn && !isBlurringBg}
          busy={isBlurringBg}
          disabled={isLayout || busy}
          onClick={toggleBlur}
        />
        <BgCard
          label={isRemovingBg ? 'Removing background…' : bgRemoved ? 'Restore Background' : 'Remove Background'}
          name={isRemovingBg ? 'Removing…' : bgRemoved ? 'Restore' : 'Remove'}
          sub={bgRemoved ? 'Bring it back' : 'Cut out subject'}
          Icon={bgRemoved ? Undo2 : Eraser}
          on={bgRemoved && !isRemovingBg}
          busy={isRemovingBg}
          disabled={busy}
          onClick={() => actions.handleRemoveBackground()}
        />
      </div>
      {blurOn && !isBlurringBg && !isLayout && (
        <Row label="Blur">
          <Slider
            label="Blur intensity"
            min={1}
            max={MAX_BLUR}
            value={blurValue}
            format={(v) => `${Math.round((v / MAX_BLUR) * 100)}%`}
            onChange={(v) => actions.setPortraitBlur(v)}
          />
        </Row>
      )}
    </Sheet>
  );
}
