import React from 'react';
import { Type, Blend, ArrowDownRight } from 'lucide-react';
import { useEditorUiStore } from '../../store/useEditorUiStore';

export default function WatermarkBar() {
  const updateWatermark = useEditorUiStore((s) => s.updateWatermark);
  const watermark = useEditorUiStore((s) => s.watermark);
  return (
    <>
      <button
        className="btn btn-icon btn-xs vid-ctx-btn"
        style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        title="Watermark Color"
      >
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: watermark?.color || '#ffffff', border: '2px solid rgba(255,255,255,0.4)' }} />
        <input type="color" value={watermark?.color || '#ffffff'} onChange={(e) => updateWatermark('color', e.target.value)} style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
      </button>

      <input
        type="text"
        value={(watermark?.text || '').replace(/^@/, '')}
        onChange={(e) => {
          const raw = e.target.value.replace(/^@+/, '');
          updateWatermark('text', raw ? `@${raw}` : '');
          if (raw) updateWatermark('imageUrl', null);
        }}
        placeholder="username"
        className="sec-bar-btn-container"
        style={{ color: '#fff', padding: '0 12px', fontSize: '0.8rem', width: '105px', outline: 'none' }}
      />

      <button
        className="btn btn-icon btn-xs vid-ctx-btn"
        onClick={() => {
          const sizes = [12, 16, 24, 32, 48];
          const nextIdx = (sizes.indexOf(watermark?.size || 24) + 1) % sizes.length;
          updateWatermark('size', sizes[nextIdx]);
        }}
        title="Size"
      >
        <Type style={{ width: 15, height: 15, transform: `scale(${(watermark?.size || 24) / 24})`, transition: 'transform 0.2s' }} />
      </button>

      <button
        className="btn btn-icon btn-xs vid-ctx-btn"
        onClick={() => {
          const ops = [1, 0.75, 0.5, 0.25];
          const nextIdx = (ops.indexOf(watermark?.opacity || 0.5) + 1) % ops.length;
          updateWatermark('opacity', ops[nextIdx]);
        }}
        title="Opacity"
      >
        <Blend style={{ width: 15, height: 15, opacity: watermark?.opacity || 0.5, transition: 'opacity 0.2s' }} />
      </button>

      <button
        className="btn btn-icon btn-xs vid-ctx-btn"
        onClick={() => {
          const pos = ['bottom-right', 'bottom-left', 'top-left', 'top-right'];
          const nextIdx = (pos.indexOf(watermark?.position || 'bottom-right') + 1) % pos.length;
          updateWatermark('position', pos[nextIdx]);
        }}
        title="Position"
      >
        <ArrowDownRight 
          style={{ 
            width: 15, 
            height: 15, 
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: `rotate(${
              watermark?.position === 'bottom-left' ? 90 :
              watermark?.position === 'top-left' ? 180 :
              watermark?.position === 'top-right' ? 270 :
              0
            }deg)`
          }} 
        />
      </button>
    </>
  );
}
