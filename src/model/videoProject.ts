// The video editor's project: the clips on its timeline and how a project is saved.
// Positions and sizes are in the preview's 800-wide stage units; times are timeline milliseconds
// unless a field says otherwise.

export type ClipType = 'video' | 'image' | 'sticker' | 'text' | 'audio';
export type TextAnimation = 'pop' | 'shake' | 'typewriter';
export type TransitionType = 'fade' | 'zoom' | 'slide';
export type ClipEffect = 'reverse' | 'boomerang';
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
  // The clip as it was before reverse/boomerang.
  original?: Pick<Media, 'url' | 'trimStartMs' | 'sourceDurationMs' | 'thumbnailUrl'> & { endMs: number };
}

export interface ImageClip extends ClipBase, Placed {
  type: 'image';
  url: string;
  filter?: ClipFilter | null;
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
}

// A photo's slow movement while on screen.
export type PhotoMotion = 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right';

// A text shadow: soft (blurred, below), hard (sharp, down-right) or glow (blurred, the text's colour).
export type TextShadow = 'soft' | 'hard' | 'glow';

export interface TextClip extends ClipBase, Placed {
  type: 'text';
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  stroke?: string;
  strokeWidth?: number;
  // Outline thickness as a share of the font size (follows resizing); wins over strokeWidth.
  outline?: number;
  shadow?: TextShadow | null;
  // 'none', 'white', 'black' or a colour.
  bgColor?: string;
  align?: TextAlign;
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
export const VIDEO_PROJECT_VERSION = 1;

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
  return { ...project, items: (raw.items as unknown[]).filter(isClip) };
}
