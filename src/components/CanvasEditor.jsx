import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Image as ImageIcon, Sparkles, Type } from 'lucide-react';

const wrapText = (ctx, text, maxWidth) => {
  if (!text) return [];
  const explicitLines = text.split('\n');
  const lines = [];

  for (const eLine of explicitLines) {
    let currentLine = '';
    const words = eLine.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      let word = words[i];
      
      // Force break word if it's longer than maxWidth
      while (ctx.measureText(word).width > maxWidth && word.length > 0) {
        let splitIndex = 1;
        while (splitIndex <= word.length && ctx.measureText(word.substring(0, splitIndex)).width <= maxWidth) {
          splitIndex++;
        }
        splitIndex--;
        if (splitIndex === 0) splitIndex = 1; 
        
        const part = word.substring(0, splitIndex);
        if (currentLine !== '') {
          lines.push(currentLine);
          currentLine = '';
        }
        lines.push(part);
        word = word.substring(splitIndex);
      }
      
      if (word === '') continue;

      const testLine = currentLine === '' ? word : currentLine + ' ' + word;
      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine !== '') {
      lines.push(currentLine);
    }
  }
  
  if (lines.length === 0) return [''];
  return lines;
};

const drawRoundRect = (ctx, x, y, width, height, radius) => {
  if (width <= 0 || height <= 0) return;
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  ctx.fill();
};

