import { paintImageLayer } from './paintImageLayer';
import { paintSticker } from './paintSticker';
import { paintCaption } from './paintCaption';

export function paintLayers({
  activeLayerId, baseImgRef, canvas, captions, dragTarget,
  getCaptionCenterY, getImageLayerCenterY, getStickerCenterY, imageCacheRef, imageLayers,
  isDragging, isDrawingMode, loadingMediaRef, renderCanvas, stickers, targetCtx
}) {
  let activeHandleDrawer = null;
  const setActiveHandleDrawer = (drawer) => { activeHandleDrawer = drawer; };

  // Reset filter for text/stickers/image-layers overlay (safe on all browsers)
  try { targetCtx.filter = 'none'; } catch { /* unsupported */ }

  // Render Custom Image Overlay Layers
  const allLayers = [
    ...(imageLayers || []).map(l => ({ ...l, _type: 'imageLayer', zIndex: l.zIndex || 0 })),
    ...(stickers || []).map(l => ({ ...l, _type: 'sticker', zIndex: l.zIndex || 0 })),
    ...(captions || []).map(l => ({ ...l, _type: 'caption', zIndex: l.zIndex || 0 }))
  ];

  allLayers.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  allLayers.forEach((layer) => {
    if (layer.hidden) return;
    if (layer._type === 'imageLayer') {
      paintImageLayer({
        activeLayerId, baseImgRef, canvas, getImageLayerCenterY, imageCacheRef, isDrawingMode,
        layer, renderCanvas, setActiveHandleDrawer, targetCtx
      });
    } else if (layer._type === 'sticker') {
      paintSticker({
        activeLayerId, baseImgRef, canvas, getStickerCenterY, imageCacheRef, isDrawingMode, layer,
        loadingMediaRef, renderCanvas, setActiveHandleDrawer, targetCtx
      });
    } else if (layer._type === 'caption') {
      paintCaption({
        activeLayerId, canvas, dragTarget, getCaptionCenterY, isDragging, isDrawingMode, layer,
        setActiveHandleDrawer, targetCtx
      });
    }
  });

  return activeHandleDrawer;
}
