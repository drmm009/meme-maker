// A video grid layout's panels (`layoutSlots`, stage units) and what sits in them: the start cards
// (VideoStartArea) and where a new clip, photo, sticker or text goes (the store's addItem) agree on
// which panels are empty.
import { textBitmap } from './textBitmap';
import { bandRects } from './videoBands';
import type { VideoBand } from './videoBands';

export interface Slot { x: number; y: number; width: number; height: number }
export interface Point { x: number; y: number }
export interface PanelItem {
  type: string;
  slotIndex?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  text?: string;
  fontSize?: number;
}

// The picture's part of the canvas: all of it, less the header and footer bars that are on.
export function pictureArea(header: VideoBand | null | undefined, footer: VideoBand | null | undefined, width: number, height: number): Slot {
  const [top] = bandRects(header, null, width, height);
  const [bottom] = bandRects(null, footer, width, height);
  const y = top?.height ?? 0;
  return { x: 0, y, width, height: height - y - (bottom?.height ?? 0) };
}

// A text's box size on the stage, from its (cached) picture; null where it can't be drawn.
export function textBoxSize(item: PanelItem): { width: number; height: number } | null {
  try {
    const b = textBitmap(item as never, 1);
    return b.boxWidth > 0 && b.boxHeight > 0 ? { width: b.boxWidth, height: b.boxHeight } : null;
  } catch {
    return null;
  }
}

// An item's middle on the stage, or null if it hasn't been placed. A text's x, y is its box's
// top-left.
export function itemCentre(item: PanelItem): Point | null {
  if (typeof item.x !== 'number' || typeof item.y !== 'number') return null;
  if (item.type === 'text') {
    const box = textBoxSize(item);
    return box ? { x: item.x + box.width / 2, y: item.y + box.height / 2 } : { x: item.x, y: item.y };
  }
  if (typeof item.width !== 'number' || typeof item.height !== 'number') return null;
  return { x: item.x + (item.width * (item.scaleX || 1)) / 2, y: item.y + (item.height * (item.scaleY || 1)) / 2 };
}

export const inSlot = (s: Slot, p: Point | null | undefined): boolean =>
  Boolean(p) && p!.x >= s.x && p!.x <= s.x + s.width && p!.y >= s.y && p!.y <= s.y + s.height;

// Whether a panel has something in it: a clip or photo given to it, or anything with its middle there.
export const slotTaken = (index: number, slot: Slot, items: PanelItem[]): boolean =>
  items.some((it) => it.slotIndex === index || inSlot(slot, itemCentre(it)));

// The first panel with nothing in it, or undefined (also when there's no grid of 2 or more).
export function firstEmptySlot(items: PanelItem[], slots: Slot[] = []): number | undefined {
  if (slots.length < 2) return undefined;
  const i = slots.findIndex((s, index) => !slotTaken(index, s, items));
  return i === -1 ? undefined : i;
}

// Where a new text's box goes to sit centred in a panel or area (its top-left), its font made
// smaller first if the text would be wider than 90% of it (or taller than 60%).
export function textInSlot(item: PanelItem, slot: Slot): Point & { fontSize?: number } {
  let box = textBoxSize(item);
  let fontSize: number | undefined;
  if (box && item.fontSize) {
    const k = Math.min(1, (slot.width * 0.9) / box.width, (slot.height * 0.6) / box.height);
    if (k < 1) {
      fontSize = Math.max(12, Math.floor(item.fontSize * k));
      box = textBoxSize({ ...item, fontSize }) ?? box;
    }
  }
  const b = box ?? { width: 0, height: 0 };
  return { x: slot.x + (slot.width - b.width) / 2, y: slot.y + (slot.height - b.height) / 2, ...(fontSize ? { fontSize } : {}) };
}
