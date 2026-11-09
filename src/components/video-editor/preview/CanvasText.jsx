import React, { useEffect, useReducer, useRef, useState } from 'react';
import Konva from 'konva';
import { Image as KonvaImage, Transformer, Group } from 'react-konva';
import { onTextFontsLoaded, scaleTextLook, textBitmap, textImageAttrs } from '../../../utils/textBitmap';
import { clipOpacity } from '../../../model/videoProject';
import { useTextPlayback } from './useTextPlayback';
import { SELECTION_PROPS, shadeSelection } from './selectionStyle';

// Picture pixels per stage unit for the preview: the stage's scale on this screen, in quarter steps
// (so resizing the window doesn't redraw every text for each pixel).
const previewScale = (stage) => {
  const s = (stage?.scaleX() || 0.5) * (Konva.pixelRatio || 1);
  return Math.min(3, Math.max(0.5, Math.ceil(s * 4) / 4));
};

// A text clip on the preview: the image editor's caption painter draws it into a picture
// (utils/textBitmap), shown here as one image. Tapping it starts editing (onEditStart); the
// corner handles resize the text (font, outline, shadow and wrap together).
const CanvasText = ({ item, isSelected, onSelect, onChange, onEditStart }) => {
  const nodeRef = useRef(null);
  const groupRef = useRef(null);
  const trRef = useRef(null);
  const itemRef = useRef(item);
  const [scale, setScale] = useState(1);
  const [, redraw] = useReducer((n) => n + 1, 0);
  const bitmap = textBitmap(item, scale);

  useEffect(() => {
    itemRef.current = item;
  }, [item]);

  // The selection frame and handles go round the text's box, not the room the picture keeps for
  // the outline, shadow and effects.
  const bitmapRef = useRef(bitmap);
  bitmapRef.current = bitmap;
  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    node.getSelfRect = () => {
      const b = bitmapRef.current;
      return { x: b.boxX, y: b.boxY, width: b.boxWidth, height: b.boxHeight };
    };
  }, []);

  // The stage's scale is known once mounted, and changes as the preview resizes.
  useEffect(() => {
    const stage = groupRef.current?.getStage();
    if (!stage) return undefined;
    const update = () => setScale(previewScale(stage));
    update();
    stage.on('scaleXChange.text', update);
    return () => stage.off('scaleXChange.text', update);
  }, []);

  // A web font that arrives after the first drawing: draw again with it.
  useEffect(() => onTextFontsLoaded(redraw), []);

  useTextPlayback(item, { itemRef, groupRef, nodeRef, trRef, scale });

  useEffect(() => {
    if (isSelected && trRef.current && nodeRef.current) {
      trRef.current.nodes([nodeRef.current]);
      shadeSelection(trRef.current);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);
  useEffect(() => {
    trRef.current?.forceUpdate();
  });

  const startEdit = (e) => {
    if (onEditStart) onEditStart(item);
    onSelect(e);
  };

  return (
    <React.Fragment>
      {/* The clip's opacity sits outside the group its animation fades, so the two multiply. */}
      <Group opacity={clipOpacity(item)}>
        <Group ref={groupRef}>
          <KonvaImage
            id={`text-${item.id}`}
            ref={nodeRef}
            {...textImageAttrs(item, bitmap)}
            draggable
            onClick={startEdit}
            onTap={startEdit}
            onDragEnd={(e) => onChange({ ...item, x: e.target.x(), y: e.target.y() })}
            onTransformEnd={() => {
              const node = nodeRef.current;
              const k = node.scaleX();
              node.scaleX(1);
              node.scaleY(1);
              onChange({ ...item, x: node.x(), y: node.y(), rotation: node.rotation(), ...scaleTextLook(item, k) });
            }}
          />
        </Group>
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          {...SELECTION_PROPS}
          keepRatio={true}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(oldBox, newBox) => (newBox.width < 20 || newBox.height < 20 ? oldBox : newBox)}
        />
      )}
    </React.Fragment>
  );
};

export default CanvasText;
