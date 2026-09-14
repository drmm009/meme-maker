import re
import sys

print("Patching MemeEditor.jsx")
with open('src/components/MemeEditor.jsx', 'r', encoding='utf-8') as f:
    meme = f.read()

# 1. Update callbacks in MemeEditor.jsx
meme = meme.replace('onUpdateStickerPosition={(id, x, y) => {', 'onUpdateStickerBounds={(id, newProps) => {')
meme = meme.replace('const nextStk = stickers.map((s) => (s.id === id ? { ...s, x, y } : s));', 'const nextStk = stickers.map((s) => (s.id === id ? { ...s, ...newProps } : s));')

meme = meme.replace('onUpdateImageLayerPosition={(id, x, y) => {', 'onUpdateImageLayerBounds={(id, newProps) => {')
meme = meme.replace('const nextImgLayers = imageLayers.map((l) => (l.id === id ? { ...l, x, y } : l));', 'const nextImgLayers = imageLayers.map((l) => (l.id === id ? { ...l, ...newProps } : l));')

# 2. Add rotation: 0 to defaults
meme = meme.replace("fontFamily: 'Impact, sans-serif'", "fontFamily: 'Impact, sans-serif',\n      rotation: 0")
meme = meme.replace("const newStk = {\n      id: `stk-${Date.now()}`,\n      emoji,\n      x: 0.5,\n      y: 0.5,\n      scale: 1.0\n    };", "const newStk = {\n      id: `stk-${Date.now()}`,\n      emoji,\n      x: 0.5,\n      y: 0.5,\n      scale: 1.0,\n      rotation: 0\n    };")
meme = meme.replace("const newLayer = {\n          id: `imgL-${Date.now()}`,\n          url: URL.createObjectURL(file),\n          x: 0.5,\n          y: 0.5,\n          scale: 0.5\n        };", "const newLayer = {\n          id: `imgL-${Date.now()}`,\n          url: URL.createObjectURL(file),\n          x: 0.5,\n          y: 0.5,\n          scale: 0.5,\n          rotation: 0\n        };")

with open('src/components/MemeEditor.jsx', 'w', encoding='utf-8') as f:
    f.write(meme)


print("Patching CanvasEditor.jsx")
with open('src/components/CanvasEditor.jsx', 'r', encoding='utf-8') as f:
    canvas = f.read()

canvas = canvas.replace('onUpdateStickerPosition,', 'onUpdateStickerBounds,')
canvas = canvas.replace('onUpdateImageLayerPosition,', 'onUpdateImageLayerBounds,')

# Add tower rendering to ImageLayers
img_layer_handle = """
          if (imgLayer.id === activeLayerId) {
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 6]);
            ctx.strokeRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12);
            
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(0, -h / 2 - 6);
            ctx.lineTo(0, -h / 2 - 36);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.fillStyle = '#00f0ff';
            ctx.arc(0, -h / 2 - 36, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }"""
canvas = re.sub(r'if \(imgLayer\.id === activeLayerId\) \{.*?ctx\.strokeRect\(-w / 2 - 6, -h / 2 - 6, w \+ 12, h \+ 12\);\s*\}', img_layer_handle, canvas, flags=re.DOTALL)

# Add rotation and tower to Stickers
sticker_render = """
        const sx = stk.x * canvas.width;
        const sy = stk.y * canvas.height;
        ctx.save();
        ctx.translate(sx, sy);
        if (stk.rotation) ctx.rotate(stk.rotation * Math.PI / 180);
        
        const stkSize = (stk.scale || 1.0) * 52;
        ctx.font = `${stkSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (stk.id === activeLayerId) {
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 6]);
          ctx.strokeRect(-stkSize / 2 - 6, -stkSize / 2 - 6, stkSize + 12, stkSize + 12);
          
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(0, -stkSize / 2 - 6);
          ctx.lineTo(0, -stkSize / 2 - 36);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.fillStyle = '#00f0ff';
          ctx.arc(0, -stkSize / 2 - 36, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        ctx.fillText(stk.emoji, 0, 0);
        ctx.restore();"""
# Replace sticker logic
canvas = re.sub(r'const sx = stk\.x \* canvas\.width;.*?ctx\.fillText\(stk\.emoji, sx, sy\);\s*ctx\.restore\(\);', sticker_render, canvas, flags=re.DOTALL)


