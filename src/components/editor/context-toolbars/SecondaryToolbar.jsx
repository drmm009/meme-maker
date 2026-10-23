import React from 'react';
import { TWEET_TREND_PRESETS } from '../../CanvasEditor';
import { FONTS } from '../../../data/stickers';
import { Blend, Smile, PanelTop, Flame, Tv, MessageCircle, Ban, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLOR_SWATCHES } from '../../../utils/captionLayout';
import { TEXT_EFFECTS, secondaryVariants } from '../constants';
import { isSocialCardCaption, getContrastStroke } from '../memeEditorUtils';
import LayerActionsBar from './secondary/LayerActionsBar';
import DrawSettingsBar from './secondary/DrawSettingsBar';
import WatermarkBar from './secondary/WatermarkBar';
import HeaderFooterBar from './secondary/HeaderFooterBar';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';

export default function SecondaryToolbar({
  activeCaption,
  activeImageLayer,
  activeSticker,
  handleClearDrawings,
  handleCycleTextAlignment,
  handleDeleteLayer,
  handleDuplicateLayer,
  handleFlipActiveLayer,
  handleRotateLayer,
  handleSetCaptionBg,
  handleSetDieCutColor,
  handleToggleCanvasBoth,
  handleToggleCanvasFooter,
  handleToggleCanvasHeader,
  handleToggleTextCase,
  isElementSelected,
  moveLayer,
  updateActiveCaptionProps,
  updateActiveImageLayer,
}) {
  const activeSubmenu = useEditorUiStore((s) => s.activeSubmenu);
  const activeTab = useEditorUiStore((s) => s.activeTab);
  const brushColor = useEditorUiStore((s) => s.brushColor);
  const brushSize = useEditorUiStore((s) => s.brushSize);
  const drawTool = useEditorUiStore((s) => s.drawTool);
  const setBrushColor = useEditorUiStore((s) => s.setBrushColor);
  const setBrushSize = useEditorUiStore((s) => s.setBrushSize);
  const setShowLayerMenu = useEditorUiStore((s) => s.setShowLayerMenu);
  const showLayerMenu = useEditorUiStore((s) => s.showLayerMenu);
  const updateWatermark = useEditorUiStore((s) => s.updateWatermark);
  const watermark = useEditorUiStore((s) => s.watermark);
  const canvasBgColor = useMemeEditorStore((s) => s.canvasBgColor);
  const setCanvasBgColor = useMemeEditorStore((s) => s.setCanvasBgColor);
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);

  return (
    <>
        <AnimatePresence>
        {Boolean(
          Boolean(activeCaption || activeSticker || activeImageLayer) ||
          (!isElementSelected && activeTab === 'draw' && (activeSubmenu === 'drawSettings' || Boolean(drawTool))) ||
          (!isElementSelected && (activeTab === 'canvas' || activeTab === 'watermark') && (activeSubmenu === 'watermark' || activeSubmenu === 'canvasBg')) ||
          (!isElementSelected && activeTab === 'text' && activeSubmenu === 'banner')
        ) && (
          <motion.div
            className="editor-secondary-toolbar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {/* 1. Caption Font Submenu */}
              {activeCaption && !isSocialCardCaption(activeCaption) && activeSubmenu === 'font' && (
                <motion.div
                  key={`cap-font-${activeCaption.id}`}
                  variants={secondaryVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                >
                  {FONTS.map(f => (
                    <button
                      key={f.id || f.family}
                      id={`font-item-${f.family.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}`}
                      className={`btn btn-xs vid-ctx-btn ${activeCaption.fontFamily === f.family ? 'active' : ''}`}
                      style={{
                        fontFamily: f.family,
                        whiteSpace: 'nowrap'
                      }}
                      onClick={() => {
                        updateActiveCaptionProps({ fontFamily: f.family });
                      }}
                    >
                      {f.name}
                    </button>
                  ))}
                </motion.div>
              )}

              {/* 2. Caption Color Submenu */}
              {activeCaption && activeSubmenu === 'color' && (
                <motion.div
                  key={`cap-color-${activeCaption.id}`}
                  variants={secondaryVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="sec-bar-btn-container"
                >
                  {COLOR_SWATCHES.map(c => {
                    const isSelected = (activeCaption.color || '#ffffff').toLowerCase() === c.toLowerCase();
                    return (
                      <button
                        key={c}
                        type="button"
                        className={`color-swatch-btn ${isSelected ? 'active' : ''}`}
                        title={`Text color ${c}`}
                        onClick={() => updateActiveCaptionProps({ color: c, stroke: getContrastStroke(c) })}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          backgroundColor: c,
                          border: isSelected ? '2px solid var(--cyber-cyan)' : '1.5px solid rgba(255,255,255,0.3)',
                          boxShadow: isSelected ? '0 0 8px rgba(6, 182, 212, 0.6)' : 'none',
                          transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                          cursor: 'pointer',
                          flexShrink: 0,
                          padding: 0,
                          transition: 'all 0.15s ease'
                        }}
                      />
                    );
                  })}
                  <div className="vid-ctx-divider" style={{ width: 1, height: 20, margin: '0 4px', flexShrink: 0 }} />
                  <div
                    title="Custom text color"
                    style={{
                      position: 'relative',
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'conic-gradient(from 180deg at 50% 50%, #ff0055, #ffaa00, #00ff66, #00bbff, #aa00ff, #ff0055)',
                      border: '1.5px solid rgba(255, 255, 255, 0.35)',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <input
                      type="color"
                      value={activeCaption.color || '#ffffff'}
                      onChange={(e) => {
                        const hex = e.target.value;
                        updateActiveCaptionProps({ color: hex, stroke: getContrastStroke(hex) });
                      }}
                      style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                    />
                  </div>
                </motion.div>
              )}

              {/* 3. Caption Alignment Submenu */}
              {activeCaption && activeSubmenu === 'align' && (
                <motion.div
                  key={`cap-align-${activeCaption.id}`}
                  variants={secondaryVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                >
                  <button
                    type="button"
                    className={`btn btn-xs vid-ctx-btn ${activeCaption.align === 'left' ? 'active' : ''}`}
                    onClick={() => updateActiveCaptionProps({ align: 'left' })}
                  >
                    <AlignLeft style={{ width: 14, height: 14 }} />
                    <span>Left</span>
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs vid-ctx-btn ${(!activeCaption.align || activeCaption.align === 'center') ? 'active' : ''}`}
                    onClick={() => updateActiveCaptionProps({ align: 'center' })}
                  >
                    <AlignCenter style={{ width: 14, height: 14 }} />
                    <span>Center</span>
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs vid-ctx-btn ${activeCaption.align === 'right' ? 'active' : ''}`}
                    onClick={() => updateActiveCaptionProps({ align: 'right' })}
                  >
                    <AlignRight style={{ width: 14, height: 14 }} />
                    <span>Right</span>
                  </button>
                </motion.div>
              )}

              {/* 4. Caption Effects Submenu */}
              {activeCaption && activeSubmenu === 'effects' && (
                <motion.div
                  key={`cap-effects-${activeCaption.id}`}
                  variants={secondaryVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                >
                  {TEXT_EFFECTS.map(effect => {
                    const isSelected = activeCaption.effect ? activeCaption.effect === effect.id : (effect.id === 'flat' && !activeCaption.curve);
                    return (
                      <button
                        key={effect.id}
                        type="button"
                        className={`btn btn-xs vid-ctx-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          updateActiveCaptionProps({
                            effect: effect.id,
                            curve: effect.curve || 0
                          });
                        }}
                        title={effect.title}
                        style={{
                          padding: '4px 12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          flexShrink: 0
                        }}
                      >
                        {effect.renderLabel()}
                      </button>
                    );
                  })}
                </motion.div>
              )}

            {/* 5. Caption Background Submenu */}
            {activeCaption && activeSubmenu === 'bg' && (() => {
              const isNone = !activeCaption.bgColor || activeCaption.bgColor === 'none' || activeCaption.bgColor === 'transparent';
              const isBlack = activeCaption.bgColor === '#000000' || activeCaption.bgColor === 'rgba(0,0,0,0.75)';
              const isWhite = activeCaption.bgColor === '#ffffff' || activeCaption.bgColor === 'rgba(255,255,255,0.9)';
              const isBanner = activeCaption.bgStyle === 'banner';
              const isCustom = !isNone && !isBlack && !isWhite && !isBanner;

              return (
                <motion.div
                  key={`cap-bg-${activeCaption.id}`}
                  variants={secondaryVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
                >
                  <div className="sec-bar-btn-container">
                    <button
                      type="button"
                      className={`color-swatch-btn ${isNone ? 'active' : ''}`}
                      onClick={() => handleSetCaptionBg('none')}
                      title="No background"
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        border: isNone ? '2px solid var(--cyber-cyan)' : '1.5px solid rgba(255, 255, 255, 0.25)',
                        background: isNone ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                        boxShadow: isNone ? '0 0 8px rgba(6, 182, 212, 0.5)' : 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        cursor: 'pointer',
                        transform: isNone ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Ban style={{ width: 12, height: 12, color: isNone ? 'var(--cyber-cyan)' : 'rgba(255, 255, 255, 0.6)' }} />
                    </button>

                    <button
                      type="button"
                      className={`color-swatch-btn ${isBlack ? 'active' : ''}`}
                      onClick={() => handleSetCaptionBg('black')}
                      title="Black background"
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        backgroundColor: '#000000',
                        border: isBlack ? '2px solid var(--cyber-cyan)' : '1.5px solid rgba(255, 255, 255, 0.35)',
                        boxShadow: isBlack ? '0 0 8px rgba(6, 182, 212, 0.5)' : 'none',
                        padding: 0,
                        cursor: 'pointer',
                        transform: isBlack ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.15s ease'
                      }}
                    />

                    <button
                      type="button"
                      className={`color-swatch-btn ${isWhite ? 'active' : ''}`}
                      onClick={() => handleSetCaptionBg('white')}
                      title="White background"
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        border: isWhite ? '2px solid var(--cyber-cyan)' : '1.5px solid rgba(255, 255, 255, 0.35)',
                        boxShadow: isWhite ? '0 0 8px rgba(6, 182, 212, 0.5)' : 'none',
                        padding: 0,
                        cursor: 'pointer',
                        transform: isWhite ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.15s ease'
                      }}
                    />

                    <div
                      title="Custom background color"
                      style={{
                        position: 'relative',
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: isCustom
                          ? activeCaption.bgColor
                          : 'conic-gradient(from 180deg at 50% 50%, #ff0055, #ffaa00, #00ff66, #00bbff, #aa00ff, #ff0055)',
                        border: isCustom ? '2px solid var(--cyber-cyan)' : '1.5px solid rgba(255, 255, 255, 0.35)',
                        boxShadow: isCustom ? '0 0 8px rgba(6, 182, 212, 0.5)' : 'none',
                        transform: isCustom ? 'scale(1.1)' : 'scale(1)',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="color"
                        value={isCustom ? activeCaption.bgColor : '#ffffff'}
                        onChange={(e) => {
                          const hex = e.target.value;
                          updateActiveCaptionProps({ bgColor: hex, bgStyle: 'box' });
                        }}
                        style={{
                          position: 'absolute',
                          opacity: 0,
                          inset: 0,
                          cursor: 'pointer',
                          width: '100%',
                          height: '100%'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`btn btn-xs vid-ctx-btn ${isBanner ? 'active' : ''}`}
                    onClick={() => {
                      if (isBanner) {
                        updateActiveCaptionProps({ bgStyle: 'box' });
                      } else if (!activeCaption.bgColor || activeCaption.bgColor === 'none' || activeCaption.bgColor === 'transparent') {
                        handleSetCaptionBg('banner');
                      } else {
                        updateActiveCaptionProps({ bgStyle: 'banner' });
                      }
                    }}
                    title={isBanner ? "Full-width Banner active (Click to return to box)" : "Toggle full-width Banner"}
                  >
                    <PanelTop style={{ width: 13, height: 13 }} />
                    <span>Banner</span>
                  </button>
                </motion.div>
              );
            })()}

            {/* 6. Caption Opacity Submenu */}
            {activeCaption && activeSubmenu === 'blur' && (
              <motion.div
                key={`cap-blur-${activeCaption.id}`}
                variants={secondaryVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
              >
                <div className="sec-bar-btn-container">
                  <Blend style={{ width: 14, height: 14, opacity: 0.8 }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Opacity</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={activeCaption.opacity !== undefined ? activeCaption.opacity : 1}
                    onChange={(e) => updateActiveCaptionProps({ opacity: parseFloat(e.target.value) })}
                    style={{ width: '100px', accentColor: 'var(--cyber-cyan)', touchAction: 'none' }}
                  />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--cyber-cyan)', minWidth: '28px' }}>
                    {Math.round((activeCaption.opacity !== undefined ? activeCaption.opacity : 1) * 100)}%
                  </span>
                </div>
              </motion.div>
            )}

            {/* 8. Tweet Card Theme & Trend Submenu */}
            {activeCaption?.isTweetCard && activeSubmenu === 'tweetTheme' && (
              <motion.div
                key={`cap-tweetTheme-${activeCaption.id}`}
                variants={secondaryVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
              >
                {['dark', 'dim', 'light'].map((th) => (
                  <button
                    key={th}
                    type="button"
                    className={`btn btn-xs vid-ctx-btn ${(activeCaption.tweetTheme || 'dark') === th ? 'active' : ''}`}
                    onClick={() => updateActiveCaptionProps({ tweetTheme: th })}
                    style={{ padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}
                  >
                    {th}
                  </button>
                ))}
              </motion.div>
            )}
            {activeCaption?.isTweetCard && activeSubmenu === 'tweetTrend' && (
              <motion.div
                key={`cap-tweetTrend-${activeCaption.id}`}
                variants={secondaryVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
              >
                {[
                  { label: '#1 Trending', value: 'viral', icon: <Flame style={{ width: 12, height: 12 }} /> },
                  { label: 'Technology', value: 'tech', icon: <Tv style={{ width: 12, height: 12 }} /> },
                  { label: 'Memes', value: 'meme', icon: <Smile style={{ width: 12, height: 12 }} /> },
                  { label: 'Casual', value: 'casual', icon: <MessageCircle style={{ width: 12, height: 12 }} /> }
                ].map((tr) => (
                  <button
                    key={tr.value}
                    type="button"
                    className={`btn btn-xs vid-ctx-btn ${(activeCaption.tweetTrendRank || 'viral') === tr.value ? 'active' : ''}`}
                    onClick={() => {
                      const preset = TWEET_TREND_PRESETS?.[tr.value];
                      if (preset) {
                        updateActiveCaptionProps({
                          tweetTrendRank: tr.value,
                          tweetMetrics: preset.text,
                          tweetTopic: preset.topic
                        });
                      }
                    }}
                    style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {tr.icon}
                    <span>{tr.label}</span>
                  </button>
                ))}
              </motion.div>
            )}

            {/* 8b. Instagram Card Theme Submenu */}
            {activeCaption?.isInstagramCard && activeSubmenu === 'igTheme' && (
              <motion.div
                key={`cap-igTheme-${activeCaption.id}`}
                variants={secondaryVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
              >
                {['dark', 'light'].map((th) => (
                  <button
                    key={th}
                    type="button"
                    className={`btn btn-xs vid-ctx-btn ${(activeCaption.igTheme || 'dark') === th ? 'active' : ''}`}
                    onClick={() => {
                      const newColor = th === 'light' ? '#262626' : '#f5f5f5';
                      updateActiveCaptionProps({ igTheme: th, color: newColor });
                    }}
                    style={{ padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}
                  >
                    {th}
                  </button>
                ))}
              </motion.div>
            )}

            {/* 8c. WhatsApp Card Submenus */}
            {activeCaption?.isWhatsAppCard && activeSubmenu === 'waTheme' && (
              <motion.div
                key={`cap-waTheme-${activeCaption.id}`}
                variants={secondaryVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
              >
                {['dark', 'light'].map((th) => (
                  <button
                    key={th}
                    type="button"
                    className={`btn btn-xs vid-ctx-btn ${(activeCaption.waTheme || 'dark') === th ? 'active' : ''}`}
                    onClick={() => updateActiveCaptionProps({ waTheme: th })}
                    style={{ padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}
                  >
                    {th}
                  </button>
                ))}
              </motion.div>
            )}
            {activeCaption?.isWhatsAppCard && activeSubmenu === 'waTicks' && (
              <motion.div
                key={`cap-waTicks-${activeCaption.id}`}
                variants={secondaryVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
              >
                {[
                  { label: 'Blue Double (Read)', value: 'blue' },
                  { label: 'Grey Double (Delivered)', value: 'grey' },
                  { label: 'Single (Sent)', value: 'single' }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`btn btn-xs vid-ctx-btn ${(activeCaption.waTicks || 'blue') === item.value ? 'active' : ''}`}
                    onClick={() => updateActiveCaptionProps({ waTicks: item.value })}
                    style={{ padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}

            {/* 9. Draw Tool Colors & Size Submenu */}
            {!isElementSelected && activeTab === 'draw' && (
              <motion.div
                key={`draw-${drawTool || 'brush'}`}
                variants={secondaryVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}
              >
                <DrawSettingsBar
                  brushColor={brushColor}
                  brushSize={brushSize}
                  drawTool={drawTool}
                  handleClearDrawings={handleClearDrawings}
                  setBrushColor={setBrushColor}
                  setBrushSize={setBrushSize}
                />
              </motion.div>
            )}

            {/* 10. Watermark Controls Submenu */}
            {!isElementSelected && (activeTab === 'canvas' || activeTab === 'watermark') && activeSubmenu === 'watermark' && (
              <motion.div
                key="canvas-watermark"
                variants={secondaryVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
              >
                <WatermarkBar updateWatermark={updateWatermark} watermark={watermark} />
              </motion.div>
            )}

            {/* 11. Canvas Color Submenu */}
            {!isElementSelected && (activeTab === 'canvas' || activeTab === 'watermark') && activeSubmenu === 'canvasBg' && (
              <motion.div
                key="canvas-bg-swatches"
                variants={secondaryVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="sec-bar-btn-container"
              >
                {['#000000', '#ffffff', '#1e293b', '#0f172a', '#ff0055', '#00f0ff', 'transparent'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch-btn ${canvasBgColor === c ? 'active' : ''}`}
                    title={c === 'transparent' ? 'Transparent' : `Canvas background ${c}`}
                    onClick={() => setCanvasBgColor(c)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      backgroundColor: c === 'transparent' ? 'rgba(255,255,255,0.1)' : c,
                      border: canvasBgColor === c ? '2px solid var(--cyber-cyan)' : '1.5px solid rgba(255,255,255,0.3)',
                      boxShadow: canvasBgColor === c ? '0 0 8px rgba(6, 182, 212, 0.5)' : 'none',
                      cursor: 'pointer',
                      flexShrink: 0,
                      padding: 0
                    }}
                  />
                ))}
                <div
                  title="Custom canvas color"
                  style={{
                    position: 'relative',
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'conic-gradient(from 180deg at 50% 50%, #ff0055, #ffaa00, #00ff66, #00bbff, #aa00ff, #ff0055)',
                    border: '1.5px solid rgba(255, 255, 255, 0.35)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <input
                    type="color"
                    value={canvasBgColor || '#000000'}
                    onChange={(e) => setCanvasBgColor(e.target.value)}
                    style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                  />
                </div>
              </motion.div>
            )}

            {/* 13. Header / Footer Extension Submenu */}
            {!isElementSelected && activeTab === 'text' && activeSubmenu === 'banner' && (
              <motion.div
                key="canvas-banner"
                variants={secondaryVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
              >
                <HeaderFooterBar handleToggleCanvasBoth={handleToggleCanvasBoth} handleToggleCanvasFooter={handleToggleCanvasFooter} handleToggleCanvasHeader={handleToggleCanvasHeader} />
              </motion.div>
            )}

            {/* 14. Die-Cut Color Picker — Appears on Secondary Toolbar when Die-Cut is active on sticker / emoji */}
            {activeSticker && activeSticker.dieCut && !activeSubmenu && (
              <motion.div
                key={`stk-diecut-${activeSticker.id}`}
                variants={secondaryVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="sec-bar-btn-container"
              >
                {COLOR_SWATCHES.map((c) => {
                  const isSelected = (activeSticker.dieCutColor || '#ffffff').toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      className={`color-swatch-btn ${isSelected ? 'active' : ''}`}
                      title={`Die-cut border color ${c}`}
                      onClick={() => handleSetDieCutColor(c)}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        backgroundColor: c,
                        border: isSelected ? '2px solid var(--cyber-cyan)' : '1.5px solid rgba(255,255,255,0.3)',
                        boxShadow: isSelected ? '0 0 8px rgba(6, 182, 212, 0.6)' : 'none',
                        transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                        cursor: 'pointer',
                        flexShrink: 0,
                        padding: 0,
                        transition: 'all 0.15s ease'
                      }}
                    />
                  );
                })}
                <div className="vid-ctx-divider" style={{ width: 1, height: 20, margin: '0 4px', flexShrink: 0 }} />
                <div
                  title="Custom die-cut border color"
                  style={{
                    position: 'relative',
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'conic-gradient(from 180deg at 50% 50%, #ff0055, #ffaa00, #00ff66, #00bbff, #aa00ff, #ff0055)',
                    border: '1.5px solid rgba(255, 255, 255, 0.35)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <input
                    type="color"
                    value={activeSticker.dieCutColor || '#ffffff'}
                    onChange={(e) => handleSetDieCutColor(e.target.value)}
                    style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                  />
                </div>
              </motion.div>
            )}

            {/* 15. Unified Layer Actions Cluster (Rotate / Duplicate / Layers / Delete) */}
            {(activeCaption || (activeSticker && !activeSticker.dieCut) || activeImageLayer) && !activeSubmenu && (
              <motion.div
                key={`layer-actions-${activeLayerId || 'layer'}`}
                variants={secondaryVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
              >
                <LayerActionsBar
                  activeCaption={activeCaption}
                  activeImageLayer={activeImageLayer}
                  handleCycleTextAlignment={handleCycleTextAlignment}
                  handleDeleteLayer={handleDeleteLayer}
                  handleDuplicateLayer={handleDuplicateLayer}
                  handleFlipActiveLayer={handleFlipActiveLayer}
                  handleRotateLayer={handleRotateLayer}
                  handleToggleTextCase={handleToggleTextCase}
                  moveLayer={moveLayer}
                  setShowLayerMenu={setShowLayerMenu}
                  showLayerMenu={showLayerMenu}
                  updateActiveImageLayer={updateActiveImageLayer}
                />
              </motion.div>
            )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
