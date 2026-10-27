import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { Rect, Text as KonvaText, Transformer, Group } from 'react-konva';
import { hasTextBox, textAttrs, textBoxAttrs } from '../../../utils/textLayer';
import { textResize } from './previewMath';
import { useTextPlayback } from './useTextPlayback';

// A text clip on the preview, with its optional background box, drawn from utils/textLayer (the
// export draws its text with the same definitions). Tapping it starts editing (onEditStart);
// resizing it changes the font size.
const CanvasText = ({ item, isSelected, onSelect, onChange, onEditStart }) => {
  const textRef = useRef(null);
  const groupRef = useRef(null);
  const bgRectRef = useRef(null);
  const trRef = useRef(null);
  const itemRef = useRef(item);
  const attrs = textAttrs(item);
  const boxed = hasTextBox(item);

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
  }, [boxed]);

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
  const boxAroundNode = (node) => ({
    ...textBoxAttrs(item, { x: node.x(), y: node.y(), width: node.width(), height: node.height(), scaleX: node.scaleX(), scaleY: node.scaleY() }),
    rotation: node.rotation(),
  });

  // The box needs the text's measured size, which only exists once the node is mounted: fit it
  // after every render (the first render can only guess, below).
  useLayoutEffect(() => {
    const textNode = textRef.current;
    if (bgRectRef.current && textNode) {
      bgRectRef.current.setAttrs(boxAroundNode(textNode));
      textNode.getLayer()?.batchDraw();
    }
  });

  // Before the text node has measured itself, size the box from the clip.
  const node = textRef.current;
  const box = textBoxAttrs(item, {
    x: attrs.x,
    y: attrs.y,
    width: item.width || node?.width() || 120,
    height: node?.height() || attrs.fontSize,
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
        {boxed && <Rect ref={bgRectRef} {...box} listening={false} />}
        <KonvaText
          id={`text-${item.id}`}
          ref={textRef}
          {...attrs}
          draggable
          onDragMove={(e) => {
            if (bgRectRef.current) {
              bgRectRef.current.position({ x: e.target.x(), y: e.target.y() });
              e.target.getLayer()?.batchDraw();
            }
          }}
          onTransform={() => {
            if (bgRectRef.current && textRef.current) {
              bgRectRef.current.setAttrs(boxAroundNode(textRef.current));
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
