import React, { useEffect, useReducer, useRef, useState } from 'react';
import Konva from 'konva';
import { Image as KonvaImage, Transformer, Group, Line, Rect } from 'react-konva';
import { onTextFontsLoaded, textBitmap, textCaret, textImageAttrs, textIndexAt, textSelectionBoxes } from '../../../utils/textBitmap';
import { wordAt } from '../../canvas/render/captionTextLayout';
import { useEditorStore } from '../../../store/useVideoEditorStore';
import { clipOpacity } from '../../../model/videoProject';
import { useTextPlayback } from './useTextPlayback';
import { SELECTION_PROPS, decorateSelection } from './selectionStyle';
import { useTextGestures } from './useTextGestures';

// Picture pixels per stage unit for the preview: the stage's scale on this screen, in quarter steps
// (so resizing the window doesn't redraw every text for each pixel).
const previewScale = (stage) => {
  const s = (stage?.scaleX() || 0.5) * (Konva.pixelRatio || 1);
  return Math.min(3, Math.max(0.5, Math.ceil(s * 4) / 4));
};

const CARET_BLINK_MS = 530;

// The text cursor while the clip is typed into: a thin orange bar at `caret` (textCaret: from the
// box's top-left, before the clip turns), blinking, and solid again whenever it moves. Only on the
// preview: the export draws its own scene.
function TextCaret({ attrs, caret, width }) {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    node.visible(true);
    node.getLayer()?.batchDraw();
    const timer = setInterval(() => {
      node.visible(!node.visible());
      node.getLayer()?.batchDraw();
    }, CARET_BLINK_MS);
    return () => clearInterval(timer);
  }, [caret.x, caret.y]);
  return (
    <Group x={attrs.x} y={attrs.y} rotation={attrs.rotation} listening={false}>
      <Rect
        ref={ref}
        x={caret.x}
        y={caret.y}
        width={width}
        height={caret.height}
        offsetX={width / 2}
        offsetY={caret.height / 2}
        rotation={caret.rotation}
        cornerRadius={width / 2}
        fill="#ff5a36"
        shadowColor="#000"
        shadowOpacity={0.45}
        shadowBlur={2}
        shadowForStrokeEnabled={false}
      />
    </Group>
  );
}

// The selected letters while the clip is typed into: a soft orange highlight over them (boxes from
// textSelectionBoxes, placed as TextCaret's).
function TextHighlight({ attrs, boxes }) {
  return (
    <Group x={attrs.x} y={attrs.y} rotation={attrs.rotation} listening={false}>
      {boxes.map((box, i) => (
        <Rect
          key={i}
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          offsetX={box.width / 2}
          offsetY={box.height / 2}
          rotation={box.rotation}
          fill="#ff5a36"
          opacity={0.38}
        />
      ))}
    </Group>
  );
}