const CanvasEditor = React.forwardRef(function CanvasEditor(
  {
    template,
    imageUrl,
    captions = [],
    stickers = [],
    imageLayers = [],
    aspectRatio = 'original',
    imageFit = 'cover',
    filters = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, blur: 0 },
    activeLayerId,
    onSelectLayer,
    onDeleteLayer,
    onUpdateCaptionBounds,
    onUpdateStickerBounds,
    onUpdateImageLayerBounds,
    onUpdateCaptionText,
    isNativeLayout,
    layoutDef,
    slotImages,
    slotTransforms,
    onUpdateSlotTransform,
    isVideoPlaying = true,
    watermark,
    drawings = [],
    onAddDrawing,
    isDrawingMode = false,
    drawTool = 'brush',
    brushColor = '#a855f7',
    brushSize = 10
  },
  ref
) {
  const internalRef = useRef(null);
  const canvasRef = ref || internalRef;
  const activeIsNativeLayout = isNativeLayout;
  const activeLayoutDef = layoutDef;

  const isDrawingActive = useRef(false);
  const currentStroke = useRef(null);
  const lastDrawPoint = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.resetVideoTimestamps = () => {
        Object.values(imageCacheRef.current).forEach((media) => {
          if (media && media.tagName === 'VIDEO') {
            const trimStart = media._trimStart || 0;
            media.currentTime = trimStart;
            media.play().catch(() => {});
          }
        });
      };
      canvasRef.current.getVideoElements = () => {
        return Object.values(imageCacheRef.current).filter((media) => media && media.tagName === 'VIDEO');
      };
    }
  }, [canvasRef]);

  const wrapperRef = useRef(null);
  const editableRef = useRef(null);
  const imageCacheRef = useRef({});
  const loadingMediaRef = useRef({});
  const [canvasScale, setCanvasScale] = useState(1);
  const [naturalSize, setNaturalSize] = useState({ w: 800, h: 800 });

  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const dragTarget = useRef(null);
  const dragStartCoords = useRef({ x: 0, y: 0 });
  const initialLayerPos = useRef({ x: 0.5, y: 0.5 });
  const initialPinchDist = useRef(null);
  const initialSlotScale = useRef(null);
  // Double-tap detection: track last tap time and layer id
  const [editingCaptionId, setEditingCaptionId] = useState(null);
  const [editingCaptionText, setEditingCaptionText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    if (editingCaptionId && activeLayerId === editingCaptionId) {
      setCursorVisible(true);
      const interval = setInterval(() => setCursorVisible(v => !v), 530);
      return () => clearInterval(interval);
    } else {
      setCursorVisible(false);
      if (editingCaptionId && activeLayerId !== editingCaptionId) {
        setEditingCaptionId(null);
      }
    }
  }, [editingCaptionId, activeLayerId]);
  const lastTapRef = useRef({ id: null, time: 0 });


  const imgSrc = template?.imageUrl || imageUrl;
  let canvasW = 1080;
  let canvasH = 1080;
  let rawW = 1080;
  let rawH = 1080;

  if (aspectRatio === '16:9') {
    rawW = 1920;
    rawH = 1080;
  } else if (aspectRatio === '9:16') {
    rawW = 1080;
    rawH = 1920;
  } else if (aspectRatio === '4:5') {
    rawW = 1080;
    rawH = 1350;
  } else if (aspectRatio === 'original') {
    rawW = template?.width || naturalSize.w || 1080;
    rawH = template?.height || naturalSize.h || 1080;
  }
  
  // Normalize canvas internal resolution to max dimension 1080
  // This keeps font sizes consistent relative to the canvas across all aspect ratios
  // and prevents performance issues from huge original image resolutions
  const maxDim = Math.max(rawW, rawH);
  if (maxDim > 0) {
    canvasW = Math.round((rawW / maxDim) * 1080);
    canvasH = Math.round((rawH / maxDim) * 1080);
  }
  
  const activeFilters = filters || { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, blur: 0 };

  const activeCaption = captions.find((c) => c.id === activeLayerId);

  // Compute exact scale ratio synchronously so font scale is accurate
  const updateScaleSync = () => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      if (rect.width > 0 && canvasW > 0) {
        setCanvasScale(rect.width / canvasW);
      }
    }
  };

  useLayoutEffect(() => {
    updateScaleSync();
  }, [canvasW, imgSrc]);

  useEffect(() => {
    updateScaleSync();
    window.addEventListener('resize', updateScaleSync);
    const ro = typeof ResizeObserver !== 'undefined' && canvasRef.current
      ? new ResizeObserver(() => updateScaleSync())
      : null;
    if (ro && canvasRef.current) {
      ro.observe(canvasRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateScaleSync);
      if (ro) ro.disconnect();
    };
  }, [canvasW, imgSrc]);

  // Focus textarea ONLY when explicitly called (not on selection change)
  const focusTextarea = () => {
    if (editableRef.current) {
      try {
        editableRef.current.focus();
        const len = editableRef.current.value.length;
        editableRef.current.setSelectionRange(len, len);
      } catch {
        // Focus fallback
      }
    }
  };

  const handlePointerDownRef = useRef(null);
  const handlePointerMoveRef = useRef(null);
  const handlePointerEndRef = useRef(null);
  
  useLayoutEffect(() => {
    handlePointerDownRef.current = handlePointerDown;
    handlePointerMoveRef.current = handlePointerMove;
    handlePointerEndRef.current = handlePointerEnd;
  });

  // Native non-passive touch listeners: handle drag & drawing AND block page scroll
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onTouchStart = (e) => {
      if (isDrawingMode && e.cancelable) e.preventDefault();
      if (handlePointerDownRef.current) handlePointerDownRef.current(e);
    };

    const onTouchMove = (e) => {
      if (e.cancelable) {
        e.preventDefault();
        e.stopPropagation();
      }
      if ((isDragging.current || isDrawingActive.current) && handlePointerMoveRef.current) {
        handlePointerMoveRef.current(e);
      }
    };

    const onTouchEnd = (e) => {
      if (handlePointerEndRef.current) handlePointerEndRef.current(e);
    };

    wrapper.addEventListener('touchstart', onTouchStart, { passive: false });
    wrapper.addEventListener('touchmove', onTouchMove, { passive: false });
    wrapper.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      wrapper.removeEventListener('touchstart', onTouchStart);
      wrapper.removeEventListener('touchmove', onTouchMove);
      wrapper.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Global window listeners for mouse drag & drawing so it doesn't stop when cursor moves outside canvas
  useEffect(() => {
    const onGlobalMouseMove = (e) => {
      if ((isDragging.current || isDrawingActive.current) && handlePointerMoveRef.current) {
        handlePointerMoveRef.current(e);
      }
    };
    const onGlobalMouseUp = (e) => {
      if ((isDragging.current || isDrawingActive.current) && handlePointerEndRef.current) {
        handlePointerEndRef.current(e);
      }
    };

    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', onGlobalMouseMove);
      window.removeEventListener('mouseup', onGlobalMouseUp);
    };
  }, []);

  const baseImgRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || (!imgSrc && !activeIsNativeLayout)) return;
    const ctx = canvas.getContext('2d');

    const renderCanvas = (img) => {
      if (canvas.width !== canvasW) canvas.width = canvasW;
        if (canvas.height !== canvasH) canvas.height = canvasH;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const drawDeleteHandle = (hx, hy) => {
        ctx.beginPath();
        ctx.fillStyle = '#ff4444';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.arc(hx, hy, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.save();
        ctx.translate(hx, hy);
        // Draw Trash Icon
        ctx.beginPath();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Lid
        ctx.moveTo(-7, -5);
        ctx.lineTo(7, -5);
        // Handle
        ctx.moveTo(-3, -5);
        ctx.lineTo(-3, -8);
        ctx.lineTo(3, -8);
        ctx.lineTo(3, -5);
        // Bin
        ctx.moveTo(-6, -5);
        ctx.lineTo(-5, 7);
        ctx.lineTo(5, 7);
        ctx.lineTo(6, -5);
        // Lines
        ctx.moveTo(-2, -1);
        ctx.lineTo(-2, 4);
        ctx.moveTo(2, -1);
        ctx.lineTo(2, 4);
        
        ctx.stroke();
        ctx.restore();
      };

      // Apply Image Filters
      ctx.save();
      const b = activeFilters.brightness ?? 100;
      const c = activeFilters.contrast ?? 100;
      const s = activeFilters.saturation ?? 100;
      const g = activeFilters.grayscale ?? 0;
      const bl = activeFilters.blur ?? 0;
      ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%) grayscale(${g}%) blur(${bl}px)`;

      // Draw Base Image or Native Layout Slots
      if (activeIsNativeLayout && activeLayoutDef) {
        const totalSlots = activeLayoutDef.slots;
        const isVert = activeLayoutDef.id === '2-vert' || activeLayoutDef.id === '3-stacked';
        const isHoriz = activeLayoutDef.id === '2-horiz' || activeLayoutDef.id === '3-horiz';
        const isGrid = activeLayoutDef.id === '4-grid';
        const isHybrid = activeLayoutDef.id === '3-hybrid';

        for (let idx = 0; idx < totalSlots; idx++) {
          let x = 0, y = 0, slotW = canvas.width, slotH = canvas.height;

          if (isVert) {
            slotH = canvas.height / totalSlots;
            y = idx * slotH;
          } else if (isHoriz) {
            slotW = canvas.width / totalSlots;
            x = idx * slotW;
          } else if (isGrid) {
            slotW = canvas.width / 2;
            slotH = canvas.height / 2;
            x = (idx % 2) * slotW;
            y = Math.floor(idx / 2) * slotH;
          } else if (isHybrid) {
            if (idx === 0) {
              slotW = canvas.width;
              slotH = canvas.height / 2;
              x = 0;
              y = 0;
            } else {
              slotW = canvas.width / 2;
              slotH = canvas.height / 2;
              x = (idx - 1) * slotW;
              y = canvas.height / 2;
            }
          }

          const src = slotImages[idx];
          if (src) {
            const cached = imageCacheRef.current[src];
            if (cached) {
              const tx = slotTransforms[idx] || { offsetX: 0, offsetY: 0, scale: 1.5 };
              const scale = Math.min(slotW / cached.width, slotH / cached.height) * (tx.scale || 1.0);
              const nw = cached.width * scale;
              const nh = cached.height * scale;
              const nx = x + (slotW - nw) / 2 + (tx.offsetX * slotW);
              const ny = y + (slotH - nh) / 2 + (tx.offsetY * slotH);

              ctx.save();
              ctx.beginPath();
              ctx.rect(x, y, slotW, slotH);
              ctx.clip();
              try {
                ctx.drawImage(cached, nx, ny, nw, nh);
              } catch (err) {
                console.warn('Failed to draw slot image:', err);
              }
              ctx.restore();
            } else {
              // Load image and re-render
              const newImg = new Image();
              newImg.crossOrigin = 'anonymous';
              newImg.onload = () => {
                imageCacheRef.current[src] = newImg;
                if (baseImgRef.current || activeIsNativeLayout) renderCanvas(baseImgRef.current);
              };
              newImg.src = src;
              
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(x, y, slotW, slotH);
            }
          } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, y, slotW, slotH);
          }

          if (activeLayoutDef.id !== '1-panel' && totalSlots > 1) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, slotW, slotH);
          }
        }
        ctx.restore();
      } else if (img && !isNativeLayout) {
        let drawW = canvas.width;
        let drawH = canvas.height;
        let offsetX = 0;
        let offsetY = 0;

        if (imageFit === 'stretch') {
          drawW = canvas.width;
          drawH = canvas.height;
          offsetX = 0;
          offsetY = 0;
        } else if (imageFit === 'contain') {
          const imgRatio = img.width / img.height;
          const canvasRatio = canvas.width / canvas.height;

          if (imgRatio > canvasRatio) {
            drawW = canvas.width;
            drawH = canvas.width / imgRatio;
            offsetX = 0;
            offsetY = (canvas.height - drawH) / 2;
          } else {
            drawH = canvas.height;
            drawW = canvas.height * imgRatio;
            offsetY = 0;
            offsetX = (canvas.width - drawW) / 2;
          }
        } else {
          const imgRatio = img.width / img.height;
          const canvasRatio = canvas.width / canvas.height;

          if (imgRatio > canvasRatio) {
            drawH = canvas.height;
            drawW = canvas.height * imgRatio;
            offsetX = (canvas.width - drawW) / 2;
          } else {
            drawW = canvas.width;
            drawH = canvas.width / imgRatio;
            offsetY = (canvas.height - drawH) / 2;
          }
        }
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
        ctx.restore();
      }

      // Reset filter for text/stickers/image-layers overlay
      ctx.filter = 'none';

      // Render Custom Image Overlay Layers
      (imageLayers || []).forEach((imgLayer) => {
        const cx = imgLayer.x * canvas.width;
        const cy = imgLayer.y * canvas.height;
        const cached = imageCacheRef.current[imgLayer.url];

        if (cached) {
          ctx.save();
          ctx.translate(cx, cy);
          if (imgLayer.rotation) {
            ctx.rotate((imgLayer.rotation * Math.PI) / 180);
          }
          const scale = imgLayer.scale || 1.0;
          const baseW = cached.width || 200;
          const baseH = cached.height || 200;
          const maxDim = 320;
          const fitScale = Math.min(maxDim / baseW, maxDim / baseH);
          const w = imgLayer.boxWidth || imgLayer.width || (baseW * fitScale * scale);
          const h = imgLayer.boxHeight || imgLayer.height || (baseH * fitScale * scale);

          const mode = imgLayer.fitMode || 'fit';
          
          if (mode === 'stretch') {
            ctx.drawImage(cached, -w / 2, -h / 2, w, h);
          } else {
            const imgAspect = baseW / baseH;
            const boxAspect = w / h;
            let drawW = w;
            let drawH = h;
            
            if (mode === 'crop') {
              if (boxAspect > imgAspect) {
                drawW = w;
                drawH = w / imgAspect;
              } else {
                drawH = h;
                drawW = h * imgAspect;
              }
            } else { // fit
              if (boxAspect > imgAspect) {
                drawH = h;
                drawW = h * imgAspect;
              } else {
                drawW = w;
                drawH = w / imgAspect;
              }
            }
            
            ctx.save();
            ctx.beginPath();
            ctx.rect(-w / 2, -h / 2, w, h);
            ctx.clip();
            ctx.drawImage(cached, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();
          }

          
          if (imgLayer.id === activeLayerId && !isDrawingMode) {
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 6]);
            ctx.strokeRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12);
            
            ctx.setLineDash([]);
            
            const hw = w / 2 + 6;
            const hh = h / 2 + 6;

            // Rotation handle stem
            ctx.beginPath();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.moveTo(0, -hh);
            ctx.lineTo(0, -hh - 34);
            ctx.stroke();
            
            // Rotation handle circle
            ctx.beginPath();
            ctx.fillStyle = '#a855f7';
            ctx.arc(0, -hh - 34, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Round handles for resizing, stretching, and cropping (4 corners + 4 middle of sides)
            ctx.fillStyle = '#a855f7';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            const drawRoundHandle = (hx, hy) => {
              ctx.beginPath();
              ctx.arc(hx, hy, 14, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            };

            // 4 Corner handles
            drawRoundHandle(-hw, -hh); // TL
            drawRoundHandle(hw, -hh);  // TR
            drawRoundHandle(-hw, hh);  // BL
            drawRoundHandle(hw, hh);   // BR

            // 4 Middle-of-side handles
            drawRoundHandle(0, -hh);  // Top middle
            drawRoundHandle(0, hh);   // Bottom middle
            drawRoundHandle(-hw, 0);  // Left middle
            drawRoundHandle(hw, 0);   // Right middle
            
            drawDeleteHandle(-hw - 36, -hh - 36);
          }

          ctx.restore();
        } else {
          const newImg = new Image();
          newImg.crossOrigin = 'anonymous';
          newImg.onload = () => {
            imageCacheRef.current[imgLayer.url] = newImg;
            renderCanvas(baseImgRef.current);
          };
          newImg.src = imgLayer.url;
        }
      });

      // Render Stickers / Emojis
      stickers.forEach((stk) => {
        
        const sx = stk.x * canvas.width;
        const sy = stk.y * canvas.height;
        ctx.save();
        ctx.translate(sx, sy);
        if (stk.rotation) ctx.rotate(stk.rotation * Math.PI / 180);
        
        const stkSize = (stk.scale || 1.0) * 52;
        ctx.font = `${stkSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        
        if (stk.id === activeLayerId && !isDrawingMode) {
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 6]);
          ctx.strokeRect(-stkSize / 2 - 6, -stkSize / 2 - 6, stkSize + 12, stkSize + 12);
          
          ctx.setLineDash([]);
          ctx.fillStyle = '#a855f7';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          
          const drawHandle = (x, y) => {
            ctx.beginPath();
            ctx.arc(x, y, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          };
          
          const hs = stkSize / 2 + 6;
          drawHandle(-hs, -hs); // TL
          drawHandle(hs, -hs); // TR
          drawHandle(-hs, hs); // BL
          drawHandle(hs, hs); // BR
          
          ctx.beginPath();
          ctx.moveTo(0, -stkSize / 2 - 6);
          ctx.lineTo(0, -stkSize / 2 - 40);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.fillStyle = '#a855f7';
          ctx.arc(0, -stkSize / 2 - 40, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          drawDeleteHandle(-hs - 36, -hs - 36);
        }

        if (stk.url || stk.imageUrl) {
          const imgUrl = stk.url || stk.imageUrl;
          const cached = imageCacheRef.current[imgUrl];
          if (cached && (cached.complete && (cached.naturalWidth || cached.width))) {
            const aspect = (cached.naturalWidth || cached.width) / ((cached.naturalHeight || cached.height) || 1);
            const drawW = aspect >= 1 ? stkSize : stkSize * aspect;
            const drawH = aspect >= 1 ? stkSize / aspect : stkSize;
            ctx.drawImage(cached, -drawW / 2, -drawH / 2, drawW, drawH);
          } else {
            if (!loadingMediaRef.current[imgUrl]) {
              loadingMediaRef.current[imgUrl] = true;
              const newImg = new Image();
              newImg.crossOrigin = 'anonymous';
              newImg.onload = () => {
                imageCacheRef.current[imgUrl] = newImg;
                renderCanvas(baseImgRef.current);
              };
              newImg.src = imgUrl;
            }
          }
        } else if (stk.emoji) {
          ctx.fillText(stk.emoji, 0, 0);
        }
        ctx.restore();
      });

      captions.forEach((cap) => {
        const cx = cap.x * canvas.width;
        const cy = cap.y * canvas.height;
        
        ctx.save();
        ctx.translate(cx, cy);
        if (cap.rotation) ctx.rotate(cap.rotation * Math.PI / 180);

        // Text opacity support (0.0 to 1.0)
        let opacity = 1;
        if (cap.opacity !== undefined && cap.opacity !== null) {
          const num = Number(cap.opacity);
          if (!isNaN(num)) {
            opacity = num > 1 ? num / 100 : num;
            opacity = Math.max(0, Math.min(1, opacity));
          }
        }
        ctx.globalAlpha = opacity;

        const fontSize = cap.fontSize || 50;
        const fontFamily = cap.fontFamily || 'Impact, sans-serif';
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const renderMaxWidth = (cap.width || 0.9) * canvas.width;
        
        let displayString = cap.text || '';
        if (cap.id === editingCaptionId && cap.id === activeLayerId && cursorVisible && !isDrawingMode) {
          displayString += '|';
        }
        
        // Use the SAME global wrapText for rendering and hit-testing
        const lines = wrapText(ctx, displayString, renderMaxWidth);
        
        let maxLineWidth = 0;
        for (const line of lines) {
          maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
        }
        // Draw Meme Text Background if enabled (white, black, or custom)
        const hasBg = cap.bgColor && cap.bgColor !== 'transparent' && cap.bgColor !== 'none';

        // The visual bounding box is sized to match the actual text
        const padX = hasBg && cap.bgStyle !== 'banner' ? Math.max(16, fontSize * 0.35) : Math.max(8, fontSize * 0.15);
        const padY = hasBg && cap.bgStyle !== 'banner' ? Math.max(10, fontSize * 0.2) : Math.max(4, fontSize * 0.1);
        const boxWidth = maxLineWidth + padX * 2;
        const lineHeight = fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        const boxHeight = totalHeight + padY * 2;
        const startY = - ((lines.length - 1) * lineHeight) / 2;

        let bgFillColor = '#ffffff';
        if (hasBg) {
          ctx.save();
          bgFillColor = cap.bgColor === 'white' ? '#ffffff' : (cap.bgColor === 'black' ? '#000000' : cap.bgColor);
          ctx.fillStyle = bgFillColor;

          if (cap.bgStyle === 'banner') {
            // Full-width edge-to-edge banner across the canvas
            const bannerPadY = Math.max(14, fontSize * 0.28);
            const bannerH = totalHeight + bannerPadY * 2;
            const bannerY = startY - lineHeight / 2 - bannerPadY;
            const bannerX = -cx;
            const bannerW = canvas.width;
            ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
          } else {
            // Box style: clean padded rounded rectangle enclosing the text
            const boxStartX = - boxWidth / 2;
            const boxStartY = - boxHeight / 2;
            const r = Math.min(8, fontSize * 0.15);
            drawRoundRect(ctx, boxStartX, boxStartY, boxWidth, boxHeight, r);
          }
          ctx.restore();
        }

        // Determine text color with smart contrast for White / Black BG
        let textColor = cap.color || '#ffffff';
        if (cap.bgColor === 'white' && (textColor.toLowerCase() === '#ffffff' || textColor.toLowerCase() === '#fff' || textColor === 'white')) {
          textColor = '#000000';
        } else if (cap.bgColor === 'black' && (textColor.toLowerCase() === '#000000' || textColor.toLowerCase() === '#000' || textColor === 'black')) {
          textColor = '#ffffff';
        }

        const shouldStroke = cap.stroke && cap.stroke !== 'transparent' && (!hasBg || (cap.stroke !== cap.bgColor && cap.stroke !== bgFillColor));

        lines.forEach((line, index) => {
          const ly = startY + index * lineHeight;

          if (shouldStroke) {
            ctx.strokeStyle = cap.stroke;
            ctx.lineWidth = cap.strokeWidth || Math.max(3, fontSize / 7);
            ctx.lineJoin = 'miter';
            ctx.miterLimit = 2;
            ctx.setLineDash([]);
            ctx.strokeText(line, 0, ly);
          }

          ctx.fillStyle = textColor;
          ctx.fillText(line, 0, ly);
        });

        if (cap.id === activeLayerId && !isDrawingMode) {
          ctx.globalAlpha = 1.0;
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 6]);
          
          const boxX = - boxWidth / 2;
          const boxY = - boxHeight / 2;
          
          ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
          
          ctx.setLineDash([]);
          ctx.fillStyle = '#f97316';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          
          const drawHandle = (x, y) => {
            ctx.beginPath();
            ctx.arc(x, y, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          };
          
          drawHandle(boxX, boxY); // Top Left
          drawHandle(boxX + boxWidth, boxY); // Top Right
          drawHandle(boxX, boxY + boxHeight); // Bottom Left
          drawHandle(boxX + boxWidth, boxY + boxHeight); // Bottom Right
          drawHandle(boxX, boxY + boxHeight / 2); // Left Middle
          drawHandle(boxX + boxWidth, boxY + boxHeight / 2); // Right Middle
          
          ctx.beginPath();
          ctx.moveTo(0, boxY);
          ctx.lineTo(0, boxY - 34);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.fillStyle = '#f97316';
          ctx.arc(0, boxY - 34, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          drawDeleteHandle(boxX - 36, boxY - 36);
        }

        ctx.restore();
      });

      // --- RENDER FREEHAND DRAWINGS ---
      const drawBrushStroke = (stroke) => {
        if (!stroke || !stroke.points || stroke.points.length === 0) return;
        ctx.save();
        ctx.strokeStyle = stroke.color || '#a855f7';
        ctx.lineWidth = stroke.size || 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        if (stroke.points.length === 1) {
          ctx.arc(stroke.points[0].x, stroke.points[0].y, (stroke.size || 8) / 2, 0, Math.PI * 2);
          ctx.fillStyle = stroke.color || '#a855f7';
          ctx.fill();
        } else {
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          ctx.stroke();
        }
        ctx.restore();
      };

      (drawings || []).forEach((d) => {
        if (d.type === 'brush' || d.type === 'eraser') {
          drawBrushStroke(d);
        }
      });
      
      // Render Watermark
      if (watermark?.enabled) {
        ctx.save();
        ctx.globalAlpha = watermark.opacity || 0.5;
        
        const pad = 20;
        let wx = 0;
        let wy = 0;
        
        const getPositions = (w, h) => {
          const pos = watermark.position || 'bottom-right';
          if (pos === 'bottom-right') return { x: canvas.width - pad - w, y: canvas.height - pad - h };
          if (pos === 'bottom-left') return { x: pad, y: canvas.height - pad - h };
          if (pos === 'top-right') return { x: canvas.width - pad - w, y: pad };
          if (pos === 'top-left') return { x: pad, y: pad };
          return { x: pad, y: pad };
        };
        
        if (watermark.imageUrl && imageCacheRef.current[watermark.imageUrl]) {
          const wmImg = imageCacheRef.current[watermark.imageUrl];
          const scale = (watermark.size || 24) * 3 / Math.max(wmImg.width, wmImg.height);
          const drawW = wmImg.width * scale;
          const drawH = wmImg.height * scale;
          const { x, y } = getPositions(drawW, drawH);
          ctx.drawImage(wmImg, x, y, drawW, drawH);
        } else if (watermark.text) {
          ctx.font = `bold ${watermark.size || 24}px Impact, sans-serif`;
          const fillColor = watermark.color || '#ffffff';
          ctx.fillStyle = fillColor;
          ctx.strokeStyle = fillColor === '#000000' ? '#ffffff' : '#000000';
          ctx.lineWidth = Math.max(2, (watermark.size || 24) / 10);
          ctx.textBaseline = 'top';
          ctx.textAlign = 'left';
          
          const textMetrics = ctx.measureText(watermark.text);
          const w = textMetrics.width;
          const h = watermark.size || 24;
          const { x, y } = getPositions(w, h);
          
          ctx.strokeText(watermark.text, x, y);
          ctx.fillText(watermark.text, x, y);
        }
        
        ctx.restore();
      }
    };

    if (baseImgRef.current && baseImgRef.current.src === imgSrc) {
      renderCanvas(baseImgRef.current);
    } else if (imgSrc) {
        const baseImg = new Image();
        baseImg.crossOrigin = 'anonymous';
        baseImg.onload = () => {
          if (baseImg.width && baseImg.height && (naturalSize.w !== baseImg.width || naturalSize.h !== baseImg.height)) {
            setNaturalSize({ w: baseImg.width, h: baseImg.height });
          }
          baseImgRef.current = baseImg;
          renderCanvas(baseImg);
        };
        baseImg.src = imgSrc;
    } else {
      renderCanvas(null);
    }
  }, [captions, stickers, activeLayerId, imageLayers, slotImages, slotTransforms, activeIsNativeLayout, editingCaptionId, cursorVisible, aspectRatio, imageFit, watermark, drawings, isDrawingMode, imgSrc]);

  // Helper to rotate point for hit testing
  const rotatePoint = (px, py, cx, cy, angle) => {
    const rad = angle * Math.PI / 180;
    const dx = px - cx;
    const dy = py - cy;
    return {
      x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: cy + dx * Math.sin(rad) + dy * Math.cos(rad)
    };
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX = 0, clientY = 0;
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else if (e.clientX !== undefined && e.clientY !== undefined) {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e) => {
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDrawingMode) {
      isDrawingActive.current = true;
      const strokeColor = drawTool === 'eraser' ? '#ffffff' : brushColor;
      const initialStroke = {
        id: `brush-${Date.now()}`,
        type: drawTool,
        color: strokeColor,
        size: brushSize,
        points: [{ x: coords.x, y: coords.y }]
      };
      currentStroke.current = initialStroke;
      lastDrawPoint.current = { x: coords.x, y: coords.y };

      // Immediate visual dot on canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    let hitLayer = null;

    // A. Priority 1: Check Active Layer (Handles first, then Body)
    if (activeLayerId) {
      // 1. Active Sticker
      const activeStk = stickers.find(s => s.id === activeLayerId);
      if (activeStk) {
        const cx = activeStk.x * canvas.width;
        const cy = activeStk.y * canvas.height;
        const stkSize = (activeStk.scale || 1.0) * 52;
        const p = rotatePoint(coords.x, coords.y, cx, cy, -(activeStk.rotation || 0));
        const hs = stkSize / 2 + 6;

        const handles = [
          { type: 'delete_layer', x: cx - hs - 36, y: cy - hs - 36, r: 26 },
          { type: 'rotate_sticker', x: cx, y: cy - stkSize / 2 - 40, r: 24 },
          { type: 'resize_sticker_tl', x: cx - hs, y: cy - hs, r: 22 },
          { type: 'resize_sticker_tr', x: cx + hs, y: cy - hs, r: 22 },
          { type: 'resize_sticker_bl', x: cx - hs, y: cy + hs, r: 22 },
          { type: 'resize_sticker_br', x: cx + hs, y: cy + hs, r: 22 },
        ];

        for (const h of handles) {
          if (Math.hypot(p.x - h.x, p.y - h.y) <= h.r) {
            hitLayer = { 
              id: activeStk.id, 
              type: h.type, 
              x: activeStk.x, 
              y: activeStk.y, 
              scale: activeStk.scale || 1.0, 
              rotation: activeStk.rotation || 0 
            };
            break;
          }
        }

        // Active sticker body
        if (!hitLayer && p.x >= cx - stkSize / 2 - 6 && p.x <= cx + stkSize / 2 + 6 && p.y >= cy - stkSize / 2 - 6 && p.y <= cy + stkSize / 2 + 6) {
          hitLayer = { 
            id: activeStk.id, 
            type: 'sticker', 
            x: activeStk.x, 
            y: activeStk.y, 
            scale: activeStk.scale || 1.0, 
            rotation: activeStk.rotation || 0 
          };
        }
      }

      // 2. Active Caption
      if (!hitLayer) {
        const activeCap = captions.find(c => c.id === activeLayerId);
        if (activeCap) {
          const cx = activeCap.x * canvas.width;
          const cy = activeCap.y * canvas.height;
          const p = rotatePoint(coords.x, coords.y, cx, cy, -(activeCap.rotation || 0));

          const renderMaxWidth = (activeCap.width || 0.9) * canvas.width;
          const fontSize = activeCap.fontSize || 50;
          ctx.font = `bold ${fontSize}px ${activeCap.fontFamily || 'Impact, sans-serif'}`;
          const lines = wrapText(ctx, activeCap.text, renderMaxWidth);
          let maxLineWidth = 0;
          for (const line of lines) {
            maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
          }
          const hasBg = activeCap.bgColor && activeCap.bgColor !== 'transparent' && activeCap.bgColor !== 'none';
          const padX = hasBg && activeCap.bgStyle !== 'banner' ? Math.max(16, fontSize * 0.35) : Math.max(8, fontSize * 0.15);
          const padY = hasBg && activeCap.bgStyle !== 'banner' ? Math.max(10, fontSize * 0.2) : Math.max(4, fontSize * 0.1);
          const boxWidth = maxLineWidth + padX * 2;
          const textHeight = lines.length * (fontSize * 1.2);
          const boxHeight = textHeight + padY * 2;
          const halfW = boxWidth / 2;
          const halfH = boxHeight / 2;

          const topY = cy - halfH;
          const bottomY = cy + halfH;
          const leftX = cx - halfW;
          const rightX = cx + halfW;

          const handles = [
            { type: 'delete_layer', x: leftX - 36, y: topY - 36, r: 26 },
            { type: 'rotate_caption', x: cx, y: topY - 34, r: 24 },
            { type: 'resize_caption_tl', x: leftX, y: topY, r: 24 },
            { type: 'resize_caption_tr', x: rightX, y: topY, r: 24 },
            { type: 'resize_caption_bl', x: leftX, y: bottomY, r: 24 },
            { type: 'resize_caption_br', x: rightX, y: bottomY, r: 24 },
            { type: 'resize_caption_l',  x: leftX, y: cy,      r: 24 },
            { type: 'resize_caption_r',  x: rightX, y: cy,     r: 24 }
          ];

          let closestHandle = null;
          let minDistance = Infinity;

          for (const h of handles) {
            const dist = Math.hypot(p.x - h.x, p.y - h.y);
            if (dist <= h.r && dist < minDistance) {
              minDistance = dist;
              closestHandle = h;
            }
          }

          if (closestHandle) {
            const cornerDist = Math.hypot(closestHandle.x - cx, closestHandle.y - cy);
            hitLayer = { 
              id: activeCap.id, 
              type: closestHandle.type, 
              x: activeCap.x, 
              y: activeCap.y, 
              width: (actualWidth / canvas.width), 
              rotation: activeCap.rotation || 0,
              fontSize: activeCap.fontSize || 50,
              initialFontSize: activeCap.fontSize || 50,
              initialWidth: activeCap.width || (actualWidth / canvas.width),
              initialDist: Math.max(15, cornerDist)
            };
          }

          if (!hitLayer && p.x >= cx - halfW && p.x <= cx + halfW && p.y >= cy - halfH && p.y <= cy + halfH) {
            hitLayer = { 
              id: activeCap.id, 
              type: 'caption', 
              x: activeCap.x, 
              y: activeCap.y, 
              width: (actualWidth / canvas.width), 
              rotation: activeCap.rotation || 0 
            };
          }
        }
      }

      // 3. Active Image Layer
      if (!hitLayer) {
        const activeImg = imageLayers.find(l => l.id === activeLayerId);
        if (activeImg) {
          const cached = imageCacheRef.current[activeImg.url];
          if (cached) {
            const cx = activeImg.x * canvas.width;
            const cy = activeImg.y * canvas.height;
            const scale = activeImg.scale || 1.0;
            const baseW = cached.width || 200;
            const baseH = cached.height || 200;
            const fitScale = Math.min(320 / baseW, 320 / baseH);
            const w = activeImg.boxWidth || activeImg.width || (baseW * fitScale * scale);
            const h = activeImg.boxHeight || activeImg.height || (baseH * fitScale * scale);
            const p = rotatePoint(coords.x, coords.y, cx, cy, -(activeImg.rotation || 0));

            const hw = w / 2 + 6;
            const hh = h / 2 + 6;

            const handles = [
              { type: 'delete_layer', x: cx - hw - 36, y: cy - hh - 36, r: 26 },
              { type: 'rotate_imageLayer', x: cx, y: cy - hh - 34, r: 22 },
              { type: 'resize_imageLayer_tl', x: cx - hw, y: cy - hh, r: 22 },
              { type: 'resize_imageLayer_tr', x: cx + hw, y: cy - hh, r: 22 },
              { type: 'resize_imageLayer_bl', x: cx - hw, y: cy + hh, r: 22 },
              { type: 'resize_imageLayer_br', x: cx + hw, y: cy + hh, r: 22 },
              { type: 'resize_imageLayer_t',  x: cx,      y: cy - hh, r: 22 },
              { type: 'resize_imageLayer_b',  x: cx,      y: cy + hh, r: 22 },
              { type: 'resize_imageLayer_l',  x: cx - hw, y: cy,      r: 22 },
              { type: 'resize_imageLayer_r',  x: cx + hw, y: cy,      r: 22 }
            ];

            let closestHandle = null;
            let minDistance = Infinity;

            for (const h of handles) {
              const dist = Math.hypot(p.x - h.x, p.y - h.y);
              if (dist <= h.r && dist < minDistance) {
                minDistance = dist;
                closestHandle = h;
              }
            }

            if (closestHandle) {
              hitLayer = { 
                id: activeImg.id, 
                type: closestHandle.type, 
                x: activeImg.x, 
                y: activeImg.y, 
                scale, 
                rotation: activeImg.rotation || 0, 
                baseW, baseH, fitScale, 
                boxWidth: w, 
                boxHeight: h,
                width: w,
                height: h
              };
            }

            if (!hitLayer && p.x >= cx - w / 2 && p.x <= cx + w / 2 && p.y >= cy - h / 2 && p.y <= cy + h / 2) {
              hitLayer = { 
                id: activeImg.id, 
                type: 'imageLayer', 
                x: activeImg.x, 
                y: activeImg.y,
                scale,
                rotation: activeImg.rotation || 0,
                baseW, baseH, fitScale,
                boxWidth: w,
                boxHeight: h,
                width: w,
                height: h
              };
            }
          }
        }
      }
    }

    // B. Priority 2: Non-active layers (Stickers top-most, then Captions, then ImageLayers)
    if (!hitLayer) {
      for (let i = stickers.length - 1; i >= 0; i--) {
        const stk = stickers[i];
        const cx = stk.x * canvas.width;
        const cy = stk.y * canvas.height;
        const stkSize = (stk.scale || 1.0) * 52;
        const p = rotatePoint(coords.x, coords.y, cx, cy, -(stk.rotation || 0));
        if (p.x >= cx - stkSize / 2 && p.x <= cx + stkSize / 2 && p.y >= cy - stkSize / 2 && p.y <= cy + stkSize / 2) {
          hitLayer = { 
            id: stk.id, 
            type: 'sticker', 
            x: stk.x, 
            y: stk.y, 
            scale: stk.scale || 1.0, 
            rotation: stk.rotation || 0 
          };
          break;
        }
      }
    }

    if (!hitLayer) {
      for (let i = captions.length - 1; i >= 0; i--) {
        const cap = captions[i];
        const cx = cap.x * canvas.width;
        const cy = cap.y * canvas.height;
        const p = rotatePoint(coords.x, coords.y, cx, cy, -(cap.rotation || 0));

        const renderMaxWidth = (cap.width || 0.9) * canvas.width;
        const fontSize = cap.fontSize || 50;
        ctx.font = `bold ${fontSize}px ${cap.fontFamily || 'Impact, sans-serif'}`;
        const lines = wrapText(ctx, cap.text, renderMaxWidth);
        let maxLineWidth = 0;
        for (const line of lines) {
          maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
        }
        const hasBg = cap.bgColor && cap.bgColor !== 'transparent' && cap.bgColor !== 'none';
        const padX = hasBg && cap.bgStyle !== 'banner' ? Math.max(16, fontSize * 0.35) : Math.max(8, fontSize * 0.15);
        const padY = hasBg && cap.bgStyle !== 'banner' ? Math.max(10, fontSize * 0.2) : Math.max(4, fontSize * 0.1);
        const boxWidth = maxLineWidth + padX * 2;
        const textHeight = lines.length * (fontSize * 1.2);
        const boxHeight = textHeight + padY * 2;
        const halfW = boxWidth / 2;
        const halfH = boxHeight / 2;

        if (p.x >= cx - halfW && p.x <= cx + halfW && p.y >= cy - halfH && p.y <= cy + halfH) {
          hitLayer = { 
            id: cap.id, 
            type: 'caption', 
            x: cap.x, 
            y: cap.y,
            boxWidth,
            boxHeight,
            width: boxWidth / canvas.width,
            rotation: cap.rotation || 0
          };
          break;
        }
      }
    }

    if (!hitLayer) {
      for (let i = imageLayers.length - 1; i >= 0; i--) {
        const l = imageLayers[i];
        const cx = l.x * canvas.width;
        const cy = l.y * canvas.height;
        const cached = imageCacheRef.current[l.url];
        if (!cached) continue;
        const scale = l.scale || 1.0;
        const baseW = cached.width || 200;
        const baseH = cached.height || 200;
        const fitScale = Math.min(320 / baseW, 320 / baseH);
        const w = l.boxWidth || l.width || (baseW * fitScale * scale);
        const h = l.boxHeight || l.height || (baseH * fitScale * scale);
        const p = rotatePoint(coords.x, coords.y, cx, cy, -(l.rotation || 0));

        if (p.x >= cx - w / 2 && p.x <= cx + w / 2 && p.y >= cy - h / 2 && p.y <= cy + h / 2) {
          hitLayer = { 
            id: l.id, 
            type: 'imageLayer', 
            x: l.x, 
            y: l.y,
            scale,
            rotation: l.rotation || 0,
            baseW, baseH, fitScale,
            boxWidth: w,
            boxHeight: h,
            width: w,
            height: h
          };
          break;
        }
      }
    }

    if (hitLayer && hitLayer.type === 'caption') {
      setEditingCaptionId(hitLayer.id);
      const activeCap = captions.find(c => c.id === hitLayer.id);
      setEditingCaptionText(activeCap ? activeCap.text : '');
      focusTextarea();
      lastTapRef.current = { id: hitLayer.id, time: Date.now() };
    } else {
      setEditingCaptionId(null);
      setCursorVisible(false);
      if (editableRef.current) editableRef.current.blur();
    }

    if (hitLayer) {
      if (hitLayer.type === 'delete_layer') {
        if (onDeleteLayer) onDeleteLayer();
        return;
      }
      
      if (onSelectLayer) onSelectLayer(hitLayer.id);
      isDragging.current = true;
      dragTarget.current = hitLayer;
      dragStartCoords.current = coords;

      const centerX = hitLayer.x * canvas.width;
      const centerY = hitLayer.y * canvas.height;
      const initDist = hitLayer.initialDist || Math.hypot(coords.x - centerX, coords.y - centerY);

      initialLayerPos.current = { 
        x: hitLayer.x, 
        y: hitLayer.y, 
        width: hitLayer.boxWidth || hitLayer.width,
        height: hitLayer.boxHeight || hitLayer.height,
        boxWidth: hitLayer.boxWidth || hitLayer.width,
        boxHeight: hitLayer.boxHeight || hitLayer.height,
        scale: hitLayer.scale || 1.0,
        rotation: hitLayer.rotation || 0,
        initialDist: Math.max(15, initDist),
        initialFontSize: hitLayer.initialFontSize || hitLayer.fontSize || 50,
        initialWidth: hitLayer.initialWidth || hitLayer.width || 0.9
      };
    } else {
      if (onSelectLayer) onSelectLayer(null);
      setEditingCaptionId(null);
      setCursorVisible(false);
      if (editableRef.current) editableRef.current.blur();
      
      // Native slot handling for pinch-to-zoom
      if (activeIsNativeLayout && activeLayoutDef) {
        const totalSlots = activeLayoutDef.slots;
        const isVert = activeLayoutDef.id === '2-vert' || activeLayoutDef.id === '3-stacked';
        const isHoriz = activeLayoutDef.id === '2-horiz' || activeLayoutDef.id === '3-horiz';
        const isGrid = activeLayoutDef.id === '4-grid';
        const isHybrid = activeLayoutDef.id === '3-hybrid';

        let hitSlotIdx = -1;
        for (let idx = 0; idx < totalSlots; idx++) {
          let x = 0, y = 0, slotW = canvas.width, slotH = canvas.height;
          if (isVert) { slotH = canvas.height / totalSlots; y = idx * slotH; }
          else if (isHoriz) { slotW = canvas.width / totalSlots; x = idx * slotW; }
          else if (isGrid) { slotW = canvas.width / 2; slotH = canvas.height / 2; x = (idx % 2) * slotW; y = Math.floor(idx / 2) * slotH; }
          else if (isHybrid) {
            if (idx === 0) { slotW = canvas.width; slotH = canvas.height / 2; x = 0; y = 0; }
            else { slotW = canvas.width / 2; slotH = canvas.height / 2; x = (idx - 1) * slotW; y = canvas.height / 2; }
          }
          if (coords.x >= x && coords.x <= x + slotW && coords.y >= y && coords.y <= y + slotH) {
            hitSlotIdx = idx;
            break;
          }
        }

        if (hitSlotIdx !== -1) {
          isDragging.current = true;
          const hasImage = !!slotImages[hitSlotIdx];
          dragTarget.current = { type: hasImage ? 'slot' : 'empty-slot', idx: hitSlotIdx };
          dragStartCoords.current = coords;
          
          if (e.touches && e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            initialPinchDist.current = Math.hypot(dx, dy);
            const currentTransform = slotTransforms[hitSlotIdx] || { scale: 1.5 };
            initialSlotScale.current = currentTransform.scale || 1.0;
          }
        }
      }
    }
  };

  const handlePointerEnd = (e) => {
    if (canvasRef.current && !isDrawingMode) {
      canvasRef.current.style.cursor = 'default';
    }
    if (isDrawingMode && isDrawingActive.current) {
      isDrawingActive.current = false;
      lastDrawPoint.current = null;
      if (currentStroke.current) {
        const strokeToSave = currentStroke.current;
        currentStroke.current = null;
        if (strokeToSave.points.length > 0 && onAddDrawing) {
          onAddDrawing(strokeToSave);
        }
      }
      return;
    }

    const wasCleanTap = !hasDragged.current;
    const tappedId = dragTarget.current?.id;
    const tappedType = dragTarget.current?.type;

    isDragging.current = false;
    hasDragged.current = false;
    dragTarget.current = null;

    if (wasCleanTap && tappedType === 'empty-slot') {
      // Slot actions are now handled by DOM overlays on the canvas
    }

    // Clean tap on caption: select layer, activate editing mode and open keyboard immediately
    if (wasCleanTap && tappedType === 'caption' && tappedId) {
      if (onSelectLayer) onSelectLayer(tappedId);
      setEditingCaptionId(tappedId);
      const activeCap = captions.find(c => c.id === tappedId);
      setEditingCaptionText(activeCap ? activeCap.text : '');
      focusTextarea();
    }
  };

  const handleTextOverlayPointerDown = (e) => {
    handlePointerDown(e);
  };

  const handleTextOverlayPointerEnd = (e) => {
    handlePointerEnd(e);
  };

  const updateHoverCursor = (coords) => {
    const canvas = canvasRef.current;
    if (!canvas || isDrawingMode) return;

    if (activeLayerId) {
      const activeStk = stickers.find(s => s.id === activeLayerId);
      if (activeStk) {
        const cx = activeStk.x * canvas.width;
        const cy = activeStk.y * canvas.height;
        const stkSize = (activeStk.scale || 1.0) * 52;
        const p = rotatePoint(coords.x, coords.y, cx, cy, -(activeStk.rotation || 0));
        const hs = stkSize / 2 + 6;

        if (Math.hypot(p.x - (cx - hs - 36), p.y - (cy - hs - 36)) <= 26) {
          canvas.style.cursor = 'pointer'; return;
        }
        if (Math.hypot(p.x - cx, p.y - (cy - stkSize / 2 - 40)) <= 24) {
          canvas.style.cursor = 'grab'; return;
        }
        if (Math.hypot(p.x - (cx - hs), p.y - (cy - hs)) <= 22 || Math.hypot(p.x - (cx + hs), p.y - (cy + hs)) <= 22) {
          canvas.style.cursor = 'nwse-resize'; return;
        }
        if (Math.hypot(p.x - (cx + hs), p.y - (cy - hs)) <= 22 || Math.hypot(p.x - (cx - hs), p.y - (cy + hs)) <= 22) {
          canvas.style.cursor = 'nesw-resize'; return;
        }
        if (p.x >= cx - stkSize / 2 - 6 && p.x <= cx + stkSize / 2 + 6 && p.y >= cy - stkSize / 2 - 6 && p.y <= cy + stkSize / 2 + 6) {
          canvas.style.cursor = 'move'; return;
        }
      }

      const activeCap = captions.find(c => c.id === activeLayerId);
      if (activeCap) {
        const cx = activeCap.x * canvas.width;
        const cy = activeCap.y * canvas.height;
        const p = rotatePoint(coords.x, coords.y, cx, cy, -(activeCap.rotation || 0));
        const renderMaxWidth = (activeCap.width || 0.9) * canvas.width;
        const fontSize = activeCap.fontSize || 50;
        const ctx = canvas.getContext('2d');
        let maxLineWidth = 0;
        if (ctx) {
          ctx.font = `bold ${fontSize}px ${activeCap.fontFamily || 'Impact, sans-serif'}`;
          const lines = wrapText(ctx, activeCap.text, renderMaxWidth);
          for (const line of lines) maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
        }
        const hasBg = activeCap.bgColor && activeCap.bgColor !== 'transparent' && activeCap.bgColor !== 'none';
        const padX = hasBg && activeCap.bgStyle !== 'banner' ? Math.max(16, fontSize * 0.35) : Math.max(8, fontSize * 0.15);
        const padY = hasBg && activeCap.bgStyle !== 'banner' ? Math.max(10, fontSize * 0.2) : Math.max(4, fontSize * 0.1);
        const boxWidth = maxLineWidth + padX * 2;
        const textHeight = lines.length * (fontSize * 1.2);
        const boxHeight = textHeight + padY * 2;

        const halfW = boxWidth / 2;
        const halfH = boxHeight / 2;

        const topY = cy - halfH;
        const bottomY = cy + halfH;
        const leftX = cx - halfW;
        const rightX = cx + halfW;

        if (Math.hypot(p.x - (leftX - 36), p.y - (topY - 36)) <= 26) {
          canvas.style.cursor = 'pointer'; return;
        }
        if (Math.hypot(p.x - cx, p.y - (topY - 34)) <= 24) {
          canvas.style.cursor = 'grab'; return;
        }
        if (Math.hypot(p.x - leftX, p.y - topY) <= 22 || Math.hypot(p.x - rightX, p.y - bottomY) <= 22) {
          canvas.style.cursor = 'nwse-resize'; return;
        }
        if (Math.hypot(p.x - rightX, p.y - topY) <= 22 || Math.hypot(p.x - leftX, p.y - bottomY) <= 22) {
          canvas.style.cursor = 'nesw-resize'; return;
        }
        if (Math.hypot(p.x - leftX, p.y - cy) <= 22 || Math.hypot(p.x - rightX, p.y - cy) <= 22) {
          canvas.style.cursor = 'ew-resize'; return;
        }
        if (p.x >= cx - halfW && p.x <= cx + halfW && p.y >= cy - halfH && p.y <= cy + halfH) {
          canvas.style.cursor = 'move'; return;
        }
      }

      const activeImg = imageLayers.find(l => l.id === activeLayerId);
      if (activeImg) {
        const cached = imageCacheRef.current[activeImg.url];
        if (cached) {
          const cx = activeImg.x * canvas.width;
          const cy = activeImg.y * canvas.height;
          const scale = activeImg.scale || 1.0;
          const baseW = cached.width || 200;
          const baseH = cached.height || 200;
          const fitScale = Math.min(320 / baseW, 320 / baseH);
          const w = activeImg.boxWidth || activeImg.width || (baseW * fitScale * scale);
          const h = activeImg.boxHeight || activeImg.height || (baseH * fitScale * scale);
          const p = rotatePoint(coords.x, coords.y, cx, cy, -(activeImg.rotation || 0));
          const hw = w / 2 + 6;
          const hh = h / 2 + 6;

          if (Math.hypot(p.x - (cx - hw - 36), p.y - (cy - hh - 36)) <= 26) {
            canvas.style.cursor = 'pointer'; return;
          }
          if (Math.hypot(p.x - cx, p.y - (cy - hh - 34)) <= 22) {
            canvas.style.cursor = 'grab'; return;
          }
          if (Math.hypot(p.x - (cx - hw), p.y - (cy - hh)) <= 22 || Math.hypot(p.x - (cx + hw), p.y - (cy + hh)) <= 22) {
            canvas.style.cursor = 'nwse-resize'; return;
          }
          if (Math.hypot(p.x - (cx + hw), p.y - (cy - hh)) <= 22 || Math.hypot(p.x - (cx - hw), p.y - (cy + hh)) <= 22) {
            canvas.style.cursor = 'nesw-resize'; return;
          }
          if (Math.hypot(p.x - cx, p.y - (cy - hh)) <= 22 || Math.hypot(p.x - cx, p.y - (cy + hh)) <= 22) {
            canvas.style.cursor = 'ns-resize'; return;
          }
          if (Math.hypot(p.x - (cx - hw), p.y - cy) <= 22 || Math.hypot(p.x - (cx + hw), p.y - cy) <= 22) {
            canvas.style.cursor = 'ew-resize'; return;
          }
          if (p.x >= cx - w / 2 && p.x <= cx + w / 2 && p.y >= cy - h / 2 && p.y <= cy + h / 2) {
            canvas.style.cursor = 'move'; return;
          }
        }
      }
    }

    for (const stk of stickers) {
      const cx = stk.x * canvas.width;
      const cy = stk.y * canvas.height;
      const stkSize = (stk.scale || 1.0) * 52;
      const p = rotatePoint(coords.x, coords.y, cx, cy, -(stk.rotation || 0));
      if (p.x >= cx - stkSize / 2 && p.x <= cx + stkSize / 2 && p.y >= cy - stkSize / 2 && p.y <= cy + stkSize / 2) {
        canvas.style.cursor = 'pointer';
        return;
      }
    }

    for (const l of imageLayers) {
      const cx = l.x * canvas.width;
      const cy = l.y * canvas.height;
      const cached = imageCacheRef.current[l.url];
      if (cached) {
        const scale = l.scale || 1.0;
        const baseW = cached.width || 200;
        const baseH = cached.height || 200;
        const fitScale = Math.min(320 / baseW, 320 / baseH);
        const w = l.boxWidth || l.width || (baseW * fitScale * scale);
        const h = l.boxHeight || l.height || (baseH * fitScale * scale);
        const p = rotatePoint(coords.x, coords.y, cx, cy, -(l.rotation || 0));
        if (p.x >= cx - w / 2 && p.x <= cx + w / 2 && p.y >= cy - h / 2 && p.y <= cy + h / 2) {
          canvas.style.cursor = 'pointer';
          return;
        }
      }
    }

    canvas.style.cursor = 'default';
  };

  const handlePointerMove = (e) => {
    if (isDrawingMode && isDrawingActive.current && currentStroke.current) {
      const coords = getCanvasCoords(e);
      const stroke = currentStroke.current;
      const lastPt = lastDrawPoint.current || stroke.points[stroke.points.length - 1];

      const dist = Math.hypot(coords.x - lastPt.x, coords.y - lastPt.y);
      if (dist >= 1.5) {
        stroke.points.push({ x: coords.x, y: coords.y });
        lastDrawPoint.current = { x: coords.x, y: coords.y };

        // Instant hardware-accelerated 2D canvas drawing (no React state lag!)
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.save();
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(lastPt.x, lastPt.y);
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const coords = getCanvasCoords(e);

    if (!isDragging.current || !dragTarget.current) {
      if (!isDrawingMode) {
        updateHoverCursor(coords);
      }
      return;
    }

    const dx = (coords.x - dragStartCoords.current.x) / canvas.width;
    const dy = (coords.y - dragStartCoords.current.y) / canvas.height;

    // Mark as dragged if moved more than threshold (prevents accidental drag on tap on touchscreens)
    const pixelDx = Math.abs(coords.x - dragStartCoords.current.x);
    const pixelDy = Math.abs(coords.y - dragStartCoords.current.y);
    const dragThreshold = (e.touches && e.touches.length > 0) ? 18 : 6;
    if (pixelDx > dragThreshold || pixelDy > dragThreshold) {
      hasDragged.current = true;
      // Blur the textarea immediately when dragging starts so keyboard dismisses
      if (dragTarget.current?.type === 'caption' && editableRef.current) {
        editableRef.current.blur();
      }
    }

    if (dragTarget.current.type === 'slot') {
      if (typeof onUpdateSlotTransform === 'function') {
        const slotIdx = dragTarget.current.idx;
        
        // Handle Pinch to Zoom
        if (e.touches && e.touches.length === 2 && initialPinchDist.current) {
          const dxPinch = e.touches[0].clientX - e.touches[1].clientX;
          const dyPinch = e.touches[0].clientY - e.touches[1].clientY;
          const currentPinchDist = Math.hypot(dxPinch, dyPinch);
          const scaleFactor = currentPinchDist / initialPinchDist.current;
          
          const newScale = Math.max(0.5, Math.min(5.0, initialSlotScale.current * scaleFactor));
          
          onUpdateSlotTransform(slotIdx, (prev) => ({
            ...prev,
            scale: newScale
          }));
        } else {
          // Handle standard dragging
          onUpdateSlotTransform(slotIdx, (prev) => ({
            ...prev,
            offsetX: prev.offsetX + dx,
            offsetY: prev.offsetY + dy
          }));
          dragStartCoords.current = coords; // reset start coords for continuous offset calculation
        }
      }
      return;
    }
    
    if (dragTarget.current.type === 'empty-slot') {
      return;
    }

    if (dragTarget.current.type.startsWith('rotate_')) {
      const centerX = initialLayerPos.current.x * canvas.width;
      const centerY = initialLayerPos.current.y * canvas.height;
      const angleRad = Math.atan2(coords.y - centerY, coords.x - centerX);
      let angleDeg = (angleRad * 180 / Math.PI) + 90; // offset since handle is at top (-90 deg)
      
      const newRotation = angleDeg;
      const id = dragTarget.current.id;

      if (dragTarget.current.type === 'rotate_caption' && onUpdateCaptionBounds) {
        onUpdateCaptionBounds(id, { rotation: newRotation });
      } else if (dragTarget.current.type === 'rotate_sticker' && onUpdateStickerBounds) {
        onUpdateStickerBounds(id, { rotation: newRotation });
      } else if (dragTarget.current.type === 'rotate_imageLayer' && onUpdateImageLayerBounds) {
        onUpdateImageLayerBounds(id, { rotation: newRotation });
      }
      return;
    }

    if (dragTarget.current.type.startsWith('resize_imageLayer_')) {
      const id = dragTarget.current.id;
      const imgLayer = imageLayers.find(l => l.id === id);
      if (!imgLayer || !onUpdateImageLayerBounds) return;

      const centerX = initialLayerPos.current.x * canvas.width;
      const centerY = initialLayerPos.current.y * canvas.height;
      const handleType = dragTarget.current.type;

      const initW = initialLayerPos.current.boxWidth || initialLayerPos.current.width || 160;
      const initH = initialLayerPos.current.boxHeight || initialLayerPos.current.height || 160;
      const initScale = initialLayerPos.current.scale || 1.0;
      const nextFitMode = (!imgLayer.fitMode || imgLayer.fitMode === 'fit') ? 'stretch' : imgLayer.fitMode;

      if (handleType === 'resize_imageLayer_l' || handleType === 'resize_imageLayer_r') {
        // Horizontal stretch / crop
        const currentAngle = (imgLayer.rotation || 0);
        const localCoords = rotatePoint(coords.x, coords.y, centerX, centerY, -currentAngle);
        const horizontalDist = Math.abs(localCoords.x - centerX);
        const newWidth = Math.max(30, Math.round(horizontalDist * 2));

        onUpdateImageLayerBounds(id, {
          width: newWidth,
          boxWidth: newWidth,
          height: initH,
          boxHeight: initH,
          fitMode: nextFitMode
        });
        return;
      }

      if (handleType === 'resize_imageLayer_t' || handleType === 'resize_imageLayer_b') {
        // Vertical stretch / crop
        const currentAngle = (imgLayer.rotation || 0);
        const localCoords = rotatePoint(coords.x, coords.y, centerX, centerY, -currentAngle);
        const verticalDist = Math.abs(localCoords.y - centerY);
        const newHeight = Math.max(30, Math.round(verticalDist * 2));

        onUpdateImageLayerBounds(id, {
          width: initW,
          boxWidth: initW,
          height: newHeight,
          boxHeight: newHeight,
          fitMode: nextFitMode
        });
        return;
      }

      // Corner handles: uniform proportional scaling
      const currentDist = Math.hypot(coords.x - centerX, coords.y - centerY);
      const initDist = initialLayerPos.current.initialDist || 50;
      const scaleFactor = Math.max(0.05, currentDist / initDist);

      const newWidth = Math.max(30, Math.round(initW * scaleFactor));
      const newHeight = Math.max(30, Math.round(initH * scaleFactor));
      const newScale = Math.max(0.1, Math.min(10.0, Number((initScale * scaleFactor).toFixed(2))));

      onUpdateImageLayerBounds(id, { 
        width: newWidth, 
        height: newHeight, 
        boxWidth: newWidth, 
        boxHeight: newHeight, 
        scale: newScale 
      });
      return;
    }
    
    if (dragTarget.current.type.startsWith('resize_sticker_')) {
      const id = dragTarget.current.id;
      const stk = stickers.find(s => s.id === id);
      if (!stk || !onUpdateStickerBounds) return;

      const centerX = initialLayerPos.current.x * canvas.width;
      const centerY = initialLayerPos.current.y * canvas.height;

      const currentDist = Math.hypot(coords.x - centerX, coords.y - centerY);
      const initDist = initialLayerPos.current.initialDist || Math.max(10, (stk.scale || 1.0) * 52 * 0.7);
      const initScale = initialLayerPos.current.scale || 1.0;

      const scaleFactor = currentDist / initDist;
      const newScale = Math.max(0.2, Math.min(20.0, Number((initScale * scaleFactor).toFixed(2))));
      onUpdateStickerBounds(id, { scale: newScale });
      return;
    }
    
    if (dragTarget.current.type.startsWith('resize_caption_')) {
      const id = dragTarget.current.id;
      const cap = captions.find(c => c.id === id);
      if (!cap || !onUpdateCaptionBounds) return;

      const centerX = initialLayerPos.current.x * canvas.width;
      const centerY = initialLayerPos.current.y * canvas.height;
      const handleType = dragTarget.current.type;

      // Side handles (Left & Right): stretch/contract word-wrap width
      if (handleType === 'resize_caption_l' || handleType === 'resize_caption_r') {
        const currentAngle = (cap.rotation || 0);
        const localCoords = rotatePoint(coords.x, coords.y, centerX, centerY, -currentAngle);
        const horizontalDistFromCenter = Math.abs(localCoords.x - centerX);
        const newPixelWidth = Math.max(60, horizontalDistFromCenter * 2);
        const newWidthPercent = Math.min(1.0, Number((newPixelWidth / canvas.width).toFixed(3)));
        onUpdateCaptionBounds(id, { width: newWidthPercent });
        return;
      }

      // Corner handles: stretch to resize text font size & box proportionally, just like sticker and image layers
      const currentDist = Math.hypot(coords.x - centerX, coords.y - centerY);
      const initDist = initialLayerPos.current.initialDist || 50;
      const scaleFactor = Math.max(0.1, currentDist / initDist);

      const initFontSize = initialLayerPos.current.initialFontSize || cap.fontSize || 50;
      const newFontSize = Math.max(16, Math.min(250, Math.round(initFontSize * scaleFactor)));

      const initWidth = initialLayerPos.current.initialWidth || cap.width || 0.9;
      const newWidth = Math.max(0.15, Math.min(1.0, Number((initWidth * scaleFactor).toFixed(3))));

      onUpdateCaptionBounds(id, { 
        fontSize: newFontSize,
        width: newWidth
      });
      return;
    }

    // Standard translation
    const targetId = dragTarget.current.id;
    let newX = initialLayerPos.current.x + dx;
    let newY = initialLayerPos.current.y + dy;

    const SNAP_DIST = 0.015;

    // 1. Center Snapping
    if (Math.abs(newX - 0.5) < SNAP_DIST) newX = 0.5;
    if (Math.abs(newY - 0.5) < SNAP_DIST) newY = 0.5;

    // 2. Layer-to-Layer Snapping
    captions.forEach((c) => {
      if (c.id !== targetId) {
        if (Math.abs(newX - c.x) < SNAP_DIST) newX = c.x;
        if (Math.abs(newY - c.y) < SNAP_DIST) newY = c.y;
      }
    });
    stickers.forEach((s) => {
      if (s.id !== targetId) {
        if (Math.abs(newX - s.x) < SNAP_DIST) newX = s.x;
        if (Math.abs(newY - s.y) < SNAP_DIST) newY = s.y;
      }
    });

    if (dragTarget.current.type === 'caption' && onUpdateCaptionBounds) {
      onUpdateCaptionBounds(dragTarget.current.id, { x: newX, y: newY });
    
    } else if (dragTarget.current.type === 'sticker' && onUpdateStickerBounds) {
      onUpdateStickerBounds(dragTarget.current.id, { x: newX, y: newY });
    } else if (dragTarget.current.type === 'imageLayer' && onUpdateImageLayerBounds) {
      onUpdateImageLayerBounds(dragTarget.current.id, { x: newX, y: newY });
    } else if (dragTarget.current.type === 'imageLayer' && onUpdateImageLayerPosition) {
      onUpdateImageLayerPosition(dragTarget.current.id, newX, newY);
    }
  };

  const handlePointerUp = () => {
    if (canvasRef.current && !isDrawingMode) {
      canvasRef.current.style.cursor = 'default';
    }
    if (isDrawingMode && isDrawingActive.current) {
      isDrawingActive.current = false;
      lastDrawPoint.current = null;
      if (currentStroke.current) {
        const strokeToSave = currentStroke.current;
        currentStroke.current = null;
        if (strokeToSave.points.length > 0 && onAddDrawing) {
          onAddDrawing(strokeToSave);
        }
      }
      return;
    }
    isDragging.current = false;
    hasDragged.current = false;
    dragTarget.current = null;
  };

  // Global window listeners so fast mouse or touch drags don't freeze when leaving the canvas element
  useEffect(() => {
    const handleGlobalMove = (e) => {
      if (isDragging.current) {
        handlePointerMove(e);
      }
    };
    const handleGlobalUp = (e) => {
      if (isDragging.current || isDrawingActive.current) {
        handlePointerUp();
      }
    };
    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchmove', handleGlobalMove, { passive: false });
    window.addEventListener('touchend', handleGlobalUp);
    window.addEventListener('touchcancel', handleGlobalUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalUp);
      window.removeEventListener('touchcancel', handleGlobalUp);
    };
  }, [captions, stickers, imageLayers, activeLayerId]);

  // Keep focus on active caption whenever selected
  useEffect(() => {
    if (activeCaption && editingCaptionId === activeCaption.id) {
      focusTextarea();
    }
  }, [activeCaption?.id, editingCaptionId]);

  const handleWheel = (e) => {
    if (!activeIsNativeLayout || !activeLayoutDef || !onUpdateSlotTransform) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const coords = getCanvasCoords(e);
    
    const totalSlots = activeLayoutDef.slots;
    const isVert = activeLayoutDef.id === '2-vert' || activeLayoutDef.id === '3-stacked';
    const isHoriz = activeLayoutDef.id === '2-horiz' || activeLayoutDef.id === '3-horiz';
    const isGrid = activeLayoutDef.id === '4-grid';
    const isHybrid = activeLayoutDef.id === '3-hybrid';

    let hitSlotIdx = -1;
    for (let idx = 0; idx < totalSlots; idx++) {
      let x = 0, y = 0, slotW = canvas.width, slotH = canvas.height;
      if (isVert) { slotH = canvas.height / totalSlots; y = idx * slotH; }
      else if (isHoriz) { slotW = canvas.width / totalSlots; x = idx * slotW; }
      else if (isGrid) { slotW = canvas.width / 2; slotH = canvas.height / 2; x = (idx % 2) * slotW; y = Math.floor(idx / 2) * slotH; }
      else if (isHybrid) {
        if (idx === 0) { slotW = canvas.width; slotH = canvas.height / 2; x = 0; y = 0; }
        else { slotW = canvas.width / 2; slotH = canvas.height / 2; x = (idx - 1) * slotW; y = canvas.height / 2; }
      }
      if (coords.x >= x && coords.x <= x + slotW && coords.y >= y && coords.y <= y + slotH) {
        hitSlotIdx = idx;
        break;
      }
    }

    if (hitSlotIdx !== -1 && slotImages && slotImages[hitSlotIdx]) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      onUpdateSlotTransform(hitSlotIdx, (prev) => {
        const prevScale = prev?.scale || 1.5;
        const newScale = Math.max(0.4, Math.min(6.0, Number((prevScale * zoomFactor).toFixed(2))));
        return {
          ...prev,
          scale: newScale
        };
      });
    }
  };

  const computedFontSize = activeCaption ? (activeCaption.fontSize || 50) * (canvasScale || 1) : 18;

  return (
    <div
      ref={wrapperRef}
      className="canvas-interactive-wrapper"
      style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', touchAction: 'none', width: '100%', height: '100%' }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerEnd}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerEnd}
      onTouchCancel={handlePointerEnd}
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef}
        className="meme-canvas"
        style={{
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          cursor: isDrawingMode ? 'crosshair' : 'default',
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto',
          display: 'block',
          objectFit: 'contain'
        }}
      />

      {/* SEAMLESS LIVE CANVAS TEXT EDITOR — EXACTLY AS SAVED VERSION WITH MOBILE TAP FOCUS */}
      {!isDrawingMode && (
        <textarea
          ref={editableRef}
          className="seamless-live-text-editor"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          style={{
            position: 'absolute',
            left: activeCaption ? `${activeCaption.x * 100}%` : '-9999px',
            top: activeCaption ? `${activeCaption.y * 100}%` : '-9999px',
            transform: activeCaption ? `translate(-50%, -50%) rotate(${activeCaption.rotation || 0}deg)` : 'none',
            width: activeCaption ? `${Math.min(95, Math.max(35, (activeCaption.width || 0.8) * 100))}%` : '1px',
            minHeight: activeCaption ? '44px' : '1px',
            opacity: 0.001,
            pointerEvents: activeCaption ? 'auto' : 'none',
            color: 'transparent',
            caretColor: 'transparent',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            zIndex: activeCaption ? 15 : -1,
            padding: '0',
            margin: '0',
            fontSize: '16px',
            touchAction: 'manipulation',
            overflow: 'hidden'
          }}
          rows={2}
          value={activeCaption?.text || ''}
          onChange={(e) => {
            if (activeCaption && onUpdateCaptionText) {
              onUpdateCaptionText(activeCaption.id, e.target.value);
            }
          }}
          onFocus={(e) => {
            try {
              const len = e.target.value.length;
              e.target.setSelectionRange(len, len);
            } catch {
              // Selection fallback
            }
          }}
          onBlur={() => {
            setEditingCaptionId(null);
            setCursorVisible(false);
          }}
          onTouchStart={(e) => {
            handleTextOverlayPointerDown(e);
          }}
          onTouchEnd={(e) => {
            handleTextOverlayPointerEnd(e);
          }}
          onMouseDown={handleTextOverlayPointerDown}
          onMouseUp={handleTextOverlayPointerEnd}
        />
      )}
    </div>
  );
});

export default CanvasEditor;
