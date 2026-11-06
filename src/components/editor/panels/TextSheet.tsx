import { useEffect, useState } from 'react';
import { BubbleIcon } from './editorIcons';
import { Sheet, Section, ChipRow, Chip, TileGrid, Tile } from '../../ui';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useSelection, captionLabel } from './selection';
import type { EditorActions } from './selection';
import LayerActions from './LayerActions';
import type { CustomFont } from '../../../utils/customFonts';
import { redrawCanvas } from '../hooks/useCustomFonts';
import CardControls from './CardControls';
import TextControls, { ColorTabs } from './TextControls';
import type { TextCaption } from './TextControls';
import { TEXT_PARTS } from './textParts';
import type { ColorTab, TextPart } from './textParts';

type Caption = TextCaption;

// The Text sheet, under the Text strip (which adds text, bubbles and social cards): pick a caption,
// edit its words, font, format, size, effects, alignment, spacing, colour, outline, shadow and box
// (TextControls, shared with the video editor). Opened from a floating-bar button it shows only that
// button's sections.
export default function TextSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const captions: Caption[] = useMemeEditorStore((s: { captions: Caption[] }) => s.captions);
  const setActiveLayerId = useMemeEditorStore((s: { setActiveLayerId: (id: string | null) => void }) => s.setActiveLayerId);
  const patchLayer = useMemeEditorStore((s: { patchLayer: (key: string, id: string, patch: object) => void }) => s.patchLayer);
  const updateCaptionText = useMemeEditorStore((s: { updateCaptionText: (id: string, text: string) => void }) => s.updateCaptionText);
  const sheetFocus: string | null = useEditorUiStore((s: { sheetFocus: string | null }) => s.sheetFocus);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const customFonts: CustomFont[] = useEditorUiStore((s: { customFonts: CustomFont[] }) => s.customFonts);
  const setCustomFonts = useEditorUiStore((s: { setCustomFonts: (fonts: CustomFont[]) => void }) => s.setCustomFonts);
  const { id, kind, caption } = useSelection();
  const part = kind === 'caption' && sheetFocus && sheetFocus in TEXT_PARTS ? (sheetFocus as TextPart) : null;
  const [colorTab, setColorTab] = useState<ColorTab>('color');

  // Opening the sheet with no caption selected picks the first one.
  useEffect(() => {
    if (!caption && captions.length) setActiveLayerId(captions[0].id);
    // Only on open: picking a sticker afterwards closes this sheet anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (patch: Partial<Caption>) => actions.updateActiveCaptionProps(patch);
  const live = (patch: Partial<Caption>) => id && patchLayer('captions', id, patch);

  return (
    <Sheet
      className="ie-text-sheet ie-tool-sheet"
      title={part ? TEXT_PARTS[part] : 'Text'}
      onClose={onClose}
      aside={part === 'color' && kind === 'caption' ? <ColorTabs value={colorTab} onChange={setColorTab} /> : undefined}
    >
      {!part && (
        <ChipRow ariaLabel="Captions">
          {captions.map((c) => (
            <Chip key={c.id} label={captionLabel(c)} active={c.id === id} onClick={() => setActiveLayerId(c.id)} />
          ))}
        </ChipRow>
      )}

      {!caption && <p className="ie-empty">{captions.length ? 'Pick a caption to edit it.' : 'No text yet. Tap Add Text above to write one.'}</p>}

      {caption && kind === 'card' && <CardControls caption={caption} actions={actions} />}

      {caption && kind === 'caption' && (
        <TextControls
          caption={caption}
          part={part}
          colorTab={colorTab}
          set={set}
          live={live}
          onText={(text) => updateCaptionText(caption.id, text)}
          customFonts={customFonts}
          onCustomFonts={(fonts) => {
            setCustomFonts(fonts);
            redrawCanvas();
          }}
        />
      )}

      {!part && caption?.bubbleStyle ? (
        <Section title="Bubble" rule>
          <TileGrid columns={2}>
            <Tile label="Bubble Style" Icon={BubbleIcon} onClick={() => openSheet('bubble')} />
          </TileGrid>
        </Section>
      ) : null}

      {!part && id && caption && <LayerActions id={id} actions={actions} />}
    </Sheet>
  );
}
