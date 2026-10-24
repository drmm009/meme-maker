import { useEffect, useRef, useState } from 'react';
import { Type, Sparkles, ImagePlus, LayoutGrid, PencilLine } from 'lucide-react';
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
const MENU_W = 196;

// The editor's tab dock, styled like the app's bottom nav. Tapping a tab selects it and opens a
// drop-up menu of its tools (tapping it again closes the menu); a selected layer's tools show in
// the toolbar above instead.
export default function EditorSidebar({ handleTabClick, toolHandlers }) {
  const activeTab = useEditorUiStore((s) => s.activeTab);
  const setDrawTool = useEditorUiStore((s) => s.setDrawTool);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const tools = useTabTools(toolHandlers);
  const [menu, setMenu] = useState(null); // { tab, left }
  const wrapRef = useRef(null);

  // Tapping elsewhere closes the menu; so does selecting a layer.
  useEffect(() => {
    if (!menu) return undefined;
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setMenu(null); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [menu]);
  useEffect(() => { if (activeLayerId) setMenu(null); }, [activeLayerId]);

  const openTab = (tab, el) => {
    if (menu?.tab === tab.id) { setMenu(null); return; }
    handleTabClick(tab.id);
    if (tab.id === 'draw') { setActiveLayerId(null); setDrawTool('brush'); }
    const wrap = wrapRef.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const center = r.left + r.width / 2 - wrap.left;
    setMenu({ tab: tab.id, left: Math.max(8, Math.min(wrap.width - MENU_W - 8, center - MENU_W / 2)) });
  };

  const isActive = (id) => activeTab === id || (id === 'canvas' && activeTab === 'watermark');
  const menuTools = menu ? tools[menu.tab] : null;
  const menuTab = menu && TABS.find((t) => t.id === menu.tab);

  return (
    <div className="ie-dock-wrap" ref={wrapRef}>
      {menuTools && (
        <div className="ie-dropup" role="menu" aria-label={`${menuTab.label} tools`} style={{ left: menu.left, width: MENU_W }}>
          {menuTools.map((t) => (t.onFile ? (
            <label key={t.id} className="ie-dropup-item" role="menuitem" title={t.title}>
              <t.Icon size={20} />
              <span>{t.label}</span>
              <input type="file" accept={t.accept} hidden onChange={(e) => { setMenu(null); t.onFile(e); }} />
            </label>
          ) : (
            <button
              key={t.id}
              type="button"
              role="menuitem"
              className={`ie-dropup-item${t.active ? ' is-on' : ''}`}
              title={t.title}
              onClick={() => { setMenu(null); t.onClick(); }}
            >
              <t.Icon size={20} />
              <span>{t.label}</span>
            </button>
          )))}
        </div>
      )}
      <nav className="ie-dock" aria-label="Editor sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`ie-tab${isActive(tab.id) ? ' is-active' : ''}`}
            aria-expanded={menu?.tab === tab.id}
            onClick={(e) => openTab(tab, e.currentTarget)}
          >
            <tab.Icon className="ie-tab-icon" size={20} />
            <span className="ie-tab-label">{tab.label}</span>
            {isActive(tab.id) && <span className="ie-tab-dot" />}
          </button>
        ))}
      </nav>
    </div>
  );
}
