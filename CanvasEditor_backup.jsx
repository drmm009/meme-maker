import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Image as ImageIcon, Sparkles, Type } from 'lucide-react';

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
    onUpdateCaptionBounds,
    onUpdateStickerPosition,
    onUpdateImageLayerPosition,
    onUpdateCaptionText,
    isNativeLayout,
    layoutDef,
    slotImages,
    slotTransforms,
    onUpdateSlotTransform,
    isVideoPlaying = true
  },
  ref
) {
  const internalRef = useRef(null);
  const canvasRef = ref || internalRef;

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

  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const dragTarget = useRef(null);
  const dragStartCoords = useRef({ x: 0, y: 0 });
  const initialLayerPos = useRef({ x: 0.5, y: 0.5 });
  // Double-tap detection: track last tap time and layer id
  const lastTapRef = useRef({ id: null, time: 0 });

  const imgSrc = template?.imageUrl || imageUrl;
  const [naturalSize, setNaturalSize] = useState({ w: template?.width || null, h: template?.height || null });

  // Reset natural size and base image cache when image source changes
  useEffect(() => {
    baseImgRef.current = null;
    setNaturalSize({ w: template?.width || null, h: template?.height || null });
  }, [imgSrc, template]);

  const activeIsNativeLayout = isNativeLayout || template?.isNativeLayout || false;
  const activeLayoutDef = layoutDef || template?.layoutDef || (activeIsNativeLayout ? { id: '1-panel', slots: 1 } : null);

  const baseCanvasW = naturalSize.w || 800;
  const baseCanvasH = naturalSize.h || 800;

  let canvasW = baseCanvasW;
  let canvasH = baseCanvasH;
  if (aspectRatio === '1:1') {
    canvasW = 800;
    canvasH = 800;
  } else if (aspectRatio === '4:5') {
    canvasW = 800;
    canvasH = 1000;
  } else if (aspectRatio === '9:16') {
    canvasW = 1080;
    canvasH = 1920;
  } else if (aspectRatio === '16:9') {
    canvasW = 1920;
    canvasH = 1080;
  }

  const activeFilters = filters || { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, blur: 0 };

  const activeCaption = captions.find((c) => c.id === activeLayerId);

  // Compute scale ratio on mount and window resize ONLY (no DOM thrashing during typing)
  useEffect(() => {
    const updateScale = () => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        const availableW = rect.width - 40;
        const availableH = rect.height - 40;
        if (availableW > 0 && availableH > 0 && canvasW > 0 && canvasH > 0) {
          const fitScale = Math.min(availableW / canvasW, availableH / canvasH);
          setCanvasScale(fitScale);
        }
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [canvasW, canvasH]);

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

  // Native non-passive touch listeners: handle drag AND block page scroll
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onTouchStart = (e) => {
      if (e.cancelable) e.preventDefault();
      handlePointerDown(e);
    };

    const onTouchMove = (e) => {
      if (e.cancelable) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (isDragging.current) {
        handlePointerMove(e);
      }
    };

    const onTouchEnd = (e) => {
      handlePointerEnd(e);
    };

    wrapper.addEventListener('touchstart', onTouchStart, { passive: false });
    wrapper.addEventListener('touchmove', onTouchMove, { passive: false });
    wrapper.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      wrapper.removeEventListener('touchstart', onTouchStart);
      wrapper.removeEventListener('touchmove', onTouchMove);
      wrapper.removeEventListener('touchend', onTouchEnd);
    };
  }, [captions, stickers, activeLayerId, imageLayers, slotImages, slotTransforms, activeIsNativeLayout]);

  // Global window listeners for mouse drag so dragging doesn't stop when cursor moves outside canvas
  useEffect(() => {
    const onGlobalMouseMove = (e) => {
      if (isDragging.current) {
        handlePointerMove(e);
      }
    };
    const onGlobalMouseUp = (e) => {
      if (isDragging.current) {
        handlePointerEnd(e);
      }
    };

    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', onGlobalMouseMove);
      window.removeEventListener('mouseup', onGlobalMouseUp);
    };
  }, [captions, stickers, imageLayers, slotImages, slotTransforms, activeIsNativeLayout]);

  const baseImgRef = useRef(null);

  const loadMedia = (src, callback, trimStart, trimEnd) => {
    if (!src) return;
    if (imageCacheRef.current[src]) {
      const cached = imageCacheRef.current[src];
      // Apply trim points to already-cached video
      if (cached.tagName === 'VIDEO' && trimStart !== undefined) {
        cached._trimStart = trimStart || 0;
        cached._trimEnd = trimEnd;
        cached.currentTime = trimStart || 0;
      }
      if (callback) callback(cached);
      return;
    }

    if (loadingMediaRef.current[src]) return;
    loadingMediaRef.current[src] = true;

    const cleanSrc = getCleanMediaUrl(src);
    if (isVideoUrl(src)) {
      const video = document.createElement('video');
      if (!cleanSrc.startsWith('blob:') && !cleanSrc.startsWith('data:')) {
        video.crossOrigin = 'anonymous';
      }
      video.autoplay = true;
      video.loop = true;
      // video.muted = true; // allow sound for preview
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.style.position = 'fixed';
      video.style.top = '-9999px';
      video.style.left = '-9999px';
      video.style.opacity = '0';
      video.style.pointerEvents = 'none';
      document.body.appendChild(video);

      video._trimStart = trimStart || 0;
      video._trimEnd = trimEnd;

      let hasTriggered = false;
      const onReady = () => {
        if (hasTriggered) return;
        hasTriggered = true;
        delete loadingMediaRef.current[src];
        video.width = video.videoWidth || 800;
        video.height = video.videoHeight || 800;
        if (trimStart) video.currentTime = trimStart;
        
        // Attempt to play with sound. If browser blocks unmuted autoplay, fallback to muted.
        video.play().catch((err) => {
          if (err.name === 'NotAllowedError') {
            video.muted = true;
            video.play().catch(() => {});
          }
        });
        
        imageCacheRef.current[src] = video;
        if (callback) callback(video);
      };

      const onError = (err) => {
        delete loadingMediaRef.current[src];
        if (video.parentNode) video.parentNode.removeChild(video);
        console.warn('Video failed to load:', src, err);
      };

      video.onloadeddata = onReady;
      video.onloadedmetadata = onReady;
      video.oncanplay = onReady;
      video.onerror = onError;
      video.src = cleanSrc;
      video.load();
    } else {
      const img = new Image();
      if (!cleanSrc.startsWith('blob:') && !cleanSrc.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        delete loadingMediaRef.current[src];
        imageCacheRef.current[src] = img;
        if (callback) callback(img);
      };
      img.onerror = () => {
        delete loadingMediaRef.current[src];
      };
      img.src = cleanSrc;
    }
  };

  // Continuous animation loop — supports play/pause and trim boundaries
  useEffect(() => {
    let animId = null;
    const animate = () => {
      // Enforce trim points
      Object.entries(imageCacheRef.current).forEach(([, media]) => {
        if (media && media.tagName === 'VIDEO') {
          const trimEnd = media._trimEnd;
          const trimStart = media._trimStart || 0;
          if (trimEnd !== undefined && media.currentTime >= trimEnd) {
            media.currentTime = trimStart;
          }
        }
      });

      // Always re-render canvas so video frames show
      if (canvasRef.current && renderCanvasRef.current) {
        const hasVideoLayer = (imageLayers || []).some(l => isVideoUrl(l.url)) ||
          isVideoUrl(imgSrc) ||
          (slotImages || []).some(s => isVideoUrl(s));
        if (hasVideoLayer) {
          renderCanvasRef.current(baseImgRef.current);
        }
      }
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [captions, stickers, imageLayers, slotImages, activeIsNativeLayout, imgSrc, isVideoPlaying]);

  const renderCanvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || (!imgSrc && !activeIsNativeLayout)) return;
    const ctx = canvas.getContext('2d');

    const renderCanvas = (img) => {
      try {
        if (canvas.width !== canvasW) canvas.width = canvasW;
        if (canvas.height !== canvasH) canvas.height = canvasH;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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
              const dims = getMediaDimensions(cached);
              const tx = slotTransforms[idx] || { offsetX: 0, offsetY: 0, scale: 1.5 };
              const scale = Math.min(slotW / dims.width, slotH / dims.height) * (tx.scale || 1.0);
              const nw = dims.width * scale;
              const nh = dims.height * scale;
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
              loadMedia(src, () => {
                renderCanvas(baseImgRef.current);
              });
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(x, y, slotW, slotH);
            }
          } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, y, slotW, slotH);
          }

          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, slotW, slotH);
        }
      } else if (img && !activeIsNativeLayout) {
        const dims = getMediaDimensions(img);
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
          const imgRatio = dims.width / dims.height;
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
          const imgRatio = dims.width / dims.height;
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
        try {
          ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
        } catch (err) {
          console.warn('Failed to draw base image:', err);
        }
      }
      ctx.restore();

      // Reset filter for text/stickers/image-layers overlay
      ctx.filter = 'none';

      // Render Custom Image / Video Overlay Layers
      (imageLayers || []).forEach((imgLayer) => {
        const cx = imgLayer.x * canvas.width;
        const cy = imgLayer.y * canvas.height;
        const cached = imageCacheRef.current[imgLayer.url];

        if (cached) {
          if (cached.tagName === 'VIDEO') {
            cached._trimStart = imgLayer.trimStart || 0;
            cached._trimEnd = imgLayer.trimEnd;
          }
          const dims = getMediaDimensions(cached);
          const baseW = dims.width || 200;
          const baseH = dims.height || 200;

          if (isFinite(baseW) && isFinite(baseH) && baseW > 0 && baseH > 0) {
            ctx.save();
            ctx.translate(cx, cy);
            if (imgLayer.rotation) {
              ctx.rotate((imgLayer.rotation * Math.PI) / 180);
            }
            const scale = imgLayer.scale || 0.5;
            const maxDim = 320;
            const fitScale = Math.min(maxDim / baseW, maxDim / baseH);
            const w = baseW * fitScale * scale;
            const h = baseH * fitScale * scale;

            if (isFinite(w) && isFinite(h) && w > 0 && h > 0) {
              try {
                ctx.drawImage(cached, -w / 2, -h / 2, w, h);
              } catch (e) {
                console.warn('Failed to draw layer frame onto canvas:', e);
              }

              if (imgLayer.id === activeLayerId) {
                ctx.strokeStyle = '#00f0ff';
                ctx.lineWidth = 3;
                ctx.setLineDash([6, 6]);
                ctx.strokeRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12);
              }
              
              // Draw Play/Pause Overlay for Video Layers
              if (cached.tagName === 'VIDEO') {
                ctx.setLineDash([]);
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.beginPath();
                ctx.arc(0, 0, 36, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#ffffff';
                if (cached.paused) {
                  // Draw Play Triangle (larger)
                  ctx.beginPath();
                  ctx.moveTo(-9, -15);
                  ctx.lineTo(18, 0);
                  ctx.lineTo(-9, 15);
                  ctx.fill();
                } else {
                  // Draw Pause Bars (larger)
                  ctx.fillRect(-12, -12, 8, 24);
                  ctx.fillRect(4, -12, 8, 24);
                }
              }
            }

            ctx.restore();
          }
        } else {
          loadMedia(imgLayer.url, () => {
            renderCanvas(baseImgRef.current);
          }, imgLayer.trimStart, imgLayer.trimEnd);
        }
      });

      // Render Stickers / Emojis
      stickers.forEach((stk) => {
        const sx = stk.x * canvas.width;
        const sy = stk.y * canvas.height;
        ctx.save();
        const stkSize = (stk.scale || 1.0) * 52;
        ctx.font = `${stkSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (stk.id === activeLayerId) {
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 6]);
          ctx.strokeRect(sx - stkSize / 2 - 6, sy - stkSize / 2 - 6, stkSize + 12, stkSize + 12);
        }

        ctx.fillText(stk.emoji, sx, sy);
        ctx.restore();
      });

      // Render Text Captions
      captions.forEach((cap) => {
        ctx.save();

        const fontSize = cap.fontSize || 50;
        const fontFamily = cap.fontFamily || 'Impact, sans-serif';
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const cx = cap.x * canvas.width;
        const cy = cap.y * canvas.height;
        const maxWidth = (cap.width || 0.9) * canvas.width;

        const lines = wrapText(ctx, cap.text, maxWidth);
        const lineHeight = fontSize * 1.2;
        const startY = cy - ((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, index) => {
          const ly = startY + index * lineHeight;

          if (cap.stroke && cap.stroke !== 'transparent') {
            ctx.strokeStyle = cap.stroke;
            ctx.lineWidth = cap.strokeWidth || Math.max(3, fontSize / 7);
            ctx.lineJoin = 'miter';
            ctx.miterLimit = 2;
            ctx.strokeText(line, cx, ly);
          }

          ctx.fillStyle = cap.color || '#ffffff';
          ctx.fillText(line, cx, ly);
        });

        // Bounding indicator box for active caption layer
        if (cap.id === activeLayerId) {
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 6]);
          
          const totalHeight = Math.max(lines.length * lineHeight, 45);
          const boxWidth = maxWidth;
          const boxX = cx - boxWidth / 2;
          
          const boxY = startY - lineHeight / 2 - 6;
          const boxHeight = totalHeight + 12;
          
          ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
          
          // Draw resize handles (4 corners)
          ctx.setLineDash([]);
          ctx.fillStyle = '#00f0ff';
          
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
        }

        ctx.restore();
      });

      // Render Smart Alignment Guides when dragging
      if (isDragging.current && activeLayerId) {
        const activeItem = captions.find((c) => c.id === activeLayerId) || stickers.find((s) => s.id === activeLayerId);
        if (activeItem) {
          ctx.save();

          const curX = activeItem.x * canvas.width;
          const curY = activeItem.y * canvas.height;

          // 1. Vertical Center Line (X = 50%)
          if (Math.abs(activeItem.x - 0.5) < 0.005) {
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, 0);
            ctx.lineTo(canvas.width / 2, canvas.height);
            ctx.stroke();

            ctx.fillStyle = '#00f0ff';
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, 5, 0, Math.PI * 2);
            ctx.fill();
          }

          // 2. Horizontal Center Line (Y = 50%)
          if (Math.abs(activeItem.y - 0.5) < 0.005) {
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(0, canvas.height / 2);
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();

            ctx.fillStyle = '#00f0ff';
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, 5, 0, Math.PI * 2);
            ctx.fill();
          }

          // 3. Object-to-Object Alignment Lines
          const otherItems = [
            ...captions.filter((c) => c.id !== activeLayerId),
            ...stickers.filter((s) => s.id !== activeLayerId)
          ];

          otherItems.forEach((other) => {
            const othX = other.x * canvas.width;
            const othY = other.y * canvas.height;

            // X-alignment with another layer
            if (Math.abs(activeItem.x - other.x) < 0.005) {
              ctx.strokeStyle = '#ff007f';
              ctx.lineWidth = 2;
              ctx.setLineDash([4, 4]);
              ctx.beginPath();
              ctx.moveTo(curX, Math.min(curY, othY) - 30);
              ctx.lineTo(curX, Math.max(curY, othY) + 30);
              ctx.stroke();
            }

            // Y-alignment with another layer
            if (Math.abs(activeItem.y - other.y) < 0.005) {
              ctx.strokeStyle = '#ff007f';
              ctx.lineWidth = 2;
              ctx.setLineDash([4, 4]);
              ctx.beginPath();
              ctx.moveTo(Math.min(curX, othX) - 30, curY);
              ctx.lineTo(Math.max(curX, othX) + 30, curY);
              ctx.stroke();
            }
          });

          ctx.restore();
        }
      }
      } catch (err) {
        console.error('Fatal error in renderCanvas:', err);
      }
    };

    renderCanvasRef.current = renderCanvas;

    if (activeIsNativeLayout) {
      renderCanvas(null);
    } else if (baseImgRef.current) {
      renderCanvas(baseImgRef.current);
    } else if (imgSrc) {
      loadMedia(imgSrc, (media) => {
        const dims = getMediaDimensions(media);
        setNaturalSize((prev) => {
          if (prev.w !== dims.width || prev.h !== dims.height) {
            return { w: dims.width, h: dims.height };
          }
          return prev;
        });
        baseImgRef.current = media;
        renderCanvas(media);
      });
    }
  }, [imgSrc, canvasW, canvasH, captions, stickers, imageLayers, activeFilters, activeLayerId, canvasRef, imageFit, activeIsNativeLayout, activeLayoutDef, slotImages, slotTransforms]);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e) => {
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let hitLayer = null;

    // Accurate rectangular bounding box hit test for text captions
    for (let cap of captions) {
      const cx = cap.x * canvas.width;
      const cy = cap.y * canvas.height;
      const maxWidth = (cap.width || 0.9) * canvas.width;
      const fontSize = cap.fontSize || 50;
      
      ctx.font = `bold ${fontSize}px ${cap.fontFamily || 'Impact, sans-serif'}`;
      
      const lines = wrapText(ctx, cap.text, maxWidth);
      const lineHeight = fontSize * 1.2;
      const totalHeight = Math.max(lines.length * lineHeight, 45);
      const halfW = maxWidth / 2;
      const halfH = totalHeight / 2 + 20;

      // Check resize handles first if this is the active layer
      if (cap.id === activeLayerId) {
        const leftHandleX = cx - halfW;
        const rightHandleX = cx + halfW;
        
        const boxY = cy - halfH; // rough approximation of top edge
        const boxBottom = cy + halfH; // rough approximation of bottom edge
        
        const handles = [
          { type: 'resize_caption_tl', x: leftHandleX, y: boxY },
          { type: 'resize_caption_tr', x: rightHandleX, y: boxY },
          { type: 'resize_caption_bl', x: leftHandleX, y: boxBottom },
          { type: 'resize_caption_br', x: rightHandleX, y: boxBottom }
        ];

        // Use a much larger hit radius (60 canvas pixels) to accommodate touch and scaled canvas
        for (const h of handles) {
          if (Math.hypot(coords.x - h.x, coords.y - h.y) < 60) {
            hitLayer = { id: cap.id, type: h.type, x: cap.x, y: cap.y, width: cap.width || 0.9 };
            break;
          }
        }
        if (hitLayer) break;
      }

      if (
        coords.x >= cx - halfW - 10 &&
        coords.x <= cx + halfW + 10 &&
        coords.y >= cy - halfH &&
        coords.y <= cy + halfH
      ) {
        hitLayer = { id: cap.id, type: 'caption', x: cap.x, y: cap.y };
        break;
      }
    }

    // Check sticker layer collision
    if (!hitLayer) {
      for (let stk of stickers) {
        const sx = stk.x * canvas.width;
        const sy = stk.y * canvas.height;
        const dist = Math.hypot(coords.x - sx, coords.y - sy);
        if (dist < 50) {
          hitLayer = { id: stk.id, type: 'sticker', x: stk.x, y: stk.y };
          break;
        }
      }
    }

    // Check custom image layer collision — use same dimensions as render code
    if (!hitLayer) {
      for (let imgLayer of (imageLayers || []).slice().reverse()) {
        const ix = imgLayer.x * canvas.width;
        const iy = imgLayer.y * canvas.height;
        const cached = imageCacheRef.current[imgLayer.url];
        const scale = imgLayer.scale || 0.5;
        const baseW = cached ? (cached.videoWidth || cached.naturalWidth || cached.width || 200) : 200;
        const baseH = cached ? (cached.videoHeight || cached.naturalHeight || cached.height || 200) : 200;
        const maxDim = 320;
        const fitScale = Math.min(maxDim / baseW, maxDim / baseH);
        const hw = (baseW * fitScale * scale) / 2 + 20; // +20px touch padding
        const hh = (baseH * fitScale * scale) / 2 + 20;

        // 1. First, check if they clicked the Play/Pause button in the center (only if it's a video)
        if (cached && cached.tagName === 'VIDEO') {
          const distToCenter = Math.hypot(coords.x - ix, coords.y - iy);
          if (distToCenter <= 45) { // Increased hit radius
            hitLayer = { id: imgLayer.id, type: 'video_toggle', media: cached };
            break;
          }
        }

        // 2. Otherwise, check if they clicked the layer for dragging/selecting
        if (
          coords.x >= ix - hw &&
          coords.x <= ix + hw &&
          coords.y >= iy - hh &&
          coords.y <= iy + hh
        ) {
          hitLayer = { id: imgLayer.id, type: 'imageLayer', x: imgLayer.x, y: imgLayer.y };
          break;
        }
      }
    }

    // Check Native Layout Slot collision (if no UI overlay element was hit)
    if (!hitLayer && activeIsNativeLayout && activeLayoutDef) {
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

        if (coords.x >= x && coords.x <= x + slotW && coords.y >= y && coords.y <= y + slotH) {
          if (slotImages[idx]) { 
            hitLayer = { id: `slot-${idx}`, type: 'slot', idx: idx, x: 0, y: 0 };
            break;
          } else {
            hitLayer = { id: `empty-slot-${idx}`, type: 'empty-slot', idx: idx, x: 0, y: 0 };
            break;
          }
        }
      }
    }

    if (hitLayer) {
      if (hitLayer.type === 'video_toggle') {
        if (hitLayer.media.paused) {
          hitLayer.media.play().catch(() => {});
        } else {
          hitLayer.media.pause();
        }
        // Also select the layer if it's not selected
        if (activeLayerId !== hitLayer.id && onSelectLayer) onSelectLayer(hitLayer.id);
        return;
      }
      
      isDragging.current = true;
      hasDragged.current = false;
      dragTarget.current = hitLayer;
      dragStartCoords.current = coords;
      initialLayerPos.current = { x: hitLayer.x, y: hitLayer.y };
      if (onSelectLayer && hitLayer.type !== 'slot') onSelectLayer(hitLayer.id);
      // Do NOT focus here — wait for touchEnd to distinguish tap vs drag
    } else {
      // User tapped blank canvas background — deselect active layer
      isDragging.current = false;
      hasDragged.current = false;
      dragTarget.current = null;
      if (onSelectLayer) onSelectLayer(null);
    }
  };

  const handlePointerEnd = (e) => {
    const wasCleanTap = !hasDragged.current;
    const tappedId = dragTarget.current?.id;
    const tappedType = dragTarget.current?.type;
    const tappedIdx = dragTarget.current?.idx;

    isDragging.current = false;
    hasDragged.current = false;
    dragTarget.current = null;

    if (wasCleanTap && tappedType === 'empty-slot') {
      // Slot actions are now handled by DOM overlays on the canvas
    }

    // Double-tap detection: open keyboard only on 2nd tap within 350ms on same caption
    if (wasCleanTap && tappedType === 'caption' && tappedId) {
      const now = Date.now();
      const last = lastTapRef.current;
      if (last.id === tappedId && now - last.time < 350) {
        // Double tap — open keyboard
        lastTapRef.current = { id: null, time: 0 };
        focusTextarea();
      } else {
        // First tap — just record it
        lastTapRef.current = { id: tappedId, time: now };
      }
    } else {
      lastTapRef.current = { id: null, time: 0 };
    }
  };

  const handleTextOverlayPointerDown = (e) => {
    const coords = getCanvasCoords(e);
    if (!activeCaption) return;

    hasDragged.current = false;
    isDragging.current = true;
    dragTarget.current = { id: activeCaption.id, type: 'caption', x: activeCaption.x, y: activeCaption.y };
    dragStartCoords.current = coords;
    initialLayerPos.current = { x: activeCaption.x, y: activeCaption.y };
  };

  const handleTextOverlayPointerEnd = (e) => {
    const wasCleanTap = !hasDragged.current;
    const tappedId = activeCaption?.id;

    isDragging.current = false;
    hasDragged.current = false;
    dragTarget.current = null;

    // Double-tap on overlay textarea — open keyboard on 2nd tap
    if (wasCleanTap && tappedId) {
      const now = Date.now();
      const last = lastTapRef.current;
      if (last.id === tappedId && now - last.time < 350) {
        lastTapRef.current = { id: null, time: 0 };
        focusTextarea();
      } else {
        lastTapRef.current = { id: tappedId, time: now };
      }
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current || !dragTarget.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const coords = getCanvasCoords(e);

    const dx = (coords.x - dragStartCoords.current.x) / canvas.width;
    const dy = (coords.y - dragStartCoords.current.y) / canvas.height;

    // Mark as dragged if moved more than a small threshold (prevents accidental drag on tap)
    const pixelDx = Math.abs(coords.x - dragStartCoords.current.x);
    const pixelDy = Math.abs(coords.y - dragStartCoords.current.y);
    if (pixelDx > 6 || pixelDy > 6) {
      hasDragged.current = true;
      // Blur the textarea immediately when dragging starts so keyboard dismisses
      if (dragTarget.current?.type === 'caption' && editableRef.current) {
        editableRef.current.blur();
      }
    }

    if (dragTarget.current.type === 'slot') {
      if (typeof onUpdateSlotTransform === 'function') {
        const slotIdx = dragTarget.current.idx;
        onUpdateSlotTransform(slotIdx, (prev) => ({
          ...prev,
          offsetX: prev.offsetX + dx,
          offsetY: prev.offsetY + dy
        }));
        dragStartCoords.current = coords; // reset start coords for continuous offset calculation
      }
      return;
    }
    
    if (dragTarget.current.type === 'empty-slot') {
      return;
    }

    if (dragTarget.current.type.startsWith('resize_caption_')) {
      const type = dragTarget.current.type;
      const initialWidth = dragTarget.current.width;
      const isRightHandle = type === 'resize_caption_tr' || type === 'resize_caption_br';
      const widthChange = isRightHandle ? dx * 2 : -dx * 2;
      const newWidth = Math.max(0.1, Math.min(0.98, initialWidth + widthChange));

      if (onUpdateCaptionBounds) {
        onUpdateCaptionBounds(dragTarget.current.id, { width: newWidth });
      }
      return;
    }

    const minBounds = dragTarget.current?.type === 'imageLayer' ? -0.5 : 0.05;
    const maxBounds = dragTarget.current?.type === 'imageLayer' ? 1.5 : 0.95;

    let newX = Math.max(minBounds, Math.min(maxBounds, initialLayerPos.current.x + dx));
    let newY = Math.max(minBounds, Math.min(maxBounds, initialLayerPos.current.y + dy));

    // Magnetic Snapping (1.5% snap zone)
    const SNAP_DIST = 0.015;
    const targetId = dragTarget.current?.id;

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
    } else if (dragTarget.current.type === 'sticker' && onUpdateStickerPosition) {
      onUpdateStickerPosition(dragTarget.current.id, newX, newY);
    } else if (dragTarget.current.type === 'imageLayer' && onUpdateImageLayerPosition) {
      onUpdateImageLayerPosition(dragTarget.current.id, newX, newY);
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    hasDragged.current = false;
    dragTarget.current = null;
  };

  const computedFontSize = activeCaption ? (activeCaption.fontSize || 50) * (canvasScale || 1) : 18;

  return (
    <div
      ref={wrapperRef}
      className="canvas-interactive-wrapper"
      style={{ position: 'relative', display: 'inline-block', touchAction: 'none' }}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
    >
      <canvas
        ref={canvasRef}
        className="meme-canvas"
        style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
        onMouseDown={handlePointerDown}
      />

      {/* SEAMLESS LIVE CANVAS TEXT EDITOR — AUTOMATICALLY FOCUSED FOR INSTANT TYPING */}
      {activeCaption && (
        <textarea
          ref={editableRef}
          className="seamless-live-text-editor"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0,
            width: '1px',
            height: '1px',
            pointerEvents: 'none',
            color: 'transparent',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            zIndex: -1,
            padding: '0',
            margin: '0',
            overflow: 'hidden'
          }}
          rows={2}
          value={activeCaption.text}
          onChange={(e) => {
            if (onUpdateCaptionText) {
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
          onTouchStart={(e) => {
            e.stopPropagation();
            handleTextOverlayPointerDown(e);
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
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
