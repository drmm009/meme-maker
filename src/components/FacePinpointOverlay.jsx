import React, { useRef, useState, useEffect } from 'react';
import { Crosshair, Check, X, Move, Plus, Minus, Sparkles, User } from 'lucide-react';

export default function FacePinpointOverlay({
  isOpen,
  faceTarget,
  onUpdateTarget,
  onConfirm,
  onCancel,
  canvasRef,
  templateImageUrl
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPosRef = useRef({ x: 0.5, y: 0.38 });
  const [detectedFaces, setDetectedFaces] = useState([]);

  // Auto-detect faces on the meme template
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    (async () => {
      try {
        const imgUrl = templateImageUrl || (canvasRef.current?.getCanvas ? canvasRef.current.getCanvas()?.toDataURL('image/jpeg', 0.85) : null);
        if (!imgUrl) return;

        let res;
        try {
          res = await fetch('/api/face-swap/detect-faces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imgUrl })
          });
        } catch (e) {
          res = await fetch('http://127.0.0.1:5174/api/face-swap/detect-faces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imgUrl })
          });
        }

        const data = await res.json();
        if (isMounted && data.success && data.faces?.length > 0) {
          setDetectedFaces(data.faces);
        }
      } catch (err) {
        console.warn('Pinpoint face detection error:', err);
      }
    })();

    return () => { isMounted = false; };
  }, [isOpen, templateImageUrl, canvasRef]);

  if (!isOpen) return null;

  const handlePointerDown = (e) => {
    // If clicking on the floating toolbar or any button, prevent dragging and stop propagation
    if (e.target && (e.target.closest('[data-pinpoint-toolbar]') || e.target.closest('button'))) {
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const normX = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));
    const normY = Math.max(0.05, Math.min(0.95, (clientY - rect.top) / rect.height));

    dragStartRef.current = { x: clientX, y: clientY };
    initialPosRef.current = { x: normX, y: normY };

    onUpdateTarget({
      ...faceTarget,
      x: normX,
      y: normY
    });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    e.stopPropagation();
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const normX = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));
    const normY = Math.max(0.05, Math.min(0.95, (clientY - rect.top) / rect.height));

    onUpdateTarget({
      ...faceTarget,
      x: normX,
      y: normY
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleAdjustRadius = (delta, e) => {
    e?.stopPropagation();
    const newR = Math.max(0.06, Math.min(0.28, (faceTarget.radius || 0.14) + delta));
    onUpdateTarget({
      ...faceTarget,
      radius: newR
    });
  };

  // Convert target norm coords to percentage for CSS placement
  const posX = (faceTarget?.x ?? 0.5) * 100;
  const posY = (faceTarget?.y ?? 0.38) * 100;
  const radiusPercent = (faceTarget?.radius ?? 0.14) * 100;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        pointerEvents: 'auto',
        touchAction: 'none',
        userSelect: 'none',
        cursor: 'crosshair'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >
      {/* Top Floating Instruction Pill */}
      <div
        data-pinpoint-toolbar="true"
        style={{
          position: 'absolute',
          top: '14px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 60,
          background: 'rgba(15, 17, 23, 0.96)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1.5px solid var(--cyber-cyan, #06b6d4)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), 0 0 16px rgba(6, 182, 212, 0.4)',
          padding: '6px 14px',
          borderRadius: '999px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#ffffff',
          whiteSpace: 'nowrap',
          pointerEvents: 'auto'
        }}
        onPointerDown={(e) => { e.stopPropagation(); }}
        onPointerUp={(e) => { e.stopPropagation(); }}
        onMouseDown={(e) => { e.stopPropagation(); }}
        onMouseUp={(e) => { e.stopPropagation(); }}
        onTouchStart={(e) => { e.stopPropagation(); }}
        onTouchEnd={(e) => { e.stopPropagation(); }}
        onClick={(e) => { e.stopPropagation(); }}
      >
        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Crosshair size={15} style={{ color: 'var(--cyber-cyan)' }} />
          <span>{detectedFaces.length > 0 ? 'Tap face badge or drag circle' : 'Drag circle over face'}</span>
        </span>

        {/* Size buttons */}
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', padding: '2px 4px' }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="btn btn-icon btn-xs"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleAdjustRadius(-0.02, e);
            }}
            style={{ width: '22px', height: '22px', minHeight: '22px', borderRadius: '50%', padding: 0 }}
            title="Smaller Face Circle"
          >
            <Minus size={11} />
          </button>
          <button
            type="button"
            className="btn btn-icon btn-xs"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleAdjustRadius(0.02, e);
            }}
            style={{ width: '22px', height: '22px', minHeight: '22px', borderRadius: '50%', padding: 0 }}
            title="Larger Face Circle"
          >
            <Plus size={11} />
          </button>
        </div>

        {/* Done / Morph Here Button */}
        <button
          type="button"
          className="btn btn-xs btn-primary shadow-glow"
          onPointerDown={(e) => { e.stopPropagation(); }}
          onMouseDown={(e) => { e.stopPropagation(); }}
          onPointerUp={(e) => { e.stopPropagation(); }}
          onMouseUp={(e) => { e.stopPropagation(); }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setTimeout(() => {
              onConfirm();
            }, 50);
          }}
          style={{
            borderRadius: '999px',
            padding: '5px 14px',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'var(--primary-gradient)'
          }}
        >
          <Check size={14} /> Morph Here
        </button>

        {/* Cancel Button */}
        <button
          type="button"
          className="btn btn-icon btn-xs btn-ghost"
          onPointerDown={(e) => { e.stopPropagation(); }}
          onMouseDown={(e) => { e.stopPropagation(); }}
          onPointerUp={(e) => { e.stopPropagation(); }}
          onMouseUp={(e) => { e.stopPropagation(); }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setTimeout(() => {
              onCancel();
            }, 50);
          }}
          style={{
            borderRadius: '50%',
            width: '26px',
            height: '26px',
            minHeight: '26px',
            padding: 0,
            color: 'var(--text-muted)'
          }}
          title="Cancel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Auto-detected Face Badges (Tap to snap reticle directly!) */}
      {detectedFaces.map((f, i) => {
        const isTargeted = Math.hypot((f.center[0] * 100) - posX, (f.center[1] * 100) - posY) < 8;
        return (
          <button
            key={f.index}
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onUpdateTarget({
                ...faceTarget,
                x: f.center[0],
                y: f.center[1]
              });
            }}
            style={{
              position: 'absolute',
              left: `${f.center[0] * 100}%`,
              top: `${f.center[1] * 100}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 55,
              padding: '3px 8px 3px 4px',
              borderRadius: '999px',
              background: isTargeted ? 'rgba(6, 182, 212, 0.95)' : 'rgba(15, 17, 23, 0.92)',
              border: isTargeted ? '1.5px solid #ffffff' : '1.5px solid var(--cyber-cyan)',
              color: isTargeted ? '#000000' : '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 800,
              boxShadow: isTargeted ? '0 0 16px rgba(6, 182, 212, 0.9)' : '0 4px 12px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              pointerEvents: 'auto',
              transition: 'all 0.15s ease'
            }}
            title={`Select Face ${i + 1}`}
          >
            {f.thumb ? (
              <img
                src={f.thumb}
                alt={`Face ${i + 1}`}
                style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <User size={12} />
            )}
            <span>Face {i + 1}</span>
          </button>
        );
      })}

      {/* Glowing Target Face Reticle */}
      <div
        style={{
          position: 'absolute',
          left: `${posX}%`,
          top: `${posY}%`,
          width: `${radiusPercent * 2}%`,
          height: `${radiusPercent * 2.3}%`,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          border: '2.5px dashed var(--cyber-cyan, #06b6d4)',
          boxShadow: '0 0 20px rgba(6, 182, 212, 0.7), inset 0 0 15px rgba(6, 182, 212, 0.25)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: isDragging ? 'none' : 'all 0.1s ease-out'
        }}
      >
        {/* Center Crosshairs */}
        <div style={{ position: 'absolute', width: '16px', height: '1.5px', background: 'var(--cyber-cyan)' }} />
        <div style={{ position: 'absolute', height: '16px', width: '1.5px', background: 'var(--cyber-cyan)' }} />

        {/* Small floating badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '-24px',
            background: 'rgba(0,0,0,0.85)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            borderRadius: '999px',
            padding: '2px 8px',
            fontSize: '0.65rem',
            fontWeight: 700,
            color: 'var(--cyber-cyan)',
            whiteSpace: 'nowrap'
          }}
        >
          Target Face Area
        </div>
      </div>
    </div>
  );
}
