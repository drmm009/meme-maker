// Choose Canvas Layout (the dock's Creator), in the pages' iOS look (pages/iosLook.css,
// CustomLayoutBuilder.css): shelves of image grids (with Blank Canvas & Custom Grid),
// and video caption layouts. Picking one opens it in the editor.
import { useState } from 'react';
import { LAYOUT_OPTIONS } from '../data/templates';
import { Grid3x3, Minus, Play, Plus } from 'lucide-react';
import SegmentedControl, { Segment } from './pages/SegmentedControl';
import './pages/iosLook.css';
import './CustomLayoutBuilder.css';

type Template = Record<string, unknown>;

interface LayoutOption {
  id: string;
  name?: string;
  slots: number;
  cols?: number;
  rows?: number;
}

type VideoLayoutOption = (typeof VIDEO_LAYOUT_OPTIONS)[number];

interface CustomLayoutBuilderProps {
  onLayoutComplete?: (template: Template) => void;
  onSelectTemplate?: (template: Template) => void;
}

const TABS: Segment[] = [
  { id: 'all', label: 'All' },
  { id: 'image', label: 'Image' },
  { id: 'video', label: 'Video' },
];

// How a preset grid's panels are arranged, for its drawing.
const gridShape = (id: string) =>
  id === '2-vert' ? { cols: 1, rows: 2 }
    : id === '2-horiz' ? { cols: 2, rows: 1 }
      : id === '3-stacked' ? { cols: 1, rows: 3 }
        : id === '3-horiz' ? { cols: 3, rows: 1 }
          : id === '4-grid' ? { cols: 2, rows: 2 }
            : { cols: 1, rows: 1 };

// A small drawing of a grid of panels.
function GridGlyph({ cols, rows }: { cols: number; rows: number }) {
  return (
    <span className="clb-glyph" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
      {Array.from({ length: cols * rows }, (_, i) => (
        <span key={i} />
      ))}
    </span>
  );
}

// Minus and plus around a number from 1 to 6.
function Stepper({ value, unit, onChange }: { value: number; unit: string; onChange: (value: number) => void }) {
  return (
    <span className="clb-stepper-wrap">
      <output className="clb-stepper-value">{value}</output>
      <span className="clb-stepper">
        <button type="button" aria-label={`Fewer ${unit}`} disabled={value <= 1} onClick={() => onChange(Math.max(1, value - 1))}>
          <Minus size={17} aria-hidden="true" />
        </button>
        <button type="button" aria-label={`More ${unit}`} disabled={value >= 6} onClick={() => onChange(Math.min(6, value + 1))}>
          <Plus size={17} aria-hidden="true" />
        </button>
      </span>
    </span>
  );
}

const VIDEO_LAYOUT_OPTIONS = [
  {
    id: 'video-blank',
    name: 'Blank Canvas',
    description: 'Clean video canvas with no preset caption bars',
    layoutType: 'none',
    defaultCaptions: []
  },
  {
    id: 'video-header',
    name: 'Header Text Video',
    description: 'Video canvas with top header text bar',
    layoutType: 'header',
    defaultCaptions: [
      { id: 'v-cap-top', text: 'TOP HEADER TEXT', fontSize: 34, y: 0.08, align: 'center', color: '#ffffff' }
    ]
  },
  {
    id: 'video-footer',
    name: 'Footer Text Video',
    description: 'Video canvas with bottom footer text bar',
    layoutType: 'footer',
    defaultCaptions: [
      { id: 'v-cap-bottom', text: 'BOTTOM FOOTER TEXT', fontSize: 34, y: 0.90, align: 'center', color: '#ffffff' }
    ]
  },
  {
    id: 'video-both',
    name: 'Header & Footer Text',
    description: 'Video canvas with both top & bottom caption bars',
    layoutType: 'both',
    defaultCaptions: [
      { id: 'v-cap-top', text: 'TOP HEADER TEXT', fontSize: 32, y: 0.08, align: 'center', color: '#ffffff' },
      { id: 'v-cap-bottom', text: 'BOTTOM FOOTER TEXT', fontSize: 32, y: 0.90, align: 'center', color: '#ffffff' }
    ]
  }
];

