import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import Konva from 'konva';
import { Stage, Layer, Rect, Image as KonvaImage, Text as KonvaText, Transformer, Line, Group } from 'react-konva';
import { useEditorStore } from '../../store/useVideoEditorStore';

// Custom component to handle Image and Video rendering on Konva Canvas
const CanvasMedia = ({ item, isSelected, onSelect, onChange, canvasDimensions }) => {
  const [image, setImage] = useState(null);
  const imageRef = useRef(null);
  const trRef = useRef(null);
  const itemRef = useRef(item);

  useEffect(() => {
    itemRef.current = item;
  }, [item]);

  const positionMedia = (naturalWidth, naturalHeight) => {
    if (!item.isPositioned && canvasDimensions) {
      const store = useEditorStore.getState();
      const slots = store.layoutSlots || [];
      
      if (item.slotIndex !== undefined && slots[item.slotIndex]) {
        // Snap to slot (Fit behavior instead of Cover)
        const slot = slots[item.slotIndex];
        const scale = Math.min(slot.width / naturalWidth, slot.height / naturalHeight);
        const drawW = naturalWidth * scale;
        const drawH = naturalHeight * scale;
        
        const xOffset = (slot.width - drawW) / 2;
        const yOffset = (slot.height - drawH) / 2;
        
        onChange({ 
          ...item, 
          isPositioned: true, 
          x: slot.x + xOffset, 
          y: slot.y + yOffset, 
          width: drawW, 
          height: drawH, 
          scaleX: 1, 
          scaleY: 1, 
          crop: undefined // No crop for Fit
        });
        return;
      }

      // Default positioning (Fit behavior)
      let scale = Math.min(
        canvasDimensions.width / naturalWidth,
        canvasDimensions.height / naturalHeight
      );

      // Don't upscale stickers; keep them at their natural size
      if (item.type === 'sticker') {
        scale = 1;
      }

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
      const isBlob = item.url.startsWith('blob:');
      vid.src = isBlob ? item.url : (item.url.includes('#') ? `${item.url}&id=${item.id}` : `${item.url}#id=${item.id}`);
      if (!isBlob) {
        vid.crossOrigin = 'anonymous'; // Prevent canvas tainting for remote URLs
      }
      vid.loop = false;
      vid.muted = true;
      vid.playsInline = true;
      vid.autoplay = true; 
      
      vid.addEventListener('loadedmetadata', () => {
        positionMedia(vid.videoWidth, vid.videoHeight);
      });
      
      // Trick browser anti-throttling by making it slightly visible and fixed off-screen
      vid.style.position = 'fixed';
      vid.style.top = '0';
      vid.style.left = '0';
      vid.style.opacity = '0.01'; // Not 0!
      vid.style.pointerEvents = 'none';
      vid.style.width = '10px'; // Not 1px!
      vid.style.height = '10px';
      vid.style.zIndex = '-9999';
      const sink = document.getElementById('video-sink');
      if (sink) {
        sink.appendChild(vid);
      } else {
        document.body.appendChild(vid);
      }
      
      vid.currentTime = 0.001; 
      
      // Track if play promise is pending to prevent AbortError from seeking
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

      // Optimize video rendering: use native requestVideoFrameCallback instead of 60fps Konva.Animation
      // This reduces redraws to match the video's actual framerate (e.g. 30fps), significantly improving performance!
      let rvfcId;
      if ('requestVideoFrameCallback' in vid) {
        const updateFrame = () => {
          if (imageRef.current && imageRef.current.visible()) {
            imageRef.current.getLayer()?.batchDraw();
          }
          rvfcId = vid.requestVideoFrameCallback(updateFrame);
        };
        rvfcId = vid.requestVideoFrameCallback(updateFrame);
      }
      
      // Animation loop strictly for syncing time and visibility
      // We still need a lightweight animation loop to sync currentTime with playhead
      const anim = new Konva.Animation(() => {
        const state = useEditorStore.getState();
        const latestItem = itemRef.current;
        
        const targetRate = latestItem.playbackRate || 1;
        const relativeTimeMs = state.playhead - latestItem.startMs;
        const trimStartSec = (latestItem.trimStartMs || 0) / 1000;
        const mediaTimeSec = trimStartSec + ((relativeTimeMs / 1000) * targetRate);

        // EARLY RETURN FAST PATH
        // If paused and tightly synced, skip all remaining sync/DOM/Konva checks instantly
        if (!state.isPlaying && Math.abs(vid.currentTime - mediaTimeSec) < 0.05) {
          return false;
        }
        
        // Sync speed and mute state
        if (vid.playbackRate !== targetRate) vid.playbackRate = targetRate;
        
        // Restore unmuted playback so the user can hear the video while editing!
        // The unique URL hash added above prevents the browser from stalling when unmuting the same Blob.
        const targetMuted = latestItem.muted || false;
        if (vid.muted !== targetMuted) {
          vid.muted = targetMuted;
        }

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
            if (!('requestVideoFrameCallback' in vid)) {
              needsRedraw = true; // MUST redraw every frame while playing! (Fallback)
            }
          } else {
            // Paused / Scrubbing
            if (!vid.paused && !playPromise) {
              vid.pause();
            }
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
      }, undefined); // pass undefined instead of unbound layer!
      
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

      anim.start();
      return () => {
        if (rvfcId && 'cancelVideoFrameCallback' in vid) {
          vid.cancelVideoFrameCallback(rvfcId);
        }
        anim.stop();
        vid.pause();
        vid.removeAttribute('src'); // cleanup
        vid.load();
        if (vid.parentNode) {
          vid.parentNode.removeChild(vid);
        }
      };
    }
  }, [item.url, item.type, canvasDimensions]);

  // Generic visibility loop for non-video items (video handles its own visibility above)
  useEffect(() => {
    if (item.type === 'video') return;
    const anim = new Konva.Animation(() => {
      const state = useEditorStore.getState();
      const latestItem = itemRef.current;
      const isVisible = state.playhead >= latestItem.startMs && state.playhead <= latestItem.endMs;
      
      const node = imageRef.current;
      if (node && node.visible() !== isVisible) {
        node.visible(isVisible);
        if (trRef.current) trRef.current.visible(isVisible);
        node.getLayer()?.batchDraw();
      }
    });
    anim.start();
    return () => anim.stop();
  }, [item.type, item.startMs, item.endMs]);

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
        crop={item.crop}
        scaleX={item.scaleX || 1}
        scaleY={item.scaleY || 1}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          let newX = e.target.x();
          let newY = e.target.y();
          let newSlotIndex = undefined;
          
          const centerX = newX + (item.width * (item.scaleX || 1)) / 2;
          const centerY = newY + (item.height * (item.scaleY || 1)) / 2;
          
          const store = useEditorStore.getState();
          const layoutSlots = store.layoutSlots || [];
          
          // Check collision with slots just to assign a slotIndex (used for Z-index or background color targets)
          if (item.type !== 'sticker' && layoutSlots.length > 0) {
            for (let i = 0; i < layoutSlots.length; i++) {
              const slot = layoutSlots[i];
              if (centerX >= slot.x && centerX <= slot.x + slot.width &&
                  centerY >= slot.y && centerY <= slot.y + slot.height) {
                newSlotIndex = i;
                break;
              }
            }
          }
          
          onChange({
            ...item,
            slotIndex: newSlotIndex,
            x: newX,
            y: newY,
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
const CanvasText = ({ item, isSelected, onSelect, onChange, onEditStart, isEditing }) => {
  const textRef = useRef(null);
  const bgRectRef = useRef(null);
  const trRef = useRef(null);
  const itemRef = useRef(item);

  const hasBg = item.bgColor && item.bgColor !== 'none' && item.bgColor !== 'transparent';
  const bgFill = item.bgColor === 'white' ? '#ffffff' : (item.bgColor === 'black' ? '#000000' : item.bgColor);

  useEffect(() => {
    itemRef.current = item;
  }, [item]);

  useEffect(() => {
    const anim = new Konva.Animation(() => {
      const state = useEditorStore.getState();
      const latestItem = itemRef.current;
      const isVisible = state.playhead >= latestItem.startMs && state.playhead <= latestItem.endMs;
      
      const node = textRef.current;
      if (node && node.visible() !== isVisible) {
        node.visible(isVisible);
        if (bgRectRef.current) bgRectRef.current.visible(isVisible);
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

  return (
    <React.Fragment>
      {hasBg && (
        <Rect
          ref={bgRectRef}
          x={(item.x || 50) - 8}
          y={(item.y || 50) - 4}
          width={((item.width || (textRef.current?.width() || 120)) * (textRef.current?.scaleX() || 1)) + 16}
          height={((textRef.current?.height() || (item.fontSize || 32)) * (textRef.current?.scaleY() || 1)) + 8}
          fill={bgFill}
          cornerRadius={6}
          rotation={item.rotation || 0}
          listening={false}
        />
      )}
      <KonvaText
        id={`text-${item.id}`}
        ref={textRef}
        text={item.text !== undefined ? item.text : 'Sample Text'}
        x={item.x || 50}
        y={item.y || 50}
        fontSize={item.fontSize || 32}
        fontFamily={item.fontFamily || 'Impact, sans-serif'}
        fontStyle="bold"
        fill={item.color || (item.bgColor === 'white' ? '#000000' : '#ffffff')}
        stroke={item.stroke || (hasBg ? 'transparent' : '#000000')}
        strokeWidth={hasBg && item.stroke === 'transparent' ? 0 : (item.strokeWidth || Math.max(2, (item.fontSize || 32) / 25))}
        letterSpacing={-(item.fontSize || 32) * 0.05}
        lineJoin="miter"
        miterLimit={2}
        align={item.align || 'center'}
        draggable
        onDragMove={(e) => {
          if (bgRectRef.current) {
            bgRectRef.current.position({
              x: e.target.x() - 8,
              y: e.target.y() - 4
            });
            e.target.getLayer()?.batchDraw();
          }
        }}
        onTransform={(e) => {
          if (bgRectRef.current && textRef.current) {
            const node = textRef.current;
            bgRectRef.current.setAttrs({
              x: node.x() - 8,
              y: node.y() - 4,
              width: node.width() * node.scaleX() + 16,
              height: node.height() * node.scaleY() + 8,
              rotation: node.rotation()
            });
            node.getLayer()?.batchDraw();
          }
        }}
        onClick={(e) => {
          if (onEditStart) onEditStart(item);
          onSelect(e);
        }}
        onTap={(e) => {
          if (onEditStart) onEditStart(item);
          onSelect(e);
        }}
        onDragEnd={(e) => {
          onChange({ ...item, x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={(e) => {
          const node = textRef.current;
          const scaleX = node.scaleX();
          
          onChange({
            ...item,
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            fontSize: Math.max(10, (item.fontSize || 32) * scaleX)
          });
          
          // Reset scale to 1 to keep text crisp for the next render
          node.scaleX(1);
          node.scaleY(1);
        }}
      />
      {isSelected && (
        <Transformer 
          ref={trRef} 
          keepRatio={true}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 20) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};


const GridOverlay = ({ layoutId, width, height }) => {
  const layoutSlots = useEditorStore(state => state.layoutSlots);

  if (!layoutId || layoutId === '1-panel') return null;

  if (layoutId === 'custom-grid') {
    return (
      <React.Fragment>
        {layoutSlots.map((slot, i) => (
          <Rect key={i} x={slot.x} y={slot.y} width={slot.width} height={slot.height} stroke="#000000" strokeWidth={4} listening={false} />
        ))}
      </React.Fragment>
    );
  }

  const lines = [];
  const addLine = (points) => lines.push(points);

  if (layoutId === '2-vert') {
    addLine([0, height / 2, width, height / 2]);
  } else if (layoutId === '3-stacked') {
    addLine([0, height / 3, width, height / 3]);
    addLine([0, 2 * height / 3, width, 2 * height / 3]);
  } else if (layoutId === '2-horiz') {
    addLine([width / 2, 0, width / 2, height]);
  } else if (layoutId === '3-horiz') {
    addLine([width / 3, 0, width / 3, height]);
    addLine([2 * width / 3, 0, 2 * width / 3, height]);
  } else if (layoutId === '4-grid') {
    addLine([0, height / 2, width, height / 2]);
    addLine([width / 2, 0, width / 2, height]);
  } else if (layoutId === '3-hybrid') {
    addLine([0, height / 2, width, height / 2]);
    addLine([width / 2, height / 2, width / 2, height]);
  }

  return (
    <React.Fragment>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} stroke="#000000" strokeWidth={4} listening={false} />
      ))}
    </React.Fragment>
  );
};

const CanvasPreview = forwardRef((props, ref) => {
  const { items, activeItemId, setActiveItem, updateItem, canvasAspectRatio, setCanvasDimensions, layoutId } = useEditorStore();
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const hiddenInputRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 450 });
  const [editingTextData, setEditingTextData] = useState(null);

  const logicalDimensions = useMemo(() => ({ width: 800, height: 800 / canvasAspectRatio }), [canvasAspectRatio]);

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
        const isMobile = window.innerWidth <= 900;
        
        let availableWidth;
        let availableHeight;

        if (isMobile) {
          // On mobile, use the actual parent container's dimensions so we stay within the flex layout
          const parentArea = containerRef.current.closest('.video-canvas-area, .canvas-area') || containerRef.current.parentElement;
          const pad = 12;
          availableWidth = Math.max(200, (parentArea ? parentArea.clientWidth : window.innerWidth) - pad);
          availableHeight = Math.max(150, (parentArea ? parentArea.clientHeight : window.innerHeight * 0.45) - pad);
        } else {
          // On desktop, use exact dimensions from the left side-by-side flex container
          const parentArea = containerRef.current.closest('.canvas-area, .video-canvas-area, .canvas-wrapper') || containerRef.current.parentElement;
          const pad = 24;
          availableWidth = Math.max(100, (parentArea ? parentArea.clientWidth : window.innerWidth * 0.5) - pad);
          availableHeight = Math.max(100, (parentArea ? parentArea.clientHeight : (window.innerHeight - 80)) - pad);
        }

        let newWidth = availableWidth;
        let newHeight = availableWidth / canvasAspectRatio;

        // If the calculated height based on width exceeds our available height, scale down by height
        if (newHeight > availableHeight) {
          newHeight = availableHeight;
          newWidth = newHeight * canvasAspectRatio;
        }

        // setDimensions is the ACTUAL physical pixels of the container
        setDimensions({ width: newWidth, height: newHeight });
        // setCanvasDimensions is the LOGICAL dimensions the elements use (fixed 800 width)
        setCanvasDimensions({ width: 800, height: 800 / canvasAspectRatio });
      }
    };
    
    window.addEventListener('resize', updateSize);
    updateSize(); // Initial call

    let ro = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      const parentArea = containerRef.current.closest('.canvas-area, .video-canvas-area, .canvas-wrapper') || containerRef.current.parentElement;
      if (parentArea) {
        ro = new ResizeObserver(() => updateSize());
        ro.observe(parentArea);
      }
    }
    
    return () => {
      window.removeEventListener('resize', updateSize);
      if (ro) ro.disconnect();
    };
  }, [canvasAspectRatio]);

  // We map ALL items so they stay mounted, but pass isVisible down
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
        <div style={{ position: 'relative', width: dimensions.width, height: dimensions.height, flexShrink: 0 }}>
        {/* MOBILE HACK: Render native videos behind the canvas so the browser compositor doesn't suspend them! */}
        <div id="video-sink" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}></div>
        
        <Stage 
          ref={stageRef}
          width={dimensions.width} 
          height={dimensions.height}
          scaleX={dimensions.width / 800}
          scaleY={dimensions.height / (800 / canvasAspectRatio)}
          onClick={() => setActiveItem(null)}
          onTap={() => setActiveItem(null)}
          style={{ touchAction: 'none', zIndex: 1 }}
        >
          <Layer id="media-layer">
            {/* Solid background so video export isn't transparent/black */}
            <Rect 
              x={0} 
              y={0} 
              width={800} 
              height={800 / canvasAspectRatio} 
              fill="white" 
              listening={false} 
            />

            {items.filter(i => i.type === 'image' || i.type === 'video').map((item) => (
              <CanvasMedia
                key={item.id}
                item={item}
                canvasDimensions={logicalDimensions}
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
            ))}
          </Layer>
          <Layer id="static-layer">
            {items.filter(i => i.type === 'text' || i.type === 'sticker').map((item) => {
              if (item.type === 'text') {
                return (
                  <CanvasText
                    key={item.id}
                    item={item}
                    isSelected={activeItemId === item.id}
                    isEditing={editingTextData?.id === item.id}
                    onSelect={(e) => {
                      e.cancelBubble = true;
                      setActiveItem(item.id);
                    }}
                    onEditStart={(clickedItem) => {
                      // Start editing state
                      const node = stageRef.current?.findOne(`#text-${clickedItem.id}`);
                      let absPos = { x: 50, y: 50 };
                      let width = 150;
                      let height = 50;
                      let fontSize = 32;
                      
                      if (node) {
                        absPos = node.absolutePosition();
                        width = node.width() * node.scaleX();
                        height = node.height() * node.scaleY();
                        fontSize = node.fontSize() * node.scaleY();
                      }

                      setEditingTextData({
                        id: clickedItem.id,
                        x: absPos.x,
                        y: absPos.y,
                        width: width,
                        height: height,
                        text: clickedItem.text !== undefined ? clickedItem.text : 'Sample Text',
                        fontSize: fontSize,
                        fontFamily: clickedItem.fontFamily || 'Impact, sans-serif',
                        color: clickedItem.color || '#000'
                      });

                      // SYNCHRONOUSLY focus the hidden input to force the mobile keyboard to open!
                      if (hiddenInputRef.current) {
                        hiddenInputRef.current.value = clickedItem.text !== undefined ? clickedItem.text : 'Sample Text';
                        hiddenInputRef.current.focus();
                      }
                    }}
                    onChange={(newAttrs) => {
                      updateItem(item.id, newAttrs);
                    }}
                  />
                );
              }
              
              // Sticker
              return (
                <CanvasMedia
                  key={item.id}
                  item={item}
                  canvasDimensions={logicalDimensions}
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
            {layoutId && <GridOverlay layoutId={layoutId} width={800} height={800 / canvasAspectRatio} />}
          </Layer>
      </Stage>

      {/* Permanently mounted textarea to capture mobile keyboard reliably */}
      <textarea
        ref={hiddenInputRef}
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
          zIndex: editingTextData ? 100 : -1,
          opacity: 0,
          pointerEvents: 'none'
        }}
        onChange={(e) => {
          if (editingTextData) {
            setEditingTextData({ ...editingTextData, text: e.target.value });
            updateItem(editingTextData.id, { text: e.target.value });
          }
        }}
        onBlur={(e) => {
          if (editingTextData) {
            updateItem(editingTextData.id, { text: e.target.value });
            setEditingTextData(null);
          }
        }}
      />
        </div>{/* end stage-wrapper */}
    </div>
  );
});

export default CanvasPreview;
