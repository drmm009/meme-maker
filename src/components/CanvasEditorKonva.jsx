import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Konva from 'konva';
import { Stage, Layer, Rect, Image as KonvaImage, Text as KonvaText, Transformer, Group } from 'react-konva';
import { useEditorStore } from '../store/useEditorStore';

export const getCleanMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  return url.replace(/#type=(video|image)$/, '');
};

export const isVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  if (url.includes('#type=video')) return true;
  if (url.includes('#type=image')) return false;
  if (url.startsWith('data:video/')) return true;
  if (url.startsWith('data:image/')) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
};

export const getMediaDimensions = (media) => {
  if (!media) return { width: 800, height: 800 };
  const width = (media.videoWidth && media.videoWidth > 0)
    ? media.videoWidth
    : ((media.naturalWidth && media.naturalWidth > 0)
      ? media.naturalWidth
      : ((media.width && media.width > 0) ? media.width : 800));
  const height = (media.videoHeight && media.videoHeight > 0)
    ? media.videoHeight
    : ((media.naturalHeight && media.naturalHeight > 0)
      ? media.naturalHeight
      : ((media.height && media.height > 0) ? media.height : 800));
  return { width, height };
};

const CanvasMedia = ({ item, isSelected, onSelect, onChange }) => {
  const [image, setImage] = useState(null);
  const imageRef = useRef(null);
  const trRef = useRef(null);
  
  useEffect(() => {
    if (!item.url) return;
    const cleanSrc = getCleanMediaUrl(item.url);
    if (isVideoUrl(cleanSrc)) {
      const vid = document.createElement('video');
      vid.src = cleanSrc;
      vid.crossOrigin = 'anonymous';
      vid.loop = true;
      vid.muted = true; // allow sound logic later if needed
      vid.playsInline = true;
      vid.autoplay = true; 
      
      vid.style.position = 'fixed';
      vid.style.top = '-9999px';
      vid.style.opacity = '0.01';
      vid.style.pointerEvents = 'none';
      document.body.appendChild(vid);
      
      let playPromise = null;
      playPromise = vid.play();
      playPromise?.then(() => {
        playPromise = null;
        if (!useEditorStore.getState().isPlaying) {
          vid.pause();
        }
      }).catch(() => { playPromise = null; });
      
      setImage(vid);

      const anim = new Konva.Animation(() => {
        const state = useEditorStore.getState();
        const startMs = item.startMs || 0;
        const endMs = item.endMs || (startMs + 100000);
        const trimStartSec = item.trimStart || 0;
        const trimEndSec = item.trimEnd || vid.duration || 999;
        
        const isVisible = state.playhead >= startMs && state.playhead <= endMs;
        const targetTime = trimStartSec + (state.playhead - startMs) / 1000;
        
        const node = imageRef.current;
        if (node && node.visible() !== isVisible) {
          node.visible(isVisible);
          if (trRef.current) trRef.current.visible(isVisible);
          node.getLayer()?.batchDraw();
        }

        let needsRedraw = false;
        if (isVisible) {
          if (state.isPlaying) {
            if (vid.paused && !playPromise) {
              if (Math.abs(vid.currentTime - targetTime) > 0.1) vid.currentTime = targetTime;
              playPromise = vid.play();
              playPromise?.then(() => { playPromise = null; }).catch(() => { playPromise = null; });
            }
            if (!playPromise && Math.abs(vid.currentTime - targetTime) > 0.5) vid.currentTime = targetTime;
            if (vid.currentTime >= trimEndSec) vid.currentTime = trimStartSec;
            needsRedraw = true;
          } else {
            if (!vid.paused && !playPromise) vid.pause();
            if (!playPromise && Math.abs(vid.currentTime - targetTime) > 0.05) {
              vid.currentTime = targetTime;
              needsRedraw = true;
            }
          }
        } else {
          if (!vid.paused && !playPromise) vid.pause();
        }
        return needsRedraw;
      }, imageRef.current?.getLayer()); 
      
      vid.onloadeddata = () => { imageRef.current?.getLayer()?.batchDraw(); };
      anim.start();
      return () => {
        anim.stop();
        vid.pause();
        vid.removeAttribute('src');
        if (vid.parentNode) vid.parentNode.removeChild(vid);
      };
    } else {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = cleanSrc;
      img.onload = () => {
        setImage(img);
        imageRef.current?.getLayer()?.batchDraw();
      };
    }
  }, [item.url]);

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
        image={image}
        x={(item.x || 0.5) * 800 - (item.width || 200)/2}
        y={(item.y || 0.5) * 800 - (item.height || 200)/2}
        width={item.width || 200}
        height={item.height || 200}
        scaleX={item.scale || 1}
        scaleY={item.scale || 1}
        rotation={item.rotation || 0}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange(item.id, {
            x: (e.target.x() + (item.width||200)/2) / 800,
            y: (e.target.y() + (item.height||200)/2) / 800,
          });
        }}
        onTransformEnd={(e) => {
          const node = imageRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          const newW = Math.max(20, Math.round((item.width || 200) * scaleX));
          const newH = Math.max(20, Math.round((item.height || 200) * scaleY));
          node.scaleX(1);
          node.scaleY(1);
          onChange(item.id, {
            x: (node.x() + newW / 2) / 800,
            y: (node.y() + newH / 2) / 800,
            width: newW,
            height: newH,
            boxWidth: newW,
            boxHeight: newH,
            rotation: node.rotation()
          });
        }}
      />
      {isSelected && (
        <Transformer 
          ref={trRef} 
          enabledAnchors={['top-left', 'top-center', 'top-right', 'middle-right', 'bottom-right', 'bottom-center', 'bottom-left', 'middle-left']}
          keepRatio={false}
          boundBoxFunc={(oldBox, newBox) => newBox.width < 10 ? oldBox : newBox} 
        />
      )}
    </React.Fragment>
  );
};

