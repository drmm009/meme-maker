import React, { useState } from 'react';
import { LAYOUT_OPTIONS, MEME_TEMPLATES } from '../data/templates';
import { Image as ImageIcon, X, Plus, Minus, Grid, Clapperboard, Share2, Type } from 'lucide-react';
import { motion } from 'framer-motion';
import './CustomLayoutBuilder.css';

export const VIDEO_LAYOUT_OPTIONS = [
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

export const SOCIAL_LAYOUT_OPTIONS = [
  {
    id: 'social-tweet-card',
    name: 'Tweet / X Post Card',
    description: 'Verified tweet format with metrics & handle',
    badge: '𝕏 Post',
    imageUrl: './images/social-tweet-card.svg'
  },
  {
    id: 'social-instagram-card',
    name: 'Instagram Feed Post',
    description: 'Square post format with username & avatar',
    badge: 'Instagram',
    imageUrl: './images/social-instagram-card.svg'
  },
  {
    id: 'social-whatsapp-card',
    name: 'WhatsApp Chat Card',
    description: 'Realistic chat format with speech bubbles',
    badge: 'WhatsApp',
    imageUrl: './images/social-whatsapp-card.svg'
  }
];

export const createLayoutTemplate = (layout) => {
  const width = 800;
  const height = 800;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (layout.id === '1-panel') {
    // Blank Canvas: crisp white base
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
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
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;

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

    ctx.strokeRect(x, y, slotW, slotH);

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
  savedState,
  onSaveState,
  onLayoutComplete,
  onSelectTemplate,
  onBack,
  _onBack
}) {
  const [isConfiguringCustom, setIsConfiguringCustom] = useState(false);
  const [customCols, setCustomCols] = useState(2);
  const [customRows, setCustomRows] = useState(2);

  const handleSelectLayoutOption = (layout) => {
    const template = createLayoutTemplate(layout);
    if (onSelectTemplate) {
      onSelectTemplate(template);
    } else if (onLayoutComplete) {
      onLayoutComplete(template);
    }
  };

  const handleSelectVideoLayout = (layoutOption) => {
    const videoTemplate = {
      id: `custom-video-${layoutOption.layoutType}-${Date.now()}`,
      name: layoutOption.name,
      type: 'video',
      category: 'custom',
      width: 1080,
      height: 1080,
      aspectRatio: 1,
      videoLayout: layoutOption.layoutType,
      defaultCaptions: layoutOption.defaultCaptions || []
    };

    if (onSelectTemplate) {
      onSelectTemplate(videoTemplate);
    } else if (onLayoutComplete) {
      onLayoutComplete(videoTemplate);
    }
  };

  const handleSelectSocialCard = (cardId) => {
    const template = MEME_TEMPLATES.find((t) => t.id === cardId) || {
      id: cardId,
      name:
        cardId === 'social-tweet-card'
          ? 'Tweet / X Post Card'
          : cardId === 'social-instagram-card'
          ? 'Instagram Feed Post Card'
          : 'WhatsApp Chat Card',
      category: 'social',
      type: 'image',
      imageUrl: `./images/${cardId}.svg`
    };

    if (onSelectTemplate) {
      onSelectTemplate(template);
    } else if (onLayoutComplete) {
      onLayoutComplete(template);
    }
  };

  return (
    <div className="custom-layout-builder">
      {/* CHOOSE CANVAS LAYOUT BODY */}
      <div className="choose-layout-scroll-body step-selection-area animate-fade-in">
        <div className="choose-canvas-layout-title-section">
          <h2 className="choose-canvas-layout-heading">Choose Canvas Layout</h2>
        </div>

        {/* Prominent Blank Canvas Card */}
        <div className="blank-canvas-section">
          <div
            className="icon-layout-card glass-card blank-canvas-card hover-lift"
            onClick={() => handleSelectLayoutOption(LAYOUT_OPTIONS[0])}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleSelectLayoutOption(LAYOUT_OPTIONS[0]);
            }}
          >
            <div className="wireframe-container blank-wf-wrap">
              <div className="layout-wireframe grid-1-panel">
                <div className="wf-box" />
              </div>
            </div>
            <div className="blank-canvas-text-wrap">
              <span className="icon-layout-label blank-canvas-title">
                {LAYOUT_OPTIONS[0].name}
              </span>
              <span className="blank-canvas-badge">Recommended</span>
            </div>
          </div>
        </div>

        {/* ── SHELF 1: IMAGE LAYOUTS ── */}
        <section className="curated-shelf-section layout-shelf-section">
          <div className="shelf-header-row">
            <div className="shelf-title-left">
              <div className="shelf-icon-badge">
                <ImageIcon size={20} />
              </div>
              <div>
                <h3 className="shelf-heading">Image Layout</h3>
                <p className="shelf-subtext">Multi-panel grids &amp; custom layouts</p>
              </div>
            </div>
          </div>
          {!isConfiguringCustom ? (
            <div className="shelf-horizontal-scroll">
              {LAYOUT_OPTIONS.filter((l) => l.id !== '1-panel' && l.id !== '3-hybrid').map((layout) => (
                <div
                  key={layout.id}
                  className="shelf-meme-card layout-shelf-card"
                  onClick={() => handleSelectLayoutOption(layout)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="shelf-card-thumb-wrap layout-thumb-wrap">
                    <div className="wireframe-container layout-wf-container">
                      <div className={`layout-wireframe grid-${layout.id}`}>
                        {Array.from({ length: layout.slots }).map((_, idx) => (
                          <div key={idx} className="wf-box" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="shelf-card-info">
                    <span className="shelf-card-name">{layout.name}</span>
                  </div>
                </div>
              ))}
              <div
                className="shelf-meme-card layout-shelf-card custom-grid-shelf-card"
                onClick={() => setIsConfiguringCustom(true)}
                role="button"
                tabIndex={0}
              >
                <div className="shelf-card-thumb-wrap layout-thumb-wrap">
                  <div className="custom-grid-icon-box">
                    <Grid style={{ color: 'var(--poster-orange)', width: '38px', height: '38px', filter: 'drop-shadow(0 0 6px rgba(255, 94, 54, 0.4))' }} />
                  </div>
                </div>
                <div className="shelf-card-info">
                  <span className="shelf-card-name">Custom Grid</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <motion.div
                className="glass-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{ padding: '20px', borderRadius: '16px', width: '100%', maxWidth: '350px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0 }}>Custom Grid Size</h4>
                  <div style={{ cursor: 'pointer', color: '#ff4d4d', display: 'flex', alignItems: 'center' }} onClick={() => setIsConfiguringCustom(false)}>
                    <X className="icon-sm" />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                  <div className="flex-between">
                    <span>Columns</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-main)', padding: '4px', borderRadius: '8px' }}>
                      <button className="btn btn-icon btn-xs" onClick={() => setCustomCols(Math.max(1, customCols - 1))}><Minus className="icon-xs" /></button>
                      <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{customCols}</span>
                      <button className="btn btn-icon btn-xs" onClick={() => setCustomCols(Math.min(6, customCols + 1))}><Plus className="icon-xs" /></button>
                    </div>
                  </div>
                  <div className="flex-between">
                    <span>Rows</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-main)', padding: '4px', borderRadius: '8px' }}>
                      <button className="btn btn-icon btn-xs" onClick={() => setCustomRows(Math.max(1, customRows - 1))}><Minus className="icon-xs" /></button>
                      <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{customRows}</span>
                      <button className="btn btn-icon btn-xs" onClick={() => setCustomRows(Math.min(6, customRows + 1))}><Plus className="icon-xs" /></button>
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px' }}
                  onClick={() => {
                    handleSelectLayoutOption({
                      id: 'custom-grid',
                      name: `Custom ${customCols}x${customRows}`,
                      slots: customCols * customRows,
                      cols: customCols,
                      rows: customRows
                    });
                  }}
                >
                  Create {customCols * customRows} Panels
                </button>
              </motion.div>
            </div>
          )}
        </section>

        {/* ── SHELF 2: VIDEO LAYOUTS ── */}
        <section className="curated-shelf-section layout-shelf-section">
          <div className="shelf-header-row">
            <div className="shelf-title-left">
              <div className="shelf-icon-badge">
                <Clapperboard size={20} />
              </div>
              <div>
                <h3 className="shelf-heading">Video Layout</h3>
                <p className="shelf-subtext">Caption bars on video canvas</p>
              </div>
            </div>
          </div>
          <div className="shelf-horizontal-scroll">
            {VIDEO_LAYOUT_OPTIONS.map((opt) => (
              <div
                key={opt.id}
                className="shelf-meme-card layout-shelf-card"
                onClick={() => handleSelectVideoLayout(opt)}
                role="button"
                tabIndex={0}
              >
                <div className="shelf-card-thumb-wrap layout-thumb-wrap">
                  <div className={`video-wireframe-display ${opt.layoutType === 'header' ? 'header-layout-display' : opt.layoutType === 'footer' ? 'footer-layout-display' : 'both-layout-display'} layout-shelf-video-wf`}>
                    {(opt.layoutType === 'header' || opt.layoutType === 'both') && (
                      <div className="video-wf-bar top-text-bar">
                        <Type size={9} className="video-wf-type-icon" />
                        <span>HEADER</span>
                      </div>
                    )}
                    <div className={`video-wf-stage ${opt.layoutType === 'both' ? 'compact-stage' : ''}`}>
                      <Clapperboard size={18} className="video-stage-icon" />
                    </div>
                    {(opt.layoutType === 'footer' || opt.layoutType === 'both') && (
                      <div className="video-wf-bar bottom-text-bar">
                        <Type size={9} className="video-wf-type-icon" />
                        <span>FOOTER</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="shelf-card-info">
                  <span className="shelf-card-name">{opt.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SHELF 3: SOCIAL CARDS ── */}
        <section className="curated-shelf-section layout-shelf-section">
          <div className="shelf-header-row">
            <div className="shelf-title-left">
              <div className="shelf-icon-badge">
                <Share2 size={20} />
              </div>
              <div>
                <h3 className="shelf-heading">Social Cards</h3>
                <p className="shelf-subtext">Twitter, WhatsApp &amp; Instagram</p>
              </div>
            </div>
          </div>
          <div className="shelf-horizontal-scroll">
            {SOCIAL_LAYOUT_OPTIONS.map((card) => (
              <div
                key={card.id}
                className="shelf-meme-card layout-shelf-card social-shelf-card"
                onClick={() => handleSelectSocialCard(card.id)}
                role="button"
                tabIndex={0}
              >
                <div className="shelf-card-thumb-wrap">
                  <img src={card.imageUrl} alt={card.name} className="shelf-card-img" />
                  <div className={`shelf-card-views social-deck-badge badge-${card.id}`}>
                    {card.badge}
                  </div>
                </div>
                <div className="shelf-card-info">
                  <span className="shelf-card-name">{card.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
