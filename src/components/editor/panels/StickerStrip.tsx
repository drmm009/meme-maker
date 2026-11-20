import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Scissors, Crop, Type, Sparkles, Palette, Plus, RotateCcw } from 'lucide-react';
import { Sheet, Tile, TileGrid, ToolDock, ToolStrip } from '../../ui';
import type { DockItem, StripItem } from '../../ui';
import { BubbleIcon } from './editorIcons';
import { useEditorUiStore } from '../store/useEditorUiStore';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { STICKER_STYLES } from '../stickerMaker';
import { useSelection } from './selection';
import type { EditorActions } from './selection';

interface LayerItem {
  id: string;
  url?: string;
  originalUrl?: string | null;
}

const TOOLS: DockItem[] = [
  { id: 'diecut', label: 'Die-cut', title: 'Die-cut border settings', Icon: Scissors },
  { id: 'style', label: 'Style', title: 'Outline style', Icon: Palette },
  { id: 'text', label: 'Text', title: 'Add text to the sticker', Icon: Type },
  { id: 'crop', label: 'Crop', title: 'Crop or turn the picture', Icon: Crop },
  { id: 'effects', label: 'Effects', title: 'Photo effects and filters', Icon: Sparkles },
];

// The Text tool's own row, as the image editor's Text tab (TextStrip) without Social Card.
const TEXT_TOOLS: StripItem[] = [
  { id: 'add', label: 'Add Text', title: 'Add Text Caption', Icon: Plus },
  { id: 'bubble', label: 'Bubble', title: 'Add Chat & Speech Bubble', Icon: BubbleIcon },
];

// The sheet each tool opens (Text shows its row). Crop's sheet crops on the board (StickerCropSheet).
const SHEET_OF: Record<string, string> = { diecut: 'diecut', style: 'stickerStyle', crop: 'stickerCrop', effects: 'filters' };
const TOOL_SHEETS = new Set(Object.values(SHEET_OF));

// The photo the tools work on: the cut-out one, or else the first.
const usePhoto = () => {
  const imageLayers: LayerItem[] = useMemeEditorStore((s: { imageLayers: LayerItem[] }) => s.imageLayers);
  return imageLayers.find((l) => Boolean(l.originalUrl)) || imageLayers[0];
};

// The Stickers maker's tools on its editing screen, once the sticker is made (before that its page,
// StickerStudio, shows): Die-cut, Style, Text (in the middle), Crop and Effects in the image editor's
// main dock (ToolDock, `ui-dock`), the open one lit. Die-cut, Style and Effects open their sheets on
// the photo (Style is StickerStyleSheet); Crop acts at once. Text, as the image editor's Text tab,
// shows a row above the dock, Add Text (a caption) and Bubble (the bubble sheet), until another tool
// is picked or Text is tapped again; it is open when the screen comes up. Export is in the header (MemeEditor). With a text layer selected
// its tools (LayerToolbar, as `tools`) show above the dock in the row's place, and selecting it
// closes a Die-cut, Style or Effects sheet that was open.
export default function StickerStrip({ actions, tools }: { actions: EditorActions; tools?: ReactNode }) {
  const sheet: string | null = useEditorUiStore((s: { sheet: string | null }) => s.sheet);
  const openSheet = useEditorUiStore((s: { openSheet: (sheet: string) => void }) => s.openSheet);
  const closeSheet = useEditorUiStore((s: { closeSheet: () => void }) => s.closeSheet);
  const setActiveLayerId = useMemeEditorStore((s: { setActiveLayerId: (id: string | null) => void }) => s.setActiveLayerId);
  const photo = usePhoto();
  const { id: selectedId, kind } = useSelection();
  // Text is the open tool when the editing screen comes up, its row showing.
  const [textOpen, setTextOpen] = useState(true);

  // Selecting a text layer puts its tools above the dock: a tool's sheet that was open makes way.
  useEffect(() => {
    if (kind !== 'caption' || !sheet || !TOOL_SHEETS.has(sheet)) return;
    closeSheet();
    // Only on a new selection, not when a sheet opens with the text still selected.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, kind]);

  // A sheet button opens its sheet on the photo, or closes it when it is open.
  const toggle = (name: string) => {
    if (sheet === name) closeSheet();
    else {
      if (photo) setActiveLayerId(photo.id);
      openSheet(name);
    }
  };

  const onSelect = (id: string) => {
    if (id === 'text') {
      // Text shows its row (or hides it); a tool's sheet that was open makes way.
      if (sheet && TOOL_SHEETS.has(sheet)) closeSheet();
      setTextOpen(!textOpen || sheet === 'bubble');
      if (sheet === 'bubble') closeSheet();
      return;
    }
    setTextOpen(false);
    if (SHEET_OF[id]) toggle(SHEET_OF[id]);
  };

  const onText = (id: string) => {
    if (id === 'add') actions.handleAddCaption();
    else if (id === 'bubble') openSheet('bubble');
  };

  const active = textOpen || sheet === 'bubble' ? 'text' : TOOLS.find((t) => SHEET_OF[t.id] && SHEET_OF[t.id] === sheet)?.id ?? null;
  // A selected text's tools take the row's place; with a sheet open (Bubble's too) the row waits.
  const row = tools ?? (textOpen && !sheet ? (
    <div className="ie-stk-text-tools">
      <ToolStrip ariaLabel="Text tools" layout="stacked" items={TEXT_TOOLS} onSelect={onText} />
    </div>
  ) : null);
  return (
    <>
      {row}
      <ToolDock ariaLabel="Sticker tools" items={TOOLS} active={active} onSelect={onSelect} />
    </>
  );
}

// The Style sheet, in the Filters sheet's design (FiltersSheet: its header, Reset, and the grid of
// photo tiles, panels.css .ie-filter-*): each outline style as the cut-out sticker on the
// see-through checkerboard in that outline, its name under it, the picked one lit. A pick restyles
// the cut-out; Reset goes back to Classic.
export function StickerStyleSheet({ actions, onClose }: { actions: EditorActions; onClose: () => void }) {
  const photo = usePhoto();
  const style: string = useEditorUiStore((s: { stickerStyle: string }) => s.stickerStyle);
  // The cut-out itself, so each tile shows the sticker's own shape in that outline.
  const src = photo?.url || photo?.originalUrl || '';
  return (
    <Sheet
      Icon={Palette}
      className="ie-filters-sheet ie-tool-sheet ie-stk-style-sheet"
      title="Style"
      onClose={onClose}
      action={{ label: 'Reset', Icon: RotateCcw, variant: 'plain', disabled: style === 'classic', onClick: () => actions.handleStickerStyle('classic') }}
    >
      <div className="ie-filter-grid" role="group" aria-label="Sticker style">
        <TileGrid>
          {STICKER_STYLES.map((s) => (
            <Tile
              key={s.id}
              className="ie-filter-tile"
              label={s.label}
              active={style === s.id}
              onClick={() => actions.handleStickerStyle(s.id)}
              icon={(
                <span className="ie-filter-thumb ie-stk-style-thumb">
                  <img className={`ie-stk-look--${s.id}`} src={src} alt="" draggable={false} />
                </span>
              )}
            />
          ))}
        </TileGrid>
      </div>
    </Sheet>
  );
}