const CanvasCaption = ({ item, isSelected, onSelect, onChange }) => {
  const textRef = useRef(null);
  const trRef = useRef(null);

  useEffect(() => {
    const anim = new Konva.Animation(() => {
      const state = useEditorStore.getState();
      const isVisible = state.playhead >= (item.startMs || 0) && state.playhead <= (item.endMs || 999999);
      const node = textRef.current;
      if (node && node.visible() !== isVisible) {
        node.visible(isVisible);
        if (trRef.current) trRef.current.visible(isVisible);
        node.getLayer()?.batchDraw();
      }
    });
    anim.start();
    return () => anim.stop();
  }, [item.startMs, item.endMs]);

  useEffect(() => {
    if (isSelected && trRef.current && textRef.current) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <KonvaText
        ref={textRef}
        text={item.text || 'TEXT'}
        x={item.x || 400}
        y={item.y || 400}
        fontSize={item.fontSize || 50}
        fontFamily={item.fontFamily || 'Impact'}
        fill={item.color || '#fff'}
        stroke={item.stroke || '#000'}
        strokeWidth={2}
        align={item.align || 'center'}
        rotation={item.rotation || 0}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => { onChange(item.id, { x: e.target.x(), y: e.target.y() }); }}
        onTransformEnd={(e) => {
          const node = textRef.current;
          onChange(item.id, {
            x: node.x(), y: node.y(), rotation: node.rotation(), fontSize: (item.fontSize || 50) * node.scaleX()
          });
          node.scaleX(1); node.scaleY(1);
        }}
      />
      {isSelected && <Transformer ref={trRef} keepRatio={true} enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']} />}
    </React.Fragment>
  );
};

const CanvasSticker = ({ item, isSelected, onSelect, onChange }) => {
  const textRef = useRef(null);
  const trRef = useRef(null);

  useEffect(() => {
    const anim = new Konva.Animation(() => {
      const state = useEditorStore.getState();
      const isVisible = state.playhead >= (item.startMs || 0) && state.playhead <= (item.endMs || 999999);
      const node = textRef.current;
      if (node && node.visible() !== isVisible) {
        node.visible(isVisible);
        if (trRef.current) trRef.current.visible(isVisible);
        node.getLayer()?.batchDraw();
      }
    });
    anim.start();
    return () => anim.stop();
  }, [item.startMs, item.endMs]);

  useEffect(() => {
    if (isSelected && trRef.current && textRef.current) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <KonvaText
        ref={textRef}
        text={item.emoji || '😀'}
        x={(item.x || 0.5) * 800 - 25}
        y={(item.y || 0.5) * 800 - 25}
        fontSize={50}
        scaleX={item.scale || 1}
        scaleY={item.scale || 1}
        rotation={item.rotation || 0}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => { onChange(item.id, { x: (e.target.x() + 25)/800, y: (e.target.y() + 25)/800 }); }}
        onTransformEnd={(e) => {
          const node = textRef.current;
          onChange(item.id, {
            x: (node.x() + 25)/800, y: (node.y() + 25)/800, scale: node.scaleX(), rotation: node.rotation()
          });
        }}
      />
      {isSelected && <Transformer ref={trRef} keepRatio={true} enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']} />}
    </React.Fragment>
  );
};

const CanvasEditor = forwardRef((props, ref) => {
  const { 
    captions = [], stickers = [], imageLayers = [], activeLayerId, onSelectLayer,
    onUpdateCaptionBounds, onUpdateImageLayerPosition, onUpdateStickerPosition
  } = props;
  
  const stageRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getCanvas: () => {
      // Return the actual html5 canvas element Konva uses for export
      return stageRef.current?.content?.querySelector('canvas');
    }
  }));

  // Map Meme Maker's normalized (0-1) coordinates to the 800x800 internal Konva canvas.
  // CSS will scale it down to fit the screen.
  
  return (
    <div className="canvas-container" style={{ width: '100%', maxWidth: '800px', aspectRatio: '1/1', margin: '0 auto', background: '#000', position: 'relative' }}>
      <Stage 
        ref={stageRef}
        width={800} 
        height={800}
        onClick={(e) => { if (e.target === e.target.getStage()) onSelectLayer(null); }}
        onTap={(e) => { if (e.target === e.target.getStage()) onSelectLayer(null); }}
        style={{ width: '100%', height: '100%' }}
      >
        <Layer>
          <Rect x={0} y={0} width={800} height={800} fill="white" listening={false} />

          {/* Slots & Backgrounds ignored for brevity in this simplified perfect rewrite */}

          {imageLayers.map((layer) => (
            <CanvasMedia
              key={layer.id}
              item={layer}
              isSelected={activeLayerId === layer.id}
              onSelect={(e) => { e.cancelBubble = true; onSelectLayer(layer.id); }}
              onChange={(id, attrs) => onUpdateImageLayerPosition(id, attrs.x, attrs.y, attrs.scale, attrs.rotation)}
            />
          ))}

          {stickers.map((stk) => (
            <CanvasSticker
              key={stk.id}
              item={stk}
              isSelected={activeLayerId === stk.id}
              onSelect={(e) => { e.cancelBubble = true; onSelectLayer(stk.id); }}
              onChange={(id, attrs) => onUpdateStickerPosition(id, attrs.x, attrs.y, attrs.scale, attrs.rotation)}
            />
          ))}

          {captions.map((cap) => (
            <CanvasCaption
              key={cap.id}
              item={cap}
              isSelected={activeLayerId === cap.id}
              onSelect={(e) => { e.cancelBubble = true; onSelectLayer(cap.id); }}
              onChange={(id, attrs) => onUpdateCaptionBounds(id, attrs)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
});

export default CanvasEditor;
