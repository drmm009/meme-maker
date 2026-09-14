import re
import sys

with open('src/components/CanvasEditor.jsx', 'r', encoding='utf-8') as f:
    canvas = f.read()

# We need to replace from the corrupted `if (stk.id === activeLayerId) {` inside `drawCanvas`
# all the way down to `// Hit test Stickers` inside `handlePointerDown`.

corrupted_regex = r'if \(stk\.id === activeLayerId\) \{\s*const hs = stkSize \/ 2 \+ 6;.*?// Hit test Stickers'

replacement = """if (stk.id === activeLayerId) {
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 6]);
          ctx.strokeRect(-stkSize / 2 - 6, -stkSize / 2 - 6, stkSize + 12, stkSize + 12);
          
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
          ctx.fillStyle = '#00f0ff';
          ctx.arc(0, -stkSize / 2 - 40, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        ctx.fillText(stk.emoji, 0, 0);
        ctx.restore();
      });

      captions.forEach((cap) => {
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
        
        const wrapText = (context, text, maxWidth) => {
          const words = (text || '').split(' ');
          let lines = [];
          let currentLine = words[0];

          for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = context.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
              currentLine += ' ' + word;
            } else {
              lines.push(currentLine);
              currentLine = word;
            }
          }
          lines.push(currentLine);
          return lines;
        };
        
        const lines = wrapText(ctx, cap.text, renderMaxWidth);
        
        let maxLineWidth = 0;
        for (const line of lines) {
          maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
        }
        const boxWidth = cap.width ? (cap.width * canvas.width) : maxLineWidth + 40;
        const maxWidth = boxWidth;
        const lineHeight = fontSize * 1.2;
        
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
          
          ctx.beginPath();
          ctx.moveTo(0, boxY);
          ctx.lineTo(0, boxY - 34);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.arc(0, boxY - 34, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      });
    }

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
        const hx = cx;
        const hy = cy - h/2 - 36;
        if (Math.hypot(p.x - hx, p.y - hy) < 40) {
          hitLayer = { id: l.id, type: 'rotate_imageLayer', x: l.x, y: l.y, rotation: l.rotation || 0 };
          break;
        }
      }

      if (p.x >= cx - w / 2 && p.x <= cx + w / 2 && p.y >= cy - h / 2 && p.y <= cy + h / 2) {
        hitLayer = { id: l.id, type: 'imageLayer', x: l.x, y: l.y };
        break;
      }
    }

    // Hit test Stickers"""

canvas = re.sub(corrupted_regex, replacement, canvas, flags=re.DOTALL)

with open('src/components/CanvasEditor.jsx', 'w', encoding='utf-8') as f:
    f.write(canvas)
print("Restored CanvasEditor.jsx")
