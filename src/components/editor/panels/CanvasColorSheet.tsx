import type { CSSProperties } from 'react';
import { Sheet, Section, Row, SwatchRow } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import type { EditorActions } from './selection';

const CANVAS_COLORS = [
  '#ffffff', '#000000', '#1e293b', '#6b7280', '#ff5a36', '#ffd60a',
  '#34c759', '#0a84ff', '#bf5af2', '#ff375f', '#f5e6c8', 'transparent',
];

const GRADIENTS: { id: string; label: string; colors: [string, string] }[] = [
  { id: 'sunset', label: 'Sunset', colors: ['#ff5f6d', '#ffc371'] },
  { id: 'ocean', label: 'Ocean', colors: ['#2193b0', '#6dd5ed'] },
  { id: 'grape', label: 'Grape', colors: ['#8e2de2', '#4a00e0'] },
  { id: 'mint', label: 'Mint', colors: ['#00b09b', '#96c93d'] },
  { id: 'night', label: 'Night', colors: ['#0f2027', '#2c5364'] },
  { id: 'peach', label: 'Peach', colors: ['#ffecd2', '#fcb69f'] },
];

const same = (a: [string, string] | null, b: [string, string]) => Boolean(a && a[0] === b[0] && a[1] === b[1]);

// The Canvas strip's Color: the background behind the meme, its bands and any empty space, as a
// solid colour or (behind the meme) a gradient.
export default function CanvasColorSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const canvasBgColor: string = useMemeEditorStore((s: { canvasBgColor: string }) => s.canvasBgColor);
  const gradient: [string, string] | null = useMemeEditorStore((s: { canvasBgGradient: [string, string] | null }) => s.canvasBgGradient);
  return (
    <Sheet title="Background" hideTitle onClose={onClose}>
      <Section>
        <Row label="Color">
          <SwatchRow ariaLabel="Canvas colour" colors={CANVAS_COLORS} value={gradient ? '' : canvasBgColor} onChange={actions.handleSetCanvasBgColor} />
        </Row>
        <Row label="Gradient">
          <div className="ui-swatches" role="radiogroup" aria-label="Background gradient">
            {GRADIENTS.map((g) => (
              <button
                key={g.id}
                type="button"
                role="radio"
                aria-checked={same(gradient, g.colors)}
                aria-label={`${g.label} gradient`}
                title={g.label}
                className={`ui-swatch${same(gradient, g.colors) ? ' is-on' : ''}`}
                style={{ background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})`, '--swatch': g.colors[1] } as CSSProperties}
                onClick={() => actions.handleSetCanvasBgGradient(g.colors)}
              />
            ))}
          </div>
        </Row>
      </Section>
    </Sheet>
  );
}
