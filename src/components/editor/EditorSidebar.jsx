import { useState } from 'react';
import { Type, Sticker, PencilLine, Sun, Plus, Check } from 'lucide-react';
import { useMemeEditorStore } from './store/useMemeEditorStore';
import { useEditorUiStore } from './store/useEditorUiStore';
import { useTabTools } from './hooks/useTabTools';
import AddAnythingSheet from './AddAnythingSheet';

// One island button: icon over a small label, like the app's bottom nav.
function Item({ Icon, label, on, className = '', ...props }) {
  return (
    <button type="button" className={`ie-island-item${on ? ' is-on' : ''} ${className}`} {...props}>
      <Icon className="ie-island-icon" size={20} />
      <span className="ie-island-label">{label}</span>
    </button>
  );
}

// What the inspector card calls the selected layer.
const layerKind = (layer, kind) => {
  if (kind === 'sticker') return 'Sticker';
  if (kind === 'image') return 'Image';
  if (layer.isTweetCard) return 'Tweet card';
  if (layer.isInstagramCard) return 'Instagram post';
  if (layer.isWhatsAppCard) return 'WhatsApp chat';
  if (layer.bubbleStyle) return 'Chat bubble';
  return 'Text';
};

// The editor's bottom area, in three states:
// - a calm island like the app's home nav: two shortcuts, a central "+" that opens a searchable
//   sheet with every tool, two shortcuts;
// - while drawing: the brush tools with Done;
// - with a layer selected: an inspector card naming the layer, with its tools (layerTools) and Done.
export default function EditorSidebar({ handleTabClick, toolHandlers, layerTools }) {
  const activeTab = useEditorUiStore((s) => s.activeTab);
  const drawTool = useEditorUiStore((s) => s.drawTool);
  const setDrawTool = useEditorUiStore((s) => s.setDrawTool);
  const setActiveSubmenu = useEditorUiStore((s) => s.setActiveSubmenu);
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);
  const templateFaceMorph = useMemeEditorStore((s) => s.templateFaceMorph);
  const captions = useMemeEditorStore((s) => s.captions);
  const stickers = useMemeEditorStore((s) => s.stickers);
  const imageLayers = useMemeEditorStore((s) => s.imageLayers);
  const tools = useTabTools(toolHandlers);
  const [sheetOpen, setSheetOpen] = useState(false);

  const drawing = activeTab === 'draw' && Boolean(drawTool);
  const stopDrawing = () => { setDrawTool(null); setActiveSubmenu(null); };

  // Run a tool from its section (the editor's activeTab), switching section first unless already
  // there, so a tool that toggles a settings bar can close it again.
  const run = (group, t) => {
    if (group === 'draw') {
      handleTabClick('draw');
      setActiveLayerId(null);
      t.onClick();
      return;
    }
    if (group !== activeTab) handleTabClick(group);
    t.onClick?.();
  };
  const tool = (group, id) => tools[group].find((t) => t.id === id);

  if (activeLayerId || templateFaceMorph) {
    const caption = captions.find((c) => c.id === activeLayerId);
    const sticker = !caption && stickers.find((s) => s.id === activeLayerId);
    const image = !caption && !sticker && imageLayers.find((l) => l.id === activeLayerId);
    const kind = caption ? layerKind(caption, 'caption') : sticker ? 'Sticker' : image ? 'Image' : 'Face swap';
    const name = caption ? (caption.text || '').replace(/\s+/g, ' ').trim() : '';
    return (
      <div className="ie-island-wrap">
        <div className="ie-inspector" role="toolbar" aria-label="Layer tools">
          <div className="ie-inspector-head">
            <span className="ie-inspector-kind">{kind}</span>
            {name && <span className="ie-inspector-name">{name}</span>}
            {activeLayerId && (
              <button type="button" className="ie-inspector-done" onClick={() => setActiveLayerId(null)}>
                <Check size={16} strokeWidth={2.6} />
                <span>Done</span>
              </button>
            )}
          </div>
          <div className="ie-inspector-tools">{layerTools}</div>
        </div>
      </div>
    );
  }

  if (drawing) {
    return (
      <div className="ie-island-wrap">
        <div className="ie-island ie-island--tools" role="toolbar" aria-label="Drawing tools">
          <Item Icon={Check} label="Done" className="ie-island-done" onClick={stopDrawing} />
          <span className="ie-island-divider" aria-hidden="true" />
          <div className="ie-island-scroll">
            {tools.draw.map((t) => (
              <Item key={t.id} Icon={t.Icon} label={t.label} on={drawTool === t.id} title={t.title} aria-pressed={drawTool === t.id} onClick={t.onClick} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ie-island-wrap">
      <nav className="ie-island" aria-label="Editor tools">
        <Item Icon={Type} label="Text" title="Add Text Caption" onClick={() => run('text', tool('text', 'add-text'))} />
        <Item Icon={Sticker} label="Stickers" title="Add Meme Stickers" onClick={() => run('images', tool('images', 'stickers'))} />
        <div className="ie-island-plus-wrap">
          <button type="button" className="ie-island-plus" onClick={() => setSheetOpen(true)} aria-label="Add anything" aria-haspopup="dialog" title="Add anything">
            <Plus size={24} strokeWidth={2.6} />
          </button>
        </div>
        <Item Icon={PencilLine} label="Draw" title="Draw on the meme" onClick={() => run('draw', tool('draw', 'brush'))} />
        <Item Icon={Sun} label="Filters" title="Photo Filters" onClick={() => run('filters', tool('filters', 'photo-filters'))} />
      </nav>
      {sheetOpen && <AddAnythingSheet tools={tools} onPick={run} onClose={() => setSheetOpen(false)} />}
    </div>
  );
}
