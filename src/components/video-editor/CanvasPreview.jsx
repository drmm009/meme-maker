import React, { useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { useShallow } from 'zustand/react/shallow';
import { drawOrder } from '../../utils/layerOrder';
import CanvasMedia from './preview/CanvasMedia';
import CanvasText from './preview/CanvasText';
import GridOverlay from './preview/GridOverlay';
import { STAGE_WIDTH } from './preview/previewMath';
import { useStageFit } from './preview/useStageFit';
import { useTextEditing } from './preview/useTextEditing';

// Initial stage size before useStageFit measures the space (it then sizes the stage directly).
const INITIAL_SIZE = { width: 800, height: 450 };

// The video editor's Konva preview: every clip on one layer, bottom to top in the same order as
// the export, in 800-wide stage units scaled to fit its container. Clips keep themselves in step
// with the playhead (see preview/).
const CanvasPreview = forwardRef((props, ref) => {
  const { items, activeItemId, setActiveItem, updateItem, canvasAspectRatio, backgroundColor, layoutId } = useEditorStore(
    useShallow(state => ({
      items: state.items,
      activeItemId: state.activeItemId,
      setActiveItem: state.setActiveItem,
      updateItem: state.updateItem,
      canvasAspectRatio: state.canvasAspectRatio,
      backgroundColor: state.backgroundColor,
      layoutId: state.layoutId
    }))
  );
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const stageHeight = STAGE_WIDTH / canvasAspectRatio;
  const logicalDimensions = useMemo(() => ({ width: STAGE_WIDTH, height: STAGE_WIDTH / canvasAspectRatio }), [canvasAspectRatio]);
  const { editingId, startEditing, inputProps } = useTextEditing(updateItem);

  useStageFit(containerRef, stageRef, canvasAspectRatio);

  useImperativeHandle(ref, () => ({
    getStream: () => {
      const canvas = stageRef.current?.getContent().querySelector('canvas');
      return canvas ? canvas.captureStream(60) : null;
    }
  }));

  const select = (id) => (e) => {
    e.cancelBubble = true;
    setActiveItem(id);
  };

  return (
    <div
      className="canvas-container"
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        /* Transparent so the parent glass card shows — no black letterbox */
        backgroundColor: 'transparent',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Stage wrapper: shrink-wraps exactly to stage pixel size so no black gaps */}
      <div id="stage-sink-wrapper" style={{ position: 'relative', width: INITIAL_SIZE.width, height: INITIAL_SIZE.height, flexShrink: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
        {/* MOBILE HACK: Render native videos behind the canvas so the browser compositor doesn't suspend them! */}
        <div id="video-sink" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}></div>

        <Stage
          ref={stageRef}
          width={INITIAL_SIZE.width}
          height={INITIAL_SIZE.height}
          scaleX={INITIAL_SIZE.width / STAGE_WIDTH}
          scaleY={INITIAL_SIZE.height / stageHeight}
          onClick={() => setActiveItem(null)}
          onTap={() => setActiveItem(null)}
          style={{ touchAction: 'none', zIndex: 1 }}
        >
          <Layer id="media-layer">
            {/* Solid background so video export isn't transparent/black */}
            <Rect x={0} y={0} width={STAGE_WIDTH} height={stageHeight} fill={backgroundColor || '#ffffff'} listening={false} />

            {/* All clips stay mounted; each shows itself only during its time on the timeline. */}
            {drawOrder(items).map((item) => (item.type === 'text' ? (
              <CanvasText
                key={item.id}
                item={item}
                isSelected={activeItemId === item.id}
                onSelect={select(item.id)}
                onEditStart={startEditing}
                onChange={(newAttrs) => updateItem(item.id, newAttrs)}
              />
            ) : (
              // Photo, video or sticker
              <CanvasMedia
                key={item.id}
                item={item}
                canvasDimensions={logicalDimensions}
                isSelected={activeItemId === item.id}
                onSelect={select(item.id)}
                onChange={(newAttrs) => updateItem(item.id, newAttrs)}
              />
            )))}
            {layoutId && <GridOverlay layoutId={layoutId} width={STAGE_WIDTH} height={stageHeight} />}
          </Layer>
        </Stage>

        {/* Permanently mounted textarea to capture mobile keyboard reliably */}
        <textarea
          {...inputProps}
          style={{
            position: 'fixed',
            top: '20%',
            left: '50%',
            width: '10px',
            height: '10px',
            fontSize: '16px',
            color: 'transparent',
            background: 'transparent',
            border: 'none',
            caretColor: 'transparent',
            padding: 0,
            margin: 0,
            outline: 'none',
            resize: 'none',
            zIndex: editingId ? 100 : -1,
            opacity: 0,
            pointerEvents: 'none'
          }}
        />
      </div>
    </div>
  );
});

export default CanvasPreview;