const createLayoutTemplate = (layout: LayoutOption): Template => {
  const width = 800;
  const height = 800;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (layout.id === '1-panel') {
    // Blank Canvas: crisp white base
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
    const dataUrl = canvas.toDataURL ? canvas.toDataURL('image/png') : '';
    return {
      id: `custom-1-panel-${Date.now()}`,
      name: 'Blank Canvas',
      layoutId: '1-panel',
      imageUrl: dataUrl,
      rawImageUrl: dataUrl,
      width,
      height,
      aspectRatio: 1,
      category: 'custom',
      // A real empty canvas: the white picture is only its thumbnail, so Canvas Style's colour shows.
      canvasOnly: true,
      canvasBgColor: '#ffffff',
      defaultCaptions: [
        {
          id: `cap-top-${Date.now()}`,
          text: 'TOP TEXT',
          x: 0.5,
          y: 0.12,
          fontSize: 48,
          color: '#ffffff',
          stroke: '#000000',
          fontFamily: 'Impact, sans-serif',
          align: 'center'
        },
        {
          id: `cap-bottom-${Date.now()}`,
          text: 'BOTTOM TEXT',
          x: 0.5,
          y: 0.88,
          fontSize: 48,
          color: '#ffffff',
          stroke: '#000000',
          fontFamily: 'Impact, sans-serif',
          align: 'center'
        }
      ]
    };
  }

  // Multi-panel grids
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
  }

  const totalSlots = layout.slots;
  const generatedCaptions = [];

  for (let idx = 0; idx < totalSlots; idx++) {
    const isVert = layout.id === '2-vert' || layout.id === '3-stacked';
    const isHoriz = layout.id === '2-horiz' || layout.id === '3-horiz';
    const isGrid = layout.id === '4-grid';
    let slotW = width, slotH = height, x = 0, y = 0;

    if (isVert) {
      slotH = height / totalSlots;
      y = idx * slotH;
    } else if (isHoriz) {
      slotW = width / totalSlots;
      x = idx * slotW;
    } else if (isGrid) {
      slotW = width / 2;
      slotH = height / 2;
      x = (idx % 2) * slotW;
      y = Math.floor(idx / 2) * slotH;
    } else if (layout.id === 'custom-grid') {
      const cols = layout.cols || 2;
      const rows = layout.rows || 2;
      slotW = width / cols;
      slotH = height / rows;
      x = (idx % cols) * slotW;
      y = Math.floor(idx / cols) * slotH;
    }

    ctx?.strokeRect(x, y, slotW, slotH);

    generatedCaptions.push({
      id: `cap-auto-${Date.now()}-${idx}`,
      text: `TEXT ${idx + 1}`,
      x: (x + slotW / 2) / width,
      y: (y + slotH / 2) / height,
      width: (slotW / width) * 0.85,
      fontSize: totalSlots > 2 ? 32 : 44,
      color: '#ffffff',
      stroke: '#000000',
      fontFamily: 'Impact, sans-serif',
      align: 'center'
    });
  }

  const dataUrl = canvas.toDataURL('image/png');
  return {
    id: `custom-${layout.id}-${Date.now()}`,
    name: layout.name || 'Custom Layout',
    layoutId: layout.id,
    imageUrl: dataUrl,
    rawImageUrl: dataUrl,
    width,
    height,
    aspectRatio: 1,
    category: 'custom',
    defaultCaptions: generatedCaptions
  };
};

