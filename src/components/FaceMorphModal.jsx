import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Wand2,
  Upload,
  Camera,
  Smile,
  RefreshCw,
  Check,
  X,
  Sliders,
  Sun,
  Palette,
  FlipHorizontal,
  Eye,
  EyeOff,
  Play,
  Pause,
  RotateCcw,
  Move
} from 'lucide-react';
import { MEME_FACE_PRESETS, getMemeFaceDataUrl } from '../data/memeFaces';
import ModalPortal from './ModalPortal';
import {
  CANONICAL_LANDMARKS,
  CANONICAL_TRIANGLES,
  getDefaultLandmarks,
  getLandmarkPreset,
  morphFaceMesh,
  drawLandmarkMeshOverlay
} from '../utils/faceMorphEngine';

export default function FaceMorphModal({
  isOpen,
  onClose,
  onApplyFaceMorph,
  initialLighting,
  memeFacePatch
}) {
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'upload'
  const [selectedPresetId, setSelectedPresetId] = useState(MEME_FACE_PRESETS[0].id);
  const [selectedImageSrc, setSelectedImageSrc] = useState(getMemeFaceDataUrl(MEME_FACE_PRESETS[0]));
  const [faceName, setFaceName] = useState(MEME_FACE_PRESETS[0].name);

  // Landmark meshes for Face A (meme) and Face B (photo)
  const [landmarksA, setLandmarksA] = useState(() => getDefaultLandmarks());
  const [landmarksB, setLandmarksB] = useState(() => getDefaultLandmarks());
  const [activeAnglePreset, setActiveAnglePreset] = useState('front');

  // Morph animation & progress (0 = 100% meme, 1 = 100% photo)
  const [morphProgress, setMorphProgress] = useState(0.75); // default 75% morph
  const [isPlaying, setIsPlaying] = useState(false);
  const animFrameRef = useRef(null);
  const animStartTimeRef = useRef(null);

  // Mesh tuning & visual controls
  const [showMesh, setShowMesh] = useState(false);
  const [activePinId, setActivePinId] = useState(null);
  const isDraggingPinRef = useRef(false);

  // Lighting & Tone matching controls
  const [brightness, setBrightness] = useState(100);
  const [warmth, setWarmth] = useState(0);
  const [contrast, setContrast] = useState(100);
  const [flipX, setFlipX] = useState(false);
  const [featherEdge, setFeatherEdge] = useState(true);

  // Canvases & Image refs
  const previewCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const memeImageRef = useRef(null);
  const targetPhotoRef = useRef(null);

  // 1. Load Meme Face Patch (Face A)
  useEffect(() => {
    const memeImg = new Image();
    memeImg.crossOrigin = 'anonymous';
    memeImg.onload = () => {
      memeImageRef.current = memeImg;
      renderCurrentFrame();
    };
    if (memeFacePatch?.dataUrl) {
      memeImg.src = memeFacePatch.dataUrl;
    } else {
      // Fallback if opened without patch
      memeImg.src = getMemeFaceDataUrl(MEME_FACE_PRESETS[1]); // Wojak fallback
    }
  }, [memeFacePatch]);

  // 2. Load Selected Photo / Preset Face (Face B)
  useEffect(() => {
    if (!selectedImageSrc) return;
    const photoImg = new Image();
    photoImg.crossOrigin = 'anonymous';
    photoImg.onload = () => {
      targetPhotoRef.current = photoImg;
      renderCurrentFrame();
    };
    photoImg.src = selectedImageSrc;
  }, [selectedImageSrc]);

  // 3. Initialize lighting from sampled canvas pixels
  useEffect(() => {
    if (initialLighting && isOpen) {
      if (initialLighting.brightness !== undefined) setBrightness(initialLighting.brightness);
      if (initialLighting.warmth !== undefined) setWarmth(initialLighting.warmth);
    }
  }, [initialLighting, isOpen]);

  // 4. Render Morphed Frame at current progress
  const renderCurrentFrame = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const memeImg = memeImageRef.current;
    const photoImg = targetPhotoRef.current;
    if (!memeImg || !photoImg) return;

    const size = 380;
    canvas.width = size;
    canvas.height = size;

    // Prepare Source Canvas A (Meme face)
    const canvasA = document.createElement('canvas');
    canvasA.width = size;
    canvasA.height = size;
    const ctxA = canvasA.getContext('2d');
    ctxA.drawImage(memeImg, 0, 0, size, size);

    // Prepare Source Canvas B (Photo face with tone filters & flip)
    const canvasB = document.createElement('canvas');
    canvasB.width = size;
    canvasB.height = size;
    const ctxB = canvasB.getContext('2d');

    ctxB.save();
    ctxB.filter = `brightness(${brightness}%) contrast(${contrast}%) sepia(${warmth}%)`;
    if (flipX) {
      ctxB.translate(size, 0);
      ctxB.scale(-1, 1);
    }
    ctxB.drawImage(photoImg, 0, 0, size, size);
    ctxB.restore();

    // Execute true landmark mesh morph
    morphFaceMesh({
      sourceCanvasA: canvasA,
      landmarksA,
      sourceCanvasB: canvasB,
      landmarksB,
      morphProgress,
      outputCanvas: canvas,
      featherEdge
    });

    // Optionally overlay wireframe triangulation mesh & pins
    if (showMesh) {
      const outCtx = canvas.getContext('2d');
      // Draw intermediate morphed landmarks
      const currentPts = landmarksA.map((ptA, idx) => {
        const ptB = landmarksB[idx] || ptA;
        return {
          id: ptA.id,
          name: ptA.name,
          x: (1 - morphProgress) * ptA.x + morphProgress * ptB.x,
          y: (1 - morphProgress) * ptA.y + morphProgress * ptB.y,
          isAnchor: ptA.isAnchor,
          isKeyPin: ptA.isKeyPin
        };
      });
      drawLandmarkMeshOverlay(outCtx, currentPts, size, {
        showTriangles: true,
        showPins: true,
        activePinId,
        color: '#06b6d4'
      });
    }
  }, [
    landmarksA,
    landmarksB,
    morphProgress,
    showMesh,
    activePinId,
    brightness,
    contrast,
    warmth,
    flipX,
    featherEdge
  ]);

  // Re-render frame when any parameter updates
  useEffect(() => {
    renderCurrentFrame();
  }, [renderCurrentFrame]);

  // 5. Morph animation loop (smooth sine oscillation between 0 and 1)
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animStartTimeRef.current = null;
      return;
    }

    const animate = (time) => {
      if (!animStartTimeRef.current) animStartTimeRef.current = time;
      const elapsed = (time - animStartTimeRef.current) / 1000;
      // 2.5 second oscillation period
      const t = (Math.sin(elapsed * (Math.PI * 2) / 2.5 - Math.PI / 2) + 1) / 2;
      setMorphProgress(t);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  // Preset switching
  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setSelectedImageSrc(getMemeFaceDataUrl(preset));
    setFaceName(preset.name);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSelectedImageSrc(url);
    setSelectedPresetId(null);
    setFaceName(file.name.replace(/\.[^/.]+$/, '').slice(0, 16));
    e.target.value = '';
  };

  const handleAnglePresetChange = (presetName) => {
    setActiveAnglePreset(presetName);
    const newLandmarks = getLandmarkPreset(presetName);
    setLandmarksA(newLandmarks);
    setLandmarksB(getDefaultLandmarks());
  };

  const handleResetMesh = () => {
    setLandmarksA(getDefaultLandmarks());
    setLandmarksB(getDefaultLandmarks());
    setActiveAnglePreset('front');
  };

  // Interactive landmark pin dragging on the preview canvas
  const handlePointerDownCanvas = (e) => {
    if (!showMesh) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const normX = (clientX - rect.left) / rect.width;
    const normY = (clientY - rect.top) / rect.height;

    // Find closest landmark pin (within threshold)
    const threshold = 0.08;
    let closestId = null;
    let closestDist = Infinity;

    landmarksA.forEach((p) => {
      if (p.isAnchor) return;
      const dist = Math.hypot(p.x - normX, p.y - normY);
      if (dist < threshold && dist < closestDist) {
        closestDist = dist;
        closestId = p.id;
      }
    });

    if (closestId) {
      setActivePinId(closestId);
      isDraggingPinRef.current = true;
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handlePointerMoveCanvas = (e) => {
    if (!isDraggingPinRef.current || !activePinId) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const normX = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));
    const normY = Math.max(0.05, Math.min(0.95, (clientY - rect.top) / rect.height));

    // Update landmark in both meshes (or mesh A)
    setLandmarksA((prev) =>
      prev.map((p) => (p.id === activePinId ? { ...p, x: normX, y: normY } : p))
    );
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePointerUpCanvas = () => {
    isDraggingPinRef.current = false;
  };

  const handleApply = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    // Render pure morphed face (without wireframe overlays)
    setShowMesh(false);

    // Give a brief tick for render without mesh, then export
    setTimeout(() => {
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = 400;
      finalCanvas.height = 400;

      const memeImg = memeImageRef.current;
      const photoImg = targetPhotoRef.current;

      if (memeImg && photoImg) {
        const cA = document.createElement('canvas');
        cA.width = 400;
        cA.height = 400;
        cA.getContext('2d').drawImage(memeImg, 0, 0, 400, 400);

        const cB = document.createElement('canvas');
        cB.width = 400;
        cB.height = 400;
        const ctxB = cB.getContext('2d');
        ctxB.save();
        ctxB.filter = `brightness(${brightness}%) contrast(${contrast}%) sepia(${warmth}%)`;
        if (flipX) {
          ctxB.translate(400, 0);
          ctxB.scale(-1, 1);
        }
        ctxB.drawImage(photoImg, 0, 0, 400, 400);
        ctxB.restore();

        morphFaceMesh({
          sourceCanvasA: cA,
          landmarksA,
          sourceCanvasB: cB,
          landmarksB,
          morphProgress,
          outputCanvas: finalCanvas,
          featherEdge
        });
      }

      const finalDataUrl = finalCanvas.toDataURL('image/png');

      onApplyFaceMorph({
        url: finalDataUrl,
        originalFaceUrl: selectedImageSrc,
        faceName: `${faceName || 'Face'} Morph (${Math.round(morphProgress * 100)}%)`,
        opacity: 1.0,
        flipX,
        brightness,
        contrast,
        warmth,
        morphProgress,
        landmarksA,
        landmarksB
      });

      onClose();
    }, 50);
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="modal-backdrop animate-fade-in"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '12px'
        }}
      >
        <div
          className="modal-card animate-scale-up"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--bg-surface-2, #181a20)',
            border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.12))',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '720px',
            maxHeight: '94vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(6, 182, 212, 0.25)'
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.12), transparent)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(6, 182, 212, 0.5)'
                }}
              >
                <Sparkles size={18} color="#ffffff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.4px' }}>
                  LANDMARK MESH FACE MORPH
                </h3>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Warps & transforms the canvas meme face directly into your chosen photo
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="btn btn-icon btn-xs btn-ghost"
              style={{ borderRadius: '50%', width: '28px', height: '28px', padding: 0 }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Modal Body */}
          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '16px 20px', gap: '14px' }}>
            {/* Top Interactive Canvas & Morph Controls */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(280px, 340px) 1fr',
                gap: '16px',
                alignItems: 'center'
              }}
            >
              {/* Preview Canvas Container */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1',
                  background: '#0b0d13',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1.5px solid rgba(6, 182, 212, 0.3)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: showMesh ? 'crosshair' : 'default'
                }}
                onPointerDown={handlePointerDownCanvas}
                onPointerMove={handlePointerMoveCanvas}
                onPointerUp={handlePointerUpCanvas}
                onTouchStart={handlePointerDownCanvas}
                onTouchMove={handlePointerMoveCanvas}
                onTouchEnd={handlePointerUpCanvas}
              >
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />

                {/* Floating Morph % Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(6, 182, 212, 0.4)',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'var(--cyber-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span>Morph:</span>
                  <span>{Math.round(morphProgress * 100)}%</span>
                </div>

                {/* Mesh Toggle & Reset pill */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(15, 17, 23, 0.85)',
                    backdropFilter: 'blur(8px)',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}
                >
                  <button
                    type="button"
                    className={`btn btn-xs ${showMesh ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setShowMesh(!showMesh)}
                    style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '999px', height: '22px' }}
                    title="Toggle wireframe mesh & draggable landmark pins"
                  >
                    {showMesh ? <EyeOff size={11} style={{ marginRight: 3 }} /> : <Eye size={11} style={{ marginRight: 3 }} />}
                    {showMesh ? 'Hide Mesh' : 'Show Mesh & Pins'}
                  </button>
                  {showMesh && (
                    <button
                      type="button"
                      className="btn btn-xs btn-ghost"
                      onClick={handleResetMesh}
                      style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '999px', height: '22px' }}
                      title="Reset landmark pins to canonical position"
                    >
                      <RotateCcw size={11} />
                    </button>
                  )}
                </div>
              </div>

              {/* Right Side: Morph Animation & Sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* 1. Main Morph Progress Slider & Play Button */}
                <div
                  className="glass-card"
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    background: 'rgba(6, 182, 212, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Wand2 size={13} style={{ color: 'var(--cyber-cyan)' }} />
                      Morph Transformation
                    </span>

                    {/* Play / Pause Animated Morph */}
                    <button
                      type="button"
                      className={`btn btn-xs ${isPlaying ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setIsPlaying(!isPlaying)}
                      style={{
                        padding: '3px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        borderRadius: '999px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Animate morph oscillation smoothly"
                    >
                      {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                      <span>{isPlaying ? 'Pause' : 'Play Morph'}</span>
                    </button>
                  </div>

                  {/* Morph Slider: 0% Meme Face -> 100% Photo Face */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 600 }}>
                      <span style={{ color: morphProgress < 0.5 ? 'var(--cyber-cyan)' : 'var(--text-muted)' }}>
                        0% Original Meme Face
                      </span>
                      <span style={{ color: morphProgress >= 0.5 ? 'var(--cyber-cyan)' : 'var(--text-muted)' }}>
                        100% Target Photo Face
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={morphProgress}
                      onChange={(e) => {
                        setIsPlaying(false);
                        setMorphProgress(parseFloat(e.target.value));
                      }}
                      style={{
                        accentColor: 'var(--cyber-cyan)',
                        height: '6px',
                        width: '100%',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>

                {/* 2. Quick Angle & Expression Alignment Presets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Meme Head Angle & Alignment
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                    {[
                      { id: 'front', label: 'Frontal' },
                      { id: 'left', label: 'Turned Left' },
                      { id: 'right', label: 'Turned Right' },
                      { id: 'smile', label: 'Big Smile' }
                    ].map((ang) => (
                      <button
                        key={ang.id}
                        type="button"
                        className={`btn btn-xs ${activeAnglePreset === ang.id ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => handleAnglePresetChange(ang.id)}
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          padding: '4px 6px',
                          borderRadius: '8px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {ang.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Lighting & Skin Tone Match Sliders */}
                <div
                  className="glass-card"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '12px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Warmth / Skin Tint</span>
                      <span style={{ color: 'var(--cyber-cyan)' }}>{warmth}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="45"
                      step="5"
                      value={warmth}
                      onChange={(e) => setWarmth(Number(e.target.value))}
                      style={{ accentColor: 'var(--cyber-cyan)', height: '4px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Brightness</span>
                      <span style={{ color: 'var(--cyber-cyan)' }}>{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="65"
                      max="140"
                      step="5"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      style={{ accentColor: 'var(--cyber-cyan)', height: '4px' }}
                    />
                  </div>
                </div>

                {/* Toggles: Flip Horizontal & Perimeter Feather */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className={`btn btn-xs ${flipX ? 'active' : 'btn-ghost'}`}
                    onClick={() => setFlipX(!flipX)}
                    style={{ flex: 1, fontSize: '0.72rem', borderRadius: '8px', padding: '5px' }}
                  >
                    <FlipHorizontal size={13} style={{ marginRight: 4 }} /> Flip Mirror
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs ${featherEdge ? 'active' : 'btn-ghost'}`}
                    onClick={() => setFeatherEdge(!featherEdge)}
                    style={{ flex: 1, fontSize: '0.72rem', borderRadius: '8px', padding: '5px' }}
                    title="Seamlessly feather boundary into meme background"
                  >
                    <Sparkles size={13} style={{ marginRight: 4 }} /> Edge Feather
                  </button>
                </div>
              </div>
            </div>

            {/* Target Face Source Selection (Meme Faces & Upload Photo) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>
                  Select Target Face Photo
                </span>

                {/* Tab Switcher */}
                <div style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '999px', padding: '2px' }}>
                  <button
                    type="button"
                    className={`btn btn-xs ${activeTab === 'presets' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setActiveTab('presets')}
                    style={{ borderRadius: '999px', fontSize: '0.72rem', padding: '2px 10px' }}
                  >
                    Meme Presets
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs ${activeTab === 'upload' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setActiveTab('upload')}
                    style={{ borderRadius: '999px', fontSize: '0.72rem', padding: '2px 10px' }}
                  >
                    Upload / Selfie
                  </button>
                </div>
              </div>

              {/* Presets List */}
              {activeTab === 'presets' ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
                    gap: '8px',
                    maxHeight: '140px',
                    overflowY: 'auto',
                    padding: '4px 0'
                  }}
                >
                  {MEME_FACE_PRESETS.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`hover-lift ${isSelected ? 'selected' : ''}`}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          background: isSelected ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                          border: isSelected ? '1.5px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '6px 4px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            background: '#1f2430',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <img
                            src={getMemeFaceDataUrl(preset)}
                            alt={preset.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            color: isSelected ? '#ffffff' : 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '65px'
                          }}
                        >
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Upload Photo / Camera Selfie */
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="user"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-xs hover-lift"
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px dashed rgba(6, 182, 212, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      color: '#ffffff',
                      fontWeight: 600
                    }}
                  >
                    <Upload size={16} style={{ color: 'var(--cyber-cyan)' }} />
                    <span>Upload Face Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="btn btn-xs hover-lift"
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px dashed rgba(6, 182, 212, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      color: '#ffffff',
                      fontWeight: 600
                    }}
                  >
                    <Camera size={16} style={{ color: 'var(--cyber-cyan)' }} />
                    <span>Take Selfie</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(0, 0, 0, 0.3)'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-xs btn-ghost"
              style={{ borderRadius: '8px', padding: '6px 14px', fontSize: '0.78rem' }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="btn btn-xs btn-primary shadow-glow"
              style={{
                borderRadius: '999px',
                padding: '8px 24px',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)'
              }}
            >
              <Check size={16} /> Apply Morph to Meme
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
