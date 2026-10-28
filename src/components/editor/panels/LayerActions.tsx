import { ArrowDown, ArrowUp, Copy, RotateCw, Trash2 } from 'lucide-react';
import { Section } from '../../ui';
import type { EditorActions } from './selection';

// The selected layer's arrange row, at the bottom of its sheet: duplicate, rotate, stack order, delete.
export default function LayerActions({ id, actions }: { id: string; actions: EditorActions }) {
  return (
    <Section title="Layer">
      <div className="ie-layer-actions">
        <button type="button" className="ui-btn" onClick={() => actions.handleDuplicateLayer(id)} title="Duplicate"><Copy size={16} />Duplicate</button>
        <button type="button" className="ui-btn" onClick={() => actions.handleRotateLayer()} title="Rotate 90°" aria-label="Rotate 90°"><RotateCw size={16} /></button>
        <button type="button" className="ui-btn" onClick={() => actions.moveLayer(id, 'forward')} title="Bring forward" aria-label="Bring forward"><ArrowUp size={16} /></button>
        <button type="button" className="ui-btn" onClick={() => actions.moveLayer(id, 'backward')} title="Send backward" aria-label="Send backward"><ArrowDown size={16} /></button>
        <button type="button" className="ui-btn ui-btn--danger" onClick={() => actions.handleDeleteLayer(id)} title="Delete layer" aria-label="Delete layer"><Trash2 size={16} /></button>
      </div>
    </Section>
  );
}
