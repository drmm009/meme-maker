// Choose Canvas Layout, in the pages' iOS look (pages/iosLook.css, CustomLayoutBuilder.css). The
// dock's Creator sheet (CreatorSheet.tsx) picks the kind (`kind`), and every layout here opens in
// that kind's editor: the video editor for a video meme, the image editor for an image meme. Under
// the title, one Blank Canvas row (an icon, its name, a line about it, a chevron), then two sections
// as grids of cards (a drawing, a short name and a detail line): Grid layout (panels, then Custom
// Grid) and Caption layout (a header bar, a footer bar, or both).
import { useEffect, useState } from 'react';
import { LAYOUT_OPTIONS } from '../data/templates';
import { ChevronRight, Grid3x3, ImageIcon, Minus, Play, Plus } from 'lucide-react';
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
  // Which editor every layout opens in: the image editor or the video editor; the Creator sheet picks it.
  kind?: 'image' | 'video';
  onLayoutComplete?: (template: Template) => void;
  onSelectTemplate?: (template: Template) => void;
}

// How a preset grid's panels are arranged, for its drawing.
const gridShape = (id: string) =>
  id === '2-vert' ? { cols: 1, rows: 2 }
    : id === '2-horiz' ? { cols: 2, rows: 1 }
      : id === '3-stacked' ? { cols: 1, rows: 3 }
        : id === '3-horiz' ? { cols: 3, rows: 1 }
          : id === '4-grid' ? { cols: 2, rows: 2 }
            : { cols: 1, rows: 1 };

// A preset's name split for its card: "2 Panels (Top/Bottom)" is "2 Panels" over "Top / Bottom".
const splitName = (name = '') => {
  const m = /^(.*?)\s*\((.*)\)$/.exec(name);
  return m ? { title: m[1], detail: m[2].replace(/\s*\/\s*/g, ' / ') } : { title: name, detail: '' };
};

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

// Blank Canvas, a wide row under the title: the place most people start.
function StartRow({ kind, detail, onClick }: { kind: 'image' | 'video'; detail: string; onClick: () => void }) {
  return (
    <button type="button" className="clb-start" onClick={onClick}>
      <span className="clb-start-pic" aria-hidden="true">
        {kind === 'video' ? <Play size={18} fill="currentColor" strokeWidth={0} /> : <span className="clb-start-frame" />}
      </span>
      <span className="clb-start-text">
        <span className="clb-start-name">Blank Canvas</span>
        <span className="clb-start-detail">{detail}</span>
      </span>
      <ChevronRight className="clb-start-go" aria-hidden="true" />
    </button>
  );
}

// A caption layout's TOP TEXT / BOTTOM TEXT: its box hugs the words, as the image editor's bar text.
const VIDEO_LAYOUT_OPTIONS = [
  {
    id: 'video-blank',
    name: 'Blank Canvas',
    label: 'Blank Canvas',
    detail: 'A video with no caption bars',
    description: 'Clean video canvas with no preset caption bars',
    layoutType: 'none',
    defaultCaptions: []
  },
  {
    id: 'video-header',
    name: 'Header Text Video',
    label: 'Top Caption',
    detail: 'Bar on top',
    description: 'Video canvas with top header text bar',
    layoutType: 'header',
    defaultCaptions: [
      { id: 'v-cap-top', text: 'TOP TEXT', fontSize: 60, y: 0.1, align: 'center', color: '#ffffff' }
    ]
  },
  {
    id: 'video-footer',
    name: 'Footer Text Video',
    label: 'Bottom Caption',
    detail: 'Bar at the bottom',
    description: 'Video canvas with bottom footer text bar',
    layoutType: 'footer',
    defaultCaptions: [
      { id: 'v-cap-bottom', text: 'BOTTOM TEXT', fontSize: 60, y: 0.9, align: 'center', color: '#ffffff' }
    ]
  },
  {
    id: 'video-both',
    name: 'Header & Footer Text',
    label: 'Top & Bottom',
    detail: 'Bars on both',
    description: 'Video canvas with both top & bottom caption bars',
    layoutType: 'both',
    defaultCaptions: [
      { id: 'v-cap-top', text: 'TOP TEXT', fontSize: 60, y: 0.1, align: 'center', color: '#ffffff' },
      { id: 'v-cap-bottom', text: 'BOTTOM TEXT', fontSize: 60, y: 0.9, align: 'center', color: '#ffffff' }
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
      // No text to start: the start card's Text pill adds some (ImageStartPrompt).
      defaultCaptions: []
    };
  }

  // Multi-panel grids: the image editor's own panels (a native layout). Each panel starts empty,
  // white, and takes a photo or text of its own (up to 4 panels, each with a start card there:
  // ImagePanelPrompts); the picture drawn here is only the template's thumbnail.
  const rects = panelRects(layout, width, height);
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    for (const r of rects) ctx.strokeRect(r.x, r.y, r.width, r.height);
  }
  const dataUrl = canvas.toDataURL ? canvas.toDataURL('image/png') : '';
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
    canvasBgColor: '#ffffff',
    isNativeLayout: true,
    layoutDef: { id: layout.id, slots: rects.length, ...(layout.id === 'custom-grid' ? { cols: layout.cols, rows: layout.rows } : {}) },
    slotImages: rects.map(() => null),
    defaultCaptions: [],
  };
};

