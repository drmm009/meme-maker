import { blobToDataURL } from '../../../utils/galleryStore';
import { getNonOverlappingPosition } from '../../../utils/captionLayout';
import { isSocialCardCaption, isVideoUrl } from '../memeEditorUtils';
import { useMemeEditorStore, useMemeEditorStoreApi } from '../store/useMemeEditorStore';
import { useEditorUiStore, useEditorUiStoreApi } from '../store/useEditorUiStore';
import { duplicateDrawing, isDragDrawing } from '../../canvas/interaction/drawingHits';
import { fitLayerScale, panelPlacement } from '../../canvas/interaction/layerBoxes';
import { inPanel, panelRects } from '../../canvas/layout/panels';
import { emptyPanelOf, newLayerPosition } from './newLayerPosition';

// A picture's natural size, or null if it can't be read (a video, a broken link) within a moment.
const naturalSize = (src) => new Promise((resolve) => {
  if (typeof Image === 'undefined') { resolve(null); return; }
  const img = new Image();
  const done = (v) => { clearTimeout(timer); resolve(v); };
  const timer = setTimeout(() => done(null), 4000);
  img.onload = () => done(img.naturalWidth && img.naturalHeight ? { w: img.naturalWidth, h: img.naturalHeight } : null);
  img.onerror = () => done(null);
  img.src = src;
});

export { firstEmptyPanel } from './newLayerPosition';

