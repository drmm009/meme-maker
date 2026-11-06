// The video editor's project: the clips on its timeline and how a project is saved.
// Positions and sizes are in the preview's 800-wide stage units; times are timeline milliseconds
// unless a field says otherwise.
import { resolveFilter } from '../utils/clipFilters';

export type ClipType = 'video' | 'image' | 'sticker' | 'text' | 'audio';
export type TextAnimation = 'pop' | 'shake' | 'typewriter';
export type TransitionType = 'fade' | 'zoom' | 'slide';
export type ClipEffect = 'reverse' | 'boomerang' | 'faceswap';
export type TextAlign = 'left' | 'center' | 'right';

// A colour filter: a preset plus brightness, contrast and saturation in -100..100.
export interface ClipFilter {
  preset?: string | null;
  brightness?: number;
  contrast?: number;
  saturation?: number;
}

// Green screen: the key colour ('auto' until the preview samples it) and its tolerances (0..1).
export interface ChromaKey {
  color: string;
  similarity: number;
  blend: number;
}

// A transition into the clip from the one before it on the main sequence.
export interface Transition {
  type: TransitionType | null;
  durationMs?: number;
}

interface ClipBase {
  id: string;
  type: ClipType;
  name?: string;
  startMs: number;
  endMs: number;
  hidden?: boolean;
  // Explicit draw order (bring forward / send back); otherwise by type, then order added.
  z?: number;
}

// The part of a picture's frame a clip shows, as fractions (0..1) of the frame.
export interface ClipCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Anything drawn on the canvas. x/y are the top-left corner; rotation (degrees, clockwise) turns
// the clip about that corner, as Konva does.
export interface Placed {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  // 0 (see-through) to 1 (solid); missing means solid.
  opacity?: number;
  // Photos, videos and stickers: the part of the frame shown (width/height are its size on the
  // canvas); missing or null is the whole frame.
  crop?: ClipCrop | null;
  // Photos, videos and stickers: mirrored left-right / upside down, within the clip's own box.
  flipX?: boolean;
  flipY?: boolean;
  // Set once the clip has been placed at its natural size.
  isPositioned?: boolean;
  // The panel of a multi-panel layout the clip belongs to.
  slotIndex?: number;
}

// A clip's opacity, 0..1 (1 when unset or not a number).
export const clipOpacity = (item: { opacity?: number }): number =>
  typeof item.opacity === 'number' && Number.isFinite(item.opacity) ? Math.min(1, Math.max(0, item.opacity)) : 1;

// Anything played from a file.
export interface Media {
  url: string;
  mimeType?: string;
  thumbnailUrl?: string | null;
  // Where the clip starts in its source, in source ms.
  trimStartMs?: number;
  sourceDurationMs?: number;
  playbackRate?: number;
  muted?: boolean;
  // 0..1
  volume?: number;
  fadeInMs?: number;
  fadeOutMs?: number;
}

export interface VideoClip extends ClipBase, Placed, Media {
  type: 'video';
  filter?: ClipFilter | null;
  chromaKey?: ChromaKey | null;
  transitionIn?: Transition | null;
  // Zoom-punch moments, in source ms.
  punches?: number[];
  effect?: ClipEffect | null;
  // The clip as it was before reverse, boomerang or face swap.
  original?: Pick<Media, 'url' | 'trimStartMs' | 'sourceDurationMs' | 'thumbnailUrl'> & { endMs: number };
}

export interface ImageClip extends ClipBase, Placed {
  type: 'image';
  url: string;
  // The look is the image editor's photo's, drawn by its painting (utils/photoLook): its filter
  // (the image editor's filter values, and the preset they came from), background blur over the
  // subject cut from `subjectOf`, rounded corners (0..1), a border and a drop shadow (sizes in stage
  // units).
  filters?: Record<string, number> | null;
  filterId?: string | null;
  bgBlur?: number;
  subjectUrl?: string | null;
  subjectOf?: string | null;
  cornerRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  shadowSize?: number;
  shadowColor?: string;
  // The picture before Face swap (url is then the swapped one).
  faceSwapOf?: string | null;
  // A freeze frame sitting in the main sequence (it can take transitions).
  isFreeze?: boolean;
  transitionIn?: Transition | null;
  // The picture before Cut out (url is then its subject on a see-through background).
  originalUrl?: string | null;
  motion?: PhotoMotion | null;
  // An end card made in the editor (kept so it can be redrawn and stays last).
  endCard?: EndCardSettings | null;
}

export interface EndCardSettings {
  title: string;
  subtitle: string;
  color: string;
}

export type WatermarkCorner = 'tl' | 'tr' | 'bl' | 'br';

// A handle shown small in a corner for the whole video.
export interface WatermarkSettings {
  text: string;
  corner: WatermarkCorner;
}

export interface StickerClip extends ClipBase, Placed {
  type: 'sticker';
  url: string;
  isGif?: boolean;
  // The picture before Cut out.
  originalUrl?: string | null;
  // As the image editor's stickers (utils/stickerLook): a die-cut border and a drop shadow, sizes
  // in stage units.
  dieCut?: boolean;
  dieCutColor?: string;
  dieCutWidth?: number;
  shadowSize?: number;
  shadowColor?: string;
}

// A photo's slow movement while on screen.
export type PhotoMotion = 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right';

// Version 1's text shadows (now shadowSize and shadowColor, or the glow effect).
type OldTextShadow = 'soft' | 'hard' | 'glow';

