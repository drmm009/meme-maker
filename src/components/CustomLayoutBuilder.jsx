import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LAYOUT_OPTIONS, MEME_TEMPLATES, CATEGORIES } from '../data/templates';
import { fetchOpenSourceMemes } from '../services/memeService';
import { Upload, ArrowRight, ArrowLeft, Move, ZoomIn, ZoomOut, RefreshCw, Sparkles, Image as ImageIcon, X, Search, Plus, Minus, Type, Square, Smartphone, Monitor, RectangleVertical, Grid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ModalPortal from './ModalPortal';

const isVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  if (url.includes('#type=video')) return true;
  if (url.includes('#type=image')) return false;
  if (url.startsWith('data:video/')) return true;
  if (url.startsWith('data:image/')) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
};

const getCleanMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  return url.replace(/#type=(video|image)$/, '');
};

export default function CustomLayoutBuilder({
  savedState,
  onSaveState,
  onLayoutComplete,
  onBack
}) {
  const [step, setStep] = useState(savedState?.step || 1); // Step 1: Layout Selection | Step 2: Populate Images
  const [selectedLayout, setSelectedLayout] = useState(
    savedState?.selectedLayout || LAYOUT_OPTIONS[0]
  );
  const [slotImages, setSlotImages] = useState(
    savedState?.slotImages || Array(LAYOUT_OPTIONS[0].slots).fill(null)
  );
  const [slotTransforms, setSlotTransforms] = useState(
    savedState?.slotTransforms || Array(LAYOUT_OPTIONS[0].slots).fill({ offsetX: 0, offsetY: 0, scale: 1.5 })
  );
  const [aspectRatio, setAspectRatio] = useState(savedState?.aspectRatio || '1:1');

  const [imagePickerTarget, setImagePickerTarget] = useState(null);
  const [memeTemplates, setMemeTemplates] = useState(MEME_TEMPLATES);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [templateCategory, setTemplateCategory] = useState('all');

  const filteredTemplates = useMemo(() => {
    return memeTemplates.filter((tmpl) => {
      const q = templateSearchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        tmpl.name.toLowerCase().includes(q) ||
        (tmpl.category && tmpl.category.toLowerCase().includes(q));

      let matchesCategory = true;
      if (templateCategory === 'trending') {
        matchesCategory = tmpl.trendingScore >= 93;
      } else if (templateCategory !== 'all') {
        matchesCategory = tmpl.category === templateCategory;
      }

      return matchesSearch && matchesCategory;
    });
  }, [memeTemplates, templateSearchQuery, templateCategory]);
  
  const [isConfiguringCustom, setIsConfiguringCustom] = useState(false);
  const [customCols, setCustomCols] = useState(2);
  const [customRows, setCustomRows] = useState(2);
  
  const [dragState, setDragState] = useState(null);
  const gridRef = useRef(null);

  const persistState = (newStep, newLayout, newImages, newTransforms, newAspectRatio) => {
    if (onSaveState) {
      onSaveState({
        step: newStep,
        selectedLayout: newLayout,
        slotImages: newImages,
        slotTransforms: newTransforms,
        aspectRatio: newAspectRatio !== undefined ? newAspectRatio : aspectRatio
      });
    }
  };

  const handleSelectLayoutOption = (layout) => {
    setSelectedLayout(layout);
    setSlotImages(new Array(layout.slots).fill(null));
    setSlotTransforms(new Array(layout.slots).fill({ offsetX: 0, offsetY: 0, scale: 1 }));
    setStep(2);
    persistState(2, layout, new Array(layout.slots).fill(null), new Array(layout.slots).fill({ offsetX: 0, offsetY: 0, scale: 1 }), aspectRatio);
  };

  useEffect(() => {
    if (imagePickerTarget !== null) {
      fetchOpenSourceMemes().then((memes) => {
        if (memes && memes.length > 0) {
          setMemeTemplates(memes);
        }
      });
    }
  }, [imagePickerTarget]);

  const updateSlotTransform = (slotIdx, updater) => {
    const nextTransforms = [...slotTransforms];
    const currentTx = nextTransforms[slotIdx] || { offsetX: 0, offsetY: 0, scale: 1.5 };
    const newTx = typeof updater === 'function' ? updater(currentTx) : updater;
    nextTransforms[slotIdx] = newTx;
    setSlotTransforms(nextTransforms);
    persistState(step, selectedLayout, slotImages, nextTransforms, aspectRatio);
  };

  const handlePointerDown = (slotIdx, e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const tx = slotTransforms[slotIdx] || { offsetX: 0, offsetY: 0, scale: 1.5 };
    setDragState({
      slotIdx,
      startX: clientX,
      startY: clientY,
      origOffsetX: tx.offsetX,
      origOffsetY: tx.offsetY
    });
  };

  const handleSlotPointerMove = (e) => {
    if (!dragState) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const sensitivityX = 1 / rect.width;
    const sensitivityY = 1 / rect.height;

    const dx = (clientX - dragState.startX) * sensitivityX;
    const dy = (clientY - dragState.startY) * sensitivityY;

    const nextTransforms = [...slotTransforms];
    const currentTx = nextTransforms[dragState.slotIdx] || { offsetX: 0, offsetY: 0, scale: 1.5 };
    nextTransforms[dragState.slotIdx] = {
      ...currentTx,
      offsetX: dragState.origOffsetX + dx,
      offsetY: dragState.origOffsetY + dy
    };
    setSlotTransforms(nextTransforms);
  };

  const handleSlotPointerUp = () => {
    if (dragState) {
      persistState(step, selectedLayout, slotImages, slotTransforms, aspectRatio);
      setDragState(null);
    }
  };

  // Stitch Layout into 2D HTML5 Canvas
  const handleGenerateMeme = async () => {
    const canvas = document.createElement('canvas');
    const width = 800;
    
    // Calculate precise height based on the selected aspect ratio
    let calculatedHeight = 800;
    if (aspectRatio === '9:16') calculatedHeight = Math.round(800 * (16 / 9));
    else if (aspectRatio === '16:9') calculatedHeight = Math.round(800 * (9 / 16));
    else if (aspectRatio === '4:5') calculatedHeight = Math.round(800 * (5 / 4));
    else if (aspectRatio === '3:4') calculatedHeight = Math.round(800 * (4 / 3));
    
    const height = calculatedHeight;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const totalSlots = selectedLayout.slots;
    const isVert = selectedLayout.id === '2-vert' || selectedLayout.id === '3-stacked';
    const isHoriz = selectedLayout.id === '2-horiz' || selectedLayout.id === '3-horiz';
    const isGrid = selectedLayout.id === '4-grid';
    const isHybrid = selectedLayout.id === '3-hybrid';

    const loadedImages = await Promise.all(
      Array.from({ length: totalSlots }).map(async (_, idx) => {
        const src = slotImages[idx];
        if (!src) return null;
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = src;
        });
      })
    );

    const generatedCaptions = [];
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = width;
    gridCanvas.height = height;
    const gridCtx = gridCanvas.getContext('2d');

    loadedImages.forEach((img, idx) => {
      const isVert = selectedLayout.id === '2-vert' || selectedLayout.id === '3-stacked';
      const isHoriz = selectedLayout.id === '2-horiz' || selectedLayout.id === '3-horiz';
      const isGrid = selectedLayout.id === '4-grid';
      const isHybrid = selectedLayout.id === '3-hybrid';

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
      } else if (isHybrid) {
        if (idx === 0) {
          slotW = width;
          slotH = height / 2;
        } else {
          slotW = width / 2;
          slotH = height / 2;
          x = (idx - 1) * slotW;
          y = height / 2;
        }
      } else if (selectedLayout.id === 'custom-grid') {
        const cols = selectedLayout.cols || 2;
        const rows = selectedLayout.rows || 2;
        slotW = width / cols;
        slotH = height / rows;
        x = (idx % cols) * slotW;
        y = Math.floor(idx / cols) * slotH;
      }

      if (img) {
        const t = slotTransforms[idx] || { offsetX: 0, offsetY: 0, scale: 1.0 };
        const scale = Math.min(slotW / img.width, slotH / img.height) * (t.scale || 1.0);
        const nw = img.width * scale;
        const nh = img.height * scale;
        const nx = x + (slotW - nw) / 2 + (t.offsetX * slotW);
        const ny = y + (slotH - nh) / 2 + (t.offsetY * slotH);

        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, slotW, slotH);
        ctx.clip();
        ctx.drawImage(img, nx, ny, nw, nh);
        ctx.restore();
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, slotW, slotH);

        if (selectedLayout.id !== 'custom-grid') {
          generatedCaptions.push({
            id: `cap-auto-${Date.now()}-${idx}`,
            text: `NEW TEXT`,
            x: (x + slotW / 2) / width,
            y: (y + slotH / 2) / height,
            width: (slotW / width) * 0.9,
            fontSize: 50,
            color: '#ffffff',
            stroke: '#000000',
            fontFamily: 'Impact, sans-serif',
            align: 'center'
          });
        }
      }

      if (selectedLayout.id !== '1-panel' && totalSlots > 1) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, slotW, slotH);

        gridCtx.strokeStyle = '#000000';
        gridCtx.lineWidth = 4;
        gridCtx.strokeRect(x, y, slotW, slotH);
      }
    });

    const stitchedDataUrl = canvas.toDataURL('image/png');
    const gridDataUrl = selectedLayout.id === '1-panel' ? null : gridCanvas.toDataURL('image/png');
    const defaultCaptions = generatedCaptions;
    const hasAnyImage = slotImages.some(img => img && img !== 'TEXT_PANEL');

    if (onLayoutComplete) {
      onLayoutComplete({
        id: `custom-${selectedLayout.id}-${Date.now()}`,
        name: selectedLayout.id === '1-panel' ? 'Blank Canvas' : 'Custom Layout',
        layoutId: selectedLayout.id,
        imageUrl: stitchedDataUrl,
        gridUrl: gridDataUrl,
        hasAnyImage: hasAnyImage,
        category: 'custom',
        width: 800,
        height: height,
        defaultCaptions
      });
    }
  };

  return (
    <div
      className="custom-layout-builder"
      onMouseMove={handleSlotPointerMove}
      onMouseUp={handleSlotPointerUp}
      onTouchMove={handleSlotPointerMove}
      onTouchEnd={handleSlotPointerUp}
    >
      {/* PERFECTLY CENTERED & UNIFORM 3-STEP NAVIGATION BAR */}
      <div className="wizard-progress-bar glass-card flex-center margin-bottom" style={{ padding: '10px 14px' }}>
        <div className="step-indicator flex-center" style={{ gap: '14px' }}>
          <span
            className={`step-badge ${step === 1 ? 'active' : 'completed'}`}
            onClick={() => setStep(1)}
            style={{ cursor: step === 2 ? 'pointer' : 'default' }}
            title={step === 2 ? 'Back to Step 1: Select Layout' : 'Step 1: Layout Structure'}
          >
            {step === 2 ? <ArrowLeft className="icon-xs" /> : null} 1. Layout
          </span>

          <span className="step-divider">→</span>

          <span
            className={`step-badge ${step === 2 ? 'active' : ''}`}
            onClick={step === 1 && selectedLayout ? () => setStep(2) : undefined}
            style={{ cursor: step === 1 ? 'pointer' : 'default' }}
          >
            2. Images
          </span>

          <span className="step-divider">→</span>

          <span
            className="step-badge action-cta"
            onClick={step === 2 ? handleGenerateMeme : undefined}
            style={{ cursor: step === 2 ? 'pointer' : 'not-allowed', opacity: step === 2 ? 1 : 0.6 }}
            title={step === 2 ? 'Proceed to Step 3: Editor' : 'Complete Step 2 to proceed to Editor'}
          >
            3. Editor <ArrowRight className="icon-xs" />
          </span>
        </div>
      </div>

      {/* STEP 1: CLEAN 3 COLUMNS x 2 ROWS LAYOUT SELECTOR WITH SPACING BELOW HEADER */}
      {step === 1 && (
        <div className="step-selection-area">
          <div className="step-header text-center step-header-spaced">
            <h3><span className="step-prefix-highlight">Step 1:</span> Select Layout Structure</h3>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div
              className="icon-layout-card glass-card"
              style={{ width: '100%', height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => handleSelectLayoutOption(LAYOUT_OPTIONS[0])}
            >
              <div className="wireframe-container" style={{ width: '80px', height: '60px', marginBottom: '8px' }}>
                <div className="layout-wireframe grid-1-panel">
                  <div className="wf-box" />
                </div>
              </div>
              <span className="icon-layout-label" style={{ fontSize: '1rem' }}>{LAYOUT_OPTIONS[0].name} (Recommended)</span>
            </div>
          </div>
          
          <h4 style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--text-muted)' }}>Or choose a multi-panel layout</h4>

          <div className="icon-layout-grid-3x2" style={isConfiguringCustom ? { display: 'flex', justifyContent: 'center' } : {}}>
            {!isConfiguringCustom ? (
              <>
                {LAYOUT_OPTIONS.filter(l => l.id !== '1-panel' && l.id !== '3-hybrid').map((layout) => (
                  <div
                    key={layout.id}
                    className="icon-layout-card glass-card"
                    onClick={() => handleSelectLayoutOption(layout)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="wireframe-container">
                      <div className={`layout-wireframe grid-${layout.id}`}>
                        {Array.from({ length: layout.slots }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`wf-box ${layout.id === '3-hybrid' && idx === 0 ? 'wf-full' : ''}`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="icon-layout-label">{layout.name}</span>
                  </div>
                ))}
                
                <div
                  className="icon-layout-card glass-card"
                  onClick={() => setIsConfiguringCustom(true)}
                  style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100px' }}
                >
                  <Grid className="icon-sm" style={{ color: 'rgba(6, 182, 212, 0.85)', marginBottom: '8px', filter: 'drop-shadow(0 0 5px rgba(6, 182, 212, 0.35))', width: '38px', height: '38px' }} />
                  <span className="icon-layout-label" style={{ fontWeight: 'bold' }}>Custom Grid</span>
                </div>
              </>
            ) : (
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
            )}
          </div>
        </div>
      )}

      {/* STEP 2: POPULATE IMAGES */}
      {step === 2 && (
        <div className="step-population-area animate-fade-in">
          <div className="flex-center margin-bottom-sm step-header-spaced">
            <h3 style={{ margin: 0 }}><span className="step-prefix-highlight">Step 2:</span> Populate Panels</h3>
          </div>

          <div className="aspect-ratio-selector flex-center margin-bottom" style={{ gap: '8px', flexWrap: 'wrap' }}>
            {['1:1', '9:16', '16:9', '4:5', '3:4'].map((ratio) => (
              <button
                key={ratio}
                className={`btn btn-xs ${aspectRatio === ratio ? 'btn-primary shadow-glow' : 'btn-secondary'}`}
                onClick={() => {
                  setAspectRatio(ratio);
                  persistState(step, selectedLayout, slotImages, slotTransforms, ratio);
                }}
                style={{ minWidth: '60px' }}
              >
                {ratio}
              </button>
            ))}
          </div>

          <div 
            className="grid-preview-container margin-bottom-lg" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', touchAction: 'none' }}
            onMouseMove={handleSlotPointerMove}
            onTouchMove={handleSlotPointerMove}
            onMouseUp={handleSlotPointerUp}
            onTouchEnd={handleSlotPointerUp}
          >
            <div
              ref={gridRef}
              className={`grid-preview grid-${selectedLayout.id}`}
              style={{
                width: '100%',
                maxWidth: `min(800px, 100%, calc(55vh * (${aspectRatio.replace(':', '/')})))`,
                aspectRatio: aspectRatio.replace(':', '/'),
                overflow: 'hidden',
                transition: 'max-width 0.3s ease, aspect-ratio 0.3s ease',
                border: selectedLayout.id === '1-panel' ? 'none' : '2px solid #000',
                boxShadow: selectedLayout.id === '1-panel' ? '0 10px 30px rgba(0,0,0,0.5)' : undefined,
                ...(selectedLayout.id === 'custom-grid' ? { gridTemplateColumns: `repeat(${selectedLayout.cols}, 1fr)`, gridTemplateRows: `repeat(${selectedLayout.rows}, 1fr)` } : {})
              }}
            >
              {Array.from({ length: selectedLayout.slots }).map((_, idx) => {
                const hasImage = slotImages[idx] && slotImages[idx] !== 'TEXT_PANEL';
                const isTextPanel = slotImages[idx] === 'TEXT_PANEL';
                const tx = slotTransforms[idx] || { offsetX: 0, offsetY: 0, scale: 1.5 };

                return (
                  <div
                    key={idx}
                    className={`grid-slot ${selectedLayout.id === '3-hybrid' && idx === 0 ? 'slot-full' : ''}`}
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      background: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: selectedLayout.id === '1-panel' ? 'none' : undefined
                    }}
                  >
                    {hasImage ? (
                      <div 
                        style={{ position: 'absolute', inset: 0, cursor: dragState ? 'grabbing' : 'grab' }}
                        onMouseDown={(e) => { e.preventDefault(); handlePointerDown(idx, e); }}
                        onTouchStart={(e) => { handlePointerDown(idx, e); }}
                      >
                        {isVideoUrl(slotImages[idx]) ? (
                          <video 
                            src={getCleanMediaUrl(slotImages[idx])} 
                            autoPlay 
                            loop 
                            muted 
                            playsInline 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'contain',
                              transform: `translate(${tx.offsetX * 100}%, ${tx.offsetY * 100}%) scale(${tx.scale})`,
                              pointerEvents: 'none'
                            }} 
                          />
                        ) : (
                          <img 
                            src={getCleanMediaUrl(slotImages[idx])} 
                            alt={`Slot ${idx + 1}`} 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'contain',
                              transform: `translate(${tx.offsetX * 100}%, ${tx.offsetY * 100}%) scale(${tx.scale})`,
                              pointerEvents: 'none'
                            }} 
                          />
                        )}
                        <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '20px', cursor: 'default' }} onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
                          <button className="btn btn-icon btn-secondary btn-xs" onClick={() => updateSlotTransform(idx, (prev) => ({ ...prev, scale: Math.max(0.1, prev.scale - 0.1) }))}>
                            <ZoomOut className="icon-xs" />
                          </button>
                          <button className="btn btn-icon btn-secondary btn-xs" onClick={() => updateSlotTransform(idx, (prev) => ({ ...prev, scale: prev.scale + 0.1 }))}>
                            <ZoomIn className="icon-xs" />
                          </button>
                          <button className="btn btn-icon btn-secondary btn-xs" onClick={() => {
                            const newImages = [...slotImages];
                            newImages[idx] = null;
                            setSlotImages(newImages);
                            persistState(step, selectedLayout, newImages, slotTransforms, aspectRatio);
                          }}>
                            <RefreshCw className="icon-xs" />
                          </button>
                        </div>
                      </div>
                    ) : isTextPanel ? (
                      <div style={{ position: 'absolute', inset: 0, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <span style={{ color: '#000', fontWeight: 'bold', fontSize: '1.2rem' }}>Text Panel</span>
                         <button className="btn btn-icon btn-secondary btn-xs" style={{ position: 'absolute', bottom: '10px', right: '10px' }} onClick={() => {
                            const newImages = [...slotImages];
                            newImages[idx] = null;
                            setSlotImages(newImages);
                            persistState(step, selectedLayout, newImages, slotTransforms);
                          }}>
                            <RefreshCw className="icon-xs" />
                          </button>
                      </div>
                    ) : (
                      <div className="slot-upload-container flex-center" style={{ width: '100%', height: '100%', flexDirection: 'column', gap: '6px' }}>
                        <label className="btn btn-primary shadow-glow hover-lift panel-btn" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Upload className="icon-xs margin-right-xs btn-icon-svg" /> <span className="btn-text">Upload</span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileUploadSlot(idx, e)}
                          />
                        </label>
                        <button className="btn shadow-sm hover-lift panel-btn panel-btn-dark" style={{ display: 'flex', alignItems: 'center' }} onClick={() => setImagePickerTarget({ slot: idx })}>
                          <Sparkles className="icon-xs margin-right-xs btn-icon-svg" /> <span className="btn-text">Template</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

              <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center' }}>
              <button
                className="btn btn-primary shadow-glow hover-lift"
                style={{
                  padding: '9px 20px',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onClick={handleGenerateMeme}
              >
                Continue to Editor <ArrowRight className="icon-xs" />
              </button>
            </div>
        </div>
      )}

      {/* Template Picker Modal for Slot Editing */}
      {imagePickerTarget !== null && (
        <ModalPortal>
          <div 
            className="modal-backdrop animate-fade-in" 
            style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', padding: '16px' }}
            onClick={() => {
              setImagePickerTarget(null);
              setTemplateSearchQuery('');
              setTemplateCategory('all');
            }}
          >
          <div 
            className="modal-content glass-card modal-lg animate-scale-up" 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              position: 'relative', 
              width: '90%', 
              maxWidth: '680px', 
              height: '80vh', 
              maxHeight: '85vh', 
              display: 'flex', 
              flexDirection: 'column', 
              overflow: 'hidden' 
            }}
          >
            <div className="modal-header flex-between" style={{ alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: '0 auto', color: '#fff', textAlign: 'center', flex: 1, paddingLeft: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ImageIcon size={20} style={{ color: 'var(--cyber-cyan)' }} />
                Add Template
              </h3>
              <button 
                className="btn-close" 
                onClick={() => {
                  setImagePickerTarget(null);
                  setTemplateSearchQuery('');
                  setTemplateCategory('all');
                }} 
                title="Close" 
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="picker-search-bar" style={{ position: 'relative', marginBottom: '14px' }}>
              <Search className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={`Search ${memeTemplates.length}+ meme templates...`}
                value={templateSearchQuery}
                onChange={(e) => setTemplateSearchQuery(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '38px', paddingRight: templateSearchQuery ? '38px' : '14px', height: '42px', width: '100%', boxSizing: 'border-box', borderRadius: '24px' }}
              />
              {templateSearchQuery && (
                <button
                  onClick={() => setTemplateSearchQuery('')}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%',
                    width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)', cursor: 'pointer'
                  }}
                >
                  <X className="icon-xs" style={{ width: '13px', height: '13px' }} />
                </button>
              )}
            </div>

            {/* Category Pills - Horizontal scroll only */}
            <div 
              onWheel={(e) => {
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
              style={{
                display: 'flex',
                flexWrap: 'nowrap',
                alignItems: 'center',
                gap: '8px',
                padding: '2px 4px 12px 4px',
                overflowX: 'auto',
                overflowY: 'hidden',
                flexShrink: 0,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                borderBottom: '1px solid var(--glass-border)',
                marginBottom: '10px'
              }}
            >
              {CATEGORIES.map((cat) => {
                const isActive = templateCategory === cat.id && !templateSearchQuery;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setTemplateCategory(cat.id);
                      setTemplateSearchQuery('');
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: isActive ? '1px solid var(--primary-accent)' : '1px solid var(--glass-border)',
                      background: isActive ? 'var(--primary-gradient)' : 'var(--glass-bg)',
                      color: isActive ? '#ffffff' : 'var(--text-muted)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      boxShadow: isActive ? '0 2px 8px rgba(139, 92, 246, 0.3)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            <div 
              className="template-picker-mini custom-scrollbar" 
              style={{ 
                flex: 1, 
                minHeight: 0, 
                overflowY: 'auto', 
                overflowX: 'hidden', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                gridAutoRows: 'max-content',
                alignContent: 'start',
                gap: '12px', 
                padding: '8px 4px 16px 4px',
                boxSizing: 'border-box',
                overscrollBehavior: 'contain'
              }}
            >
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((templateItem) => (
                <div
                  key={templateItem.id}
                  className="template-card glass-card hover-lift"
                  style={{
                    minWidth: 0,
                    width: '100%',
                    height: 'auto',
                    minHeight: '165px',
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: 'var(--bg-surface-1)',
                    border: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                  onClick={() => {
                    const newImages = [...slotImages];
                    newImages[imagePickerTarget.slot] = templateItem.url || templateItem.imageUrl;
                    const newTransforms = [...slotTransforms];
                    newTransforms[imagePickerTarget.slot] = { offsetX: 0, offsetY: 0, scale: 1.5 };
                    setSlotImages(newImages);
                    setSlotTransforms(newTransforms);
                    persistState(step, selectedLayout, newImages, newTransforms, aspectRatio);
                    setImagePickerTarget(null);
                    setTemplateSearchQuery('');
                    setTemplateCategory('all');
                  }}
                >
                  <div
                    className="template-image-wrapper"
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      height: '130px',
                      minHeight: '120px',
                      position: 'relative',
                      overflow: 'hidden',
                      background: 'rgba(0, 0, 0, 0.4)',
                      flexShrink: 0
                    }}
                  >
                    <img 
                      src={templateItem.url || templateItem.imageUrl} 
                      alt={templateItem.name} 
                      loading="lazy" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        minHeight: '120px',
                        objectFit: 'cover', 
                        display: 'block' 
                      }} 
                      onError={(e) => {
                        if (templateItem.rawImageUrl && e.currentTarget.src !== templateItem.rawImageUrl) {
                          e.currentTarget.src = templateItem.rawImageUrl;
                        }
                      }}
                    />
                  </div>
                  <div className="template-info" style={{ padding: '6px 8px', minHeight: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxSizing: 'border-box' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, textAlign: 'center', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)', width: '100%' }}>{templateItem.name}</span>
                  </div>
                </div>
              ))) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  <ImageIcon className="icon-lg" style={{ opacity: 0.4, marginBottom: '8px' }} />
                  <p>No matching templates found for "{templateSearchQuery}"</p>
                </div>
              )}
            </div>
          </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