// A text clip on the preview: the image editor's caption painter draws it into a picture
// (utils/textBitmap), shown here as one image. Tapping it starts editing (onEditStart); while it's
// typed into, `selection` is where the cursor is in its text, or the letters selected (TextCaret,
// TextHighlight show them), and a tap on it moves the cursor there, a double tap selects the word
// (onPlaceCaret). Its handles, pinch and drag work as the image editor's captions (useTextGestures).
const CanvasText = ({ item, isSelected, onSelect, onChange, onEditStart, canvasDimensions, selection = null, onPlaceCaret }) => {
  const nodeRef = useRef(null);
  const groupRef = useRef(null);
  const trRef = useRef(null);
  const itemRef = useRef(item);
  const [scale, setScale] = useState(1);
  const [, redraw] = useReducer((n) => n + 1, 0);
  const bitmapRef = useRef(null);
  const { liveRef, guides, handlers, boundBoxFunc, anchorDragBoundFunc } = useTextGestures({ item, isSelected, nodeRef, trRef, bitmapRef, scale, canvas: canvasDimensions, onChange });
  // Mid-gesture the node already shows the live look; a render then keeps it.
  const shown = liveRef.current ? { ...item, ...liveRef.current } : item;
  const bitmap = textBitmap(shown, scale);
  const attrs = textImageAttrs(shown, bitmap);
  const selected = selection && selection.start !== selection.end;
  const caret = selection && !selected ? textCaret(shown, scale, selection.end) : null;
  const highlight = selected ? textSelectionBoxes(shown, scale, selection.start, selection.end) : null;

  useEffect(() => {
    itemRef.current = item;
  }, [item]);

  // The selection frame and handles go round the text's box, not the room the picture keeps for
  // the outline, shadow and effects.
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
      decorateSelection(trRef.current, {
        onDuplicate: () => useEditorStore.getState().duplicateItem(item.id),
        onDelete: () => useEditorStore.getState().removeItem(item.id),
      });
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, item.id]);
  useEffect(() => {
    trRef.current?.forceUpdate();
  });

  // Where in the text a tap on the clip landed (from the pointer, through the clip's own turn,
  // scale and animation).
  const indexAtPointer = () => {
    const node = nodeRef.current;
    const pointer = node?.getStage()?.getPointerPosition();
    if (!node || !pointer) return null;
    const local = node.getAbsoluteTransform().copy().invert().point(pointer);
    return textIndexAt(shown, scale, local.x - bitmap.boxX, local.y - bitmap.boxY);
  };

  const startEdit = (e) => {
    // Already typed into: the tap moves the cursor instead.
    if (selection && onPlaceCaret) {
      const at = indexAtPointer();
      if (at !== null) onPlaceCaret(at);
      return;
    }
    if (onEditStart) onEditStart(item);
    onSelect(e);
  };
  const selectWord = () => {
    const at = selection && onPlaceCaret ? indexAtPointer() : null;
    if (at === null) return;
    const [start, end] = wordAt(shown.text ?? '', at);
    onPlaceCaret(start, end);
  };
  // While typed into, pressing the clip keeps the keyboard: the hidden text box stays focused.
  const keepFocus = (e) => {
    if (selection) e.evt.preventDefault();
  };

  return (
    <React.Fragment>
      {/* The clip's opacity sits outside the group its animation fades, so the two multiply. */}
      <Group opacity={clipOpacity(item)}>
        <Group ref={groupRef}>
          <KonvaImage
            id={`text-${item.id}`}
            ref={nodeRef}
            {...attrs}
            draggable
            onClick={startEdit}
            onTap={startEdit}
            onDblClick={selectWord}
            onDblTap={selectWord}
            onMouseDown={keepFocus}
            onDragMove={handlers.onDragMove}
            onDragEnd={handlers.onDragEnd}
            onTransform={handlers.onTransform}
            onTransformEnd={handlers.onTransformEnd}
          />
          {/* About 2.5 screen pixels wide at any zoom (scale is picture pixels per stage unit). */}
          {highlight && <TextHighlight attrs={attrs} boxes={highlight} />}
          {caret && <TextCaret attrs={attrs} caret={caret} width={(2.5 * (Konva.pixelRatio || 1)) / scale} />}
        </Group>
      </Group>
      {/* Centre guides while a drag has snapped the text onto a centre line. */}
      {guides && canvasDimensions && (
        <Group listening={false}>
          {guides.vertical !== null && <Line points={[guides.vertical, 0, guides.vertical, canvasDimensions.height]} stroke="#ff5a36" strokeWidth={1.5} strokeScaleEnabled={false} dash={[6, 4]} />}
          {guides.horizontal !== null && <Line points={[0, guides.horizontal, canvasDimensions.width, guides.horizontal]} stroke="#ff5a36" strokeWidth={1.5} strokeScaleEnabled={false} dash={[6, 4]} />}
        </Group>
      )}
      {isSelected && (
        <Transformer
          ref={trRef}
          {...SELECTION_PROPS}
          keepRatio={true}
          enabledAnchors={['middle-left', 'middle-right', 'bottom-left', 'bottom-right']}
          flipEnabled={false}
          boundBoxFunc={boundBoxFunc}
          anchorDragBoundFunc={anchorDragBoundFunc}
        />
      )}
    </React.Fragment>
  );
};

export default CanvasText;
