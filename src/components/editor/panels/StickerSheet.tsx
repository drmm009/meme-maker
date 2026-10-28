import { useEffect, useRef } from 'react';
import { Sticker, Smile } from 'lucide-react';
import { Sheet, Section, Row, ChipRow, Chip, SwatchRow, Slider, Switch, TileGrid, Tile } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { COLOR_SWATCHES } from '../../../utils/captionLayout';
import { useSelection } from './selection';
import type { EditorActions } from './selection';
import type { MemeSticker } from '../../../model/memeDocument';
import LayerActions from './LayerActions';

const stickerLabel = (s: MemeSticker) => s.emoji || s.name || 'Sticker';

// The Sticker sheet: add meme stickers or emoji; size, flip and die-cut the selected one.
export default function StickerSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const stickers: MemeSticker[] = useMemeEditorStore((s: { stickers: MemeSticker[] }) => s.stickers);
  const setActiveLayerId = useMemeEditorStore((s: { setActiveLayerId: (id: string | null) => void }) => s.setActiveLayerId);
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  const setShowMemeStickersModal = useEditorUiStore((s: { setShowMemeStickersModal: (v: boolean) => void }) => s.setShowMemeStickersModal);
  const setShowEmojiModal = useEditorUiStore((s: { setShowEmojiModal: (v: boolean) => void }) => s.setShowEmojiModal);
  const sheetFocus: string | null = useEditorUiStore((s: { sheetFocus: string | null }) => s.sheetFocus);
  const { id, sticker } = useSelection();
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sheetFocus) return;
    bodyRef.current?.querySelector(`[data-section="${sheetFocus}"]`)?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, [sheetFocus, id]);

  return (
    <Sheet title="Sticker" onClose={onClose}>
      <div ref={bodyRef}>
        <Section>
          <TileGrid columns={2}>
            <Tile label="Meme Stickers" Icon={Sticker} title="Add Meme Stickers" onClick={() => setShowMemeStickersModal(true)} />
            <Tile label="Emojis" Icon={Smile} title="Add Emojis" onClick={() => setShowEmojiModal(true)} />
          </TileGrid>
        </Section>

        {stickers.length > 0 && (
          <Section title="On the meme">
            <ChipRow ariaLabel="Stickers">
              {stickers.map((s) => <Chip key={s.id} label={stickerLabel(s)} active={s.id === id} onClick={() => setActiveLayerId(s.id)} />)}
            </ChipRow>
          </Section>
        )}

        {sticker && id && (
          <>
            <Section title="Selected sticker" id="size">
              <Row label="Size">
                <Slider label="Sticker size" min={0.3} max={6} step={0.05} value={sticker.scale || 1} onChange={(v) => patchLayer('stickers', id, { scale: v })} format={(v) => `${Math.round(v * 100)}%`} />
              </Row>
              <Row label="Flip" end>
                <Switch label="Flip sticker" checked={Boolean(sticker.flipX)} onChange={() => actions.handleFlipActiveLayer()} />
              </Row>
              <Row label="Die-cut" end>
                <Switch label="Die-cut border" checked={Boolean(sticker.dieCut)} onChange={() => actions.handleToggleDieCutSticker()} />
              </Row>
              {sticker.dieCut && (
                <Row label="Border">
                  <SwatchRow ariaLabel="Die-cut border colour" colors={COLOR_SWATCHES} value={sticker.dieCutColor || '#ffffff'} onChange={(c) => actions.handleSetDieCutColor(c)} />
                </Row>
              )}
            </Section>
            <LayerActions id={id} actions={actions} />
          </>
        )}
      </div>
    </Sheet>
  );
}
