import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Konva from 'konva';
import { Stage, Layer, Rect, Image as KonvaImage, Text as KonvaText, Transformer } from 'react-konva';
import { useEditorStore } from '../store/useEditorStore';

// Custom component to handle Image and Video rendering on Konva Canvas
const CanvasMedia = ({ item, isSelected, onSelect, onChange, canvasDimensions }) => {
  const [image, setImage] = useState(null);
  const imageRef = useRef(null);
  const trRef = useRef(null);

  const positionMedia = (naturalWidth, naturalHeight) => {
    if (!item.isPositioned && canvasDimensions) {
      const scale = Math.min(
        (canvasDimensions.width * 0.8) / naturalWidth,
        (canvasDimensions.height * 0.8) / naturalHeight
      );
      const w = naturalWidth * scale;
      const h = naturalHeight * scale;
      const x = (canvasDimensions.width - w) / 2;
      const y = (canvasDimensions.height - h) / 2;
      
      onChange({ ...item, isPositioned: true, x, y, width: w, height: h });
    }
  };

  useEffect(() => {
    if ((item.type === 'image' || item.type === 'sticker') && item.url) {
      const img = new window.Image();
      img.src = item.url;
      img.onload = () => {
        setImage(img);
        positionMedia(img.width, img.height);
      };
    } else if (item.type === 'video' && item.url) {
      const vid = document.createElement('video');
      vid.src = item.url;
      vid.loop = false;
      vid.muted = true;
      vid.playsInline = true;
      vid.autoplay = true; 
      
      // Trick browser anti-throttling by making it slightly visible and fixed off-screen
      vid.style.position = 'fixed';
      vid.style.top = '0';
      vid.style.left = '0';
      vid.style.opacity = '0.01'; // Not 0!
      vid.style.pointerEvents = 'none';
      vid.style.width = '10px'; // Not 1px!
      vid.style.height = '10px';
      vid.style.zIndex = '-9999';
      document.body.appendChild(vid);
      
      vid.currentTime = 0.001; 
      
      // Track if play promise is pending
      let playPromise = null;

      // Force mobile decode pipeline
      playPromise = vid.play();
      playPromise?.then(() => {
        playPromise = null;
        if (!useEditorStore.getState().isPlaying) {
          vid.pause();
        }
        const layer = imageRef.current?.getLayer();
        if (layer) layer.batchDraw();
      }).catch(() => {
        playPromise = null;
      });
      
      setImage(vid);

      // Animation loop strictly for syncing time and redrawing frames
      const layer = imageRef.current?.getLayer();
      const anim = new Konva.Animation(() => {
        const state = useEditorStore.getState();
        const latestItem = state.items.find(i => i.id === item.id) || item;
        
        // Sync speed and mute state
        const targetRate = latestItem.playbackRate || 1;
        if (vid.playbackRate !== targetRate) vid.playbackRate = targetRate;
        const targetMuted = latestItem.muted || false;
        if (vid.muted !== targetMuted) vid.muted = targetMuted;

        const relativeTimeMs = state.playhead - latestItem.startMs;
        const trimStartSec = (latestItem.trimStartMs || 0) / 1000;
        const mediaTimeSec = trimStartSec + ((relativeTimeMs / 1000) * targetRate);
        
        // Handle visibility dynamically without React
        const isVisible = relativeTimeMs >= 0 && state.playhead <= latestItem.endMs;
        const node = imageRef.current;
        if (node && node.visible() !== isVisible) {
          node.visible(isVisible);
          if (trRef.current) trRef.current.visible(isVisible);
          node.getLayer()?.batchDraw();
        }

        let needsRedraw = false;

        // If within the item's duration and meant to be visible
        if (isVisible) {
          if (state.isPlaying) {
            // Only attempt play if paused and no pending play request
            if (vid.paused && !playPromise) {
              // Ensure we start from the exact time before playing
              if (Math.abs(vid.currentTime - mediaTimeSec) > 0.1) {
                  vid.currentTime = mediaTimeSec;
              }
              playPromise = vid.play();
              playPromise?.then(() => { playPromise = null; }).catch(() => { playPromise = null; });
            }
            
            // Hard sync ONLY if drift is massive (> 1.0s). 
            // Setting currentTime constantly during playback flushes the browser decode buffer and causes severe lag!
            if (!playPromise && Math.abs(vid.currentTime - mediaTimeSec) > 1.0) {
              vid.currentTime = mediaTimeSec;
            }
            needsRedraw = true; // MUST redraw every frame while playing!
          } else {
            // Paused / Scrubbing
            if (!vid.paused && !playPromise) {
              vid.pause();
            }
            // Scrubbing sync (tight sync is fine here because video is paused)
            if (!playPromise && Math.abs(vid.currentTime - mediaTimeSec) > 0.05) {
              vid.currentTime = mediaTimeSec;
              needsRedraw = true;
            }
          }
        } else {
          // Out of bounds - ensure it's paused
          if (!vid.paused && !playPromise) {
            vid.pause();
          }
        }

        return needsRedraw;
      }, layer); 
      
      // Ensure first frame draws when video is ready
      vid.onloadedmetadata = () => {
        positionMedia(vid.videoWidth, vid.videoHeight);
      };
      vid.onloadeddata = () => {
        const layer = imageRef.current?.getLayer();
        if (layer) layer.batchDraw();
      };
      vid.onseeked = () => {
        const layer = imageRef.current?.getLayer();
        if (layer) layer.batchDraw();
      };
      vid.oncanplay = () => {
        const layer = imageRef.current?.getLayer();
        if (layer) layer.batchDraw();
      };

      anim.start();
      return () => {
        anim.stop();
        vid.pause();
        vid.removeAttribute('src'); // cleanup
        if (vid.parentNode) {
          vid.parentNode.removeChild(vid);
        }
      };
    }
  }, [item.url, item.type, canvasDimensions]);

  // Setup Transformer when selected
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
        x={item.x || 0}
        y={item.y || 0}
        width={item.width || 200}
        height={item.height || 200}
        scaleX={item.scaleX || 1}
        scaleY={item.scaleY || 1}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            ...item,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = imageRef.current;
          onChange({
            ...item,
            x: node.x(),
            y: node.y(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY()
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

// Custom Text Component to handle visibility outside React render cycle
const CanvasText = ({ item, isSelected, onSelect, onChange }) => {
  const textRef = useRef(null);
  const trRef = useRef(null);

  useEffect(() => {
    const anim = new Konva.Animation(() => {
      const state = useEditorStore.getState();
      const latestItem = state.items.find(i => i.id === item.id) || item;
      const isVisible = state.playhead >= latestItem.startMs && state.playhead <= latestItem.endMs;
      
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
        text={item.text || 'Sample Text'}
        x={item.x || 50}
        y={item.y || 50}
        fontSize={32}
        fill={item.color || "#000"}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({ ...item, x: e.target.x(), y: e.target.y() });
        }}
      />
      {isSelected && (
        <Transformer ref={trRef} />
      )}
    </React.Fragment>
  );
};

const CanvasPreview = forwardRef((props, ref) => {
  const { items, activeItemId, setActiveItem, updateItem, canvasAspectRatio, setCanvasDimensions } = useEditorStore();
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 450 });

  useImperativeHandle(ref, () => ({
    getStream: () => {
      const canvas = stageRef.current?.getContent().querySelector('canvas');
      if (canvas) {
        return canvas.captureStream(60);
      }
      return null;
    }
  }));

  // Make canvas responsive to screen size and aspect ratio
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        // We get the available width from the parent container
        const parentArea = containerRef.current.closest('.canvas-area');
        
        // Find max available bounds from the parent area (or window fallback)
        const availableWidth = parentArea ? parentArea.clientWidth - 32 : window.innerWidth - 32; // -32 for padding
        const availableHeight = parentArea ? parentArea.clientHeight - 32 : (window.innerHeight * 0.5) - 32;

        let newWidth = availableWidth;
        let newHeight = availableWidth / canvasAspectRatio;

        // If the calculated height based on width exceeds our available height, we MUST scale down by height instead!
        if (newHeight > availableHeight) {
          newHeight = availableHeight;
          newWidth = newHeight * canvasAspectRatio;
        }

        setDimensions({ width: newWidth, height: newHeight });
        setCanvasDimensions({ width: newWidth, height: newHeight });
      }
    };
    
    window.addEventListener('resize', updateSize);
    updateSize(); // Initial call
    
    return () => window.removeEventListener('resize', updateSize);
  }, [canvasAspectRatio]);

  // We map ALL items so they stay mounted, but pass isVisible down
  return (
      <div 
        className="canvas-container" 
        ref={containerRef}
        style={{ width: dimensions.width, height: dimensions.height, margin: '0 auto', background: '#fff', position: 'relative' }}
      >
        {/* REAL HTML5 CANVAS VIA KONVA */}
        <Stage 
          ref={stageRef}
          width={dimensions.width} 
          height={dimensions.height}
          onClick={() => setActiveItem(null)}
          onTap={() => setActiveItem(null)}
          style={{ background: 'white' }}
        >
        <Layer>
          {/* Solid background so video export isn't transparent/black */}
          <Rect 
            x={0} 
            y={0} 
            width={dimensions.width} 
            height={dimensions.height} 
            fill="white" 
            listening={false} 
          />

          {items.map((item) => {
            if (item.type === 'text') {
              return (
                <CanvasText
                  key={item.id}
                  item={item}
                  isSelected={activeItemId === item.id}
                  onSelect={(e) => {
                    e.cancelBubble = true;
                    setActiveItem(item.id);
                  }}
                  onChange={(newAttrs) => {
                    updateItem(item.id, newAttrs);
                  }}
                />
              );
            }
            
            // Image or Video
            return (
              <CanvasMedia
                key={item.id}
                item={item}
                canvasDimensions={dimensions}
                isSelected={activeItemId === item.id}
                isVisible={true}
                onSelect={(e) => {
                  e.cancelBubble = true;
                  setActiveItem(item.id);
                }}
                onChange={(newAttrs) => {
                  updateItem(item.id, newAttrs);
                }}
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
});

export default CanvasPreview;
