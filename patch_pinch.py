import re

# 1. Update index.css
with open('src/index.css', 'r', encoding='utf-8') as f:
    css = f.read()

css = css.replace('background-color: #000;', 'background-color: #ffffff;')
css = css.replace('background: #1e293b;', 'background: #ffffff;\n  border: 1px solid #e2e8f0;')

with open('src/index.css', 'w', encoding='utf-8') as f:
    f.write(css)


# 2. Update CustomLayoutBuilder.jsx
with open('src/components/CustomLayoutBuilder.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace inline style for grid-slot background
content = content.replace("background: '#1e293b'", "background: '#ffffff'")

# Replace handlePointerDown
down_regex = r"const handlePointerDown = \(slotIdx, e\) => \{.*?\n\s*setDragState\(\{(.*?)\}\);\n\s*\};"
down_repl = """const handlePointerDown = (slotIdx, e) => {
    let clientX, clientY, initialPinchDistance = null;
    
    if (e.touches && e.touches.length >= 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      clientX = (t1.clientX + t2.clientX) / 2;
      clientY = (t1.clientY + t2.clientY) / 2;
      initialPinchDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    } else {
      clientX = e.touches ? e.touches[0].clientX : e.clientX;
      clientY = e.touches ? e.touches[0].clientY : e.clientY;
    }
    
    const tx = slotTransforms[slotIdx] || { offsetX: 0, offsetY: 0, scale: 1.5 };
    setDragState({
      slotIdx,
      startX: clientX,
      startY: clientY,
      origOffsetX: tx.offsetX,
      origOffsetY: tx.offsetY,
      initialPinchDistance,
      origScale: tx.scale
    });
  };"""
content = re.sub(down_regex, down_repl, content, flags=re.DOTALL)


# Replace handleSlotPointerMove
move_regex = r"const handleSlotPointerMove = \(e\) => \{.*?\n\s*setSlotTransforms\(nextTransforms\);\n\s*\};"
move_repl = """const handleSlotPointerMove = (e) => {
    if (!dragState) return;
    
    let clientX, clientY, currentPinchDistance = null;
    if (e.touches && e.touches.length >= 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      clientX = (t1.clientX + t2.clientX) / 2;
      clientY = (t1.clientY + t2.clientY) / 2;
      currentPinchDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    } else {
      clientX = e.touches ? e.touches[0].clientX : e.clientX;
      clientY = e.touches ? e.touches[0].clientY : e.clientY;
    }
    
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const sensitivityX = 1 / rect.width;
    const sensitivityY = 1 / rect.height;

    const dx = (clientX - dragState.startX) * sensitivityX;
    const dy = (clientY - dragState.startY) * sensitivityY;

    const nextTransforms = [...slotTransforms];
    const currentTx = nextTransforms[dragState.slotIdx] || { offsetX: 0, offsetY: 0, scale: 1.5 };
    
    let nextScale = currentTx.scale;
    if (dragState.initialPinchDistance && currentPinchDistance) {
       const scaleDiff = (currentPinchDistance - dragState.initialPinchDistance) * 0.005;
       nextScale = Math.max(0.1, dragState.origScale + scaleDiff);
    }

    nextTransforms[dragState.slotIdx] = {
      ...currentTx,
      offsetX: dragState.origOffsetX + dx,
      offsetY: dragState.origOffsetY + dy,
      scale: nextScale
    };
    setSlotTransforms(nextTransforms);
  };"""
content = re.sub(move_regex, move_repl, content, flags=re.DOTALL)

with open('src/components/CustomLayoutBuilder.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Pinch-to-zoom and white backgrounds applied.")
