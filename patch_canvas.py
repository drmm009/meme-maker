import re

with open('src/components/CanvasEditor.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add editingCaptionId state
state_insertion = r"const \[editingCaptionId, setEditingCaptionId\] = useState(null);\n  const \[editingCaptionText, setEditingCaptionText\] = useState('');\n  const lastTapRef = useRef({ id: null, time: 0 });\n"

# replace the existing lastTapRef
content = re.sub(r'const lastTapRef = useRef\(\{ id: null, time: 0 \}\);', state_insertion, content)

# 2. Modify wrapText logic inside drawCanvas
# Search for:
# const maxWidth = (cap.width || 0.9) * canvas.width;
# const lines = wrapText(ctx, cap.text, maxWidth);
draw_replace_target = r"const maxWidth = \(cap\.width \|\| 0\.9\) \* canvas\.width;\s*const lines = wrapText\(ctx, cap\.text, maxWidth\);"

draw_replace_with = """const renderMaxWidth = (cap.width || 0.9) * canvas.width;
        const lines = wrapText(ctx, cap.text, renderMaxWidth);
        
        let maxLineWidth = 0;
        for (const line of lines) {
          maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
        }
        const boxWidth = cap.width ? (cap.width * canvas.width) : maxLineWidth + 40;
        const maxWidth = boxWidth;"""
content = re.sub(draw_replace_target, draw_replace_with, content)

# Wait, there's another place where wrapText is used inside handlePointerDown
pointer_replace_target = r"const maxWidth = \(cap\.width \|\| 0\.9\) \* canvas\.width;\s*const fontSize = cap\.fontSize \|\| 50;\s*ctx\.font = `bold \${fontSize}px \${cap\.fontFamily \|\| 'Impact, sans-serif'}`;\s*const lines = wrapText\(ctx, cap\.text, maxWidth\);"

pointer_replace_with = """const renderMaxWidth = (cap.width || 0.9) * canvas.width;
      const fontSize = cap.fontSize || 50;
      
      ctx.font = `bold ${fontSize}px ${cap.fontFamily || 'Impact, sans-serif'}`;
      
      const lines = wrapText(ctx, cap.text, renderMaxWidth);
      
      let maxLineWidth = 0;
      for (const line of lines) {
        maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
      }
      const actualWidth = cap.width ? (cap.width * canvas.width) : maxLineWidth + 40;
      const maxWidth = actualWidth;
      const halfW = actualWidth / 2;"""

# Wait, there's `const halfW = maxWidth / 2;` below in handlePointerDown that I need to NOT conflict with.
# So I should just replace `const halfW = maxWidth / 2;` with `// halfW replaced` inside handlePointerDown?
# Actually, I can just do a more precise replacement for handlePointerDown:

content = re.sub(
    r'const maxWidth = \(cap\.width \|\| 0\.9\) \* canvas\.width;\s*const fontSize = cap\.fontSize \|\| 50;\s*ctx\.font = `bold \$\{fontSize\}px \$\{cap\.fontFamily \|\| \'Impact, sans-serif\'\}`;\s*const lines = wrapText\(ctx, cap\.text, maxWidth\);\s*const lineHeight = fontSize \* 1\.2;\s*const totalHeight = Math\.max\(lines\.length \* lineHeight, 45\);\s*const halfW = maxWidth / 2;',
    """const renderMaxWidth = (cap.width || 0.9) * canvas.width;
      const fontSize = cap.fontSize || 50;
      
      ctx.font = `bold ${fontSize}px ${cap.fontFamily || 'Impact, sans-serif'}`;
      
      const lines = wrapText(ctx, cap.text, renderMaxWidth);
      const lineHeight = fontSize * 1.2;
      const totalHeight = Math.max(lines.length * lineHeight, 45);
      
      let maxLineWidth = 0;
      for (const line of lines) {
        maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
      }
      const actualWidth = cap.width ? (cap.width * canvas.width) : maxLineWidth + 40;
      const halfW = actualWidth / 2;""",
    content
)

# 3. Add double-tap detection in handlePointerDown
# Find where hitLayer is used at the end of handlePointerDown before returning
# "if (hitLayer) {" ... wait, in MemeEditor it might just be updating activeLayerId directly?
# No, `handlePointerDown` sets `onSelectLayer(hitLayer.id)` if hitLayer is found.
# Let's search for `onSelectLayer(hitLayer.id);`

double_tap_logic = """if (hitLayer && hitLayer.type === 'caption') {
      const now = Date.now();
      if (lastTapRef.current.id === hitLayer.id && now - lastTapRef.current.time < 300) {
        setEditingCaptionId(hitLayer.id);
        const activeCap = captions.find(c => c.id === hitLayer.id);
        setEditingCaptionText(activeCap ? activeCap.text : '');
      }
      lastTapRef.current = { id: hitLayer.id, time: now };
    }
    
    if (hitLayer) {"""

content = content.replace("if (hitLayer) {", double_tap_logic, 1)

# 4. Render the overlay textarea
# Find the end of the return statement
# return ( <div ref={wrapperRef} ...> <canvas ... /> {editingCaptionId && ...} </div> )

textarea_code = """
      {editingCaptionId && captions.find(c => c.id === editingCaptionId) && (() => {
        const editingCaption = captions.find(c => c.id === editingCaptionId);
        return (
          <textarea
            autoFocus
            value={editingCaptionText}
            onChange={(e) => setEditingCaptionText(e.target.value)}
            onBlur={() => {
              if (onUpdateCaptionText) onUpdateCaptionText(editingCaptionId, editingCaptionText);
              setEditingCaptionId(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (onUpdateCaptionText) onUpdateCaptionText(editingCaptionId, editingCaptionText);
                setEditingCaptionId(null);
              }
            }}
            style={{
              position: 'absolute',
              left: `${editingCaption.x * 100}%`,
              top: `${editingCaption.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: `${(editingCaption.width || 0.9) * 100}%`,
              minWidth: '200px',
              height: '100%',
              maxHeight: '80%',
              fontSize: `${(editingCaption.fontSize || 50) * canvasScale}px`,
              fontFamily: editingCaption.fontFamily || 'Impact, sans-serif',
              color: editingCaption.color || '#ffffff',
              WebkitTextStroke: `${(editingCaption.strokeWidth || Math.max(3, (editingCaption.fontSize || 50) / 7)) * canvasScale}px ${editingCaption.stroke || '#000000'}`,
              textAlign: 'center',
              background: 'rgba(0,0,0,0.4)',
              border: '2px dashed #00f0ff',
              outline: 'none',
              resize: 'none',
              overflow: 'hidden',
              zIndex: 100,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          />
        );
      })()}
    </div>
  );
"""

content = re.sub(r'</canvas>\s*</div>\s*\);\s*\}\);', '</canvas>\n' + textarea_code + '\n});', content)

with open('src/components/CanvasEditor.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("CanvasEditor.jsx patched successfully.")
