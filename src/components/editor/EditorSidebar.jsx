import { useState } from 'react';
import { Plus, Check, Sparkles, ImagePlus, Paintbrush, SlidersHorizontal } from 'lucide-react';
import { useMemeEditorStore } from './store/useMemeEditorStore';
import { useEditorUiStore } from './store/useEditorUiStore';
import { useTabTools } from './hooks/useTabTools';
import OrbitOverlay from './OrbitOverlay';

// Quick chips when nothing is selected, as [section, tool id, label, icon colour, active style].
// Active style: 'amber' / 'white' fill the chip (deep-fry, top band); others just tint the icon.
const CHIPS = [
  ['text', 'add-text', '+ Caption', '#ff5e36'],
  ['text', 'bubble', '+ Bubble', '#38bdf8'],
  ['text', 'social', 'Social Card', '#34d399'],
  ['images', 'stickers', 'Stickers', '#fbbf24'],
  ['images', 'emojis', 'Emojis', '#fbbf24'],
  ['filters', 'face-swap', 'Face Swap', '#f472b6'],
  ['filters', 'deep-fry', 'Deep-Fry', '#fbbf24', 'amber'],
  ['filters', 'remove-bg', null, '#c084fc'],
  ['canvas', 'top-band', 'Top Band', '#f5f5f7', 'white'],
  ['canvas', 'watermark', 'Watermark', '#ff5e36'],
];

// What the inspector card calls the selected layer.
const captionKind = (c) => {
  if (c.isTweetCard) return 'Tweet';
  if (c.isInstagramCard) return 'Instagram';
  if (c.isWhatsAppCard) return 'WhatsApp';
  if (c.bubbleStyle) return 'Bubble';
  return 'Text';
};

// The editor's bottom deck (Concept 1, "Orbit & Halo"):
// - nothing selected: a strip of quick chips over a trigger bar (AI Roast, media, the "+" nucleus,
//   draw, filters); "+" opens OrbitOverlay (command palette and orbit);
// - drawing: brush tools with Done;
// - a layer selected: a "<kind> Studio" inspector card with the layer's tools (layerTools) and Done.
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
  const [orbitOpen, setOrbitOpen] = useState(false);

  const drawing = activeTab === 'draw' && Boolean(drawTool);
  const stopDrawing = () => { setDrawTool(null); setActiveSubmenu(null); };
  const tool = (section, id) => tools[section].find((t) => t.id === id);

  // Run a tool from its section (the editor's activeTab), switching section first unless already
  // there, so a tool that toggles a settings bar can close it again.
  const run = (section, t) => {
    if (section === 'draw') {
      handleTabClick('draw');
      setActiveLayerId(null);
      t.onClick();
      return;
    }
    if (section !== activeTab) handleTabClick(section);
    t.onClick?.();
  };

  if (activeLayerId || templateFaceMorph) {
    const caption = captions.find((c) => c.id === activeLayerId);
    const sticker = !caption && stickers.find((s) => s.id === activeLayerId);
    const image = !caption && !sticker && imageLayers.find((l) => l.id === activeLayerId);
    const kind = caption ? captionKind(caption) : sticker ? 'Sticker' : image ? 'Image' : 'Face swap';
    const name = caption ? (caption.text || '').replace(/\s+/g, ' ').trim() : sticker ? (sticker.name || sticker.emoji || '') : '';
    return (
      <div className="ie-deck">
        <div className="ie-inspector" role="toolbar" aria-label="Layer tools">
          <div className="ie-inspector-head">
            <span className="ie-inspector-kind">{kind} Studio</span>
            {name && <span className="ie-inspector-name">{name}</span>}
            {activeLayerId && (
              <button type="button" className="ie-inspector-done" onClick={() => setActiveLayerId(null)}>
                <Check size={13} strokeWidth={3} />
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
      <div className="ie-deck">
        <div className="ie-inspector" role="toolbar" aria-label="Drawing tools">
          <div className="ie-inspector-head">
            <span className="ie-inspector-kind">Draw Studio</span>
            <button type="button" className="ie-inspector-done" onClick={stopDrawing}>
              <Check size={13} strokeWidth={3} />
              <span>Done</span>
            </button>
          </div>
          <div className="ie-chips">
            {tools.draw.map((t) => (
              <button key={t.id} type="button" className={`ie-chip${drawTool === t.id ? ' is-fill-coral' : ''}`} title={t.title} aria-pressed={drawTool === t.id} onClick={t.onClick}>
                <t.Icon size={14} style={{ color: drawTool === t.id ? '#fff' : '#ff5e36' }} />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const upload = tool('images', 'upload');
  return (
    <div className="ie-deck">
      <div className="ie-chips" role="toolbar" aria-label="Quick tools">
        {CHIPS.map(([section, id, label, color, fill]) => {
          const t = tool(section, id);
          if (!t) return null;
          const filled = fill && t.active;
          return (
            <button
              key={id}
              type="button"
              className={`ie-chip${filled ? ` is-fill-${fill}` : ''}`}
              title={t.title}
              aria-pressed={Boolean(t.active)}
              onClick={() => run(section, t)}
            >
              <t.Icon size={14} style={{ color: filled ? 'currentColor' : color }} />
              <span>{label || t.label}</span>
            </button>
          );
        })}
      </div>

      <nav className="ie-trigger" aria-label="Editor tools">
        <div className="ie-trigger-side">
          <button type="button" className="ie-trigger-pill" title="AI Meme Captions" onClick={() => run('text', tool('text', 'ai'))}>
            <Sparkles size={14} style={{ color: '#ff5e36' }} />
            <span>AI Roast</span>
          </button>
          <label className="ie-trigger-square" title={upload.title} aria-label="Add a photo or video">
            <ImagePlus size={17} />
            <input type="file" accept={upload.accept} hidden onChange={(e) => { run('images', upload); upload.onFile(e); }} />
          </label>
        </div>

        <button
          type="button"
          className={`ie-nucleus${orbitOpen ? ' is-open' : ''}`}
          onClick={() => setOrbitOpen((v) => !v)}
          aria-label="Add anything"
          aria-haspopup="dialog"
          aria-expanded={orbitOpen}
          title="Add anything"
        >
          <Plus size={24} strokeWidth={2.6} />
        </button>

        <div className="ie-trigger-side ie-trigger-side--end">
          <button type="button" className="ie-trigger-square" title="Draw on the meme" aria-label="Draw" onClick={() => run('draw', tool('draw', 'brush'))}>
            <Paintbrush size={17} />
          </button>
          <button type="button" className="ie-trigger-pill" title="Photo Filters" onClick={() => run('filters', tool('filters', 'photo-filters'))}>
            <SlidersHorizontal size={14} />
            <span>Filters</span>
          </button>
        </div>
      </nav>

      {orbitOpen && <OrbitOverlay tools={tools} onPick={run} onClose={() => setOrbitOpen(false)} />}
    </div>
  );
}
