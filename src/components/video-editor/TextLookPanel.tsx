import { useState } from 'react';
import TextControls, { ColorTabs } from '../editor/panels/TextControls';
import type { ColorTab, TextCaption, TextPart } from '../editor/panels/TextControls';
import { useEditorStore } from '../../store/useVideoEditorStore';
import { setVideoFonts, useVideoFonts } from './videoFonts';
import type { TextClip } from '../../model/videoProject';
import '../editor/panels/panels.css';

// Text sizes on the 800-wide stage (a new text starts at 100).
const SIZE_RANGE: [number, number] = [16, 300];

// A text clip's look in the image editor's text controls (editor/panels/TextControls), inside the
// classes that style them there. The words and every setting save straight to the clip; the
// store keeps a slider's drag as one undo step.
function TextLook({ item, part }: { item: TextClip; part: TextPart | null }) {
  const customFonts = useVideoFonts((s) => s.fonts);
  const [colorTab, setColorTab] = useState<ColorTab>('color');
  const update = (patch: Partial<TextCaption>) => useEditorStore.getState().updateItem(item.id, patch);
  return (
    <div className="ie-panels--sheet vt-text-look">
      <div className="ie-text-sheet ie-tool-sheet">
        {part === 'color' && <ColorTabs value={colorTab} onChange={setColorTab} />}
        <TextControls
          caption={item as unknown as TextCaption}
          part={part}
          colorTab={colorTab}
          set={update}
          live={update}
          onText={(text) => update({ text })}
          customFonts={customFonts}
          onCustomFonts={setVideoFonts}
          sizeRange={SIZE_RANGE}
          banner={false}
          autoFocusText={!part}
        />
      </div>
    </div>
  );
}

export const TextEditPanel = ({ item }: { item: TextClip }) => <TextLook item={item} part={null} />;
export const TextFontPanel = ({ item }: { item: TextClip }) => <TextLook item={item} part="font" />;
export const TextStylePanel = ({ item }: { item: TextClip }) => <TextLook item={item} part="style" />;
export const TextColorPanel = ({ item }: { item: TextClip }) => <TextLook item={item} part="color" />;