export function useLayerActions({ activeCaption, activeImageLayer, activeSticker, updateActiveCaptionProps, canvasRef }) {
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const stickers = useMemeEditorStore((s) => s.stickers);
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);
  const setStickers = useMemeEditorStore((s) => s.setStickers);
  const pushHistory = useMemeEditorStore((s) => s.pushHistory);
  const setImageLayers = useMemeEditorStore((s) => s.setImageLayers);
  const captions = useMemeEditorStore((s) => s.captions);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);
  const setActiveTab = useEditorUiStore((s) => s.setActiveTab);
  const setPendingVideoLayer = useEditorUiStore((s) => s.setPendingVideoLayer);
  const setCaptions = useMemeEditorStore((s) => s.setCaptions);
  const pushHistoryDebounced = useMemeEditorStore((s) => s.pushHistoryDebounced);
  const slotTransforms = useMemeEditorStore((s) => s.slotTransforms);
  const setSlotTransforms = useMemeEditorStore((s) => s.setSlotTransforms);
  const drawings = useMemeEditorStore((s) => s.drawings);
  const setDrawings = useMemeEditorStore((s) => s.setDrawings);
  // Read at the moment of adding (a panel's card sets the target just before).
  const uiApi = useEditorUiStoreApi();
  const docApi = useMemeEditorStoreApi();

  // Horizontal Flip / Mirror for Stickers & Media Overlays
  const handleFlipActiveLayer = () => {
    if (!activeLayerId) return;
    const isStk = stickers.some(s => s.id === activeLayerId);
    const isImg = (imageLayers || []).some(i => i.id === activeLayerId);

    if (isStk) {
      const nextStks = stickers.map(s => s.id === activeLayerId ? { ...s, flipX: !s.flipX } : s);
      setStickers(nextStks);
      pushHistory();
    } else if (isImg) {
      const nextImgs = (imageLayers || []).map(i => i.id === activeLayerId ? { ...i, flipX: !i.flipX } : i);
      setImageLayers(nextImgs);
      pushHistory();
    }
  };

  // A photo, template or clip as a layer. A picture fits the canvas's image area whole, centred, or a
  // multi-panel layout's `panel` (its rectangle, fractions of the image area: layout/panels), centred
  // in it (its size is read first); one whose size can't be read comes in at the old default, beside
  // the others.
  const commitAddImageLayer = async (src, trimStart, trimEnd, target = null) => {
    // In a grid layout a photo with no panel named goes into the first empty one (else the canvas).
    const panel = target || emptyPanelOf(docApi.getState());
    const area = canvasRef?.current?.imageArea;
    const size = area ? await naturalSize(src) : null;
    const box = panel && area ? { w: panel.width * area.w, h: panel.height * area.h } : area;
    const pos = size
      ? (panel ? { x: panel.x + panel.width / 2, y: panel.y + panel.height / 2 } : { x: 0.5, y: 0.5 })
      : getNonOverlappingPosition('image', captions, stickers, imageLayers);
    const maxZ = Math.max(-1, ...captions.map(c => c.zIndex ?? -1), ...stickers.map(s => s.zIndex ?? -1), ...(imageLayers || []).map(i => i.zIndex ?? -1));
    // A fitted picture covers the canvas, so it goes under the text (as a meme's picture is);
    // otherwise on top, as before.
    const minCapZ = captions.length ? Math.min(...captions.map(c => c.zIndex ?? 0)) : null;
    const zIndex = size && minCapZ !== null ? minCapZ - 1 : maxZ + 1;
    const newImgLayer = {
      id: `img-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      url: src,
      x: pos.x,
      y: pos.y,
      scale: size ? fitLayerScale(size, box) : 1.5,
      rotation: 0,
      fitMode: 'stretch',
      zIndex,
      ...(trimStart !== undefined ? { trimStart } : {}),
      ...(trimEnd !== undefined ? { trimEnd } : {})
    };
    // The list as it is now (the size was read after a wait).
    setImageLayers((prev) => [...(prev || []), newImgLayer]);
    setActiveLayerId(newImgLayer.id);
    setActiveTab('images');
    pushHistory();
  };

  // A grid layout's Fit / Fill / Stretch for the selected photo: the whole picture inside its panel,
  // the panel covered exactly (the picture cropped to its shape), or the whole picture pulled to the
  // panel's shape; centred. Its panel is the one its middle
  // is in (else the nearest).
  const handleFitImageToPanel = async (mode) => {
    const { activeLayerId: id, imageLayers: layers, activeTemplate } = docApi.getState();
    const layer = (layers || []).find((l) => l.id === id);
    const area = canvasRef?.current?.imageArea;
    const rects = panelRects(activeTemplate?.layoutDef);
    if (!layer || !area || !rects.length) return;
    const x = layer.x ?? 0.5;
    const y = layer.y ?? 0.5;
    const centre = (r) => [r.x + r.width / 2, r.y + r.height / 2];
    const panel = rects.find((r) => inPanel(r, x, y))
      || rects.reduce((a, b) => (Math.hypot(...centre(a).map((v, i) => v - [x, y][i])) <= Math.hypot(...centre(b).map((v, i) => v - [x, y][i])) ? a : b));
    const size = await naturalSize(layer.url);
    if (!size) return;
    const patch = panelPlacement(size, { w: panel.width * area.w, h: panel.height * area.h }, mode);
    const [px, py] = centre(panel);
    setImageLayers((prev) => (prev || []).map((l) => (l.id === layer.id ? { ...l, ...patch, x: px, y: py } : l)));
    pushHistory();
  };

  const handleAddImageLayer = (src) => {
    // From a panel's start card (Add photo or Templates): a layer fitted inside that panel.
    const target = uiApi.getState().panelTarget;
    if (target !== null && target !== undefined && !isVideoUrl(src)) {
      uiApi.getState().setPanelTarget(null);
      const panel = panelRects(docApi.getState().activeTemplate?.layoutDef)[target] || null;
      commitAddImageLayer(src, undefined, undefined, panel);
      return;
    }
    if (isVideoUrl(src)) {
      setPendingVideoLayer(src);
    } else {
      commitAddImageLayer(src);
    }
  };

  const handleFileUploadImageLayer = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await blobToDataURL(file);
      handleAddImageLayer(url);
    } catch (err) {
      console.error('Failed to read image file:', err);
    } finally {
      e.target.value = '';
    }
  };

  const updateActiveImageLayer = (key, value) => {
    if (!activeLayerId) return;
    const nextImgLayers = imageLayers.map((layer) => {
      if (layer.id === activeLayerId) {
        if (typeof key === 'object') {
          return { ...layer, ...key };
        }
        return { ...layer, [key]: value };
      }
      return layer;
    });
    setImageLayers(nextImgLayers);
    pushHistory();
  };

  // Get all layers sorted in ascending visual stack order (0 = back, length-1 = front)
  const getOrderedLayers = (caps = captions, stks = stickers, imgs = imageLayers) => {
    const list = [
      ...(imgs || []).map(l => ({ ...l, _type: 'imageLayer', zIndex: l.zIndex ?? 0 })),
      ...(stks || []).map(s => ({ ...s, _type: 'sticker', zIndex: s.zIndex ?? 0 })),
      ...(caps || []).map(c => ({ ...c, _type: 'caption', zIndex: c.zIndex ?? 0 }))
    ];
    list.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    return list;
  };

  // Re-indexes list and applies state + history
  const commitLayerStack = (orderedList) => {
    orderedList.forEach((item, index) => {
      item.zIndex = index;
    });

    const nextCaps = orderedList.filter(i => i._type === 'caption').map(({ _type, ...rest }) => rest);
    const nextStks = orderedList.filter(i => i._type === 'sticker').map(({ _type, ...rest }) => rest);
    const nextImgs = orderedList.filter(i => i._type === 'imageLayer').map(({ _type, ...rest }) => rest);

    setCaptions(nextCaps);
    setStickers(nextStks);
    setImageLayers(nextImgs);
    pushHistory();
  };

  const moveLayer = (id, action) => {
    if (!id) return;
    const list = getOrderedLayers();
    const idx = list.findIndex(i => i.id === id);
    if (idx === -1) return;

    if (action === 'forward') {
      if (idx >= list.length - 1) return;
      const temp = list[idx];
      list[idx] = list[idx + 1];
      list[idx + 1] = temp;
    } else if (action === 'backward') {
      if (idx <= 0) return;
      const temp = list[idx];
      list[idx] = list[idx - 1];
      list[idx - 1] = temp;
    } else if (action === 'front') {
      if (idx >= list.length - 1) return;
      const [item] = list.splice(idx, 1);
      list.push(item);
    } else if (action === 'back') {
      if (idx <= 0) return;
      const [item] = list.splice(idx, 1);
      list.unshift(item);
    }

    commitLayerStack(list);
  };

        const handleDeleteLayer = (targetId) => {
    const idToDelete = (typeof targetId === 'string' && targetId) ? targetId : activeLayerId;
    if (!idToDelete) return;
    // A shape or censor region.
    if ((drawings || []).some((d) => d.id === idToDelete)) {
      setDrawings(drawings.filter((d) => d.id !== idToDelete));
      if (activeLayerId === idToDelete) setActiveLayerId(null);
      pushHistory();
      return;
    }
    // Header and footer bands are part of the canvas: deleting the text in one leaves the band
    // (it is switched off from Canvas > Header / Footer).
    if (activeLayerId === idToDelete) {
      const prevSticker = stickers.find((s) => s.id === idToDelete);
      const prevCaption = captions.find((c) => c.id === idToDelete);
      const prevImg = imageLayers.find((img) => img.id === idToDelete);
      if (prevSticker || (prevCaption && isSocialCardCaption(prevCaption)) || prevImg) {
        setActiveTab('images');
      }
      setActiveLayerId(null);
    }
    const list = getOrderedLayers().filter(i => i.id !== idToDelete);
    commitLayerStack(list);
  };

  const handleDuplicateLayer = (targetId) => {
    const idToDup = (typeof targetId === 'string' && targetId) ? targetId : activeLayerId;
    if (!idToDup) return;
    // A shape or censor region: the copy goes on top.
    const drawing = (drawings || []).find((d) => d.id === idToDup && isDragDrawing(d));
    if (drawing) {
      const newId = `${drawing.type}-${Date.now()}`;
      setDrawings([...drawings, duplicateDrawing(drawing, newId)]);
      setActiveLayerId(newId);
      pushHistory();
      return;
    }
    const list = getOrderedLayers();
    const idx = list.findIndex(i => i.id === idToDup);
    if (idx === -1) return;

    const source = list[idx];
    const newId = `${source._type === 'caption' ? 'cap' : source._type === 'sticker' ? 'stk' : 'img'}-${Date.now()}`;
    const clone = {
      ...source,
      id: newId,
      x: Math.min(0.9, (source.x || 0.5) + 0.04),
      y: Math.min(0.9, (source.y || 0.5) + 0.04)
    };

    list.splice(idx + 1, 0, clone);
    commitLayerStack(list);
    setActiveLayerId(newId);
  };

  const handleRotateLayer = () => {
    if (activeCaption) {
      const nextRot = ((activeCaption.rotation || 0) + 90) % 360;
      updateActiveCaptionProps({ rotation: nextRot });
    } else if (activeSticker) {
      handleRotateSticker();
    } else if (activeImageLayer) {
      handleRotateImageLayer();
    }
  };

  const handleRotateImageLayer = () => {
    if (!activeImageLayer) return;
    const nextRot = ((activeImageLayer.rotation || 0) + 90) % 360;
    const nextImg = imageLayers.map(l => l.id === activeImageLayer.id ? { ...l, rotation: nextRot } : l);
    setImageLayers(nextImg);
    pushHistoryDebounced();
  };

  const handleRotateSticker = () => {
    if (!activeSticker) return;
    const nextRot = ((activeSticker.rotation || 0) + 90) % 360;
    const nextStickers = stickers.map(s => s.id === activeSticker.id ? { ...s, rotation: nextRot } : s);
    setStickers(nextStickers);
    pushHistoryDebounced();
  };

  const handleToggleDieCutSticker = (color = '#ffffff') => {
    if (activeSticker) {
      const nextDieCut = !activeSticker.dieCut;
      const nextStickers = stickers.map(s => s.id === activeSticker.id ? {
        ...s,
        dieCut: nextDieCut,
        dieCutColor: s.dieCutColor || color,
        dieCutWidth: s.dieCutWidth || 6
      } : s);
      setStickers(nextStickers);
      pushHistory();
    } else if (activeImageLayer) {
      const nextDieCut = !activeImageLayer.dieCut;
      const nextImg = imageLayers.map(l => l.id === activeImageLayer.id ? {
        ...l,
        dieCut: nextDieCut,
        dieCutColor: l.dieCutColor || color,
        dieCutWidth: l.dieCutWidth || 6
      } : l);
      setImageLayers(nextImg);
      pushHistory();
    }
  };

  const handleSetDieCutColor = (color) => {
    if (activeSticker) {
      const nextStickers = stickers.map(s => s.id === activeSticker.id ? {
        ...s,
        dieCut: true,
        dieCutColor: color
      } : s);
      setStickers(nextStickers);
      pushHistoryDebounced();
    } else if (activeImageLayer) {
      const nextImg = imageLayers.map(l => l.id === activeImageLayer.id ? {
        ...l,
        dieCut: true,
        dieCutColor: color
      } : l);
      setImageLayers(nextImg);
      pushHistoryDebounced();
    }
  };

    const updateSlotTransform = (slotIndex, updateFn) => {
    const nextTransforms = [...slotTransforms];
    const prev = nextTransforms[slotIndex] || { offsetX: 0, offsetY: 0, scale: 1.5 };
    nextTransforms[slotIndex] = updateFn(prev);
    setSlotTransforms(nextTransforms);
    // Called on every move of a pan or pinch: one undo step once it stops.
    pushHistoryDebounced();
  };

    // Emoji & Sticker Handlers
  const handleAddSticker = (stickerObj) => {
    const pos = newLayerPosition('sticker', docApi.getState());
    const maxZ = Math.max(-1, ...captions.map(c => c.zIndex ?? -1), ...stickers.map(s => s.zIndex ?? -1), ...(imageLayers || []).map(i => i.zIndex ?? -1));
    const newSticker = {
      id: `stk-${Date.now()}`,
      emoji: stickerObj.emoji,
      x: pos.x,
      y: pos.y,
      scale: 2.5,
      rotation: 0,
      zIndex: maxZ + 1
    };
    const nextStickers = [...stickers, newSticker];
    setStickers(nextStickers);
    setActiveLayerId(newSticker.id);
    setActiveTab('images');
    pushHistory();
  };

  const handleAddGraphicSticker = (stickerObj) => {
    const pos = newLayerPosition('sticker', docApi.getState());
    const maxZ = Math.max(-1, ...captions.map(c => c.zIndex ?? -1), ...stickers.map(s => s.zIndex ?? -1), ...(imageLayers || []).map(i => i.zIndex ?? -1));
    const newSticker = {
      id: `stk-graphic-${Date.now()}`,
      name: stickerObj.name,
      url: stickerObj.url,
      x: pos.x,
      y: pos.y,
      scale: 2.2,
      rotation: 0,
      zIndex: maxZ + 1
    };
    const nextStickers = [...stickers, newSticker];
    setStickers(nextStickers);
    setActiveLayerId(newSticker.id);
    setActiveTab('images');
    pushHistory();
  };

  return { commitAddImageLayer, handleAddImageLayer, handleFileUploadImageLayer, handleFitImageToPanel, updateActiveImageLayer, moveLayer, handleDeleteLayer, handleDuplicateLayer, handleRotateLayer, handleFlipActiveLayer, handleToggleDieCutSticker, handleSetDieCutColor, updateSlotTransform, handleAddSticker, handleAddGraphicSticker };
}
