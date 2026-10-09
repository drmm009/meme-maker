import React, { useState, useRef, useEffect } from 'react';
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
  Layers,
  ZoomIn
} from 'lucide-react';
import { MEME_FACE_PRESETS, getMemeFaceDataUrl } from '../data/memeFaces';
import { removeBackground } from '@imgly/background-removal';
import ModalPortal from './ModalPortal';

export default function FaceMorphModal({ isOpen, onClose, onApplyFaceMorph, initialLighting }) {
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'upload'
  const [selectedPresetId, setSelectedPresetId] = useState(MEME_FACE_PRESETS[0].id);
  const [selectedImageSrc, setSelectedImageSrc] = useState(getMemeFaceDataUrl(MEME_FACE_PRESETS[0]));
  const [faceName, setFaceName] = useState(MEME_FACE_PRESETS[0].name);

  // Mask & Crop Controls
  const [maskType, setMaskType] = useState('oval'); // 'oval' | 'circle' | 'full'
  const [feather, setFeather] = useState(14); // 0 to 30px soft edge
  const [zoom, setZoom] = useState(1.0); // 0.6 to 2.0
  const [panX, setPanX] = useState(0); // -100 to 100
  const [panY, setPanY] = useState(0); // -100 to 100
  const [flipX, setFlipX] = useState(false);

  // Lighting & Skin Tone Match Controls
  const [brightness, setBrightness] = useState(100); // 50 to 150%
  const [contrast, setContrast] = useState(100); // 50 to 150%
  const [warmth, setWarmth] = useState(0); // 0 to 40% (sepia / warmth tint)
  const [saturation, setSaturation] = useState(100); // 0 to 160%
  const [morphOpacity, setMorphOpacity] = useState(100); // 30 to 100%

  // AI Background Removal state
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgRemoved, setBgRemoved] = useState(false);

  // Preview canvas
  const previewCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const loadedImageRef = useRef(null);

  // Load selected image into Image element
  useEffect(() => {
    if (!selectedImageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      loadedImageRef.current = img;
      renderPreview();
    };
    img.src = selectedImageSrc;
  }, [selectedImageSrc]);

  // Apply auto-sampled meme lighting when modal opens
  useEffect(() => {
    if (initialLighting && isOpen) {
      if (initialLighting.brightness !== undefined) setBrightness(initialLighting.brightness);
      if (initialLighting.warmth !== undefined) setWarmth(initialLighting.warmth);
    }
  }, [initialLighting, isOpen]);

  // Re-render preview whenever controls change
  useEffect(() => {
    if (loadedImageRef.current) {
      renderPreview();
    }
  }, [maskType, feather, zoom, panX, panY, flipX, brightness, contrast, warmth, saturation, morphOpacity]);

  const renderPreview = () => {
    const canvas = previewCanvasRef.current;
    const img = loadedImageRef.current;
    if (!canvas || !img) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);

    // 1. Draw image onto temporary buffer canvas with filters & transform
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const tCtx = tempCanvas.getContext('2d');

    tCtx.save();
    tCtx.translate(size / 2 + panX, size / 2 + panY);
    if (flipX) tCtx.scale(-1, 1);
    tCtx.scale(zoom, zoom);

    // CSS filters for lighting & tone matching
    tCtx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${warmth}%)`;

    const imgAspect = img.width / img.height;
    let dw = size;
    let dh = size;
    if (imgAspect > 1) {
      dh = size / imgAspect;
    } else {
      dw = size * imgAspect;
    }
    tCtx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    tCtx.restore();

    // 2. Draw buffered image to main canvas
    ctx.globalAlpha = morphOpacity / 100;
    ctx.drawImage(tempCanvas, 0, 0);

    // 3. If oval/circle mask with feathering is active, apply feathered alpha mask
    if (maskType !== 'full') {
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = size;
      maskCanvas.height = size;
      const mCtx = maskCanvas.getContext('2d');

      const cx = size / 2;
      const cy = size / 2;
      const rx = maskType === 'circle' ? size * 0.38 : size * 0.35;
      const ry = maskType === 'circle' ? size * 0.38 : size * 0.44;

      if (feather > 0) {
        mCtx.filter = `blur(${feather}px)`;
      }
      mCtx.fillStyle = '#000000';
      mCtx.beginPath();
      mCtx.ellipse(cx, cy, Math.max(10, rx - feather * 0.5), Math.max(10, ry - feather * 0.5), 0, 0, Math.PI * 2);
      mCtx.fill();

      // Apply mask via destination-in
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(maskCanvas, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setSelectedImageSrc(getMemeFaceDataUrl(preset));
    setFaceName(preset.name);
    setBgRemoved(false);
    setPanX(0);
    setPanY(0);
    setZoom(1.0);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSelectedImageSrc(url);
    setSelectedPresetId(null);
    setFaceName(file.name.replace(/\.[^/.]+$/, ''));
    setBgRemoved(false);
    setPanX(0);
    setPanY(0);
    setZoom(1.0);
  };

  const handleAiBackgroundRemoval = async () => {
    if (!selectedImageSrc || isRemovingBg) return;
    setIsRemovingBg(true);
    try {
      const res = await fetch(selectedImageSrc);
      const blob = await res.blob();
      const cutBlob = await removeBackground(blob);
      const newUrl = URL.createObjectURL(cutBlob);
      setSelectedImageSrc(newUrl);
      setBgRemoved(true);
      // If AI background removed, mask can be set to full or gentle feather
      setFeather(6);
    } catch (err) {
      console.error('Face Cutout BG removal failed:', err);
      alert('AI Background Cutout: ' + (err.message || 'Could not process image automatically. Use the oval feathered mask!'));
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleResetControls = () => {
    setFeather(14);
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
    setFlipX(false);
    setBrightness(100);
    setContrast(100);
    setWarmth(0);
    setSaturation(100);
    setMorphOpacity(100);
    setMaskType('oval');
  };

  const handleApply = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    // Export high-quality cutout PNG
    const finalDataUrl = canvas.toDataURL('image/png');

    onApplyFaceMorph({
      url: finalDataUrl,
      originalFaceUrl: selectedImageSrc,
      faceName: faceName || 'Morphed Face',
      opacity: morphOpacity / 100,
      flipX,
      feather,
      brightness,
      contrast,
      warmth,
      saturation
    });

    onClose();
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
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
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
            maxWidth: '680px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7), 0 0 24px rgba(6, 182, 212, 0.25)',
            color: '#ffffff'
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--primary-gradient, linear-gradient(135deg, #6366f1, #8b5cf6))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(99, 102, 241, 0.5)'
                }}
              >
                <Smile style={{ width: 20, height: 20, color: '#ffffff' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.2px' }}>
                  Face Morph & Swap Studio
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
                  Seamlessly cutout, morph, and blend any face onto your meme
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn btn-icon btn-ghost btn-xs"
              style={{ borderRadius: '50%', color: 'var(--text-muted)' }}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body: Two Columns (Left Preview / Right Controls & Library) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              padding: '20px',
              overflowY: 'auto',
              flex: 1
            }}
          >
            {/* Left Column: Live Morph Preview & Quick Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  position: 'relative',
                  width: '260px',
                  height: '260px',
                  borderRadius: '16px',
                  background: 'radial-gradient(circle, #2d313d 0%, #15171d 100%)',
                  border: '2px solid rgba(6, 182, 212, 0.3)',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                />

                {/* Oval Guide Overlay (dashed circle) */}
                {maskType !== 'full' && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: maskType === 'circle' ? '12%' : '8% 15%',
                      borderRadius: '50%',
                      border: '1.5px dashed rgba(6, 182, 212, 0.5)',
                      pointerEvents: 'none',
                      boxShadow: '0 0 10px rgba(6, 182, 212, 0.2)'
                    }}
                  />
                )}

                {/* Badge showing current face name */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(4px)',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: 'var(--cyber-cyan, #06b6d4)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {faceName}
                </div>
              </div>

              {/* Quick Preview Toolbar: Flip, AI BG Removal, Reset */}
              <div style={{ display: 'flex', gap: '8px', width: '260px' }}>
                <button
                  type="button"
                  onClick={() => setFlipX(!flipX)}
                  className={`btn btn-xs flex-1 ${flipX ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    background: flipX ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.08)'
                  }}
                  title="Mirror / Flip Face horizontally"
                >
                  <FlipHorizontal size={13} /> Flip
                </button>

                <button
                  type="button"
                  onClick={handleAiBackgroundRemoval}
                  disabled={isRemovingBg}
                  className="btn btn-xs flex-1"
                  style={{
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    background: bgRemoved ? 'rgba(16, 185, 129, 0.25)' : 'rgba(99, 102, 241, 0.25)',
                    border: bgRemoved ? '1px solid #10b981' : '1px solid var(--cyber-cyan)',
                    color: '#ffffff'
                  }}
                  title="Automatic AI Cutout & Background Removal"
                >
                  <Wand2 size={13} className={isRemovingBg ? 'spin' : ''} />
                  {isRemovingBg ? 'Cutting...' : bgRemoved ? 'AI Cut ✓' : 'AI Cutout'}
                </button>

                <button
                  type="button"
                  onClick={handleResetControls}
                  className="btn btn-xs btn-ghost"
                  style={{
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    height: '30px',
                    padding: '0 8px',
                    background: 'rgba(255,255,255,0.06)'
                  }}
                  title="Reset adjustments"
                >
                  <RefreshCw size={13} />
                </button>
              </div>

              {/* Mask Type Selector */}
              <div style={{ width: '260px', display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '3px', borderRadius: '10px' }}>
                {[
                  { id: 'oval', label: 'Oval Face' },
                  { id: 'circle', label: 'Circle' },
                  { id: 'full', label: 'Full Cut' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMaskType(m.id)}
                    className={`btn btn-xs flex-1 ${maskType === m.id ? 'btn-primary' : 'btn-ghost'}`}
                    style={{
                      borderRadius: '8px',
                      fontSize: '0.7rem',
                      height: '26px',
                      fontWeight: 600,
                      background: maskType === m.id ? 'var(--primary-gradient)' : 'transparent'
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Source Tabs & Fine-Tuning Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Tabs: Meme Face Presets vs Upload Photo */}
              <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('presets')}
                  className={`btn btn-xs ${activeTab === 'presets' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    borderRadius: '999px',
                    padding: '4px 14px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Smile size={13} /> Meme Faces
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`btn btn-xs ${activeTab === 'upload' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    borderRadius: '999px',
                    padding: '4px 14px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Upload size={13} /> Upload / Selfie
                </button>
              </div>

              {/* Tab 1: Meme Face Presets Grid */}
              {activeTab === 'presets' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
                    gap: '8px',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    padding: '4px 2px'
                  }}
                >
                  {MEME_FACE_PRESETS.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 4px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                          boxShadow: isSelected ? '0 0 10px rgba(6, 182, 212, 0.4)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        title={`${preset.name} - ${preset.tag}`}
                      >
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: '#1e222b',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255,255,255,0.1)'
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
                            fontSize: '0.62rem',
                            fontWeight: 600,
                            color: isSelected ? '#ffffff' : 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '65px'
                          }}
                        >
                          {preset.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tab 2: Upload Photo & Camera Capture */}
              {activeTab === 'upload' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '6px 0' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <label
                      className="btn btn-xs btn-primary flex-1 hover-lift"
                      style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        margin: 0
                      }}
                    >
                      <Upload size={14} /> Choose Photo
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                      />
                    </label>

                    <label
                      className="btn btn-xs btn-secondary flex-1 hover-lift"
                      style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        margin: 0
                      }}
                    >
                      <Camera size={14} /> Take Selfie
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="user"
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Tip: Use bright front-facing photos for the most seamless face morphing!
                  </span>
                </div>
              )}

              {/* Morph & Blend Sliders */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '12px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                {/* 1. Edge Feathering (Soft Blend Falloff) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Edge Feather (Soft Blend)</span>
                    <span style={{ color: 'var(--cyber-cyan)' }}>{feather}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="28"
                    step="1"
                    value={feather}
                    onChange={(e) => setFeather(Number(e.target.value))}
                    style={{ accentColor: 'var(--cyber-cyan)', height: '4px' }}
                  />
                </div>

                {/* 2. Morph / Opacity Slider */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Morph Blend / Opacity</span>
                    <span style={{ color: 'var(--cyber-cyan)' }}>{morphOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    step="5"
                    value={morphOpacity}
                    onChange={(e) => setMorphOpacity(Number(e.target.value))}
                    style={{ accentColor: 'var(--cyber-cyan)', height: '4px' }}
                  />
                </div>

                {/* 3. Zoom / Crop Scale */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Face Zoom</span>
                    <span style={{ color: 'var(--cyber-cyan)' }}>{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.8"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    style={{ accentColor: 'var(--cyber-cyan)', height: '4px' }}
                  />
                </div>

                {/* Lighting Match: Warmth & Brightness */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingTop: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Warmth / Tint</span>
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Brightness</span>
                      <span style={{ color: 'var(--cyber-cyan)' }}>{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="70"
                      max="135"
                      step="5"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      style={{ accentColor: 'var(--cyber-cyan)', height: '4px' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(0, 0, 0, 0.25)'
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
                gap: '8px'
              }}
            >
              <Check size={15} /> Apply Morph to Meme
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
