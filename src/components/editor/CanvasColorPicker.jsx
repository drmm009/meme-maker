import React from 'react';

export default function CanvasColorPicker({ canvasBgColor, setCanvasBgColor }) {
  const [localColor, setLocalColor] = React.useState(canvasBgColor);
  const timerRef = React.useRef(null);

  React.useEffect(() => {
    setLocalColor(canvasBgColor);
  }, [canvasBgColor]);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalColor(val);
    window.dispatchEvent(new CustomEvent('liveCanvasBgColor', { detail: val }));
    
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCanvasBgColor(val);
    }, 150); // debounce setting main state
  };

  return (
    <div
      className="btn btn-xs vid-ctx-btn"
      style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '4px 10px', borderRadius: '10px' }}
      title="Canvas Color"
    >
      <div style={{ width: 14, height: 14, borderRadius: '50%', background: localColor || '#ffffff', border: '2px solid rgba(255,255,255,0.4)' }} />
      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Canvas Color</span>
      <input type="color" value={localColor || '#ffffff'} onChange={handleChange} style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
    </div>
  );
}