export interface TextClip extends ClipBase, Placed {
  type: 'text';
  text?: string;
  // The look is the image editor's caption's (MemeCaption), drawn by its painter (utils/textBitmap),
  // with sizes in stage units. x and y are the box's top-left; width is the wrap width.
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  // Outline colour ('transparent' or unset: none) and width (unset: the painter's, by font size).
  stroke?: string;
  strokeWidth?: number;
  // 'none', 'white', 'black' or a colour.
  bgColor?: string;
  bgStyle?: 'box' | 'banner';
  bubbleStyle?: string;
  align?: TextAlign;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  effect?: string;
  curve?: number;
  // Shares of the font size (letters) and a multiple of it (lines).
  letterSpacing?: number;
  lineHeight?: number;
  shadowSize?: number;
  shadowColor?: string;
  gradient?: [string, string] | null;
  animation?: TextAnimation | null;
  // Made by auto captions (they share one timeline row and export as one track).
  autoCaption?: boolean;
}

export interface AudioClip extends ClipBase, Media {
  type: 'audio';
  isVoiceover?: boolean;
  // Lower under voice: quieter while a voiceover or a video's sound plays.
  duck?: boolean;
  icon?: string;
}

export type Clip = VideoClip | ImageClip | StickerClip | TextClip | AudioClip;
export type VisualClip = Exclude<Clip, AudioClip>;

export interface LayoutSlot {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VideoProject {
  items: Clip[];
  duration?: number;
  canvasAspectRatio?: number;
  backgroundColor?: string;
  layoutId?: string | null;
  layoutSlots?: LayoutSlot[];
  gridOverlayUrl?: string | null;
  watermark?: WatermarkSettings | null;
}

// Saved projects carry this. Bump it when the saved shape changes, and teach
// migrateVideoProject to upgrade the previous version.
export const VIDEO_PROJECT_VERSION = 3;

const CLIP_TYPES = new Set<ClipType>(['video', 'image', 'sticker', 'text', 'audio']);
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

// A usable clip: a known type, an id, a time range, and a file unless it's text.
export const isClip = (v: unknown): v is Clip => isRecord(v)
  && typeof v.id === 'string'
  && CLIP_TYPES.has(v.type as ClipType)
  && isNum(v.startMs)
  && isNum(v.endMs)
  && (v.type === 'text' || typeof v.url === 'string');

// A saved project upgraded to the current version, keeping only usable clips. Null if it isn't a
// project, or was saved by a newer version of the app (which this one can't read safely).
// Projects saved before versioning count as version 0.
export function migrateVideoProject(raw: unknown, version = 0): VideoProject | null {
  if (!isRecord(raw) || !Array.isArray(raw.items) || version > VIDEO_PROJECT_VERSION) return null;
  // 0 -> 1: no change in shape; versioning starts here, and clips that can't be used are dropped.
  const project = { ...raw } as unknown as VideoProject;
  const items = (raw.items as unknown[]).filter(isClip);
  // 1 -> 2: text takes the image editor's caption look (see upgradeText).
  const v2 = version < 2 ? items.map((c) => (c.type === 'text' ? upgradeText(c) : c)) : items;
  // 2 -> 3: photos take the image editor's filters (see upgradePhotoFilter).
  return { ...project, items: version < 3 ? v2.map((c) => (c.type === 'image' ? upgradePhotoFilter(c) : c)) : v2 };
}

// A version 2 photo's colour filter (a video filter preset and sliders) as the image editor's filter
// values, the same amounts.
export function upgradePhotoFilter(clip: ImageClip): ImageClip {
  const { filter, ...rest } = clip as ImageClip & { filter?: ClipFilter | null };
  const v = resolveFilter(filter);
  if (!v) return rest;
  const filters = {
    brightness: Math.round(v.brightness * 100),
    contrast: Math.round(v.contrast * 100),
    saturation: Math.round(v.saturate * 100),
    grayscale: 0,
    sepia: Math.round(v.sepia * 100),
    invert: 0,
    hueRotate: Math.round(v.hue),
    blur: 0,
  };
  return { ...rest, filters, filterId: 'original' };
}

// A version 1 text clip in version 2's terms, looking as close to before as the caption painter
// draws it: the outline (a share of the font size, or its 1/25 default) in stage units, black
// unless on a box; the shadow presets as a shadow size and colour, glow as the glow effect.
export function upgradeText(clip: TextClip): TextClip {
  const { outline, shadow, ...rest } = clip as TextClip & { outline?: number; shadow?: OldTextShadow | null };
  const fontSize = rest.fontSize || 32;
  const boxed = Boolean(rest.bgColor) && rest.bgColor !== 'none' && rest.bgColor !== 'transparent';
  const next: TextClip = {
    ...rest,
    stroke: rest.stroke || (boxed ? 'transparent' : '#000000'),
    strokeWidth: isNum(outline) ? Math.max(0, outline) * fontSize : rest.strokeWidth || Math.max(2, fontSize / 25),
  };
  if (shadow === 'soft') Object.assign(next, { shadowSize: Math.round(fontSize * 0.16), shadowColor: 'rgba(0, 0, 0, 0.8)' });
  if (shadow === 'hard') Object.assign(next, { shadowSize: Math.round(fontSize * 0.08), shadowColor: '#000000' });
  if (shadow === 'glow') next.effect = 'glow';
  return next;
}