export default function CustomLayoutBuilder({
  onLayoutComplete,
  onSelectTemplate
}: CustomLayoutBuilderProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'image' | 'video'>('all');
  const [isConfiguringCustom, setIsConfiguringCustom] = useState(false);
  const [customCols, setCustomCols] = useState(2);
  const [customRows, setCustomRows] = useState(2);

  const handleSelectLayoutOption = (layout: LayoutOption) => {
    const template = createLayoutTemplate(layout);
    if (onSelectTemplate) {
      onSelectTemplate(template);
    } else if (onLayoutComplete) {
      onLayoutComplete(template);
    }
  };

  const handleSelectVideoLayout = (layoutOption: VideoLayoutOption) => {
    const videoTemplate: Template = {
      id: `custom-video-${layoutOption.layoutType}-${Date.now()}`,
      name: layoutOption.name,
      type: 'video',
      category: 'custom',
      width: 1080,
      height: 1080,
      aspectRatio: 1,
      videoLayout: layoutOption.layoutType === 'none' ? undefined : layoutOption.layoutType,
      defaultCaptions: layoutOption.defaultCaptions || []
    };

    if (onSelectTemplate) {
      onSelectTemplate(videoTemplate);
    } else if (onLayoutComplete) {
      onLayoutComplete(videoTemplate);
    }
  };

  const imageLayouts: LayoutOption[] = [
    LAYOUT_OPTIONS[0],
    ...LAYOUT_OPTIONS.filter((l: LayoutOption) => l.id !== '1-panel' && l.id !== '3-hybrid')
  ];

  const showImage = activeTab === 'all' || activeTab === 'image';
  const showVideo = activeTab === 'all' || activeTab === 'video';

  return (
    <div className="clb ios ios-page">
      <header className="clb-nav">
        <h1 className="ios-title">Canvas Layout</h1>
        <p className="ios-subtitle">Choose a layout or start with a blank canvas</p>
        <SegmentedControl
          label="Layout category"
          segments={TABS}
          value={activeTab}
          onChange={(id) => setActiveTab(id as 'all' | 'image' | 'video')}
          className="clb-segments"
        />
      </header>

      {showImage && (
        <section className="clb-section">
          <h2 className="ios-section-title">Image Layout</h2>
          <p className="ios-section-sub">Multi-panel grids and custom layouts</p>
          {!isConfiguringCustom ? (
            <div className="clb-shelf">
              {imageLayouts.map((layout) => (
                <button
                  key={layout.id}
                  type="button"
                  className={`clb-card ${layout.id === '1-panel' ? 'clb-card--blank' : ''}`}
                  onClick={() => handleSelectLayoutOption(layout)}
                >
                  <span className="clb-card-pic" aria-hidden="true">
                    <GridGlyph {...gridShape(layout.id)} />
                  </span>
                  <span className="clb-card-name">{layout.name}</span>
                  {layout.id === '1-panel' && <span className="clb-card-sub">Recommended</span>}
                </button>
              ))}
              <button type="button" className="clb-card clb-card--custom" onClick={() => setIsConfiguringCustom(true)}>
                <span className="clb-card-pic" aria-hidden="true">
                  <Grid3x3 className="clb-card-icon" />
                </span>
                <span className="clb-card-name">Custom Grid</span>
              </button>
            </div>
          ) : (
            <div className="clb-custom">
              <span className="clb-custom-preview" aria-hidden="true">
                <GridGlyph cols={customCols} rows={customRows} />
              </span>
              <div className="clb-form">
                <div className="clb-form-row">
                  <span className="clb-form-label">Columns</span>
                  <Stepper value={customCols} unit="columns" onChange={setCustomCols} />
                </div>
                <div className="clb-form-row">
                  <span className="clb-form-label">Rows</span>
                  <Stepper value={customRows} unit="rows" onChange={setCustomRows} />
                </div>
              </div>
              <div className="clb-custom-actions">
                <button type="button" className="ios-btn ios-btn--gray" onClick={() => setIsConfiguringCustom(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="ios-btn ios-btn--filled"
                  onClick={() =>
                    handleSelectLayoutOption({
                      id: 'custom-grid',
                      name: `Custom ${customCols}x${customRows}`,
                      slots: customCols * customRows,
                      cols: customCols,
                      rows: customRows,
                    })
                  }
                >
                  Create {customCols * customRows} {customCols * customRows === 1 ? 'Panel' : 'Panels'}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {showVideo && (
        <section className="clb-section">
          <h2 className="ios-section-title">Video Layout</h2>
          <p className="ios-section-sub">Caption bars on a video canvas</p>
          <div className="clb-shelf">
            {VIDEO_LAYOUT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`clb-card ${opt.id === 'video-blank' ? 'clb-card--blank' : ''}`}
                onClick={() => handleSelectVideoLayout(opt)}
              >
                <span className="clb-card-pic" aria-hidden="true">
                  <span className="clb-video">
                    {opt.layoutType === 'none' ? (
                      <span className="clb-video-stage clb-video-stage--blank">
                        <Play size={18} fill="currentColor" strokeWidth={0} />
                      </span>
                    ) : (
                      <>
                        {opt.layoutType !== 'footer' && <span className="clb-video-bar" />}
                        <span className="clb-video-stage">
                          <Play size={16} fill="currentColor" strokeWidth={0} />
                        </span>
                        {opt.layoutType !== 'header' && <span className="clb-video-bar" />}
                      </>
                    )}
                  </span>
                </span>
                <span className="clb-card-name">{opt.name}</span>
                {opt.id === 'video-blank' && <span className="clb-card-sub">Recommended</span>}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
