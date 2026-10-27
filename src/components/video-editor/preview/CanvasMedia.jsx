import React, { useState, useEffect, useRef } from 'react';
import { Image as KonvaImage, Transformer } from 'react-konva';
import { useEditorStore } from '../../../store/useVideoEditorStore';
import { applyMotion } from './nodeMotion';
import { dropSlotIndex, fitPlacement, isOnScreen } from './previewMath';
import { attachPreviewVideo } from './previewVideo';
import { useFrameEffects } from './useFrameEffects';
import { drawGifFrame, useGifFrames } from './useGifFrames';

// A photo, sticker (animated GIFs included) or video on the preview: draggable and resizable when
// selected, shown only during its time on the timeline. Videos play from a hidden <video>
// (previewVideo.js); green screen and filters go through useFrameEffects.
const CanvasMedia = ({ item, isSelected, onSelect, onChange, canvasDimensions }) => {
  const [image, setImage] = useState(null);
  const imageRef = useRef(null);
  const trRef = useRef(null);
  const itemRef = useRef(item);
  const gifRef = useRef(null);

  const { effectImage, drawEffects } = useFrameEffects(item, image, imageRef);

  useEffect(() => {
    itemRef.current = item;
  }, [item]);

  // New media is placed once its size is known (through a ref: it closes over item and onChange).
  const positionMediaRef = useRef(null);
  positionMediaRef.current = (naturalWidth, naturalHeight) => {
    const patch = fitPlacement(item, naturalWidth, naturalHeight, canvasDimensions, useEditorStore.getState().layoutSlots || []);
    if (patch) onChange({ ...item, ...patch });
  };

  useEffect(() => {
    if ((item.type === 'image' || item.type === 'sticker') && item.url) {
      const img = new window.Image();
      img.src = item.url;
      img.onload = () => {
        // An animated GIF may already be showing its decoded frames; keep that canvas.
        setImage(gifRef.current?.canvas || img);
        positionMediaRef.current(img.width, img.height);
      };
      return undefined;
    }
    if (item.type === 'video' && item.url) {
      // itemRef is already this render's item; the video follows later changes through it.
      return attachPreviewVideo({
        item: itemRef.current, itemRef, imageRef, trRef, setImage, drawEffects,
        onMetadata: (w, h) => positionMediaRef.current(w, h),
      });
    }
    return undefined;
  }, [item.url, item.type, item.id, canvasDimensions, drawEffects]);

  useGifFrames(item, itemRef, gifRef, setImage);

  // Photos and stickers: show and hide with the playhead, step GIF frames, and move freeze frames
  // through their transitions. (Videos do this in previewVideo.)
  useEffect(() => {
    if (item.type === 'video') return undefined;
    return useEditorStore.subscribe((state) => {
      const latest = state.items.find((i) => i.id === itemRef.current.id) || itemRef.current;
      const visible = isOnScreen(latest, state.playhead);
      const node = imageRef.current;
      if (node && node.visible() !== visible) {
        node.visible(visible);
        if (trRef.current) trRef.current.visible(visible);
        node.getLayer()?.batchDraw();
      }
      if (node && visible && drawGifFrame(gifRef.current, state.playhead, latest)) node.getLayer()?.batchDraw();
      if (node && latest.isFreeze && applyMotion(node, latest, state)) node.getLayer()?.batchDraw();
    });
  }, [item.type, item.startMs, item.endMs]);

  useEffect(() => {
    if (isSelected && trRef.current && imageRef.current) {
      trRef.current.nodes([imageRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <KonvaImage
        ref={imageRef}
        image={effectImage || image}
        x={item.x || 0}
        y={item.y || 0}
        width={item.width || 200}
        height={item.height || 200}
        crop={item.crop}
        scaleX={item.scaleX || 1}
        scaleY={item.scaleY || 1}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          const x = e.target.x();
          const y = e.target.y();
          // The layout panel it was dropped on (used for z-order and background colour targets).
          onChange({ ...item, slotIndex: dropSlotIndex(item, x, y, useEditorStore.getState().layoutSlots || []), x, y });
        }}
        onTransformEnd={() => {
          const node = imageRef.current;
          onChange({ ...item, x: node.x(), y: node.y(), scaleX: node.scaleX(), scaleY: node.scaleY() });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          // Limit minimum size
          boundBoxFunc={(oldBox, newBox) => (newBox.width < 10 || newBox.height < 10 ? oldBox : newBox)}
        />
      )}
    </React.Fragment>
  );
};

export default CanvasMedia;
