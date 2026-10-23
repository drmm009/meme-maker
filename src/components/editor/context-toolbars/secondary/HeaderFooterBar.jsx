import React from 'react';
import { PanelTop, PanelBottom, Rows3 } from 'lucide-react';
import { useMemeEditorStore } from '../../store/useMemeEditorStore';

export default function HeaderFooterBar({
  handleToggleCanvasBoth,
  handleToggleCanvasFooter,
  handleToggleCanvasHeader,
}) {
  const canvasHeader = useMemeEditorStore((s) => s.canvasHeader);
  const canvasFooter = useMemeEditorStore((s) => s.canvasFooter);

  return (
    <>
      <button
        type="button"
        className={`btn btn-xs vid-ctx-btn ${canvasHeader.enabled ? 'active' : ''}`}
        onClick={handleToggleCanvasHeader}
        title="Toggle Header Extension"
        style={{
          padding: '4px 12px',
          fontSize: '0.75rem',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          borderRadius: '8px',
          flexShrink: 0,
          background: canvasHeader.enabled ? 'var(--primary-gradient)' : undefined,
          border: canvasHeader.enabled ? '1px solid var(--cyber-cyan)' : undefined,
          color: canvasHeader.enabled ? '#ffffff' : undefined
        }}
      >
        <PanelTop style={{ width: 13, height: 13 }} />
        <span>Header</span>
      </button>
      <button
        type="button"
        className={`btn btn-xs vid-ctx-btn ${canvasFooter.enabled ? 'active' : ''}`}
        onClick={handleToggleCanvasFooter}
        title="Toggle Footer Extension"
        style={{
          padding: '4px 12px',
          fontSize: '0.75rem',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          borderRadius: '8px',
          flexShrink: 0,
          background: canvasFooter.enabled ? 'var(--primary-gradient)' : undefined,
          border: canvasFooter.enabled ? '1px solid var(--cyber-cyan)' : undefined,
          color: canvasFooter.enabled ? '#ffffff' : undefined
        }}
      >
        <PanelBottom style={{ width: 13, height: 13 }} />
        <span>Footer</span>
      </button>
      <button
        type="button"
        className={`btn btn-xs vid-ctx-btn ${(canvasHeader.enabled && canvasFooter.enabled) ? 'active' : ''}`}
        onClick={handleToggleCanvasBoth}
        title="Toggle Both Header & Footer Extensions"
        style={{
          padding: '4px 12px',
          fontSize: '0.75rem',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          borderRadius: '8px',
          flexShrink: 0,
          background: (canvasHeader.enabled && canvasFooter.enabled) ? 'var(--primary-gradient)' : undefined,
          border: (canvasHeader.enabled && canvasFooter.enabled) ? '1px solid var(--cyber-cyan)' : undefined,
          color: (canvasHeader.enabled && canvasFooter.enabled) ? '#ffffff' : undefined
        }}
      >
        <Rows3 style={{ width: 13, height: 13 }} />
        <span>Both</span>
      </button>
    </>
  );
}