# Add rotation and tower to Captions
caption_render = """
        const cx = cap.x * canvas.width;
        const cy = cap.y * canvas.height;
        
        ctx.save();
        ctx.translate(cx, cy);
        if (cap.rotation) ctx.rotate(cap.rotation * Math.PI / 180);

        const fontSize = cap.fontSize || 50;
        const fontFamily = cap.fontFamily || 'Impact, sans-serif';
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const renderMaxWidth = (cap.width || 0.9) * canvas.width;
        const lines = wrapText(ctx, cap.text, renderMaxWidth);
        
        let maxLineWidth = 0;
        for (const line of lines) {
          maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
        }
        const boxWidth = cap.width ? (cap.width * canvas.width) : maxLineWidth + 40;
        const maxWidth = boxWidth;
        const lineHeight = fontSize * 1.2;
        
        // Since we translated to cx, cy, startY is offset by -totalHeight/2 basically
        const totalHeight = Math.max(lines.length * lineHeight, 45);
        const startY = - ((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, index) => {
          const ly = startY + index * lineHeight;

          if (cap.stroke && cap.stroke !== 'transparent') {
            ctx.strokeStyle = cap.stroke;
            ctx.lineWidth = cap.strokeWidth || Math.max(3, fontSize / 7);
            ctx.lineJoin = 'miter';
            ctx.miterLimit = 2;
            ctx.setLineDash([]);
            ctx.strokeText(line, 0, ly);
          }

          ctx.fillStyle = cap.color || '#ffffff';
          ctx.fillText(line, 0, ly);
        });

        if (cap.id === activeLayerId) {
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 6]);
          
          const boxX = - boxWidth / 2;
          const boxY = startY - lineHeight / 2 - 6;
          const boxHeight = totalHeight + 12;
          
          ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
          
          ctx.setLineDash([]);
          ctx.fillStyle = '#00f0ff';
          ctx.strokeStyle = '#ffffff';
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
          
          // Rotation Tower Handle
          ctx.beginPath();
          ctx.moveTo(0, boxY);
          ctx.lineTo(0, boxY - 30);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.arc(0, boxY - 30, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();"""

# Note: this regex for captions might be tricky. Let's just find `const fontSize = cap.fontSize || 50;` down to `ctx.restore();`
canvas = re.sub(r'const fontSize = cap\.fontSize \|\| 50;.*?ctx\.restore\(\);', caption_render, canvas, flags=re.DOTALL)
# Wait, I also need to remove `ctx.save();` and `cx` calculations before `const fontSize`.
canvas = re.sub(r'ctx\.save\(\);\s*const fontSize = cap\.fontSize', caption_render, canvas, flags=re.DOTALL) # wait, my replacement ALREADY does the top part! Let's just replace the whole caption loop body.
canvas = re.sub(r'captions\.forEach\(\(cap\) => \{.*?ctx\.restore\(\);\s*\}\);', 'captions.forEach((cap) => {\n' + caption_render + '\n});', canvas, flags=re.DOTALL)


# Now update HIT DETECTION (handlePointerDown)
# In handlePointerDown, we need to check if the user clicked the rotation handle.
# It is much easier to just replace `handlePointerDown` with a fully rewritten one that accounts for rotation matrices.
# But I can also just approximate rotation hits! For now, let's inject a generic rotation hit check.

