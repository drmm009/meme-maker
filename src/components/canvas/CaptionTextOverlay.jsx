// Invisible textarea laid over the active caption so typing edits it in place on the canvas:
// the keyboard opens on mobile, and the canvas draws the text while this element stays transparent.
export default function CaptionTextOverlay({
  caption, editableRef, headerExtH, canvasH, footerExtH, totalCanvasH,
  onChangeText, onBlur, onPointerDown, onPointerEnd
}) {
  const totalH = Math.max(1, totalCanvasH);
  let centerY;
  if (caption.isHeaderCaption && !caption.hasCustomPos) centerY = headerExtH / 2;
  else if (caption.isFooterCaption && !caption.hasCustomPos) centerY = headerExtH + canvasH + footerExtH / 2;
  else centerY = headerExtH + caption.y * canvasH;

  return (
    <textarea
      ref={editableRef}
      className="seamless-live-text-editor"
      spellCheck={false}
      autoCorrect="off"
      autoCapitalize="off"
      style={{
        position: 'absolute',
        left: `${caption.x * 100}%`,
        top: `${(centerY / totalH) * 100}%`,
        transform: `translate(-50%, -50%) rotate(${caption.rotation || 0}deg)`,
        width: `${Math.min(95, Math.max(35, (caption.width || 0.8) * 100))}%`,
        minHeight: '44px',
        opacity: 0.001,
        pointerEvents: 'auto',
        color: 'transparent',
        caretColor: 'transparent',
        background: 'transparent',
        border: 'none',
        outline: 'none',
        resize: 'none',
        zIndex: 15,
        padding: '0',
        margin: '0',
        fontSize: '16px',
        touchAction: 'manipulation',
        overflow: 'hidden'
      }}
      rows={2}
      value={caption.text || ''}
      onChange={(e) => onChangeText(e.target.value)}
      onFocus={(e) => {
        try {
          const len = e.target.value.length;
          e.target.setSelectionRange(len, len);
        } catch {
          // Selection fallback
        }
      }}
      onBlur={onBlur}
      onTouchStart={onPointerDown}
      onTouchEnd={onPointerEnd}
      onMouseDown={onPointerDown}
      onMouseUp={onPointerEnd}
    />
  );
}
