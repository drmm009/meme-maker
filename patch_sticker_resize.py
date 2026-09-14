import re

# 1. Update CanvasEditor.jsx
with open('src/components/CanvasEditor.jsx', 'r', encoding='utf-8') as f:
    canvas = f.read()

# Increase rotation handle size
canvas = canvas.replace("ctx.arc(0, -stkSize / 2 - 36, 12, 0, Math.PI * 2);", "ctx.arc(0, -stkSize / 2 - 40, 16, 0, Math.PI * 2);")
canvas = canvas.replace("ctx.arc(0, boxY - 30, 12, 0, Math.PI * 2);", "ctx.arc(0, boxY - 34, 16, 0, Math.PI * 2);")
canvas = canvas.replace("ctx.arc(0, -h / 2 - 36, 12, 0, Math.PI * 2);", "ctx.arc(0, -h / 2 - 40, 16, 0, Math.PI * 2);")

# Extend line length slightly to match the larger radius
canvas = canvas.replace("ctx.lineTo(0, -stkSize / 2 - 36);", "ctx.lineTo(0, -stkSize / 2 - 40);")
canvas = canvas.replace("ctx.lineTo(0, boxY - 30);", "ctx.lineTo(0, boxY - 34);")
canvas = canvas.replace("ctx.lineTo(0, -h / 2 - 36);", "ctx.lineTo(0, -h / 2 - 40);")

# Update hit radius to 40
canvas = canvas.replace("if (Math.hypot(p.x - hx, p.y - hy) < 30) {", "if (Math.hypot(p.x - hx, p.y - hy) < 40) {")
canvas = canvas.replace("if (Math.hypot(p.x - h.x, p.y - h.y) < 30) {", "if (Math.hypot(p.x - h.x, p.y - h.y) < 40) {")
canvas = canvas.replace("y: topY - 30", "y: topY - 34")
canvas = canvas.replace("y: cy - stkSize/2 - 36", "y: cy - stkSize/2 - 40")
canvas = canvas.replace("y: cy - h/2 - 36", "y: cy - h/2 - 40")


# Add resize handles for stickers
# First, the rendering part
sticker_resize_handles = """
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
          ctx.moveTo(0, -stkSize / 2 - 6);"""
canvas = canvas.replace("""          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(0, -stkSize / 2 - 6);""", sticker_resize_handles)


# Next, the hit detection part for stickers
sticker_hit_detection = """
        if (stk.id === activeLayerId) {
          const hs = stkSize / 2 + 6;
          const handles = [
            { type: 'resize_sticker_tl', x: cx - hs, y: cy - hs },
            { type: 'resize_sticker_tr', x: cx + hs, y: cy - hs },
            { type: 'resize_sticker_bl', x: cx - hs, y: cy + hs },
            { type: 'resize_sticker_br', x: cx + hs, y: cy + hs },
            { type: 'rotate_sticker', x: cx, y: cy - stkSize/2 - 40 }
          ];
          
          for (const h of handles) {
            // Need to apply rotation to the handles too! Wait, the handles rotate with the sticker.
            // Oh, our p is already inverse rotated! So we can just check local coords.
            // Local coords: TL is (-hs, -hs). But wait, hit testing is done in global?
            // Actually, p is local to the center cx,cy! So p.x - cx is local X.
          }
"""
# Let's fix the hit testing logic for stickers:
sticker_hit_logic = """
        if (stk.id === activeLayerId) {
          const hs = stkSize / 2 + 6;
          
          // p is the inverse-rotated pointer coordinate. cx,cy is the center.
          // So the local handle coordinates relative to the canvas are just cx + localX, cy + localY.
          const handles = [
            { type: 'resize_sticker_tl', x: cx - hs, y: cy - hs },
            { type: 'resize_sticker_tr', x: cx + hs, y: cy - hs },
            { type: 'resize_sticker_bl', x: cx - hs, y: cy + hs },
            { type: 'resize_sticker_br', x: cx + hs, y: cy + hs },
            { type: 'rotate_sticker', x: cx, y: cy - stkSize/2 - 40 }
          ];

          for (const h of handles) {
            if (Math.hypot(p.x - h.x, p.y - h.y) < 40) {
              hitLayer = { id: stk.id, type: h.type, x: stk.x, y: stk.y, scale: stk.scale || 1.0, rotation: stk.rotation || 0 };
              break;
            }
          }
          if (hitLayer) break;
        }"""
canvas = re.sub(r'if \(stk\.id === activeLayerId\) \{.*?break;\s*\}\s*\}', sticker_hit_logic, canvas, flags=re.DOTALL)


# Finally, handle dragging for resize_sticker
# In handlePointerMove, add logic for resize_sticker
resize_sticker_logic = """
    if (dragTarget.current.type.startsWith('resize_sticker_')) {
      const type = dragTarget.current.type;
      const initialScale = dragTarget.current.scale;
      
      // Calculate distance from center to new point
      const centerX = initialLayerPos.current.x * canvas.width;
      const centerY = initialLayerPos.current.y * canvas.height;
      const dist = Math.hypot(coords.x - centerX, coords.y - centerY);
      
      // Original distance was approx (stkSize/2) * sqrt(2). 
      // Base stkSize = 52. So half size = 26.
      // initialDist = initialScale * 26 * 1.414.
      // So newScale = dist / (26 * 1.414).
      
      const newScale = Math.max(0.2, Math.min(5.0, dist / 36.7)); // 26 * sqrt(2) = 36.77
      
      if (onUpdateStickerBounds) {
        onUpdateStickerBounds(dragTarget.current.id, { scale: newScale });
      }
      return;
    }
    
    if (dragTarget.current.type.startsWith('resize_caption_')) {"""
canvas = canvas.replace("if (dragTarget.current.type.startsWith('resize_caption_')) {", resize_sticker_logic)

with open('src/components/CanvasEditor.jsx', 'w', encoding='utf-8') as f:
    f.write(canvas)
print("CanvasEditor.jsx patched successfully.")


# 2. Update MemeEditor.jsx
with open('src/components/MemeEditor.jsx', 'r', encoding='utf-8') as f:
    meme = f.read()

# Replace the entire activeSticker block
old_sticker_block_regex = r'\{activeSticker \? \(\s*<div className="form-field margin-bottom-sm">.*?</div>\s*\)\s*:\s*\(\s*<div className="flex-between margin-bottom-xs">'
new_sticker_block = """{activeSticker ? (
                  <div className="flex-between align-center margin-bottom-sm" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <span className="sticker-selected-badge" style={{ fontSize: '1.2rem', margin: 0, padding: 0, background: 'transparent' }}>
                      {activeSticker.emoji} Selected
                    </span>
                    <button className="btn btn-icon btn-xs text-danger" onClick={handleDeleteLayer} title="Delete Sticker">
                      <Trash2 className="icon-xs" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-between margin-bottom-xs">"""
meme = re.sub(old_sticker_block_regex, new_sticker_block, meme, flags=re.DOTALL)

with open('src/components/MemeEditor.jsx', 'w', encoding='utf-8') as f:
    f.write(meme)
print("MemeEditor.jsx patched successfully.")
