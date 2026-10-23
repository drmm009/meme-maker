import React from 'react';
import { Plus, Trash2, PanelTop, PanelBottom, MessageSquare, Rows3, WandSparkles } from 'lucide-react';
import { COLOR_SWATCHES } from '../../../../utils/captionLayout';
import { useMemeEditorStore } from '../../store/useMemeEditorStore';

export default function TextToolbar({
  activeCaption,
  handleAddBubble,
  handleAddCaption,
  handleAddCurvedText,
  handleDeleteLayer,
  handleToggleCanvasBoth,
  handleToggleCanvasFooter,
  handleToggleCanvasHeader,
  setShowAiModal,
  setShowBubbleBottomSheet,
}) {
  const canvasHeader = useMemeEditorStore((s) => s.canvasHeader);
  const canvasFooter = useMemeEditorStore((s) => s.canvasFooter);
  const activeLayerId = useMemeEditorStore((s) => s.activeLayerId);
  const captions = useMemeEditorStore((s) => s.captions);
  const setCaptions = useMemeEditorStore((s) => s.setCaptions);
  const pushHistory = useMemeEditorStore((s) => s.pushHistory);

  return (
    <>
      <div
        className="text-toolbar-row flex-between align-center"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexWrap: 'wrap'
        }}
      >
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {/* + Text Button */}
            <button
              type="button"
              className="btn btn-xs btn-primary hover-lift"
              onClick={handleAddCaption}
              style={{
                padding: "7px 14px",
                borderRadius: "20px",
                fontSize: "0.82rem",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Plus size={15} /> {activeCaption ? "Text" : "Add Text"}
            </button>

            {/* Curved / Arc Text Button */}
            <button
              type="button"
              className={`btn btn-xs hover-lift ${(activeCaption?.curve && activeCaption.curve !== 0) ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleAddCurvedText}
              title={activeCaption ? "Toggle or adjust text curve / arc" : "Add curved / arched meme text"}
              style={{
                padding: "7px 14px",
                borderRadius: "20px",
                fontSize: "0.82rem",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: (activeCaption?.curve && activeCaption.curve !== 0) ? "#ffffff" : "var(--cyber-cyan)" }}>
                <path d="M4 18C4 11.3726 9.37258 6 16 6H20" />
                <path d="M16 2L20 6L16 10" />
              </svg>
              <span>{activeCaption ? (activeCaption.curve ? `Arc (${activeCaption.curve > 0 ? '+' : ''}${activeCaption.curve}°)` : 'Curve') : 'Curved Text'}</span>
            </button>

            {/* Unified Header & Footer Segmented Control */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '20px',
                padding: '3px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                gap: '2px'
              }}
            >
              <button
                type="button"
                className={`btn btn-xs hover-lift ${canvasHeader.enabled ? 'active' : ''}`}
                onClick={handleToggleCanvasHeader}
                title="Toggle Modern Header Extension (Twitter / Reddit style top canvas extension)"
                style={{
                  padding: "5px 12px",
                  borderRadius: "16px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  background: canvasHeader.enabled
                    ? "var(--primary-gradient)"
                    : "transparent",
                  border: canvasHeader.enabled
                    ? "1px solid var(--cyber-cyan)"
                    : "1px solid transparent",
                  color: "#ffffff"
                }}
              >
                <PanelTop size={14} style={{ color: canvasHeader.enabled ? "#ffffff" : "var(--cyber-cyan)" }} />
                <span>Header</span>
              </button>
              <button
                type="button"
                className={`btn btn-xs hover-lift ${canvasFooter.enabled ? 'active' : ''}`}
                onClick={handleToggleCanvasFooter}
                title="Toggle Modern Footer Extension (Twitter / Reddit style bottom canvas extension)"
                style={{
                  padding: "5px 12px",
                  borderRadius: "16px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  background: canvasFooter.enabled
                    ? "var(--primary-gradient)"
                    : "transparent",
                  border: canvasFooter.enabled
                    ? "1px solid var(--cyber-cyan)"
                    : "1px solid transparent",
                  color: "#ffffff"
                }}
              >
                <PanelBottom size={14} style={{ color: canvasFooter.enabled ? "#ffffff" : "var(--cyber-cyan)" }} />
                <span>Footer</span>
              </button>
              <button
                type="button"
                className={`btn btn-xs hover-lift ${(canvasHeader.enabled && canvasFooter.enabled) ? 'active' : ''}`}
                onClick={handleToggleCanvasBoth}
                title="Toggle Both Header & Footer Extensions"
                style={{
                  padding: "5px 12px",
                  borderRadius: "16px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  background: (canvasHeader.enabled && canvasFooter.enabled)
                    ? "var(--primary-gradient)"
                    : "transparent",
                  border: (canvasHeader.enabled && canvasFooter.enabled)
                    ? "1px solid var(--cyber-cyan)"
                    : "1px solid transparent",
                  color: "#ffffff"
                }}
              >
                <Rows3 size={14} style={{ color: (canvasHeader.enabled && canvasFooter.enabled) ? "#ffffff" : "var(--cyber-cyan)" }} />
                <span>Both</span>
              </button>
            </div>

            {/* Speech & Chat Bubble Button */}
            <button
              type="button"
              className={`btn btn-xs hover-lift ${activeCaption?.bubbleStyle ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                if (activeCaption) {
                  setShowBubbleBottomSheet(true);
                } else {
                  handleAddBubble();
                  setShowBubbleBottomSheet(true);
                }
              }}
              title={activeCaption?.bubbleStyle ? "Change Chat or Speech Bubble Layout (iPhone, WhatsApp, Comic)" : "Add Chat or Speech Bubble (iPhone, WhatsApp, Comic)"}
              style={{ padding: "7px 14px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <MessageSquare size={15} style={{ color: activeCaption?.bubbleStyle ? "#ffffff" : "var(--cyber-cyan)" }} /> Bubble
            </button>

            {/* AI Meme Caption Generator Button */}
            <button
              type="button"
              className="btn btn-xs hover-lift"
              onClick={() => setShowAiModal(true)}
              title="Generate AI meme captions or browse funny ideas"
              style={{
                padding: "7px 14px",
                borderRadius: "20px",
                fontSize: "0.82rem",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(236, 72, 153, 0.35) 100%)",
                border: "1px solid rgba(236, 72, 153, 0.6)",
                color: "#ffffff"
              }}
            >
              <WandSparkles size={15} style={{ color: "#ec4899" }} /> AI Captions
            </button>
          </div>

        {/* Color Swatches Bar + Delete Button (When activeCaption exists) */}
        {activeCaption && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              className="color-palette-bar"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-surface-1)',
                padding: '4px 8px',
                borderRadius: '20px',
                border: '1px solid var(--glass-border)'
              }}
            >
              {COLOR_SWATCHES.map((hex) => {
                const isSelected = (activeCaption.color || '#ffffff').toLowerCase() === hex.toLowerCase();
                return (
                  <button
                    key={hex}
                    type="button"
                    className="color-swatch-circle"
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: hex,
                      border: isSelected ? '2px solid #ffffff' : '1.5px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: isSelected ? `0 0 10px ${hex}, 0 0 2px #fff` : 'none',
                      transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => {
                      if (!activeLayerId) return;
                      const hasBg = activeCaption.bgColor && activeCaption.bgColor !== 'none' && activeCaption.bgColor !== 'transparent';
                      const strokeColor = hasBg ? 'transparent' : (hex === '#000000' ? '#ffffff' : '#000000');
                      const nextCaps = captions.map((cap) => 
                        cap.id === activeLayerId ? { ...cap, color: hex, stroke: strokeColor } : cap
                      );
                      setCaptions(nextCaps);
                      pushHistory();
                    }}
                    title={hex}
                  />
                );
              })}

              {/* Custom Color Wheel Picker */}
              <label
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
                  border: '1.5px solid rgba(255, 255, 255, 0.5)',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                  margin: 0,
                  padding: 0
                }}
                title="Custom Color"
              >
                <input
                  type="color"
                  value={activeCaption.color || '#ffffff'}
                  onChange={(e) => {
                    const hex = e.target.value;
                    if (!activeLayerId) return;
                    const hasBg = activeCaption.bgColor && activeCaption.bgColor !== 'none' && activeCaption.bgColor !== 'transparent';
                    const strokeColor = hasBg ? 'transparent' : (hex === '#000000' ? '#ffffff' : '#000000');
                    const nextCaps = captions.map((cap) => 
                      cap.id === activeLayerId ? { ...cap, color: hex, stroke: strokeColor } : cap
                    );
                    setCaptions(nextCaps);
                    pushHistory();
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
              </label>
            </div>

            {/* Delete Text Layer Button */}
            <button
              type="button"
              className="btn btn-icon btn-xs hover-lift vid-ctx-btn-delete"
              onClick={() => handleDeleteLayer()}
              title="Delete Text"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: '1px solid rgba(255, 255, 255, 0.28)',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginRight: '8px'
              }}
            >
              <Trash2 size={14} style={{ color: '#ffffff' }} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
