import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { isSocialCardCaption } from '../memeEditorUtils';
import type { MemeCaption } from '../../../model/memeDocument';

export type Caption = MemeCaption & Record<string, any>;
export type Platform = 'tweet' | 'instagram' | 'whatsapp';

export const platformOf = (c: Caption): Platform => (c.isTweetCard ? 'tweet' : c.isInstagramCard ? 'instagram' : 'whatsapp');

// The social card the Social Card maker edits: the selected one, or else the first on the meme.
export function useCard(): Caption | null {
  const captions: Caption[] = useMemeEditorStore((s: { captions: Caption[] }) => s.captions);
  const activeLayerId: string | null = useMemeEditorStore((s: { activeLayerId: string | null }) => s.activeLayerId);
  const active = captions.find((c) => c.id === activeLayerId);
  return (active && isSocialCardCaption(active) ? active : captions.find(isSocialCardCaption)) || null;
}
