// The image editor's document: the layers over the meme image and how they're placed.
// x is a fraction (0..1) of the canvas width and y a fraction of the image area's height (the area
// below any header band); both mark the layer's centre. Box sizes and handles are in canvas pixels.

import type { LayerLook } from '../components/canvas/draw/layerLook';

interface MemeLayerBase {
  id: string;
  x: number;
  y: number;
  // Degrees, clockwise, about the layer's centre.
  rotation?: number;
  zIndex?: number;
  hidden?: boolean;
  locked?: boolean;
  flipX?: boolean;
  flipY?: boolean;
  // 0..1
  opacity?: number;
}

export interface MemeCaption extends MemeLayerBase {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  stroke?: string;
  strokeWidth?: number;
  align?: 'left' | 'center' | 'right';
  // Wrap width as a fraction of the canvas width; with hasCustomWidth the box is at least that wide.
  width?: number;
  hasCustomWidth?: boolean;
  bgColor?: string;
  bgStyle?: 'box' | 'banner';
  bubbleStyle?: string;
  curve?: number;
  effect?: string;
  // Captions are bold unless bold is false.
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  // Extra space between letters, as a fraction of the font size (may be negative).
  letterSpacing?: number;
  // Distance between lines, as a multiple of the font size (1.2 when unset).
  lineHeight?: number;
  // A drop shadow: blur in canvas pixels (0 = none), and its colour.
  shadowSize?: number;
  shadowColor?: string;
  // A left-to-right two-colour fill instead of `color`.
  gradient?: [string, string] | null;
  blur?: number;
  // Header/footer captions sit in their band until dragged out (hasCustomPos; y then spans the whole canvas).
  isHeaderCaption?: boolean;
  isFooterCaption?: boolean;
  hasCustomPos?: boolean;
  // Social cards and the news chyron draw with their own painters (draw/socialCards, draw/chyron).
  isTweetCard?: boolean;
  isInstagramCard?: boolean;
  isWhatsAppCard?: boolean;
  isBreakingNews?: boolean;
}

// Blend mode and shadow (stickers and photos), corners and border (photos): canvas/draw/layerLook.
export interface MemeSticker extends MemeLayerBase, LayerLook {
  // Size multiplier of the 52px base sticker.
  scale?: number;
  emoji?: string;
  url?: string;
  imageUrl?: string;
  name?: string;
  dieCut?: boolean;
  dieCutColor?: string;
  dieCutWidth?: number;
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MemeImageLayer extends MemeLayerBase, LayerLook {
  url: string;
  scale?: number;
  // Drawn size in canvas pixels (otherwise the image fitted into 320px, times scale).
  width?: number;
  height?: number;
  boxWidth?: number;
  boxHeight?: number;
  // Fractions of the source image shown in crop mode.
  crop?: CropRect;
  fitMode?: 'fit' | 'stretch' | 'crop';
  isFaceMorph?: boolean;
  faceName?: string;
  filterId?: string;
}

// A loaded image's size, as hit testing needs it.
export interface LoadedImage {
  width: number;
  height: number;
}
