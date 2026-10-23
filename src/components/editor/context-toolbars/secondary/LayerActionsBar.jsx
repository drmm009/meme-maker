import React from 'react';
import { Trash2, Copy, RotateCw, Crop, Layers, ArrowUp, ArrowDown, FlipHorizontal, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { isSocialCardCaption } from '../../memeEditorUtils';
import { useMemeEditorStore } from '../../store/useMemeEditorStore';
import { useEditorUiStore } from '../../store/useEditorUiStore';

export default function LayerActionsBar({
  activeCaption,
  activeImageLayer,
  handleCycleTextAlignment,
  handleDeleteLayer,
  handleDuplicateLayer,
  handleFlipActiveLayer,
  handleRotateLayer,
  handleToggleTextCase,
  moveLayer,
  updateActiveImageLayer,
}) {
  const setShowLayerMenu = useEditorUiStore((s) => s.setShowLayerMenu);
  const showLayerMenu = useEditorUiStore((s) => s.showLayerMenu);
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);

  return (
    <>
      <div className="sec-bar-layer-actions">
        {activeCaption && !isSocialCardCaption(activeCaption) && (
          <>
            <button
              type="button"
              className="layer-action-btn layer-action-btn-case"
              title="Toggle Text Case (ALL CAPS / Sentence case / lowercase)"
              aria-label="Toggle Text Case"
              onClick={handleToggleTextCase}
            >
              <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.86rem' }}>Aa</span>
            </button>
            <div className="layer-action-divider" />

            <button
              type="button"
              className="layer-action-btn layer-action-btn-align"
              title={`Text Alignment: ${(activeCaption.align || 'center').toUpperCase()} (Click to cycle Left, Center, Right)`}
              aria-label={`Text Alignment: ${activeCaption.align || 'center'}`}
              onClick={handleCycleTextAlignment}
            >
              {(activeCaption.align === 'left') ? (
                <AlignLeft style={{ width: 16, height: 16 }} />
              ) : (activeCaption.align === 'right') ? (
                <AlignRight style={{ width: 16, height: 16 }} />
              ) : (
                <AlignCenter style={{ width: 16, height: 16 }} />
              )}
            </button>
            <div className="layer-action-divider" />
          </>
        )}

        {activeImageLayer && (
          <>
            <button
              type="button"
              className={`layer-action-btn layer-action-btn-crop ${activeImageLayer.fitMode === 'crop' ? 'active' : ''}`}
              title={activeImageLayer.fitMode === 'crop' ? 'Exit Crop' : 'Crop'}
              aria-label={activeImageLayer.fitMode === 'crop' ? 'Exit Crop' : 'Crop'}
              onClick={() => updateActiveImageLayer('fitMode', activeImageLayer.fitMode === 'crop' ? 'fit' : 'crop')}
            >
              <Crop style={{ width: 16, height: 16 }} />
            </button>
            <div className="layer-action-divider" />

            <button
              type="button"
              className={`layer-action-btn layer-action-btn-flip ${activeImageLayer.flipX ? 'active' : ''}`}
              title="Flip Horizontal (Mirror)"
              aria-label="Flip Horizontal"
              onClick={handleFlipActiveLayer}
            >
              <FlipHorizontal style={{ width: 16, height: 16 }} />
            </button>
            <div className="layer-action-divider" />
          </>
        )}

        <button
          type="button"
          className="layer-action-btn layer-action-btn-rotate"
          title="Rotate 90°"
          aria-label="Rotate 90°"
          onClick={handleRotateLayer}
        >
          <RotateCw style={{ width: 16, height: 16 }} />
        </button>

        <div className="layer-action-divider" />

        <button
          type="button"
          className="layer-action-btn layer-action-btn-duplicate"
          title="Duplicate Layer"
          aria-label="Duplicate Layer"
          onClick={() => handleDuplicateLayer()}
        >
          <Copy style={{ width: 16, height: 16 }} />
        </button>

        <div className="layer-action-divider" />

        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <button
            type="button"
            className={`layer-action-btn layer-action-btn-layers ${showLayerMenu ? 'active' : ''}`}
            title="Layer Order"
            aria-label="Layer Order"
            onClick={() => setShowLayerMenu(!showLayerMenu)}
          >
            <Layers style={{ width: 16, height: 16 }} />
          </button>

          {showLayerMenu && (
            <div
              className="sec-bar-layer-order-popover"
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              <button
                type="button"
                className="layer-action-popover-btn"
                title="Bring Forward"
                aria-label="Bring Forward"
                onClick={() => moveLayer(activeLayerId, 'forward')}
              >
                <ArrowUp style={{ width: 14, height: 14 }} />
              </button>
              <div className="layer-action-divider" />
              <button
                type="button"
                className="layer-action-popover-btn"
                title="Send Backward"
                aria-label="Send Backward"
                onClick={() => moveLayer(activeLayerId, 'backward')}
              >
                <ArrowDown style={{ width: 14, height: 14 }} />
              </button>
            </div>
          )}
        </div>

        <div className="layer-action-divider" />

        <button
          type="button"
          className="layer-action-btn layer-action-btn-delete"
          title="Delete Layer"
          aria-label="Delete Layer"
          onClick={() => handleDeleteLayer()}
        >
          <Trash2 style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </>
  );
}
