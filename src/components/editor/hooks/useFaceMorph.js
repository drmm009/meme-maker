import { useState, useRef } from 'react';
// The face engine (and its mesh libraries) loads on the first face swap.
const loadFaceGraft = () => import('../../../utils/faceGraftEngine');
import { useMemeEditorStore } from '../store/useMemeEditorStore';

// Face swap / morph: on an image layer or sticker, or on the template's face.
export function useFaceMorph({ canvasRef }) {
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);
  const setImageLayers = useMemeEditorStore((s) => s.setImageLayers);
  const stickers = useMemeEditorStore((s) => s.stickers);
  const setStickers = useMemeEditorStore((s) => s.setStickers);
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);
  const activeTemplate = useMemeEditorStore((s) => s.activeTemplate);
  const setActiveTemplate = useMemeEditorStore((s) => s.setActiveTemplate);
  const templateFaceMorph = useMemeEditorStore((s) => s.templateFaceMorph);
  const setTemplateFaceMorph = useMemeEditorStore((s) => s.setTemplateFaceMorph);
  const pushHistory = useMemeEditorStore((s) => s.pushHistory);

  const activeImageLayer = imageLayers.find((i) => i.id === activeLayerId);
  const activeSticker = stickers.find((s) => s.id === activeLayerId);

  const [showFaceMorphModal, setShowFaceMorphModal] = useState(false);
  const [morphTargetLayerId, setMorphTargetLayerId] = useState(null);
  const [morphTargetUrl, setMorphTargetUrl] = useState(null);
  const [isPinpointingFace, setIsPinpointingFace] = useState(false);
  const [faceTarget, setFaceTarget] = useState({ x: 0.5, y: 0.38, radius: 0.14 });
  const [sampledFaceLighting, setSampledFaceLighting] = useState(null);
  const [extractedMemeFace, setExtractedMemeFace] = useState(null);
  const [isHoldingCanvasCompare, setIsHoldingCanvasCompare] = useState(false);
  const originalTemplateImgRef = useRef(null);

  const handleStartMorphFace = (explicitTarget = null) => {
    // 1. Identify if a target layer was explicitly passed, or if activeImageLayer / activeSticker is selected
    // Note: React onClick passes a SyntheticEvent (which has nativeEvent/dispatchConfig), so ignore SyntheticEvents!
    let targetLayer = null;
    if (explicitTarget && typeof explicitTarget === 'object' && ('url' in explicitTarget || 'src' in explicitTarget) && !('nativeEvent' in explicitTarget)) {
      targetLayer = explicitTarget;
    } else if (activeImageLayer && (activeImageLayer.url || activeImageLayer.src)) {
      targetLayer = activeImageLayer;
    } else if (activeSticker && (activeSticker.url || activeSticker.src)) {
      targetLayer = activeSticker;
    }

    if (targetLayer) {
      const url = targetLayer.url || targetLayer.src;
      if (url) {
        setMorphTargetLayerId(targetLayer.id);
        setMorphTargetUrl(url);
        setSampledFaceLighting(null);
        setExtractedMemeFace(null);
        setShowFaceMorphModal(true);
        return;
      }
    }

    // 2. Fallback: Targeting background meme template
    setMorphTargetLayerId(null);
    setMorphTargetUrl(null);
    setActiveLayerId(null);
    let lighting = null;
    let patch = null;
    if (canvasRef.current?.sampleFaceLighting) {
      lighting = canvasRef.current.sampleFaceLighting(faceTarget.x, faceTarget.y, faceTarget.radius);
      setSampledFaceLighting(lighting);
    }
    if (canvasRef.current?.extractFacePatch) {
      patch = canvasRef.current.extractFacePatch(faceTarget.x, faceTarget.y, faceTarget.radius, 400);
      setExtractedMemeFace(patch);
    }
    setShowFaceMorphModal(true);
  };

  const handleConfirmPinpoint = () => {
    setActiveLayerId(null);
    setIsPinpointingFace(false);
    let lighting = null;
    let patch = null;
    if (canvasRef.current?.sampleFaceLighting) {
      lighting = canvasRef.current.sampleFaceLighting(faceTarget.x, faceTarget.y, faceTarget.radius);
      setSampledFaceLighting(lighting);
    }
    if (canvasRef.current?.extractFacePatch) {
      patch = canvasRef.current.extractFacePatch(faceTarget.x, faceTarget.y, faceTarget.radius, 400);
      setExtractedMemeFace(patch);
    }
    setShowFaceMorphModal(true);
  };

  const handleApplyFaceMorph = async ({
    url,
    originalFaceUrl,
    faceName,
    flipX,
    brightness,
    contrast,
    warmth,
    morphProgress,
    landmarksA,
    landmarksB,
    triangles,
    isNeuralSwap,
    neuralSwappedFullImage
  }) => {
    setShowFaceMorphModal(false);

    // CASE 1: Swapping an image layer or graphic sticker on top of canvas
    if (morphTargetLayerId) {
      const swappedResultUrl = neuralSwappedFullImage || url;
      if (swappedResultUrl) {
        let origUrl = null;
        let nextImgLayers = imageLayers;
        let nextStickers = stickers;
        const isImg = imageLayers.some(l => l.id === morphTargetLayerId);
        if (isImg) {
          nextImgLayers = imageLayers.map((l) => {
            if (l.id === morphTargetLayerId) {
              origUrl = l.originalUrl || l.url;
              return {
                ...l,
                url: swappedResultUrl,
                originalUrl: origUrl
              };
            }
            return l;
          });
          setImageLayers(nextImgLayers);
        } else {
          nextStickers = stickers.map((s) => {
            if (s.id === morphTargetLayerId) {
              origUrl = s.originalUrl || s.url;
              return {
                ...s,
                url: swappedResultUrl,
                originalUrl: origUrl
              };
            }
            return s;
          });
          setStickers(nextStickers);
        }

        const morphState = {
          isLayerSwap: true,
          layerId: morphTargetLayerId,
          cleanOriginalUrl: origUrl,
          photoUrl: originalFaceUrl || url,
          faceName: faceName || 'Face Swap'
        };
        setTemplateFaceMorph(morphState);
        setActiveLayerId(null);
        pushHistory();
      }
      setMorphTargetLayerId(null);
      setMorphTargetUrl(null);
      return;
    }

    // CASE 2: Swapping background meme template
    const cleanOriginalUrl = (originalTemplateImgRef.current && !originalTemplateImgRef.current.startsWith('data:'))
      ? originalTemplateImgRef.current
      : (activeTemplate?.originalUrl || (activeTemplate?.imageUrl && !activeTemplate.imageUrl.startsWith('data:') ? activeTemplate.imageUrl : null) || activeTemplate?.imageUrl);
    
    if (!originalTemplateImgRef.current || originalTemplateImgRef.current.startsWith('data:')) {
      originalTemplateImgRef.current = cleanOriginalUrl;
    }

    if (isNeuralSwap && neuralSwappedFullImage) {
      setActiveTemplate(prev => ({
        ...prev,
        rawImageUrl: neuralSwappedFullImage,
        imageUrl: neuralSwappedFullImage,
        originalUrl: prev?.originalUrl || cleanOriginalUrl
      }));

      const morphState = {
        faceTarget: { ...faceTarget },
        photoUrl: originalFaceUrl || url,
        originalFaceUrl: originalFaceUrl || url,
        faceName: faceName || 'AI Neural Swap',
        morphProgress: 1.0,
        warmth: 0,
        brightness: 100,
        contrast: 100,
        flipX: false,
        cleanOriginalUrl,
        isNeuralSwap: true
      };

      setTemplateFaceMorph(morphState);
      setActiveLayerId(null);
      pushHistory();
      return;
    }

    const baseImg = cleanOriginalUrl;

    const { fuseFaceIntoTemplate } = await loadFaceGraft();
    const fusedDataUrl = await fuseFaceIntoTemplate({
      baseImg,
      faceTarget,
      photoImg: originalFaceUrl || url,
      morphedPatch: url,
      landmarksA,
      landmarksB,
      triangles,
      morphProgress: morphProgress !== undefined ? morphProgress : 0.85,
      warmth: warmth || 0,
      brightness: brightness || 0,
      flipX: !!flipX
    });

    if (fusedDataUrl) {
      setActiveTemplate(prev => ({
        ...prev,
        rawImageUrl: fusedDataUrl,
        imageUrl: fusedDataUrl,
        originalUrl: prev?.originalUrl || cleanOriginalUrl
      }));

      const morphState = {
        faceTarget: { ...faceTarget },
        photoUrl: url || originalFaceUrl,
        originalFaceUrl: originalFaceUrl || url,
        faceName: faceName || 'Face Morph',
        morphProgress: morphProgress !== undefined ? morphProgress : 0.85,
        warmth: warmth || 0,
        brightness: brightness || 0,
        contrast: contrast || 100,
        flipX: !!flipX,
        cleanOriginalUrl,
        landmarksA,
        landmarksB,
        triangles
      };

      setTemplateFaceMorph(morphState);
      setActiveLayerId(null);
      pushHistory();
    }
  };

  const handleUpdateTemplateMorphProgress = async (newVal) => {
    if (!templateFaceMorph) return;
    const progress = Math.max(0, Math.min(1, newVal));
    setTemplateFaceMorph(prev => ({ ...prev, morphProgress: progress }));

    const cleanUrl = templateFaceMorph.cleanOriginalUrl || activeTemplate?.originalUrl;
    const { fuseFaceIntoTemplate } = await loadFaceGraft();
    const fusedDataUrl = await fuseFaceIntoTemplate({
      baseImg: cleanUrl,
      faceTarget: templateFaceMorph.faceTarget,
      photoImg: templateFaceMorph.originalFaceUrl || templateFaceMorph.photoUrl,
      landmarksA: templateFaceMorph.landmarksA,
      landmarksB: templateFaceMorph.landmarksB,
      triangles: templateFaceMorph.triangles,
      morphProgress: progress,
      warmth: templateFaceMorph.warmth || 0,
      brightness: templateFaceMorph.brightness || 0,
      flipX: templateFaceMorph.flipX
    });

    if (fusedDataUrl) {
      setActiveTemplate(prev => ({
        ...prev,
        rawImageUrl: fusedDataUrl,
        imageUrl: fusedDataUrl,
        originalUrl: prev?.originalUrl || cleanUrl
      }));
    }
  };

  const handleChangeFace = () => {
    if (templateFaceMorph?.isLayerSwap) {
      const target = imageLayers.find(l => l.id === templateFaceMorph.layerId) || stickers.find(s => s.id === templateFaceMorph.layerId);
      if (target) {
        handleStartMorphFace(target);
        return;
      }
    }
    setShowFaceMorphModal(true);
  };

  const handleRevertTemplateFace = () => {
    if (!templateFaceMorph) return;
    if (templateFaceMorph.isLayerSwap) {
      const cleanUrl = templateFaceMorph.cleanOriginalUrl;
      let nextImgs = imageLayers;
      let nextStks = stickers;
      if (cleanUrl) {
        nextImgs = imageLayers.map(l => l.id === templateFaceMorph.layerId ? { ...l, url: cleanUrl } : l);
        nextStks = stickers.map(s => s.id === templateFaceMorph.layerId ? { ...s, url: cleanUrl } : s);
        setImageLayers(nextImgs);
        setStickers(nextStks);
      }
      setTemplateFaceMorph(null);
      pushHistory();
      return;
    }
    const cleanUrl = templateFaceMorph.cleanOriginalUrl || activeTemplate?.originalUrl;
    if (cleanUrl) {
      setActiveTemplate(prev => ({
        ...prev,
        rawImageUrl: cleanUrl,
        imageUrl: cleanUrl,
        originalUrl: null
      }));
    }
    setTemplateFaceMorph(null);
    pushHistory();
  };

  const handleFinalizeTemplateFace = () => {
    if (templateFaceMorph?.isLayerSwap) {
      setTemplateFaceMorph(null);
      pushHistory();
      return;
    }
    setActiveTemplate(prev => ({
      ...prev,
      originalUrl: null
    }));
    setTemplateFaceMorph(null);
    pushHistory();
  };

  return {
    showFaceMorphModal,
    setShowFaceMorphModal,
    morphTargetLayerId,
    setMorphTargetLayerId,
    morphTargetUrl,
    setMorphTargetUrl,
    isPinpointingFace,
    setIsPinpointingFace,
    faceTarget,
    setFaceTarget,
    sampledFaceLighting,
    extractedMemeFace,
    isHoldingCanvasCompare,
    setIsHoldingCanvasCompare,
    originalTemplateImgRef,
    handleStartMorphFace,
    handleConfirmPinpoint,
    handleApplyFaceMorph,
    handleUpdateTemplateMorphProgress,
    handleChangeFace,
    handleRevertTemplateFace,
    handleFinalizeTemplateFace,
  };
}
