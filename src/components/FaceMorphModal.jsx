import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Upload,
  Camera,
  RefreshCw,
  Check,
  X,
  Eye,
  AlertCircle
} from 'lucide-react';
import { MEME_FACE_PRESETS, getMemeFaceDataUrl } from '../data/memeFaces';
import ModalPortal from './ModalPortal';

// Helper to convert any image URL/blob to a base64 data URL
async function ensureDataUrl(src) {
  if (!src) return '';
  if (src.startsWith('data:')) return src;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth || 600;
        c.height = img.naturalHeight || 600;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(c.toDataURL('image/jpeg', 0.92));
      } catch (err) {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

export default function FaceMorphModal({
  isOpen,
  onClose,
  onApplyFaceMorph,
  memeFacePatch,
  memeTemplateUrl,
  faceTarget,
  targetLabel
}) {
  // Preset or custom uploaded face
  const [selectedPresetId, setSelectedPresetId] = useState(MEME_FACE_PRESETS[0].id);
  const [selectedImageSrc, setSelectedImageSrc] = useState(getMemeFaceDataUrl(MEME_FACE_PRESETS[0]));
  const [faceName, setFaceName] = useState(MEME_FACE_PRESETS[0].name);

  // Neural Swap Engine State
  const [isNeuralAvailable, setIsNeuralAvailable] = useState(false);
  const [isNeuralProcessing, setIsNeuralProcessing] = useState(false);
  const [neuralError, setNeuralError] = useState(null);

  // Generated Results
  const [neuralFullImage, setNeuralFullImage] = useState(null);
  const [neuralCropPreview, setNeuralCropPreview] = useState(null);
  const [originalCropPreview, setOriginalCropPreview] = useState(null);
  const [previewType, setPreviewType] = useState('crop'); // 'crop' | 'full'

  // Hold to Compare State
  const [isComparing, setIsComparing] = useState(false);

  // Target Face Selection (defaults to all faces if > 1)
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [selectedTargetIndex, setSelectedTargetIndex] = useState(null);
  const [swapAllFaces, setSwapAllFaces] = useState(true);

  // Custom uploaded face
  const [customFace, setCustomFace] = useState(null);

  // Refs
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // 1. Initialize Server Status & Auto-Detect Meme Faces
  useEffect(() => {
    let isMounted = true;
    const initServer = async () => {
      let isOnline = false;
      try {
        const res = await fetch('/api/face-swap/status');
        const data = await res.json();
        if (data.status === 'online' && data.model_available) {
          isOnline = true;
        }
      } catch (e) {
        try {
          const res2 = await fetch('http://127.0.0.1:5174/api/face-swap/status');
          const data2 = await res2.json();
          if (data2.status === 'online') isOnline = true;
        } catch (e2) {}
      }

      if (isMounted) {
        setIsNeuralAvailable(isOnline);
        if (!isOnline) {
          setNeuralError('AI Face Swap server is offline. Please launch face_swap_server.py.');
        }
      }

      // Auto-detect faces in the meme template
      if (isOnline && (memeTemplateUrl || memeFacePatch?.dataUrl)) {
        try {
          const targetUrl = await ensureDataUrl(memeTemplateUrl || memeFacePatch?.dataUrl);
          let detectRes;
          try {
            detectRes = await fetch('/api/face-swap/detect-faces', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: targetUrl })
            });
          } catch (e) {
            detectRes = await fetch('http://127.0.0.1:5174/api/face-swap/detect-faces', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: targetUrl })
            });
          }
          const dData = await detectRes.json();
          if (isMounted && dData.success && dData.faces?.length > 0) {
            setDetectedFaces(dData.faces);
            if (dData.faces.length > 1) {
              setSwapAllFaces(true);
              setSelectedTargetIndex(null);
            } else {
              setSwapAllFaces(false);
              setSelectedTargetIndex(0);
            }
          }
        } catch (err) {
          console.warn('Face detection error:', err);
        }
      }
    };

    if (isOpen) {
      initServer();
    }
    return () => { isMounted = false; };
  }, [isOpen, memeTemplateUrl, memeFacePatch, faceTarget]);

  // 2. Execute Neural Face Swap
  const runNeuralFaceSwap = useCallback(async (sourceImgUrl, faceIdx = selectedTargetIndex, allFaces = swapAllFaces) => {
    if (!sourceImgUrl) return;
    setIsNeuralProcessing(true);
    setNeuralError(null);

    try {
      const srcDataUrl = await ensureDataUrl(sourceImgUrl);
      const targetBase = memeTemplateUrl || memeFacePatch?.dataUrl;
      const targetDataUrl = await ensureDataUrl(targetBase);
      const targetCenter = faceTarget ? [faceTarget.x, faceTarget.y] : [0.5, 0.5];

      const isAll = allFaces || (faceIdx === null);
      const payload = {
        source_image: srcDataUrl,
        target_image: targetDataUrl,
        target_center: (!isAll && faceIdx === null) ? targetCenter : null,
        target_face_index: isAll ? null : faceIdx,
        swap_all: isAll,
        blend_ratio: 1.0,
        crop_only: true
      };

      let resp;
      try {
        resp = await fetch('/api/face-swap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        resp = await fetch('http://127.0.0.1:5174/api/face-swap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await resp.json();
      if (data.success) {
        setNeuralFullImage(data.image);
        setNeuralCropPreview(data.crop_image || data.image);
        if (data.original_crop_image) {
          setOriginalCropPreview(data.original_crop_image);
        }
        if (data.detected_faces && data.detected_faces.length > 0) {
          setDetectedFaces(data.detected_faces);
          if (data.detected_faces.length > 1 && selectedTargetIndex === null) {
            setSwapAllFaces(true);
          }
        }
      } else {
        setNeuralError(data.error || 'Face swap failed. Please use a clear portrait photo.');
      }
    } catch (err) {
      console.warn('Neural face swap error:', err);
      setNeuralError('Offline AI swap server not reachable.');
    } finally {
      setIsNeuralProcessing(false);
    }
  }, [memeTemplateUrl, memeFacePatch, faceTarget, selectedTargetIndex, swapAllFaces]);

  // Trigger Neural Face Swap when selection changes
  useEffect(() => {
    if (isNeuralAvailable && selectedImageSrc && isOpen) {
      runNeuralFaceSwap(selectedImageSrc, selectedTargetIndex, swapAllFaces);
    }
  }, [isNeuralAvailable, selectedImageSrc, selectedTargetIndex, swapAllFaces, isOpen]);

  // Handle Preset Selection
  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setSelectedImageSrc(getMemeFaceDataUrl(preset));
    setFaceName(preset.name);
  };

  // Handle File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setSelectedImageSrc(dataUrl);
      setSelectedPresetId('custom_upload');
      setFaceName('Your Photo');
      setCustomFace({
        id: 'custom_upload',
        name: 'Your Photo',
        dataUrl
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Compare gesture handlers
  const handleStartComparing = (e) => {
    e.preventDefault();
    setIsComparing(true);
  };

  const handleStopComparing = (e) => {
    e.preventDefault();
    setIsComparing(false);
  };

  // Apply to Meme
  const handleApply = () => {
    if (neuralFullImage) {
      onApplyFaceMorph({
        isNeuralSwap: true,
        neuralSwappedFullImage: neuralFullImage,
        originalFaceUrl: selectedImageSrc,
        faceName: `${faceName || 'Face'} Swap`
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentPreview = isComparing
    ? (originalCropPreview || memeFacePatch?.dataUrl || memeTemplateUrl)
    : (previewType === 'crop' ? (neuralCropPreview || neuralFullImage) : neuralFullImage);

  return (
    <ModalPortal>
      <div
        className="modal-backdrop animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        style={{
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backdropFilter: 'blur(12px)',
          background: 'rgba(0, 0, 0, 0.75)'
        }}
      >
        <div
          className="modal-card animate-scale-up"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '430px',
            background: 'rgba(18, 18, 24, 0.98)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'min(90vh, 760px)'
          }}
        >
          {/* 1. Header (Matching AiCaptionModal & App Design) */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} style={{ color: 'var(--cyber-cyan)' }} />
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>
                AI Face Swap
              </span>
              {targetLabel && (
                <span
                  style={{
                    fontSize: '0.64rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: 'var(--cyber-cyan)',
                    border: '1px solid rgba(6, 182, 212, 0.3)'
                  }}
                >
                  {targetLabel}
                </span>
              )}
            </div>

            <button
              type="button"
              className="btn btn-icon btn-ghost btn-xs"
              onClick={onClose}
              title="Close"
              aria-label="Close"
              style={{
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.6)',
                width: '26px',
                height: '26px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* 2. Scrollable Body */}
          <div
            style={{
              padding: '14px 18px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {/* Visual Preview Box */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '210px',
                borderRadius: '12px',
                background: '#090a0f',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isNeuralProcessing ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw className="spin" size={24} style={{ color: 'var(--cyber-cyan)' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                    Swapping face...
                  </span>
                </div>
              ) : neuralError ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px', textAlign: 'center', color: '#f87171' }}>
                  <AlertCircle size={22} />
                  <span style={{ fontSize: '0.74rem' }}>{neuralError}</span>
                  <button
                    type="button"
                    className="btn btn-xs btn-primary"
                    onClick={() => runNeuralFaceSwap(selectedImageSrc)}
                    style={{ fontSize: '0.7rem', padding: '3px 10px', marginTop: '4px' }}
                  >
                    Retry
                  </button>
                </div>
              ) : currentPreview ? (
                <>
                  <img
                    src={currentPreview}
                    alt="Swapped Face"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                      userSelect: 'none',
                      pointerEvents: 'none'
                    }}
                  />

                  {/* Minimal "Hold to Compare" Button */}
                  <button
                    type="button"
                    onPointerDown={handleStartComparing}
                    onPointerUp={handleStopComparing}
                    onPointerLeave={handleStopComparing}
                    onPointerCancel={handleStopComparing}
                    onTouchStart={handleStartComparing}
                    onTouchEnd={handleStopComparing}
                    onTouchCancel={handleStopComparing}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      padding: '3px 9px',
                      borderRadius: '999px',
                      fontSize: '0.66rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      border: isComparing ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                      background: isComparing ? '#ef4444' : 'rgba(15, 18, 25, 0.85)',
                      backdropFilter: 'blur(6px)',
                      color: '#ffffff',
                      userSelect: 'none',
                      touchAction: 'manipulation'
                    }}
                  >
                    <Eye size={10} />
                    <span>{isComparing ? 'Original' : 'Hold to Compare'}</span>
                  </button>

                  {/* Subtle Face / Full Zoom Toggle */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      display: 'inline-flex',
                      background: 'rgba(15, 18, 25, 0.85)',
                      backdropFilter: 'blur(6px)',
                      borderRadius: '6px',
                      padding: '2px',
                      border: '1px solid rgba(255, 255, 255, 0.12)'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewType('crop')}
                      style={{
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontSize: '0.64rem',
                        fontWeight: previewType === 'crop' ? 700 : 500,
                        border: 'none',
                        background: previewType === 'crop' ? 'var(--cyber-cyan)' : 'transparent',
                        color: previewType === 'crop' ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                        cursor: 'pointer'
                      }}
                    >
                      Face
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewType('full')}
                      style={{
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontSize: '0.64rem',
                        fontWeight: previewType === 'full' ? 700 : 500,
                        border: 'none',
                        background: previewType === 'full' ? 'var(--cyber-cyan)' : 'transparent',
                        color: previewType === 'full' ? '#000000' : 'rgba(255, 255, 255, 0.7)',
                        cursor: 'pointer'
                      }}
                    >
                      Full
                    </button>
                  </div>
                </>
              ) : (
                <span style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                  Select a face to preview
                </span>
              )}
            </div>

            {/* Upload Buttons */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary btn-sm"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  padding: '8px 12px',
                  borderRadius: '10px'
                }}
              >
                <Upload size={14} style={{ color: 'var(--cyber-cyan)' }} />
                <span>Upload Photo</span>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  padding: '8px 14px',
                  borderRadius: '10px'
                }}
              >
                <Camera size={14} />
                <span>Selfie</span>
              </button>
            </div>

            {/* Quick Face Presets Strip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '2px',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {customFace && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPresetId(customFace.id);
                    setSelectedImageSrc(customFace.dataUrl);
                    setFaceName(customFace.name);
                  }}
                  style={{
                    flexShrink: 0,
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    padding: 0,
                    overflow: 'hidden',
                    background: '#0d1017',
                    border: selectedPresetId === customFace.id ? '2px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: selectedPresetId === customFace.id ? '0 0 10px rgba(6, 182, 212, 0.5)' : 'none',
                    cursor: 'pointer'
                  }}
                  title="Your Uploaded Photo"
                >
                  <img src={customFace.dataUrl} alt="Your Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              )}

              {MEME_FACE_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    style={{
                      flexShrink: 0,
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      padding: 0,
                      overflow: 'hidden',
                      background: '#0d1017',
                      border: isSelected ? '2px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.15)',
                      boxShadow: isSelected ? '0 0 10px rgba(6, 182, 212, 0.5)' : 'none',
                      cursor: 'pointer'
                    }}
                    title={preset.name}
                  >
                    <img
                      src={getMemeFaceDataUrl(preset)}
                      alt={preset.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </button>
                );
              })}
            </div>

            {/* If multiple faces detected: Segmented selector matching AiCaptionModal */}
            {detectedFaces.length > 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.07)'
                }}
              >
                <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>
                  Target:
                </span>

                <div
                  style={{
                    display: 'inline-flex',
                    background: 'rgba(255, 255, 255, 0.06)',
                    borderRadius: '8px',
                    padding: '2px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    gap: '2px'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSwapAllFaces(true);
                      setSelectedTargetIndex(null);
                    }}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.68rem',
                      fontWeight: swapAllFaces ? 700 : 500,
                      border: 'none',
                      cursor: 'pointer',
                      background: swapAllFaces ? 'var(--primary-gradient)' : 'transparent',
                      color: swapAllFaces ? '#ffffff' : 'rgba(255, 255, 255, 0.65)'
                    }}
                  >
                    All Faces ({detectedFaces.length})
                  </button>

                  {detectedFaces.map((f, i) => {
                    const isSelected = !swapAllFaces && selectedTargetIndex === f.index;
                    return (
                      <button
                        key={f.index}
                        type="button"
                        onClick={() => {
                          setSwapAllFaces(false);
                          setSelectedTargetIndex(f.index);
                        }}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.68rem',
                          fontWeight: isSelected ? 700 : 500,
                          border: 'none',
                          cursor: 'pointer',
                          background: isSelected ? 'var(--primary-gradient)' : 'transparent',
                          color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.65)'
                        }}
                      >
                        Face {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 3. Footer Actions (Matching App's standard modal action footer) */}
          <div
            style={{
              padding: '12px 18px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(0, 0, 0, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              style={{ fontSize: '0.8rem', padding: '7px 14px', borderRadius: '10px' }}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleApply}
              disabled={isNeuralProcessing || (!neuralFullImage && !neuralCropPreview)}
              style={{
                flex: 1,
                fontSize: '0.82rem',
                fontWeight: 700,
                padding: '8px 16px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Check size={14} />
              <span>Apply to Meme</span>
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
