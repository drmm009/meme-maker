import { Check } from 'lucide-react';
import { useMemeEditorStore } from './store/useMemeEditorStore';
import { useEditorUiStore } from './store/useEditorUiStore';
import { useTabTools } from './hooks/useTabTools';

// Tool groups, left to right; a thin divider separates them.
const GROUPS = ['text', 'images', 'draw', 'filters', 'canvas'];

// The editor's bottom bar: one scrolling row of round buttons (same style as the top bar), every
// tool one tap away. When a layer is selected its tools (layerTools) take over the row, with Done.
export default function EditorSidebar({ handleTabClick, toolHandlers, layerTools }) {
  const activeTab = useEditorUiStore((s) => s.activeTab);
  const drawTool = useEditorUiStore((s) => s.drawTool);
  const setDrawTool = useEditorUiStore((s) => s.setDrawTool);
  const setActiveSubmenu = useEditorUiStore((s) => s.setActiveSubmenu);
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);
  const templateFaceMorph = useMemeEditorStore((s) => s.templateFaceMorph);
  const tools = useTabTools(toolHandlers);

  // Each tool belongs to a group (the editor's activeTab): switch to it first, unless already there,
  // so a tool that toggles a settings bar can close it again.
  const run = (group, t) => {
    if (group === 'draw') {
      if (activeTab === 'draw' && drawTool === t.id) { setDrawTool(null); setActiveSubmenu(null); return; }
      handleTabClick('draw');
      setActiveLayerId(null);
      t.onClick();
      return;
    }
    if (group !== activeTab) handleTabClick(group);
    t.onClick?.();
  };
  const isOn = (group, t) => (group === 'draw' ? activeTab === 'draw' && drawTool === t.id : Boolean(t.active));

  if (activeLayerId || templateFaceMorph) {
    return (
      <div className="ie-bar ie-bar--layer" role="toolbar" aria-label="Layer tools">
        {activeLayerId && (
          <>
            <button type="button" className="ie-btn ie-btn--done" onClick={() => setActiveLayerId(null)}>
              <span className="ie-btn-circle"><Check size={19} strokeWidth={2.5} /></span>
              <span className="ie-btn-label">Done</span>
            </button>
            <span className="ie-bar-divider" aria-hidden="true" />
          </>
        )}
        {layerTools}
      </div>
    );
  }

  return (
    <div className="ie-bar" role="toolbar" aria-label="Editor tools">
      {GROUPS.map((group, gi) => (
        <div key={group} className="ie-bar-group">
          {gi > 0 && <span className="ie-bar-divider" aria-hidden="true" />}
          {tools[group].map((t) => (t.onFile ? (
            <label key={t.id} className="ie-btn" title={t.title} onClick={() => { if (group !== activeTab) handleTabClick(group); }}>
              <span className="ie-btn-circle"><t.Icon size={19} /></span>
              <span className="ie-btn-label">{t.label}</span>
              <input type="file" accept={t.accept} hidden onChange={t.onFile} />
            </label>
          ) : (
            <button
              key={t.id}
              type="button"
              className={`ie-btn${isOn(group, t) ? ' is-on' : ''}`}
              title={t.title}
              aria-pressed={isOn(group, t)}
              onClick={() => run(group, t)}
            >
              <span className="ie-btn-circle"><t.Icon size={19} /></span>
              <span className="ie-btn-label">{t.label}</span>
            </button>
          )))}
        </div>
      ))}
    </div>
  );
}
