import { useState, useEffect } from 'react';
import { Focus, Droplets, Eraser, Undo2, LoaderCircle } from 'lucide-react';
import { Sheet, Section, Slider } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useSelection } from './selection';
import type { EditorActions } from './selection';

// Compact Background Studio Sheet: Background Blur & Remove Background
export default function BackgroundSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const imageFilters = useMemeEditorStore((s: { imageFilters: Record<string, unknown> }) => s.imageFilters) || {};
  const templateBgRemoved = useMemeEditorStore((s: { activeTemplate?: { originalUrl?: string } }) => Boolean(s.activeTemplate?.originalUrl));
  const { image } = useSelection();

  const isLayout = Boolean(actions.isNativeLayout) && !image;
  const isRemovingBg = Boolean(actions.isRemovingBg);
  const isBlurringBg = Boolean(actions.isBlurringBg);
  const bgRemoved = image ? Boolean(image.originalUrl) : templateBgRemoved;
  const blurValue = Number((image ? image.bgBlur : imageFilters.bgBlur) || 0);

  const [isSliderOpen, setIsSliderOpen] = useState(blurValue > 0);

  // When blur finishes loading or blurValue changes externally, update slider open state
  useEffect(() => {
    if (blurValue > 0) {
      setIsSliderOpen(true);
    }
  }, [blurValue]);

  const handleApplyBlur = () => {
    if (actions.handleApplyBackgroundBlur) {
      actions.handleApplyBackgroundBlur();
    } else {
      actions.setPortraitBlur(30);
    }
  };

  return (
    <Sheet className="ie-background-sheet" title="Background" hideTitle onClose={onClose}>
      <Section title="Background Blur">
        {!isLayout ? (
          isSliderOpen && !isBlurringBg ? (
            <div className="ie-bg-blur-slider-wrap">
              <Slider
                label="Blur intensity"
                min={0}
                max={30}
                value={blurValue}
                format={(v) => `${Math.round((v / 30) * 100)}%`}
                onChange={(v) => actions.setPortraitBlur(v)}
                StartIcon={Focus}
                EndIcon={Droplets}
              />
            </div>
          ) : (
            <div className="ie-bg-action-wrap">
              <button
                type="button"
                className={`ui-btn ie-remove-bg-action-btn${blurValue > 0 ? ' is-on' : ''}`}
                disabled={isBlurringBg || isRemovingBg}
                onClick={handleApplyBlur}
                aria-label="Blur Background"
              >
                {isBlurringBg ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin ie-remove-bg-icon" />
                    <span>Finding the subject…</span>
                  </>
                ) : (
                  <>
                    <Droplets size={17} className="ie-remove-bg-icon" />
                    <span>Blur Background</span>
                  </>
                )}
              </button>
            </div>
          )
        ) : (
          <p className="ie-empty" style={{ margin: '4px 0' }}>Available on single photo memes.</p>
        )}
      </Section>

      <Section rule title="Remove Background">
        <div className="ie-bg-action-wrap">
          <button
            type="button"
            className={`ui-btn ie-remove-bg-action-btn${bgRemoved ? ' is-on' : ''}`}
            disabled={isRemovingBg || isBlurringBg}
            onClick={() => actions.handleRemoveBackground()}
            aria-label={bgRemoved ? 'Restore Background' : 'Remove Background'}
          >
            {isRemovingBg ? (
              <>
                <LoaderCircle size={17} className="animate-spin ie-remove-bg-icon" />
                <span>Removing background…</span>
              </>
            ) : bgRemoved ? (
              <>
                <Undo2 size={17} className="ie-remove-bg-icon" />
                <span>Restore Background</span>
              </>
            ) : (
              <>
                <Eraser size={17} className="ie-remove-bg-icon" />
                <span>Remove Background</span>
              </>
            )}
          </button>
        </div>
      </Section>
    </Sheet>
  );
}
