import React, { useEffect, useRef } from 'react';
import { Rect, Text as KonvaText, Transformer, Group } from 'react-konva';
import { textBoxAround, textResize, textStyle } from './previewMath';
import { useTextPlayback } from './useTextPlayback';

// A text clip on the preview, with its optional background box. Tapping it starts editing
// (onEditStart); resizing it changes the font size.
const CanvasText = ({ item, isSelected, onSelect, onChange, onEditStart }) => {
  const textRef = useRef(null);
  const groupRef = useRef(null);
  const bgRectRef = useRef(null);
  const trRef = useRef(null);
  const itemRef = useRef(item);
  const style = textStyle(item);

  useEffect(() => {
    itemRef.current = item;
  }, [item]);

  // A background added while the text is off screen mounts visible; match it to the text.
  useEffect(() => {
    const rect = bgRectRef.current;
    const node = textRef.current;
    if (rect && node && rect.visible() !== node.visible()) {
      rect.visible(node.visible());
      rect.getLayer()?.batchDraw();
    }
  }, [style.hasBg]);

  useTextPlayback(item, { itemRef, groupRef, textRef, bgRectRef, trRef });

  useEffect(() => {
    if (isSelected && trRef.current && textRef.current) {
      trRef.current.nodes([textRef.current]);
      trRef.current.forceUpdate();
      trRef.current.getLayer()?.batchDraw();

      // Ensure the transformer updates AFTER any dynamic web fonts finish loading
      document.fonts.ready.then(() => {
        if (trRef.current && textRef.current) {
          trRef.current.forceUpdate();
          trRef.current.getLayer()?.batchDraw();
        }
      });
    }
  }, [isSelected, item.text, item.fontFamily, item.fontSize, item.width]);

  // The background box around the text node as it is now (dragged, scaled, rotated).
  const boxAroundNode = (node) => textBoxAround({
    x: node.x(), y: node.y(), width: node.width(), height: node.height(), scaleX: node.scaleX(), scaleY: node.scaleY()
  });

  const node = textRef.current;
  const box = textBoxAround({
    x: style.x,
    y: style.y,
    width: item.width || node?.width() || 120,
    height: node?.height() || style.fontSize,
    scaleX: node?.scaleX() || 1,
    scaleY: node?.scaleY() || 1,
  });
  const startEdit = (e) => {
    if (onEditStart) onEditStart(item);
    onSelect(e);
  };

  return (
    <React.Fragment>
      <Group ref={groupRef}>
        {style.hasBg && (
          <Rect
            ref={bgRectRef}
            {...box}
            fill={style.bgFill}
            cornerRadius={6}
            rotation={item.rotation || 0}
            listening={false}
          />
        )}
        <KonvaText
          id={`text-${item.id}`}
          ref={textRef}
          text={style.text}
          x={style.x}
          y={style.y}
          width={style.width}
          fontSize={style.fontSize}
          fontFamily={style.fontFamily}
          fontStyle="bold"
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          letterSpacing={style.letterSpacing}
          lineJoin="miter"
          miterLimit={2}
          align={style.align}
          draggable
          onDragMove={(e) => {
            if (bgRectRef.current) {
              const { x, y } = boxAroundNode(e.target);
              bgRectRef.current.position({ x, y });
              e.target.getLayer()?.batchDraw();
            }
          }}
          onTransform={() => {
            if (bgRectRef.current && textRef.current) {
              bgRectRef.current.setAttrs({ ...boxAroundNode(textRef.current), rotation: textRef.current.rotation() });
              textRef.current.getLayer()?.batchDraw();
            }
          }}
          onClick={startEdit}
          onTap={startEdit}
          onDragEnd={(e) => {
            onChange({ ...item, x: e.target.x(), y: e.target.y() });
          }}
          onTransformEnd={() => {
            const t = textRef.current;
            onChange({ ...item, ...textResize(item, { x: t.x(), y: t.y(), rotation: t.rotation(), scaleX: t.scaleX() }) });
            // Reset scale to 1 to keep text crisp for the next render
            t.scaleX(1);
            t.scaleY(1);
          }}
        />
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          keepRatio={true}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(oldBox, newBox) => (newBox.width < 20 || newBox.height < 20 ? oldBox : newBox)}
        />
      )}
    </React.Fragment>
  );
};

export default CanvasText;
