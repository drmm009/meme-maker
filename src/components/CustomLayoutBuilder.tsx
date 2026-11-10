// Choose a layout (the dock's Creator): a blank canvas, then rows of image grids, video caption
// layouts and social cards. Picking one opens it in the editor. In the editors' look (pageLook.css).
import { useState } from 'react';
import { LAYOUT_OPTIONS, MEME_TEMPLATES } from '../data/templates';
import { Clapperboard, Grid2x2, LayoutGrid, Minus, Plus, Share2, X } from 'lucide-react';
import './pages/pageLook.css';
import './CustomLayoutBuilder.css';

type Template = Record<string, unknown>;

interface LayoutOption {
  id: string;
  name: string;
  slots: number;
  cols?: number;
  rows?: number;
}

interface Caption {
  id: string;
  text: string;
  fontSize: number;
  y: number;
  align: string;
  color: string;
}

type VideoLayoutType = 'header' | 'footer' | 'both';

interface VideoLayoutOption {
  id: string;
  name: string;
  label: string;
  sub: string;
  layoutType: VideoLayoutType;
  defaultCaptions: Caption[];
}

const VIDEO_LAYOUT_OPTIONS: VideoLayoutOption[] = [
  {
    id: 'video-header',
    name: 'Header Text Video',
    label: 'Header text',
    sub: 'Caption on top',
    layoutType: 'header',
    defaultCaptions: [
      { id: 'v-cap-top', text: 'TOP HEADER TEXT', fontSize: 34, y: 0.08, align: 'center', color: '#ffffff' }
    ]
  },
  {
    id: 'video-footer',
    name: 'Footer Text Video',
    label: 'Footer text',
    sub: 'Caption below',
    layoutType: 'footer',
    defaultCaptions: [
      { id: 'v-cap-bottom', text: 'BOTTOM FOOTER TEXT', fontSize: 34, y: 0.9, align: 'center', color: '#ffffff' }
    ]
  },
  {
    id: 'video-both',
    name: 'Header & Footer Text',
    label: 'Header & footer',
    sub: 'Captions top and bottom',
    layoutType: 'both',
    defaultCaptions: [
      { id: 'v-cap-top', text: 'TOP HEADER TEXT', fontSize: 32, y: 0.08, align: 'center', color: '#ffffff' },
      { id: 'v-cap-bottom', text: 'BOTTOM FOOTER TEXT', fontSize: 32, y: 0.9, align: 'center', color: '#ffffff' }
    ]
  }
];

const SOCIAL_LAYOUT_OPTIONS = [
  { id: 'social-tweet-card', name: 'Tweet / X Post Card', label: 'X post', sub: 'Tweet with handle', imageUrl: './images/social-tweet-card.svg' },
  { id: 'social-instagram-card', name: 'Instagram Feed Post Card', label: 'Instagram post', sub: 'Square feed post', imageUrl: './images/social-instagram-card.svg' },
  { id: 'social-whatsapp-card', name: 'WhatsApp Chat Card', label: 'WhatsApp chat', sub: 'Chat bubbles', imageUrl: './images/social-whatsapp-card.svg' }
];

// "2 Panels (Top/Bottom)" → ["2 panels", "Top/Bottom"]
function splitName(name: string): [string, string] {
  const m = /^(.*?)\s*\((.*)\)\s*$/.exec(name);
  if (!m) return [name, ''];
  return [m[1].replace(/Panels/, 'panels'), m[2]];
}

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
    const dataUrl = canvas.toDataURL('image/png');
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
        { id: `cap-top-${Date.now()}`, text: 'TOP TEXT', x: 0.5, y: 0.12, fontSize: 48, color: '#ffffff', stroke: '#000000', fontFamily: 'Impact, sans-serif', align: 'center' },
        { id: `cap-bottom-${Date.now()}`, text: 'BOTTOM TEXT', x: 0.5, y: 0.88, fontSize: 48, color: '#ffffff', stroke: '#000000', fontFamily: 'Impact, sans-serif', align: 'center' }
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
  const generatedCaptions: Template[] = [];

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

// The panels of a grid, drawn as grey boxes.
function GridDiagram({ cols, rows, count }: { cols: number; rows: number; count: number }) {
  return (
    <span className="lb-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => <span key={i} className="lb-cell" />)}
    </span>
  );
}

const GRID_SHAPE: Record<string, [number, number]> = {
  '2-vert': [1, 2],
  '2-horiz': [2, 1],
  '3-stacked': [1, 3],
  '3-horiz': [3, 1],
  '4-grid': [2, 2]
};

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="lb-step-row">
      <span>{label}</span>
      <div className="lb-stepper">
        <button type="button" className="lb-step-btn" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= 1} onClick={() => onChange(Math.max(1, value - 1))}>
          <Minus size={16} />
        </button>
        <span className="lb-step-value" aria-live="polite">{value}</span>
        <button type="button" className="lb-step-btn" aria-label={`More ${label.toLowerCase()}`} disabled={value >= 6} onClick={() => onChange(Math.min(6, value + 1))}>
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

interface CustomLayoutBuilderProps {
  onLayoutComplete?: (template: Template) => void;
  onSelectTemplate?: (template: Template) => void;
}

