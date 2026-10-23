import { Type, Sparkles, Copy, LayoutGrid, PencilLine } from 'lucide-react';
import { useMemeEditorStore } from './store/useMemeEditorStore';
import { useEditorUiStore } from './store/useEditorUiStore';

// The editor's tab dock. Each tab's tools appear in the toolbars above it
// (ContextToolbar / SecondaryToolbar), the same on phones and desktops.
export default function EditorSidebar({ handleTabClick, tabButtonsRef }) {
  const activeTab = useEditorUiStore((s) => s.activeTab);
  const setDrawTool = useEditorUiStore((s) => s.setDrawTool);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);

  return (
    <div className="editor-sidebar glass-card folded">
      <div
        ref={tabButtonsRef}
        className="tab-buttons"
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
      >
        <button
          className={`tab-btn ${activeTab === 'draw' ? 'active' : ''}`}
          onClick={() => {
            handleTabClick('draw');
            setActiveLayerId(null);
            setDrawTool('brush');
          }}
        >
          <PencilLine className="icon-xs" /> <span>Draw</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'images' ? 'active' : ''}`}
          onClick={() => handleTabClick('images')}
        >
          <Copy className="icon-xs" /> <span>Media</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => handleTabClick('text')}
        >
          <Type className="icon-xs" /> <span>Text</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'filters' ? 'active' : ''}`}
          onClick={() => handleTabClick('filters')}
        >
          <Sparkles className="icon-xs" /> <span>AI/Filters</span>
        </button>
        <button
          className={`tab-btn ${(activeTab === 'canvas' || activeTab === 'watermark') ? 'active' : ''}`}
          onClick={() => handleTabClick('canvas')}
        >
          <LayoutGrid className="icon-xs" /> <span>Canvas</span>
        </button>
      </div>
    </div>
  );
}
