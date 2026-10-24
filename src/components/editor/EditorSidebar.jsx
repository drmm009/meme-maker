import { useState } from 'react';
import { Type, Sparkles, ImagePlus, LayoutGrid, PencilLine, ChevronLeft } from 'lucide-react';
import { useMemeEditorStore } from './store/useMemeEditorStore';
import { useEditorUiStore } from './store/useEditorUiStore';
import { useTabTools } from './hooks/useTabTools';

const TABS = [
  { id: 'draw', label: 'Draw', Icon: PencilLine },
  { id: 'images', label: 'Media', Icon: ImagePlus },
  { id: 'text', label: 'Text', Icon: Type },
  { id: 'filters', label: 'AI/Filters', Icon: Sparkles },
  { id: 'canvas', label: 'Canvas', Icon: LayoutGrid },
];

// The editor's dock, styled like the app's bottom nav. Tapping a tab swaps the dock to that tab's
// tools, with a back button that returns to the tabs; a selected layer's tools show in the
// toolbar above.
export default function EditorSidebar({ handleTabClick, toolHandlers }) {
  const activeTab = useEditorUiStore((s) => s.activeTab);
  const setDrawTool = useEditorUiStore((s) => s.setDrawTool);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);
  const tools = useTabTools(toolHandlers);
  const [openTab, setOpenTab] = useState(null); // tab whose tools fill the dock, or null for the tabs

  const enterTab = (tab) => {
    handleTabClick(tab.id);
    if (tab.id === 'draw') { setActiveLayerId(null); setDrawTool('brush'); }
    setOpenTab(tab.id);
  };

  const isActive = (id) => activeTab === id || (id === 'canvas' && activeTab === 'watermark');
  const tab = openTab && TABS.find((t) => t.id === openTab);

  if (tab) {
    return (
      <div className="ie-dock-wrap">
        <nav key={tab.id} className="ie-dock ie-dock--tools" aria-label={`${tab.label} tools`}>
          <button type="button" className="ie-tab ie-tab--back" onClick={() => setOpenTab(null)} aria-label="Back to sections" title="Back">
            <ChevronLeft className="ie-tab-icon" size={22} />
            <span className="ie-tab-label">{tab.label}</span>
          </button>
          <span className="ie-dock-divider" aria-hidden="true" />
          <div className="ie-dock-tools">
            {tools[tab.id].map((t) => (t.onFile ? (
              <label key={t.id} className="ie-tab ie-tool" title={t.title}>
                <t.Icon className="ie-tab-icon" size={20} />
                <span className="ie-tab-label">{t.label}</span>
                <input type="file" accept={t.accept} hidden onChange={t.onFile} />
              </label>
            ) : (
              <button
                key={t.id}
                type="button"
                className={`ie-tab ie-tool${t.active ? ' is-active' : ''}`}
                title={t.title}
                onClick={t.onClick}
              >
                <t.Icon className="ie-tab-icon" size={20} />
                <span className="ie-tab-label">{t.label}</span>
                {t.active && <span className="ie-tab-dot" />}
              </button>
            )))}
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="ie-dock-wrap">
      <nav className="ie-dock" aria-label="Editor sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`ie-tab${isActive(t.id) ? ' is-active' : ''}`}
            onClick={() => enterTab(t)}
          >
            <t.Icon className="ie-tab-icon" size={20} />
            <span className="ie-tab-label">{t.label}</span>
            {isActive(t.id) && <span className="ie-tab-dot" />}
          </button>
        ))}
      </nav>
    </div>
  );
}
