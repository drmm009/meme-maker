import React, { useState } from 'react';
import { LAYOUT_OPTIONS } from '../../data/templates';
import { ArrowLeft, Grid, X, Minus, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VideoLayoutBuilder({ onLayoutComplete, onBack }) {
  const [isConfiguringCustom, setIsConfiguringCustom] = useState(false);
  const [customCols, setCustomCols] = useState(2);
  const [customRows, setCustomRows] = useState(2);

  const handleSelectLayoutOption = (layout) => {
    // Instantly generate the 4:3 grid lines and jump to Video Editor
    const width = 800;
    const height = 600; // 4:3 Classic
    
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = width;
    gridCanvas.height = height;
    const gridCtx = gridCanvas.getContext('2d');

    const totalSlots = layout.slots;
    const isVert = layout.id === '2-vert' || layout.id === '3-stacked';
    const isHoriz = layout.id === '2-horiz' || layout.id === '3-horiz';
    const isGrid = layout.id === '4-grid';
    const isHybrid = layout.id === '3-hybrid';

    gridCtx.strokeStyle = '#000000';
    gridCtx.lineWidth = 4;

    const layoutSlots = [];
    
    if (layout.id !== '1-panel') {
      for (let idx = 0; idx < totalSlots; idx++) {
        let slotW = width, slotH = height, x = 0, y = 0;
        if (isVert) {
          slotH = height / totalSlots;
          y = idx * slotH;
        } else if (isHoriz) {
          slotW = width / totalSlots;
          x = idx * slotW;
        } else if (isGrid) {
          slotW = width / 2;
          slotH = height / 2;
          x = (idx % 2) * slotW;
          y = Math.floor(idx / 2) * slotH;
        } else if (isHybrid) {
          if (idx === 0) {
            slotW = width;
            slotH = height / 2;
          } else {
            slotW = width / 2;
            slotH = height / 2;
            x = (idx - 1) * slotW;
            y = height / 2;
          }
        } else if (layout.id === 'custom-grid') {
          const cols = layout.cols || 2;
          const rows = layout.rows || 2;
          slotW = width / cols;
          slotH = height / rows;
          x = (idx % cols) * slotW;
          y = Math.floor(idx / cols) * slotH;
        }
        layoutSlots.push({ x, y, width: slotW, height: slotH });
      }
      
      // Explicitly draw only the internal divider lines to ensure perfectly uniform thickness
      gridCtx.beginPath();
      if (layout.id === '2-vert') {
         gridCtx.moveTo(0, height / 2);
         gridCtx.lineTo(width, height / 2);
      } else if (layout.id === '3-stacked') {
         gridCtx.moveTo(0, height / 3);
         gridCtx.lineTo(width, height / 3);
         gridCtx.moveTo(0, 2 * height / 3);
         gridCtx.lineTo(width, 2 * height / 3);
      } else if (layout.id === '2-horiz') {
         gridCtx.moveTo(width / 2, 0);
         gridCtx.lineTo(width / 2, height);
      } else if (layout.id === '3-horiz') {
         gridCtx.moveTo(width / 3, 0);
         gridCtx.lineTo(width / 3, height);
         gridCtx.moveTo(2 * width / 3, 0);
         gridCtx.lineTo(2 * width / 3, height);
      } else if (layout.id === '4-grid') {
         gridCtx.moveTo(0, height / 2);
         gridCtx.lineTo(width, height / 2);
         gridCtx.moveTo(width / 2, 0);
         gridCtx.lineTo(width / 2, height);
      } else if (layout.id === '3-hybrid') {
         gridCtx.moveTo(0, height / 2);
         gridCtx.lineTo(width, height / 2);
         gridCtx.moveTo(width / 2, height / 2);
         gridCtx.lineTo(width / 2, height);
      } else if (layout.id === 'custom-grid') {
         const cols = layout.cols || 2;
         const rows = layout.rows || 2;
         const slotW = width / cols;
         const slotH = height / rows;
         for (let r = 1; r < rows; r++) {
           gridCtx.moveTo(0, r * slotH);
           gridCtx.lineTo(width, r * slotH);
         }
         for (let c = 1; c < cols; c++) {
           gridCtx.moveTo(c * slotW, 0);
           gridCtx.lineTo(c * slotW, height);
         }
      }
      gridCtx.stroke();
    }

    const gridDataUrl = layout.id === '1-panel' ? null : gridCanvas.toDataURL('image/png');

    if (onLayoutComplete) {
      onLayoutComplete({
        id: `custom-${layout.id}-${Date.now()}`,
        name: 'Custom Layout',
        layoutId: layout.id,
        gridUrl: gridDataUrl,
        mediaItems: [],
        hasAnyImage: false,
        hasEmptySlots: true,
        category: 'custom',
        width: 800,
        height: height,
        slots: layoutSlots,
        defaultCaptions: []
      });
    }
  };

  return (
    <div className="custom-layout-builder animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <div className="editor-topbar glass-card flex-between margin-bottom" style={{ paddingLeft: 0 }}>
        <button className="btn btn-ghost btn-xs" onClick={onBack}>
          <ArrowLeft className="icon-sm" /> Back
        </button>
        <h2 className="choose-layout-heading" style={{ display: 'flex', alignItems: 'center', margin: 0, color: 'var(--text-main)', fontWeight: 'bold' }}>
          Select Layout Structure
        </h2>
        <div style={{ width: '60px' }}>{/* Placeholder to balance flex-between */}</div>
      </div>

      <div className="step-selection-area">
        <div className="step-header text-center step-header-spaced">
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>Clicking a layout will immediately open the Video Editor where you can arrange your media.</p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div
            className="icon-layout-card glass-card hover-lift"
            style={{ width: '100%', height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onClick={() => handleSelectLayoutOption(LAYOUT_OPTIONS[0])}
          >
            <div className="wireframe-container" style={{ width: '80px', height: '60px', marginBottom: '8px' }}>
              <div className="layout-wireframe grid-1-panel">
                <div className="wf-box" />
              </div>
            </div>
            <span className="icon-layout-label" style={{ fontSize: '1rem' }}>
              {LAYOUT_OPTIONS[0].name} <span className="layout-description-mobile">(Recommended)</span>
            </span>
          </div>
        </div>
        
        <h4 style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--text-muted)' }}>Or choose a multi-panel layout</h4>

        <div className="icon-layout-grid-3x2" style={isConfiguringCustom ? { display: 'flex', justifyContent: 'center' } : {}}>
          {!isConfiguringCustom ? (
            <>
              {LAYOUT_OPTIONS.filter(l => l.id !== '1-panel' && l.id !== '3-hybrid').map((layout) => (
                <div
                  key={layout.id}
                  className="icon-layout-card glass-card hover-lift"
                  onClick={() => handleSelectLayoutOption(layout)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="wireframe-container">
                    <div className={`layout-wireframe grid-${layout.id}`}>
                      {Array.from({ length: layout.slots }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`wf-box ${layout.id === '3-hybrid' && idx === 0 ? 'wf-full' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="icon-layout-label">
                    {layout.name.includes('(') ? (
                      <>
                        {layout.name.split('(')[0]} <span className="layout-description-mobile">({layout.name.split('(')[1]}</span>
                      </>
                    ) : (
                      layout.name
                    )}
                  </span>
                </div>
              ))}
              
              <div
                className="icon-layout-card glass-card hover-lift"
                onClick={() => setIsConfiguringCustom(true)}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100px' }}
              >
                <Grid className="icon-sm" style={{ color: 'var(--poster-orange)', marginBottom: '8px', width: '40px', height: '40px' }} />
                <span className="icon-layout-label" style={{ fontWeight: 'bold' }}>Custom Grid</span>
              </div>
            </>
          ) : (
            <motion.div 
              className="glass-card" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3 }}
              style={{ padding: '20px', borderRadius: '16px', width: '100%', maxWidth: '350px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h4 style={{ margin: 0 }}>Custom Grid Size</h4>
                <div style={{ cursor: 'pointer', color: '#ff4d4d', display: 'flex', alignItems: 'center' }} onClick={() => setIsConfiguringCustom(false)}>
                  <X className="icon-sm" />
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                <div className="flex-between">
                  <span>Columns</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-main)', padding: '4px', borderRadius: '8px' }}>
                    <button className="btn btn-icon btn-xs" onClick={() => setCustomCols(Math.max(1, customCols - 1))}><Minus className="icon-xs" /></button>
                    <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{customCols}</span>
                    <button className="btn btn-icon btn-xs" onClick={() => setCustomCols(Math.min(4, customCols + 1))}><Plus className="icon-xs" /></button>
                  </div>
                </div>
                <div className="flex-between">
                  <span>Rows</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-main)', padding: '4px', borderRadius: '8px' }}>
                    <button className="btn btn-icon btn-xs" onClick={() => setCustomRows(Math.max(1, customRows - 1))}><Minus className="icon-xs" /></button>
                    <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{customRows}</span>
                    <button className="btn btn-icon btn-xs" onClick={() => setCustomRows(Math.min(4, customRows + 1))}><Plus className="icon-xs" /></button>
                  </div>
                </div>
              </div>
              
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '10px' }}
                onClick={() => {
                  handleSelectLayoutOption({
                    id: 'custom-grid',
                    name: `Custom ${customCols}x${customRows}`,
                    slots: customCols * customRows,
                    cols: customCols,
                    rows: customRows
                  });
                }}
              >
                Create {customCols * customRows} Panels
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