// A preset or custom grid's panels as rectangles on a width x height canvas.
const panelRects = (layout: LayoutOption, width: number, height: number) => {
  const { cols, rows } = layout.id === 'custom-grid' ? { cols: layout.cols || 2, rows: layout.rows || 2 } : gridShape(layout.id);
  return Array.from({ length: cols * rows }, (_, i) => ({
    x: (i % cols) * (width / cols),
    y: Math.floor(i / cols) * (height / rows),
    width: width / cols,
    height: height / rows,
  }));
};

// A grid for the video editor: its panels (`slots`, on the editor's 800 x 600 canvas, 4:3) take a
// clip or photo each, and `layoutId` draws the divider lines.
const createVideoGridTemplate = (layout: LayoutOption): Template => ({
  id: `custom-video-${layout.id}-${Date.now()}`,
  name: layout.name || 'Custom Layout',
  type: 'video',
  category: 'custom',
  layoutId: layout.id,
  slots: panelRects(layout, 800, 600),
  width: 800,
  height: 600,
  defaultCaptions: [],
});

// A caption layout for the image editor: a blank canvas with the header bar, the footer bar or both
// switched on, black as the video editor's, each with its caption in it (white), big enough to read at a glance;
// the bar shrinks longer text to fit (canvasLayout's fitCaptionsToBands).
const createCaptionImageTemplate = (layoutType: string): Template => {
  const base = createLayoutTemplate({ id: '1-panel', name: 'Blank Canvas', slots: 1 });
  const top = layoutType === 'header' || layoutType === 'both';
  const bottom = layoutType === 'footer' || layoutType === 'both';
  const look = { x: 0.5, fontSize: 84, color: '#ffffff', stroke: 'transparent', fontFamily: 'Impact, sans-serif', align: 'center' };
  const stamp = Date.now();
  return {
    ...base,
    id: `custom-caption-${layoutType}-${stamp}`,
    name: 'Caption Layout',
    canvasHeader: { enabled: top, bgColor: '#000000', ownColor: true, height: 170 },
    canvasFooter: { enabled: bottom, bgColor: '#000000', ownColor: true, height: 170 },
    defaultCaptions: [
      ...(top ? [{ ...look, id: `cap-header-${stamp}`, text: 'TOP TEXT', y: 0.08, isHeaderCaption: true }] : []),
      ...(bottom ? [{ ...look, id: `cap-footer-${stamp}`, text: 'BOTTOM TEXT', y: 0.92, isFooterCaption: true }] : []),
    ],
  };
};