export default function CustomLayoutBuilder({ onLayoutComplete, onSelectTemplate }: CustomLayoutBuilderProps) {
  const [isConfiguringCustom, setIsConfiguringCustom] = useState(false);
  const [customCols, setCustomCols] = useState(2);
  const [customRows, setCustomRows] = useState(2);

  const open = (template: Template) => {
    if (onSelectTemplate) onSelectTemplate(template);
    else onLayoutComplete?.(template);
  };

  const handleSelectLayoutOption = (layout: LayoutOption) => open(createLayoutTemplate(layout));

  const handleSelectVideoLayout = (opt: VideoLayoutOption) =>
    open({
      id: `custom-video-${opt.layoutType}-${Date.now()}`,
      name: opt.name,
      type: 'video',
      category: 'custom',
      width: 1080,
      height: 1080,
      aspectRatio: 1,
      videoLayout: opt.layoutType,
      defaultCaptions: opt.defaultCaptions
    });

  const handleSelectSocialCard = (card: (typeof SOCIAL_LAYOUT_OPTIONS)[number]) =>
    open(
      (MEME_TEMPLATES as Template[]).find((t) => t.id === card.id) || {
        id: card.id,
        name: card.name,
        category: 'social',
        type: 'image',
        imageUrl: card.imageUrl
      }
    );

  const layouts = LAYOUT_OPTIONS as LayoutOption[];
  const blank = layouts[0];
  const grids = layouts.filter((l) => l.id !== '1-panel' && l.id !== '3-hybrid');

  return (
    <div className="pg lb">
      <div className="pg-head">
        <h1 className="pg-title">Choose a layout</h1>
      </div>

      <button type="button" className="pg-card lb-blank" onClick={() => handleSelectLayoutOption(blank)}>
        <span className="lb-blank-canvas pg-pic" aria-hidden="true" />
        <span className="lb-blank-text">
          <span className="lb-name">Blank canvas</span>
          <span className="lb-sub">An empty square</span>
        </span>
        <span className="lb-blank-go">Start</span>
      </button>

      <section className="pg-section">
        <div className="pg-section-head">
          <LayoutGrid className="pg-section-icon" aria-hidden="true" />
          <h2 className="pg-section-title">Image layouts</h2>
        </div>
        {!isConfiguringCustom ? (
          <div className="pg-rail">
            {grids.map((layout) => {
              const [cols, rows] = GRID_SHAPE[layout.id] || [1, layout.slots];
              const [title, sub] = splitName(layout.name);
              return (
                <button key={layout.id} type="button" className="pg-card lb-card" onClick={() => handleSelectLayoutOption(layout)}>
                  <span className="lb-thumb"><GridDiagram cols={cols} rows={rows} count={layout.slots} /></span>
                  <span className="lb-info">
                    <span className="lb-name">{title}</span>
                    {sub && <span className="lb-sub">{sub}</span>}
                  </span>
                </button>
              );
            })}
            <button type="button" className="pg-card lb-card" onClick={() => setIsConfiguringCustom(true)}>
              <span className="lb-thumb"><Grid2x2 className="lb-custom-icon" aria-hidden="true" /></span>
              <span className="lb-info">
                <span className="lb-name">Custom grid</span>
                <span className="lb-sub">Pick rows and columns</span>
              </span>
            </button>
          </div>
        ) : (
          <div className="lb-custom">
            <div className="lb-custom-head">
              <h3 className="lb-custom-title">Custom grid</h3>
              <button type="button" className="lb-close" aria-label="Close custom grid" onClick={() => setIsConfiguringCustom(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="lb-custom-body">
              <span className="lb-custom-preview">
                <GridDiagram cols={customCols} rows={customRows} count={customCols * customRows} />
              </span>
              <div className="lb-custom-steps">
                <Stepper label="Columns" value={customCols} onChange={setCustomCols} />
                <Stepper label="Rows" value={customRows} onChange={setCustomRows} />
              </div>
            </div>
            <button
              type="button"
              className="pg-btn pg-btn--accent pg-btn--block"
              onClick={() =>
                handleSelectLayoutOption({
                  id: 'custom-grid',
                  name: `Custom ${customCols}x${customRows}`,
                  slots: customCols * customRows,
                  cols: customCols,
                  rows: customRows
                })
              }
            >
              Create {customCols * customRows} {customCols * customRows === 1 ? 'panel' : 'panels'}
            </button>
          </div>
        )}
      </section>

      <section className="pg-section">
        <div className="pg-section-head">
          <Clapperboard className="pg-section-icon" aria-hidden="true" />
          <h2 className="pg-section-title">Video layouts</h2>
        </div>
        <div className="pg-rail">
          {VIDEO_LAYOUT_OPTIONS.map((opt) => (
            <button key={opt.id} type="button" className="pg-card lb-card" onClick={() => handleSelectVideoLayout(opt)}>
              <span className="lb-thumb">
                <span className="lb-video" aria-hidden="true">
                  {opt.layoutType !== 'footer' && <span className="lb-bar">Text</span>}
                  <span className="lb-stage"><Clapperboard size={18} /></span>
                  {opt.layoutType !== 'header' && <span className="lb-bar">Text</span>}
                </span>
              </span>
              <span className="lb-info">
                <span className="lb-name">{opt.label}</span>
                <span className="lb-sub">{opt.sub}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="pg-section">
        <div className="pg-section-head">
          <Share2 className="pg-section-icon" aria-hidden="true" />
          <h2 className="pg-section-title">Social cards</h2>
        </div>
        <div className="pg-rail">
          {SOCIAL_LAYOUT_OPTIONS.map((card) => (
            <button key={card.id} type="button" className="pg-card lb-card" onClick={() => handleSelectSocialCard(card)}>
              <span className="lb-thumb lb-thumb--pic">
                <img src={card.imageUrl} alt="" loading="lazy" />
              </span>
              <span className="lb-info">
                <span className="lb-name">{card.label}</span>
                <span className="lb-sub">{card.sub}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
