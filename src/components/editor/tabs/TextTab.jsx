import { Type, Sparkles, PanelTop, PanelBottom } from 'lucide-react';
import { PRESET_PHRASES, isColorDark } from '../../../utils/captionLayout';
import CaptionStyleControls from './text/CaptionStyleControls';
import TextToolbar from './text/TextToolbar';
import { useMemeEditorStore } from '../store/useMemeEditorStore';
import { useEditorUiStore } from '../store/useEditorUiStore';

export default function TextTab({
  activeCaption,
  activeFontObj,
  getActiveTextEffectId,
  handleAddBubble,
  handleAddCaption,
  handleAddCurvedText,
  handleAddPresetPhrase,
  handleApplyBubbleStyle,
  handleApplyTextEffect,
  handleCycleFont,
  handleDeleteLayer,
  handleSetCanvasBgColor,
  handleSetCaptionBg,
  handleToggleCanvasBoth,
  handleToggleCanvasFooter,
  handleToggleCanvasHeader,
  handleToggleTextCase,
  updateActiveCaption,
  updateActiveCaptionProps,
}) {
  const activeTab = useEditorUiStore((s) => s.activeTab);
  const setActiveSubmenu = useEditorUiStore((s) => s.setActiveSubmenu);
  const canvasHeader = useMemeEditorStore((s) => s.canvasHeader);
  const canvasFooter = useMemeEditorStore((s) => s.canvasFooter);
  const canvasBgColor = useMemeEditorStore((s) => s.canvasBgColor);
  const pushHistory = useMemeEditorStore((s) => s.pushHistory);
  const captions = useMemeEditorStore((s) => s.captions);
  const setActiveLayerId = useMemeEditorStore((s) => s.setActiveLayerId);

  return (
    <>
      {activeTab === 'text' && (
        <div className="tab-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* TOP ACTION & COLOR TOOLBAR */}
          <TextToolbar
            activeCaption={activeCaption}
            handleAddBubble={handleAddBubble}
            handleAddCaption={handleAddCaption}
            handleAddCurvedText={handleAddCurvedText}
            handleDeleteLayer={handleDeleteLayer}
            handleToggleCanvasBoth={handleToggleCanvasBoth}
            handleToggleCanvasFooter={handleToggleCanvasFooter}
            handleToggleCanvasHeader={handleToggleCanvasHeader}
          />

          {/* ACTIVE CAPTION CONTROLS */}
          {activeCaption ? (
            <CaptionStyleControls
              activeCaption={activeCaption}
              activeFontObj={activeFontObj}
              getActiveTextEffectId={getActiveTextEffectId}
              handleApplyBubbleStyle={handleApplyBubbleStyle}
              handleApplyTextEffect={handleApplyTextEffect}
              handleCycleFont={handleCycleFont}
              handleSetCaptionBg={handleSetCaptionBg}
              handleToggleTextCase={handleToggleTextCase}
              updateActiveCaption={updateActiveCaption}
              updateActiveCaptionProps={updateActiveCaptionProps}
            />
          ) : (canvasHeader.enabled || canvasFooter.enabled) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {canvasHeader.enabled && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'var(--bg-surface-1)',
                    borderRadius: '10px',
                    border: '1px dashed var(--glass-border)',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <PanelTop size={15} style={{ color: 'var(--cyber-cyan)' }} />
                    <span>Header Extension is active.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-xs btn-secondary"
                      onClick={() => {
                        const isDark = isColorDark(canvasBgColor || '#ffffff');
                        const nextBg = isDark ? '#ffffff' : '#000000';
                        handleSetCanvasBgColor(nextBg);
                        pushHistory();
                      }}
                      style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="Toggle Canvas & Header Theme (Light / Dark)"
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: canvasBgColor || '#ffffff', border: '1px solid #fff' }} />
                      <span>{isColorDark(canvasBgColor || '#ffffff') ? 'Dark' : 'Light'}</span>
                    </button>
                    <div
                      style={{ position: 'relative', overflow: 'hidden', width: 22, height: 22, borderRadius: '6px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: canvasBgColor || '#ffffff', cursor: 'pointer', flexShrink: 0 }}
                      title="Pick Custom Canvas Background Color"
                    >
                      <input
                        type="color"
                        value={canvasBgColor || '#ffffff'}
                        onChange={(e) => {
                          handleSetCanvasBgColor(e.target.value);
                        }}
                        style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-xs btn-primary"
                      onClick={() => {
                        const hCap = captions.find(c => c.isHeaderCaption);
                        if (hCap) {
                          setActiveLayerId(hCap.id);
                          setActiveSubmenu(null);
                        } else {
                          handleToggleCanvasHeader();
                        }
                      }}
                      style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px' }}
                    >
                      Select Text
                    </button>
                  </div>
                </div>
              )}

              {canvasFooter.enabled && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'var(--bg-surface-1)',
                    borderRadius: '10px',
                    border: '1px dashed var(--glass-border)',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <PanelBottom size={15} style={{ color: 'var(--cyber-cyan)' }} />
                    <span>Footer Extension is active.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-xs btn-secondary"
                      onClick={() => {
                        const isDark = isColorDark(canvasBgColor || '#ffffff');
                        const nextBg = isDark ? '#ffffff' : '#000000';
                        handleSetCanvasBgColor(nextBg);
                        pushHistory();
                      }}
                      style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="Toggle Canvas & Footer Theme (Light / Dark)"
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: canvasBgColor || '#ffffff', border: '1px solid #fff' }} />
                      <span>{isColorDark(canvasBgColor || '#ffffff') ? 'Dark' : 'Light'}</span>
                    </button>
                    <div
                      style={{ position: 'relative', overflow: 'hidden', width: 22, height: 22, borderRadius: '6px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: canvasBgColor || '#ffffff', cursor: 'pointer', flexShrink: 0 }}
                      title="Pick Custom Canvas Background Color"
                    >
                      <input
                        type="color"
                        value={canvasBgColor || '#ffffff'}
                        onChange={(e) => {
                          handleSetCanvasBgColor(e.target.value);
                        }}
                        style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-xs btn-primary"
                      onClick={() => {
                        const fCap = captions.find(c => c.isFooterCaption);
                        if (fCap) {
                          setActiveLayerId(fCap.id);
                          setActiveSubmenu(null);
                        } else {
                          handleToggleCanvasFooter();
                        }
                      }}
                      style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px' }}
                    >
                      Select Text
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* EMPTY STATE (When no caption is selected) */
            <div
              style={{
                padding: '12px 14px',
                background: 'var(--bg-surface-1)',
                borderRadius: '10px',
                border: '1px dashed var(--glass-border)',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Type size={15} style={{ color: 'var(--cyber-cyan)', opacity: 0.8 }} />
              <span>Tap text, header, or footer on canvas to customize font, size, opacity & colors.</span>
            </div>
          )}

          {/* QUICK PHRASES SECTION */}
          <div className="preset-phrases-section" style={{ marginTop: '2px' }}>
            <div className="flex-between align-center" style={{ marginBottom: '6px' }}>
              <label className="form-field-label" style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={12} style={{ color: 'var(--cyber-cyan)' }} /> Quick Phrases
              </label>
            </div>
            <div className="preset-chips-scroll" style={{ paddingBottom: '4px' }}>
              {PRESET_PHRASES.map((phrase) => (
                <button
                  key={phrase}
                  className="phrase-chip hover-lift"
                  onClick={() => handleAddPresetPhrase(phrase)}
                  style={{
                    background: 'var(--bg-surface-1)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '16px',
                    padding: '4px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  + {phrase}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