export default function CustomLayoutBuilder({
  kind = 'image',
  onLayoutComplete,
  onSelectTemplate
}: CustomLayoutBuilderProps) {
  // Each time the page opens (App remounts it on every Creator pick) it starts at the top, with the
  // Blank Canvas row in view, even when it was already showing further down.
  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, [kind]);
  const [isConfiguringCustom, setIsConfiguringCustom] = useState(false);
  const [customCols, setCustomCols] = useState(2);
  const [customRows, setCustomRows] = useState(2);

  const open = (template: Template) => {
    if (onSelectTemplate) onSelectTemplate(template);
    else if (onLayoutComplete) onLayoutComplete(template);
  };
  const isVideo = kind === 'video';

  // A grid (or Custom Grid), in the picked kind's editor.
  const handleSelectLayoutOption = (layout: LayoutOption) => {
    open(isVideo && layout.id !== '1-panel' ? createVideoGridTemplate(layout) : createLayoutTemplate(layout));
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
      // A caption layout's bars, on in the video editor like the image editor's.
      ...(layoutOption.layoutType === 'none' ? {} : {
        videoHeader: { enabled: layoutOption.layoutType !== 'footer', bgColor: '#000000', height: 120 },
        videoFooter: { enabled: layoutOption.layoutType !== 'header', bgColor: '#000000', height: 120 },
      }),
      defaultCaptions: layoutOption.defaultCaptions || []
    };

    open(videoTemplate);
  };

  // A caption layout, in the picked kind's editor.
  const handleSelectCaptionLayout = (layoutOption: VideoLayoutOption) => {
    if (isVideo) handleSelectVideoLayout(layoutOption);
    else open(createCaptionImageTemplate(layoutOption.layoutType));
  };

  const blankImage = (LAYOUT_OPTIONS.find((l: LayoutOption) => l.id === '1-panel') ?? LAYOUT_OPTIONS[0]) as LayoutOption;
  const imageLayouts: LayoutOption[] = LAYOUT_OPTIONS.filter((l: LayoutOption) => l.id !== '1-panel' && l.id !== '3-hybrid');
  const [blankVideo, ...videoLayouts] = VIDEO_LAYOUT_OPTIONS;


  return (
    <div className="clb ios ios-page">
      <header className="clb-nav">
        <h1 className="ios-title">Canvas Layout</h1>
        <p className="ios-subtitle">{isVideo ? 'Every layout opens in the video editor' : 'Every layout opens in the image editor'}</p>
      </header>

      {kind === 'video' ? (
        <StartRow kind="video" detail={blankVideo.detail} onClick={() => handleSelectVideoLayout(blankVideo)} />
      ) : (
        <StartRow kind="image" detail="An empty square to build on" onClick={() => handleSelectLayoutOption(blankImage)} />
      )}

      <section className="clb-section">
        <h2 className="ios-section-title">Grid layout</h2>
        <p className="ios-section-sub">{isVideo ? 'Clips side by side, stacked or in a grid' : 'Photos side by side, stacked or in a grid'}</p>
        {!isConfiguringCustom ? (
          <>
            <div className="clb-grid">
              {imageLayouts.map((layout) => {
                const { title, detail } = splitName(layout.name);
                return (
                  <button key={layout.id} type="button" className="clb-card" onClick={() => handleSelectLayoutOption(layout)}>
                    <span className="clb-card-pic" aria-hidden="true">
                      <GridGlyph {...gridShape(layout.id)} />
                    </span>
                    <span className="clb-card-name">{title}</span>
                    {detail && <span className="clb-card-detail">{detail}</span>}
                  </button>
                );
              })}
              <button type="button" className="clb-card" onClick={() => setIsConfiguringCustom(true)}>
                <span className="clb-card-pic" aria-hidden="true">
                  <Grid3x3 className="clb-card-icon" />
                </span>
                <span className="clb-card-name">Custom Grid</span>
                <span className="clb-card-detail">Rows & columns</span>
              </button>
            </div>
          </>
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

      <section className="clb-section">
        <h2 className="ios-section-title">Caption layout</h2>
        <p className="ios-section-sub">{isVideo ? 'Caption bars above and below the clip' : 'Caption bars above and below the picture'}</p>
        <div className="clb-grid">
          {videoLayouts.map((opt) => (
            <button key={opt.id} type="button" className="clb-card" onClick={() => handleSelectCaptionLayout(opt)}>
              <span className="clb-card-pic" aria-hidden="true">
                <span className="clb-video">
                  {opt.layoutType !== 'footer' && <span className="clb-video-bar" />}
                  <span className="clb-video-stage">
                    {isVideo ? <Play size={16} fill="currentColor" strokeWidth={0} /> : <ImageIcon size={16} />}
                  </span>
                  {opt.layoutType !== 'header' && <span className="clb-video-bar" />}
                </span>
              </span>
              <span className="clb-card-name">{opt.label}</span>
              <span className="clb-card-detail">{opt.detail}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
