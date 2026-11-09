import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Image as KonvaImage, Transformer } from 'react-konva';
import { useEditorStore } from '../../../store/useVideoEditorStore';
import { applyMotion, applyPunch } from './nodeMotion';
import { clipCrop } from '../../../utils/clipCrop';
import { dropSlotIndex, fitPlacement, isOnScreen, mediaAttrs } from './previewMath';
import { attachPreviewVideo } from './previewVideo';
import { useFrameEffects } from './useFrameEffects';
import { drawGifFrame, useGifFrames } from './useGifFrames';
import { hasStickerLook, stickerLookImage } from '../../../utils/stickerLook';
import { blurSubjectUrl, hasPhotoPicture, photoNodeAttrs, photoPicture } from '../../../utils/photoLook';
import { SELECTION_PROPS, shadeSelection } from './selectionStyle';

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

  // A sticker's die-cut border and shadow, drawn by the image editor's painting into a picture of
  // the same shape (redrawn when the look or its size on the stage changes).
  const looked = hasStickerLook(item);
  const shownWidth = Math.round((item.width || 0) * (item.scaleX || 1));
  const lookImage = useMemo(
    () => (looked && image && !gifRef.current ? stickerLookImage(image, item) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [looked, image, item.dieCut, item.dieCutColor, item.dieCutWidth, item.shadowSize, item.shadowColor, shownWidth],
  );

  // A photo's filter and background blur, drawn by the image editor's painting into a picture of the
  // same shape (its frame is drawn by the node: photoNodeAttrs). The blur keeps the subject sharp.
  const subjectUrl = blurSubjectUrl(item);
  const [subject, setSubject] = useState(null);
  useEffect(() => {
    if (!subjectUrl) return undefined;
    let alive = true;
    const img = new window.Image();
    img.onload = () => alive && setSubject({ url: subjectUrl, img });
    img.src = subjectUrl;
    return () => { alive = false; };
  }, [subjectUrl]);
  const shownSubject = subject?.url === subjectUrl ? subject.img : null;
  const pictured = hasPhotoPicture(item);
  const photoImage = useMemo(
    () => (pictured && image && !gifRef.current ? photoPicture(image, item, shownSubject) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pictured, image, shownSubject, JSON.stringify(item.filters || null), item.bgBlur],
  );

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
      if (node && (latest.isFreeze || latest.motion) && applyMotion(node, latest, state)) node.getLayer()?.batchDraw();
    });
  }, [item.type, item.startMs, item.endMs]);

  // The crop, in the pixels of whatever is showing (it changes size when a filter or green screen
  // turns on), and again when photo motion goes off. Videos and freeze frames keep it up to date as they play (applyMotion).
  const crop = clipCrop(item);
  useLayoutEffect(() => {
    const node = imageRef.current;
    if (node && applyPunch(node, 1, crop)) node.getLayer()?.batchDraw();
  }, [crop.x, crop.y, crop.width, crop.height, image, effectImage, lookImage, photoImage, item.motion]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isSelected && trRef.current && imageRef.current) {
      trRef.current.nodes([imageRef.current]);
      shadeSelection(trRef.current);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <KonvaImage
        ref={imageRef}
        image={lookImage || photoImage || effectImage || image}
        {...mediaAttrs(item)}
        {...photoNodeAttrs(item)}
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
          // A flipped clip's node has a negative scale; the flip itself is kept in flipX/flipY.
          onChange({ ...item, x: node.x(), y: node.y(), scaleX: Math.abs(node.scaleX()), scaleY: Math.abs(node.scaleY()), rotation: node.rotation() });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          {...SELECTION_PROPS}
          // Limit minimum size
          boundBoxFunc={(oldBox, newBox) => (newBox.width < 10 || newBox.height < 10 ? oldBox : newBox)}
        />
      )}
    </React.Fragment>
  );
};

export default CanvasMedia;
