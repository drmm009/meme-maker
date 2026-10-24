import { useState } from 'react';
import { Type, Sparkles, ImagePlus, LayoutGrid, PencilLine, ChevronLeft, Check } from 'lucide-react';
import { useMemeEditorStore } from './store/useMemeEditorStore';
import { useEditorUiStore } from './store/useEditorUiStore';
import { useTabTools } from './hooks/useTabTools';

const TABS = [
  { id: 'draw', label: 'Draw', Icon: PencilLine },
  { id: 'images', label: 'Media', Icon: ImagePlus },
  { id: 'text', label: 'Text', Icon: Type },
  { id: 'filters', label: 'AI', Icon: Sparkles },
  { id: 'canvas', label: 'Canvas', Icon: LayoutGrid },
];

// One island button: icon over a small label, like the app's bottom nav.
function Item({ Icon, label, on, className = '', ...props }) {
  return (
    <button type="button" className={`ie-island-item${on ? ' is-on' : ''} ${className}`} {...props}>
      <Icon className="ie-island-icon" size={20} />
      <span className="ie-island-label">{label}</span>
    </button>
  );
}

// The editor's bottom bar: a floating island like the app's home nav. It shows the sections; a
// section swaps the island to its tools with a back button; a selected layer swaps in that layer's
// tools (layerTools) with Done.
export default function EditorSidebar({ handleTabClick, toolHandlers, layerTools }) {
  const activeTab = useEditorUiStore((s) => s.activeTab);
  const drawTool = useEditorUiStore((s) => s.drawTool);
  const setDrawTool = useEditorUiStore((s) => s.setDrawTool);
  const setActiveSubmenu = useEditorUiStore((s) => s.setActiveSubmenu);
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);
  const templateFaceMorph = useMemeEditorStore((s) => s.templateFaceMorph);
  const tools = useTabTools(toolHandlers);
  const [openTab, setOpenTab] = useState(null); // section whose tools fill the island, or null

  const enterTab = (id) => {
    handleTabClick(id);
    if (id === 'draw') { setActiveLayerId(null); setDrawTool('brush'); }
    setOpenTab(id);
  };
  // Leaving Draw stops drawing, so the canvas is back to moving layers.
  const leaveTab = () => {
    if (openTab === 'draw') { setDrawTool(null); setActiveSubmenu(null); }
    setOpenTab(null);
  };
  const runTool = (t) => {
    if (openTab === 'draw' && drawTool === t.id) { setDrawTool(null); setActiveSubmenu(null); return; }
    t.onClick();
  };
  const isOn = (t) => (openTab === 'draw' ? drawTool === t.id : Boolean(t.active));
  const isActive = (id) => activeTab === id || (id === 'canvas' && activeTab === 'watermark');

  if (activeLayerId || templateFaceMorph) {
    return (
      <div className="ie-island-wrap">
        <div className="ie-island ie-island--layer" role="toolbar" aria-label="Layer tools">
          {activeLayerId && (
            <>
              <Item Icon={Check} label="Done" className="ie-island-done" onClick={() => setActiveLayerId(null)} />
              <span className="ie-island-divider" aria-hidden="true" />
            </>
          )}
          <div className="ie-island-scroll">{layerTools}</div>
        </div>
      </div>
    );
  }

  const tab = openTab && TABS.find((t) => t.id === openTab);
  if (tab) {
    return (
      <div className="ie-island-wrap">
        <nav key={tab.id} className="ie-island ie-island--tools" aria-label={`${tab.label} tools`}>
          <Item Icon={ChevronLeft} label={tab.label} className="ie-island-back" onClick={leaveTab} aria-label="Back to sections" title="Back" />
          <span className="ie-island-divider" aria-hidden="true" />
          <div className="ie-island-scroll">
            {tools[tab.id].map((t) => (t.onFile ? (
              <label key={t.id} className="ie-island-item" title={t.title}>
                <t.Icon className="ie-island-icon" size={20} />
                <span className="ie-island-label">{t.label}</span>
                <input type="file" accept={t.accept} hidden onChange={t.onFile} />
              </label>
            ) : (
              <Item key={t.id} Icon={t.Icon} label={t.label} on={isOn(t)} title={t.title} aria-pressed={isOn(t)} onClick={() => runTool(t)} />
            )))}
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="ie-island-wrap">
      <nav className="ie-island" aria-label="Editor sections">
        {TABS.map((t) => (
          <Item key={t.id} Icon={t.Icon} label={t.label} on={isActive(t.id)} className="ie-island-tab" onClick={() => enterTab(t.id)} />
        ))}
      </nav>
    </div>
  );
}