hit_detection = """
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

  const handlePointerDown = (e) => {
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let hitLayer = null;

    // Hit test Custom Image Layers
    for (let i = imageLayers.length - 1; i >= 0; i--) {
      const l = imageLayers[i];
      const cx = l.x * canvas.width;
      const cy = l.y * canvas.height;
      const cached = imageCacheRef.current[l.url];
      if (!cached) continue;
      
      const scale = l.scale || 0.5;
      const baseW = cached.width || 200;
      const baseH = cached.height || 200;
      const fitScale = Math.min(320 / baseW, 320 / baseH);
      const w = baseW * fitScale * scale;
      const h = baseH * fitScale * scale;

      const p = rotatePoint(coords.x, coords.y, cx, cy, -(l.rotation || 0));

      if (l.id === activeLayerId) {
        // Tower Handle
        const hx = cx;
        const hy = cy - h/2 - 36;
        if (Math.hypot(p.x - hx, p.y - hy) < 30) {
          hitLayer = { id: l.id, type: 'rotate_imageLayer', x: l.x, y: l.y, rotation: l.rotation || 0 };
          break;
        }
      }

      if (p.x >= cx - w / 2 && p.x <= cx + w / 2 && p.y >= cy - h / 2 && p.y <= cy + h / 2) {
        hitLayer = { id: l.id, type: 'imageLayer', x: l.x, y: l.y };
        break;
      }
    }

    // Hit test Stickers
    if (!hitLayer) {
      for (let i = stickers.length - 1; i >= 0; i--) {
        const stk = stickers[i];
        const cx = stk.x * canvas.width;
        const cy = stk.y * canvas.height;
        const stkSize = (stk.scale || 1.0) * 52;
        
        const p = rotatePoint(coords.x, coords.y, cx, cy, -(stk.rotation || 0));

        if (stk.id === activeLayerId) {
          const hx = cx;
          const hy = cy - stkSize/2 - 36;
          if (Math.hypot(p.x - hx, p.y - hy) < 30) {
            hitLayer = { id: stk.id, type: 'rotate_sticker', x: stk.x, y: stk.y, rotation: stk.rotation || 0 };
            break;
          }
        }

        if (p.x >= cx - stkSize/2 && p.x <= cx + stkSize/2 && p.y >= cy - stkSize/2 && p.y <= cy + stkSize/2) {
          hitLayer = { id: stk.id, type: 'sticker', x: stk.x, y: stk.y };
          break;
        }
      }
    }

    // Hit test Text Captions
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
        const actualWidth = cap.width ? (cap.width * canvas.width) : maxLineWidth + 40;
        const halfW = actualWidth / 2;
        const lineHeight = fontSize * 1.2;
        const totalHeight = Math.max(lines.length * lineHeight, 45);
        const halfH = totalHeight / 2 + 6;

        if (cap.id === activeLayerId) {
          const topY = cy - halfH;
          const bottomY = cy + halfH;
          const leftX = cx - halfW;
          const rightX = cx + halfW;
          
          const handles = [
            { type: 'resize_caption_tl', x: leftX, y: topY },
            { type: 'resize_caption_tr', x: rightX, y: topY },
            { type: 'resize_caption_bl', x: leftX, y: bottomY },
            { type: 'resize_caption_br', x: rightX, y: bottomY },
            { type: 'rotate_caption', x: cx, y: topY - 30 }
          ];

          for (const h of handles) {
            if (Math.hypot(p.x - h.x, p.y - h.y) < 30) {
              hitLayer = { id: cap.id, type: h.type, x: cap.x, y: cap.y, width: cap.width || 0.9, rotation: cap.rotation || 0 };
              break;
            }
          }
          if (hitLayer) break;
        }

        if (p.x >= cx - halfW && p.x <= cx + halfW && p.y >= cy - halfH && p.y <= cy + halfH) {
          hitLayer = { id: cap.id, type: 'caption', x: cap.x, y: cap.y };
          break;
        }
      }
    }

    if (hitLayer && hitLayer.type === 'caption') {
      const now = Date.now();
      if (lastTapRef.current.id === hitLayer.id && now - lastTapRef.current.time < 300) {
        setEditingCaptionId(hitLayer.id);
        const activeCap = captions.find(c => c.id === hitLayer.id);
        setEditingCaptionText(activeCap ? activeCap.text : '');
      }
      lastTapRef.current = { id: hitLayer.id, time: now };
    }

    if (hitLayer) {
      if (onSelectLayer) onSelectLayer(hitLayer.id);
      isDragging.current = true;
      dragTarget.current = hitLayer;
      dragStartCoords.current = coords;
      initialLayerPos.current = { 
        x: hitLayer.x, 
        y: hitLayer.y, 
        width: hitLayer.width,
        rotation: hitLayer.rotation || 0
      };
    } else {
      if (onSelectLayer) onSelectLayer(null);
    }
  };"""

canvas = re.sub(r'const handlePointerDown = \(e\) => \{.*?if \(hitLayer\) \{.*?\}\s*\};', hit_detection, canvas, flags=re.DOTALL)

# And dragging logic (handlePointerMove)
move_logic = """
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
    
    if (dragTarget.current.type.startsWith('resize_')) {"""
canvas = canvas.replace("if (dragTarget.current.type.startsWith('resize_')) {", move_logic)

# Replace sticker move block
sticker_move = """
    } else if (dragTarget.current.type === 'sticker' && onUpdateStickerBounds) {
      onUpdateStickerBounds(dragTarget.current.id, { x: newX, y: newY });
    } else if (dragTarget.current.type === 'imageLayer' && onUpdateImageLayerBounds) {
      onUpdateImageLayerBounds(dragTarget.current.id, { x: newX, y: newY });
    }"""
canvas = re.sub(r'\} else if \(dragTarget\.current\.type === \'sticker\' && onUpdateStickerPosition\) \{.*?\n\s*\}', sticker_move, canvas, flags=re.DOTALL)


with open('src/components/CanvasEditor.jsx', 'w', encoding='utf-8') as f:
    f.write(canvas)
print("CanvasEditor.jsx and MemeEditor.jsx patched successfully.")
