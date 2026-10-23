import React from 'react';
import { Type, Sparkles, RefreshCw, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { BUBBLE_LAYOUT_OPTIONS } from '../../../../utils/captionLayout';
import { TEXT_EFFECTS } from '../../constants';
import { isSocialCardCaption } from '../../memeEditorUtils';
import ChyronEditor from '../../social-cards/ChyronEditor';
import TweetCardEditor from '../../social-cards/TweetCardEditor';
import InstagramCardEditor from '../../social-cards/InstagramCardEditor';
import WhatsAppCardEditor from '../../social-cards/WhatsAppCardEditor';

export default function CaptionStyleControls({
  activeCaption,
  activeFontObj,
  getActiveTextEffectId,
  handleApplyBubbleStyle,
  handleApplyTextEffect,
  handleCycleFont,
  handleSetCaptionBg,
  handleToggleTextCase,
  updateActiveCaption,
  updateActiveCaptionProps,
}) {
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* ROW 1: SIZE & OPACITY SIDE BY SIDE */}
        {(() => {
          const currentOpacityNum = activeCaption.opacity !== undefined && activeCaption.opacity !== null
            ? (Number(activeCaption.opacity) > 1 ? Number(activeCaption.opacity) / 100 : Number(activeCaption.opacity))
            : 1;
          const opacityPercent = Math.round(currentOpacityNum * 100);

          return (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                alignItems: 'center'
              }}
            >
              {/* Size Control */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                <label style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Size ({activeCaption.fontSize || 50}px)
                </label>
                <div
                  className="size-control-group flex-between gap-xs"
                  style={{
                    height: '36px',
                    padding: '0 6px',
                    borderRadius: '10px',
                    background: 'var(--bg-surface-1)',
                    border: '1px solid var(--glass-border)',
                    alignItems: 'center'
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost"
                    style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: 'var(--text-main)' }}
                    onClick={() => updateActiveCaption('fontSize', Math.max(16, (activeCaption.fontSize || 50) - 4))}
                    title="Decrease size"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min={16}
                    max={250}
                    style={{ flex: 1, margin: '0 4px', minWidth: 0, accentColor: 'var(--cyber-cyan)' }}
                    value={activeCaption.fontSize || 50}
                    onChange={(e) => updateActiveCaption('fontSize', Number(e.target.value))}
                  />
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost"
                    style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: 'var(--text-main)' }}
                    onClick={() => updateActiveCaption('fontSize', Math.min(250, (activeCaption.fontSize || 50) + 4))}
                    title="Increase size"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Opacity Control */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                <label style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Opacity
                </label>
                <div
                  className="size-control-group flex-between gap-xs"
                  style={{
                    height: '36px',
                    padding: '0 6px',
                    borderRadius: '10px',
                    background: 'var(--bg-surface-1)',
                    border: '1px solid var(--glass-border)',
                    alignItems: 'center'
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost"
                    style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: 'var(--text-main)' }}
                    onClick={() => updateActiveCaption('opacity', Math.max(10, opacityPercent - 5) / 100)}
                    title="Decrease opacity"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={1}
                    style={{ flex: 1, margin: '0 4px', minWidth: 0, accentColor: 'var(--cyber-cyan)' }}
                    value={opacityPercent}
                    onChange={(e) => updateActiveCaption('opacity', Number(e.target.value) / 100)}
                  />
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost"
                    style={{ width: '24px', height: '24px', borderRadius: '50%', padding: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: 'var(--text-main)' }}
                    onClick={() => updateActiveCaption('opacity', Math.min(100, opacityPercent + 5) / 100)}
                    title="Increase opacity"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ROW 2: FONT SELECTION & BACKGROUND TOGGLES (SIDE-BY-SIDE) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            alignItems: 'end'
          }}
        >
          {/* Font Selector Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
            <div className="flex-between align-center" style={{ minHeight: '16px' }}>
              <label style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Font
              </label>
              <button
                type="button"
                className="btn btn-xs btn-ghost"
                onClick={handleToggleTextCase}
                title="Toggle Text Case (ALL CAPS / Sentence case / lowercase)"
                style={{ padding: '0 6px', height: '18px', fontSize: '0.7rem', fontWeight: 700, borderRadius: '6px', color: 'var(--cyber-cyan)' }}
              >
                Aa Case
              </button>
            </div>
            <button
              type="button"
              className="btn btn-xs btn-secondary font-cycle-btn hover-lift"
              style={{
                fontFamily: activeFontObj.family,
                width: '100%',
                padding: '0 8px',
                height: '38px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                background: 'var(--bg-surface-1)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxSizing: 'border-box'
              }}
              onClick={handleCycleFont}
              title="Click to cycle font"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <Type size={13} style={{ color: 'var(--cyber-cyan)', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeFontObj.id || activeFontObj.name.split(' ')[0]}</span>
              </span>
              <RefreshCw size={12} style={{ color: 'var(--cyber-cyan)', flexShrink: 0, opacity: 0.8 }} />
            </button>
          </div>

          {/* Background Segmented Pill */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
            <div className="flex-between align-center" style={{ minHeight: '16px' }}>
              <label style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Background
              </label>
            </div>

            {/* Segmented Button Group: None, White, Black, Banner */}
            <div
              style={{
                display: 'flex',
                height: '38px',
                padding: 0,
                borderRadius: '10px',
                background: 'transparent',
                border: 'none',
                gap: '4px',
                boxSizing: 'border-box'
              }}
            >
              <button
                type="button"
                className={`btn btn-xs flex-1 ${(!activeCaption.bgColor || activeCaption.bgColor === 'transparent' || activeCaption.bgColor === 'none') ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  borderRadius: '999px',
                  padding: '0 2px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: (!activeCaption.bgColor || activeCaption.bgColor === 'transparent' || activeCaption.bgColor === 'none') ? undefined : 'var(--bg-surface-1)',
                  border: 'none'
                }}
                onClick={() => handleSetCaptionBg('none')}
              >
                None
              </button>
              <button
                type="button"
                className={`btn btn-xs flex-1 ${activeCaption.bgColor === 'white' ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  borderRadius: '999px',
                  padding: '0 2px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  background: activeCaption.bgColor === 'white' ? undefined : 'var(--bg-surface-1)',
                  border: 'none'
                }}
                onClick={() => handleSetCaptionBg('white')}
              >
                White
              </button>
              <button
                type="button"
                className={`btn btn-xs flex-1 ${(activeCaption.bgColor === 'black' || activeCaption.bgColor === '#000000') ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  borderRadius: '999px',
                  padding: '0 2px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  background: (activeCaption.bgColor === 'black' || activeCaption.bgColor === '#000000') ? undefined : 'var(--bg-surface-1)',
                  border: 'none'
                }}
                onClick={() => handleSetCaptionBg('black')}
              >
                Dark
              </button>
            </div>
          </div>
        </div>

        {/* ROW: ALIGNMENT & TEXT CASE */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            alignItems: 'center'
          }}
        >
          {/* Alignment Control */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
            <label style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Alignment
            </label>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'var(--bg-surface-1)',
                borderRadius: '10px',
                padding: '3px',
                border: '1px solid var(--glass-border)',
                gap: '3px',
                height: '36px'
              }}
            >
              <button
                type="button"
                className={`btn btn-xs flex-1 ${(activeCaption.align === 'left') ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => updateActiveCaption('align', 'left')}
                style={{
                  borderRadius: '7px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  background: activeCaption.align === 'left' ? 'var(--primary-gradient)' : 'transparent',
                  border: 'none',
                  color: '#ffffff'
                }}
                title="Align Left"
              >
                <AlignLeft size={13} />
                <span>Left</span>
              </button>
              <button
                type="button"
                className={`btn btn-xs flex-1 ${(activeCaption.align === 'center' || !activeCaption.align) ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => updateActiveCaption('align', 'center')}
                style={{
                  borderRadius: '7px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  background: (activeCaption.align === 'center' || !activeCaption.align) ? 'var(--primary-gradient)' : 'transparent',
                  border: 'none',
                  color: '#ffffff'
                }}
                title="Align Center"
              >
                <AlignCenter size={13} />
                <span>Center</span>
              </button>
              <button
                type="button"
                className={`btn btn-xs flex-1 ${(activeCaption.align === 'right') ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => updateActiveCaption('align', 'right')}
                style={{
                  borderRadius: '7px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  background: activeCaption.align === 'right' ? 'var(--primary-gradient)' : 'transparent',
                  border: 'none',
                  color: '#ffffff'
                }}
                title="Align Right"
              >
                <AlignRight size={13} />
                <span>Right</span>
              </button>
            </div>
          </div>

          {/* Case Control */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
            <label style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Text Case
            </label>
            <button
              type="button"
              className="btn btn-sm btn-secondary hover-lift"
              onClick={handleToggleTextCase}
              style={{
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Aa</span>
              <span>Toggle Case</span>
            </button>
          </div>
        </div>

        {/* ROW 3: TEXT EFFECTS CONTROL */}
        {(!activeCaption.isBreakingNews && !isSocialCardCaption(activeCaption)) && (() => {
          const currentEffect = getActiveTextEffectId(activeCaption);
          return (
            <div
              style={{
                background: 'var(--bg-surface-1)',
                padding: '10px 12px',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div className="flex-between align-center">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles style={{ width: 14, height: 14, color: "var(--cyber-cyan)" }} />
                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>Text Effects</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: (currentEffect !== 'flat') ? 'var(--cyber-cyan)' : 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {currentEffect}
                  </span>
                </div>
                {currentEffect !== 'flat' && (
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost"
                    onClick={() => handleApplyTextEffect('flat')}
                    style={{ fontSize: '0.68rem', padding: '1px 6px', height: '18px', color: 'var(--text-muted)' }}
                  >
                    Reset Flat
                  </button>
                )}
              </div>

              {/* Preset Effect Buttons with stylized labels */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                {TEXT_EFFECTS.map((eff) => {
                  const isActive = currentEffect === eff.id;
                  return (
                    <button
                      key={eff.id}
                      type="button"
                      className={`btn btn-xs ${isActive ? 'btn-primary' : 'btn-ghost'}`}
                      style={{
                        fontSize: '0.72rem',
                        padding: '5px 2px',
                        borderRadius: '6px',
                        border: isActive ? '1px solid var(--cyber-cyan)' : '1px solid var(--glass-border)',
                        background: isActive ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.05)',
                        boxShadow: isActive ? '0 0 10px rgba(6, 182, 212, 0.4)' : 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '28px'
                      }}
                      onClick={() => handleApplyTextEffect(eff.id)}
                      title={eff.title}
                    >
                      {eff.renderLabel()}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Bubble Style Switcher (if this is a speech or chat bubble) */}
        {activeCaption.bubbleStyle && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
            <div className="flex-between align-center">
              <label style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Bubble Layout & Style
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
              {BUBBLE_LAYOUT_OPTIONS.map(style => (
                <button
                  key={style.id}
                  type="button"
                  className={`btn btn-xs bubble-layout-btn bubble-layout-btn-${style.id} ${activeCaption.bubbleStyle === style.id ? 'bubble-active' : ''}`}
                  style={{ fontSize: '0.68rem', padding: '5px 2px' }}
                  onClick={() => handleApplyBubbleStyle(style.id)}
                  title={`Switch to ${style.label} bubble`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Breaking News Chyron Customizer */}
        <ChyronEditor activeCaption={activeCaption} updateActiveCaption={updateActiveCaption} updateActiveCaptionProps={updateActiveCaptionProps} />

        {/* Fake Tweet Post Customizer */}
        <TweetCardEditor activeCaption={activeCaption} updateActiveCaption={updateActiveCaption} updateActiveCaptionProps={updateActiveCaptionProps} />

        {/* Fake Instagram Post Customizer */}
        <InstagramCardEditor activeCaption={activeCaption} updateActiveCaption={updateActiveCaption} updateActiveCaptionProps={updateActiveCaptionProps} />

        {/* Fake WhatsApp Message Customizer (Modern iOS Multi-Message) */}
        <WhatsAppCardEditor activeCaption={activeCaption} updateActiveCaption={updateActiveCaption} updateActiveCaptionProps={updateActiveCaptionProps} />

        {/* Standard / Demotivational Caption Textarea */}
        {(!activeCaption.isBreakingNews && !isSocialCardCaption(activeCaption)) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
            <div className="flex-between align-center">
              <label style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {activeCaption.isDemotivationalTitle ? 'Demotivational Title' : (activeCaption.isDemotivationalSubtitle ? 'Demotivational Subtitle' : 'Caption Text')}
              </label>
            </div>
            <textarea
              className="form-input"
              rows={2}
              value={activeCaption.text || ''}
              onChange={(e) => updateActiveCaption('text', e.target.value)}
              placeholder="Enter text..."
              style={{ width: '100%', fontSize: '0.85rem', resize: 'vertical' }}
            />
          </div>
        )}
      </div>
    </>
  );
}
