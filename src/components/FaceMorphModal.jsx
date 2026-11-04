import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Camera,
  RefreshCw,
  Check,
  Eye,
  AlertCircle,
  CloudOff,
  LoaderCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { TEMPLATE_FACES } from './editor/faceSwap';
import BottomSheet from './BottomSheet';
import './FaceMorphModal.css';

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
      } catch {
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
  // A face from our meme templates (picked by its picture), or the person's own upload.
  const [selectedPresetId, setSelectedPresetId] = useState(TEMPLATE_FACES[0].src);
  const [selectedImageSrc, setSelectedImageSrc] = useState(TEMPLATE_FACES[0].src);
  const [faceName, setFaceName] = useState(TEMPLATE_FACES[0].name);

  // Neural Swap Engine State
  const [isNeuralAvailable, setIsNeuralAvailable] = useState(false);
  const [isNeuralProcessing, setIsNeuralProcessing] = useState(false);
  const [neuralError, setNeuralError] = useState(null);
  // Bumped by Try again while the server is offline, to ask it again.
  const [serverCheck, setServerCheck] = useState(0);

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
      } catch {
        try {
          const res2 = await fetch('http://127.0.0.1:5174/api/face-swap/status');
          const data2 = await res2.json();
          if (data2.status === 'online') isOnline = true;
        } catch {
          // Server offline
        }
      }

      if (isMounted) {
        setIsNeuralAvailable(isOnline);
        setNeuralError(isOnline ? null : 'Start face_swap_server.py on this computer, then try again.');
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
          } catch {
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
  }, [isOpen, memeTemplateUrl, memeFacePatch, faceTarget, serverCheck]);

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
      } catch {
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

  // A new face or a different face in the meme makes the last swap stale: back to Swap face.
  const clearResult = () => {
    setNeuralFullImage(null);
    setNeuralCropPreview(null);
    setOriginalCropPreview(null);
    setNeuralError(null);
    setIsComparing(false);
  };

  // Handle File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      clearResult();
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

  const swappedPreview = previewType === 'crop' ? (neuralCropPreview || neuralFullImage) : neuralFullImage;
  const hasResult = Boolean(neuralFullImage);
  const original = originalCropPreview || memeFacePatch?.dataUrl || memeTemplateUrl;
  const currentPreview = hasResult ? (isComparing ? original : swappedPreview) : memeTemplateUrl;

  // Your uploaded photo first, then the faces from our meme templates.
  const faces = [
    ...(customFace ? [{ id: customFace.id, name: customFace.name, label: 'Yours', src: customFace.dataUrl }] : []),
    ...TEMPLATE_FACES.map((f) => ({ id: f.src, name: f.name, label: f.label, src: f.src })),
  ];
  const picked = faces.find((f) => f.id === selectedPresetId);
  const pickedName = picked ? (picked.id === customFace?.id ? 'Your photo' : picked.label) : faceName;

  const pickFace = (face) => {
    if (face.id === selectedPresetId) return;
    clearResult();
    setSelectedPresetId(face.id);
    setSelectedImageSrc(face.src);
    setFaceName(face.name);
  };
  const pickTarget = (all, index) => {
    clearResult();
    setSwapAllFaces(all);
    setSelectedTargetIndex(index);
  };

  const retry = () => {
    if (isNeuralAvailable) runNeuralFaceSwap(selectedImageSrc);
    else setServerCheck((n) => n + 1);
  };

  // The one main button: Swap face runs the swap (nothing runs before), then Apply to meme keeps it.
  const main = hasResult
    ? { label: 'Apply to meme', Icon: Check, onClick: handleApply, disabled: isNeuralProcessing }
    : {
      label: isNeuralProcessing ? 'Swapping…' : 'Swap face',
      Icon: isNeuralProcessing ? LoaderCircle : Sparkles,
      onClick: () => runNeuralFaceSwap(selectedImageSrc),
      disabled: isNeuralProcessing || !isNeuralAvailable || !selectedImageSrc,
    };

  const holdProps = {
    onPointerDown: handleStartComparing,
    onPointerUp: handleStopComparing,
    onPointerLeave: handleStopComparing,
    onPointerCancel: handleStopComparing,
    onTouchStart: handleStartComparing,
    onTouchEnd: handleStopComparing,
    onTouchCancel: handleStopComparing,
    onContextMenu: (e) => e.preventDefault(),
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Face Swap"
      className="fmm-sheet"
      badge={targetLabel ? <span className="fmm-badge">{targetLabel}</span> : null}
      maxHeight="88vh"
      contentStyle={{ padding: '2px 16px 14px', gap: '20px' }}
      footer={
        <div className="fmm-foot">
          <button type="button" className="fmm-btn" onClick={onClose}>Cancel</button>
          <button type="button" className={`fmm-btn fmm-btn--accent${isNeuralProcessing ? ' is-busy' : ''}`} onClick={main.onClick} disabled={main.disabled}>
            <main.Icon size={17} strokeWidth={2.4} aria-hidden="true" />
            {main.label}
          </button>
        </div>
      }
    >
      {/* The meme, then the swap on it: a scrim and spinner while it runs, or what went wrong. */}
      <div className={`fmm-stage${hasResult ? ' has-result' : ''}`}>
        {currentPreview && <img className="fmm-stage-img" src={currentPreview} alt={hasResult && !isComparing ? 'Swapped face' : 'The meme'} />}

        {isNeuralProcessing ? (
          <div className="fmm-stage-msg fmm-stage-msg--over" role="status">
            <LoaderCircle size={26} className="fmm-spin" aria-hidden="true" />
            <span className="fmm-stage-title">Swapping in {pickedName}…</span>
            <span className="fmm-stage-sub">This can take a few seconds.</span>
          </div>
        ) : neuralError ? (
          <div className="fmm-stage-msg fmm-stage-msg--over" role="alert">
            <span className="fmm-stage-icon" aria-hidden="true">
              {isNeuralAvailable ? <AlertCircle size={20} /> : <CloudOff size={20} />}
            </span>
            <span className="fmm-stage-title">{isNeuralAvailable ? 'That face didn’t swap' : 'Face swap is offline'}</span>
            <span className="fmm-stage-sub">{neuralError}</span>
            <button type="button" className="fmm-retry" onClick={retry}>
              <RefreshCw size={14} strokeWidth={2.3} aria-hidden="true" />
              Try again
            </button>
          </div>
        ) : hasResult ? (
          <>
            <button type="button" className={`fmm-compare${isComparing ? ' is-on' : ''}`} {...holdProps}>
              <Eye size={14} strokeWidth={2.3} aria-hidden="true" />
              {isComparing ? 'Original' : 'Hold to compare'}
            </button>
            <div className="fmm-zoom" role="radiogroup" aria-label="Preview">
              {[['crop', 'Face'], ['full', 'Full']].map(([id, label]) => (
                <button key={id} type="button" role="radio" aria-checked={previewType === id} className={previewType === id ? 'is-on' : ''} onClick={() => setPreviewType(id)}>
                  {label}
                </button>
              ))}
            </div>
          </>
        ) : picked ? (
          // Before the swap: who goes onto the meme.
          <span className="fmm-going-in">
            <img src={picked.src} alt="" draggable={false} />
            <span>{pickedName}</span>
            <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
            <span className="fmm-going-in-dim">this meme</span>
          </span>
        ) : null}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} hidden />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="user" onChange={handleFileUpload} hidden />

      {/* Faces: bring your own (upload or selfie), or a meme face */}
      <section className="fmm-section">
        <div className="fmm-section-head">
          <span className="fmm-label">Face</span>
          <span className="fmm-picked">{pickedName}</span>
        </div>
        <div className="fmm-faces">
          <button type="button" className="fmm-face fmm-face--add" onClick={() => fileInputRef.current?.click()}>
            <span className="fmm-face-img"><Upload size={20} strokeWidth={2.1} aria-hidden="true" /></span>
            <span className="fmm-face-name">Upload</span>
          </button>
          <button type="button" className="fmm-face fmm-face--add" onClick={() => cameraInputRef.current?.click()}>
            <span className="fmm-face-img"><Camera size={20} strokeWidth={2.1} aria-hidden="true" /></span>
            <span className="fmm-face-name">Selfie</span>
          </button>
          <span className="fmm-faces-rule" aria-hidden="true" />
          <div className="fmm-faces-list" role="radiogroup" aria-label="Faces">
            {faces.map((face) => {
              const on = selectedPresetId === face.id;
              return (
                <button
                  key={face.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={face.name}
                  title={face.name}
                  className={`fmm-face${on ? ' is-on' : ''}`}
                  onClick={() => pickFace(face)}
                >
                  <span className="fmm-face-img"><img src={face.src} alt="" draggable={false} /></span>
                  <span className="fmm-face-name">{face.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* More than one face in the meme: swap them all, or just one */}
      {detectedFaces.length > 1 && (
        <section className="fmm-section">
          <div className="fmm-section-head">
            <span className="fmm-label">Swap on</span>
          </div>
          <div className="fmm-seg" role="radiogroup" aria-label="Faces in the meme">
            <button type="button" role="radio" aria-checked={swapAllFaces} className={swapAllFaces ? 'is-on' : ''} onClick={() => pickTarget(true, null)}>
              All faces
            </button>
            {detectedFaces.map((f, i) => {
              const on = !swapAllFaces && selectedTargetIndex === f.index;
              return (
                <button key={f.index} type="button" role="radio" aria-checked={on} className={on ? 'is-on' : ''} onClick={() => pickTarget(false, f.index)}>
                  Face {i + 1}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </BottomSheet>
  );
}
