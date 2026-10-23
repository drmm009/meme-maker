import React from 'react';
import { Type, Plus, Settings, Upload, Droplet, Palette, Wand2, MessageSquareQuote, Flame, CheckCheck, User } from 'lucide-react';
import { TwitterVerifiedBadge, InstagramVerifiedBadge } from '../../MemeStylesModal';

export default function CaptionToolbar({
  activeCaption,
  activeFontObj,
  activeSubmenu,
  handleOpenSocialModalForActiveCard,
  handleSetCaptionBg,
  handleToggleSubmenu,
  setActiveSubmenu,
  setShowBubbleBottomSheet,
  showBubbleBottomSheet,
  showStylesModal,
  updateActiveCaptionProps,
}) {
  return (
    <>
      {activeCaption && (
        activeCaption.isTweetCard ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              className={`btn btn-xs vid-ctx-btn ${showStylesModal ? 'active' : ''}`}
              onClick={() => handleOpenSocialModalForActiveCard('tweet')}
              title="Tweet Card Settings"
              aria-label="Tweet Card Settings"
              style={{
                padding: '4px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                flexShrink: 0,
                background: showStylesModal ? 'rgba(29, 155, 240, 0.45)' : 'rgba(29, 155, 240, 0.22)',
                border: showStylesModal ? '1.5px solid #1d9bf0' : '1px solid #1d9bf0',
                boxShadow: showStylesModal ? '0 0 10px rgba(29, 155, 240, 0.5)' : 'none',
                color: '#ffffff'
              }}
            >
              <Settings style={{ width: 14, height: 14, color: '#1d9bf0' }} />
            </button>

            <button
              type="button"
              className={`btn btn-xs vid-ctx-btn ${activeCaption.tweetVerified !== false ? 'active' : ''}`}
              onClick={() => updateActiveCaptionProps({ tweetVerified: activeCaption.tweetVerified === false })}
              title="Toggle Verified Badge"
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                flexShrink: 0,
                background: activeCaption.tweetVerified !== false ? 'rgba(29, 155, 240, 0.28)' : 'rgba(255, 255, 255, 0.08)',
                border: activeCaption.tweetVerified !== false ? '1px solid #1d9bf0' : '1px solid rgba(255, 255, 255, 0.1)',
                color: activeCaption.tweetVerified !== false ? '#ffffff' : 'rgba(255, 255, 255, 0.85)'
              }}
            >
              <TwitterVerifiedBadge size={14} color="#ffffff" checkColor={activeCaption.tweetVerified !== false ? "#1d9bf0" : "#0f172a"} />
              <span>Verified</span>
            </button>

            <button
              type="button"
              className={`btn btn-xs vid-ctx-btn ${activeSubmenu === 'tweetTheme' ? 'active' : ''}`}
              onClick={() => handleToggleSubmenu('tweetTheme')}
              title="Change Theme (Dim, Dark, White)"
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                flexShrink: 0,
                background: activeSubmenu === 'tweetTheme' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                border: activeSubmenu === 'tweetTheme' ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff'
              }}
            >
              <Palette style={{ width: 13, height: 13, color: '#ffffff' }} />
              <span>Theme</span>
            </button>

            <button
              type="button"
              className={`btn btn-xs vid-ctx-btn ${activeSubmenu === 'tweetTrend' ? 'active' : ''}`}
              onClick={() => handleToggleSubmenu('tweetTrend')}
              title="Change Trend Metrics (Viral, Casual, Ratioed)"
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                flexShrink: 0,
                background: activeSubmenu === 'tweetTrend' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                border: activeSubmenu === 'tweetTrend' ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff'
              }}
            >
              <Flame style={{ width: 13, height: 13, color: '#ffffff' }} />
              <span>Trend</span>
            </button>
          </div>
        ) : activeCaption.isInstagramCard ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              className={`btn btn-xs vid-ctx-btn ${showStylesModal ? 'active' : ''}`}
              onClick={() => handleOpenSocialModalForActiveCard('instagram')}
              title="Instagram Post Settings"
              aria-label="Instagram Post Settings"
              style={{
                padding: '4px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                flexShrink: 0,
                background: showStylesModal ? 'rgba(244, 63, 94, 0.45)' : 'rgba(244, 63, 94, 0.22)',
                border: showStylesModal ? '1.5px solid #f43f5e' : '1px solid #f43f5e',
                boxShadow: showStylesModal ? '0 0 10px rgba(244, 63, 94, 0.5)' : 'none',
                color: '#ffffff'
              }}
            >
              <Settings style={{ width: 14, height: 14, color: '#f43f5e' }} />
            </button>

            {/* Custom Post Photo Uploader */}
            <label
              className="btn btn-xs vid-ctx-btn"
              title="Upload Custom Post Photo"
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                flexShrink: 0,
                background: 'rgba(255, 94, 54, 0.22)',
                border: '1px solid #ff5e36',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <Upload style={{ width: 13, height: 13 }} />
              <span>Photo</span>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      updateActiveCaptionProps({ igPostImage: ev.target.result });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>

            <button
              type="button"
              className={`btn btn-xs vid-ctx-btn ${activeCaption.igVerified !== false ? 'active' : ''}`}
              onClick={() => updateActiveCaptionProps({ igVerified: activeCaption.igVerified === false })}
              title="Toggle Verified Badge"
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                flexShrink: 0,
                background: activeCaption.igVerified !== false ? 'rgba(0, 149, 246, 0.28)' : 'rgba(255, 255, 255, 0.08)',
                border: activeCaption.igVerified !== false ? '1px solid #0095f6' : '1px solid rgba(255, 255, 255, 0.1)',
                color: activeCaption.igVerified !== false ? '#ffffff' : 'rgba(255, 255, 255, 0.85)'
              }}
            >
              <InstagramVerifiedBadge size={14} />
              <span>Verified</span>
            </button>

            <button
              type="button"
              className={`btn btn-xs vid-ctx-btn ${activeCaption.igHasStoryRing !== false ? 'active' : ''}`}
              onClick={() => updateActiveCaptionProps({ igHasStoryRing: activeCaption.igHasStoryRing === false })}
              title="Toggle Gradient Story Ring"
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                flexShrink: 0,
                background: activeCaption.igHasStoryRing !== false ? 'rgba(244, 63, 94, 0.28)' : 'rgba(255, 255, 255, 0.08)',
                border: activeCaption.igHasStoryRing !== false ? '1px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff'
              }}
            >
              <div style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                border: '1.5px solid #fff'
              }} />
              <span>Story Ring</span>
            </button>

            <button
              type="button"
              className={`btn btn-xs vid-ctx-btn ${activeSubmenu === 'igTheme' ? 'active' : ''}`}
              onClick={() => handleToggleSubmenu('igTheme')}
              title="Change Instagram Theme (Dark / Light)"
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                flexShrink: 0,
                background: activeSubmenu === 'igTheme' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                border: activeSubmenu === 'igTheme' ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff'
              }}
            >
              <Palette style={{ width: 13, height: 13, color: '#ffffff' }} />
              <span>Theme</span>
            </button>
          </div>
        ) : activeCaption.isWhatsAppCard ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              className={`btn btn-xs vid-ctx-btn ${showStylesModal ? 'active' : ''}`}
              onClick={() => handleOpenSocialModalForActiveCard('whatsapp')}
              title="WhatsApp Chat Settings"
              aria-label="WhatsApp Chat Settings"
              style={{
                padding: '4px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                flexShrink: 0,
                background: showStylesModal ? 'rgba(34, 197, 94, 0.45)' : 'rgba(34, 197, 94, 0.22)',
                border: showStylesModal ? '1.5px solid #22c55e' : '1px solid #22c55e',
                boxShadow: showStylesModal ? '0 0 10px rgba(34, 197, 94, 0.5)' : 'none',
                color: '#ffffff'
              }}
            >
              <Settings style={{ width: 14, height: 14, color: '#22c55e' }} />
            </button>

            {/* Add Message Button */}
            <button
              type="button"
              className="btn btn-xs vid-ctx-btn"
              onClick={() => {
                const curMsgs = activeCaption.waMessages && activeCaption.waMessages.length > 0
                  ? activeCaption.waMessages
                  : [{ id: 'm1', text: activeCaption.text || '', direction: activeCaption.waDirection || 'received', time: activeCaption.waTime || '11:42 PM', ticks: activeCaption.waTicks || 'blue' }];
                const lastMsg = curMsgs[curMsgs.length - 1];
                const nextDir = lastMsg?.direction === 'sent' ? 'received' : 'sent';
                const newMsg = {
                  id: `m_${Date.now()}`,
                  text: nextDir === 'sent' ? 'Sounds great!' : 'Check this out!',
                  direction: nextDir,
                  time: '11:45 PM',
                  ticks: 'blue'
                };
                updateActiveCaptionProps({ waMessages: [...curMsgs, newMsg] });
              }}
              title="Add New Message to WhatsApp Thread"
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                flexShrink: 0,
                background: 'rgba(37, 211, 102, 0.28)',
                border: '1px solid #25d366',
                color: '#ffffff'
              }}
            >
              <Plus style={{ width: 13, height: 13 }} />
              <span>+ Msg</span>
            </button>

            <button
              type="button"
              className={`btn btn-xs vid-ctx-btn ${activeCaption.waShowHeader !== false ? 'active' : ''}`}
              onClick={() => updateActiveCaptionProps({ waShowHeader: activeCaption.waShowHeader === false })}
              title="Toggle WhatsApp Contact Header"
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                flexShrink: 0,
                background: activeCaption.waShowHeader !== false ? 'rgba(37, 211, 102, 0.28)' : 'rgba(255, 255, 255, 0.08)',
                border: activeCaption.waShowHeader !== false ? '1px solid #25d366' : '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff'
              }}
            >
              <User style={{ width: 13, height: 13 }} />
              <span>Header</span>
            </button>

            {activeCaption.waDirection === 'sent' && (
              <button
                type="button"
                className={`btn btn-xs vid-ctx-btn ${activeSubmenu === 'waTicks' ? 'active' : ''}`}
                onClick={() => handleToggleSubmenu('waTicks')}
                title="Change Read Receipt Ticks (Blue / Grey / Single)"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  borderRadius: '8px',
                  flexShrink: 0,
                  background: activeSubmenu === 'waTicks' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                  border: activeSubmenu === 'waTicks' ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff'
                }}
              >
                <CheckCheck style={{ width: 13, height: 13, color: '#53bdeb' }} />
                <span>Ticks</span>
              </button>
            )}

            <button
              type="button"
              className={`btn btn-xs vid-ctx-btn ${activeSubmenu === 'waTheme' ? 'active' : ''}`}
              onClick={() => handleToggleSubmenu('waTheme')}
              title="Change WhatsApp Theme (Dark / Light)"
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                flexShrink: 0,
                background: activeSubmenu === 'waTheme' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                border: activeSubmenu === 'waTheme' ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff'
              }}
            >
              <Palette style={{ width: 13, height: 13, color: '#ffffff' }} />
              <span>Theme</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {/* 1. Font Button */}
            <button
              type="button"
              data-setting-btn="font"
              className={`btn btn-xs vid-ctx-btn vid-ctx-btn-font ${activeSubmenu === 'font' ? 'active' : ''}`}
              title="Change Font"
              onClick={() => handleToggleSubmenu('font')}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                background: activeSubmenu === 'font' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                border: activeSubmenu === 'font' ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: activeSubmenu === 'font' ? '0 2px 10px rgba(6, 182, 212, 0.4), 0 0 8px rgba(99, 102, 241, 0.4)' : 'none',
                transition: 'all 0.2s ease',
                color: '#ffffff',
                flexShrink: 0
              }}
            >
              <Type className="vid-font-icon" style={{ width: 14, height: 14, color: '#ffffff' }} />
              <span>{activeFontObj ? activeFontObj.id : (activeCaption.fontFamily || 'Impact').split(/[\s,]+/)[0].replace(/^[-'"]+|['"]+$/g, '')}</span>
            </button>

            {/* 3. Color Button */}
            <button
              type="button"
              data-setting-btn="color"
              className={`btn btn-xs vid-ctx-btn vid-ctx-btn-color ${activeSubmenu === 'color' ? 'active' : ''}`}
              onClick={() => handleToggleSubmenu('color')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '8px',
                background: activeSubmenu === 'color' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                border: activeSubmenu === 'color' ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: activeSubmenu === 'color' ? '0 2px 10px rgba(6, 182, 212, 0.4), 0 0 8px rgba(99, 102, 241, 0.4)' : 'none',
                color: '#ffffff',
                flexShrink: 0,
                cursor: 'pointer'
              }}
              title="Text Fill Color"
            >
              <div
                className="vid-color-swatch-disc"
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: activeCaption.color || '#fff',
                  border: '2px solid rgba(255,255,255,0.85)',
                  boxShadow: `0 0 6px ${activeCaption.color || 'rgba(255,255,255,0.4)'}`
                }}
              />
              <span>Color</span>
            </button>

            {/* 4. Box Button */}
            {(() => {
              const hasBg = Boolean(activeCaption.bgColor && activeCaption.bgColor !== 'none' && activeCaption.bgColor !== 'transparent');

              return (
                <button
                  type="button"
                  data-setting-btn="bg"
                  className={`btn btn-xs vid-ctx-btn vid-ctx-btn-bg ${activeSubmenu === 'bg' ? 'active' : ''}`}
                  title={hasBg ? `Text Box Active (${activeCaption.bgColor}) - Click to toggle options` : "Text Box - Click to apply and change color"}
                  onClick={() => {
                    if (activeSubmenu === 'bg') {
                      handleToggleSubmenu('bg');
                    } else {
                      handleToggleSubmenu('bg');
                      if (!hasBg) {
                        handleSetCaptionBg('white');
                      }
                    }
                  }}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    borderRadius: '8px',
                    background: activeSubmenu === 'bg' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                    border: activeSubmenu === 'bg' ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: activeSubmenu === 'bg' ? '0 2px 10px rgba(6, 182, 212, 0.4), 0 0 8px rgba(99, 102, 241, 0.4)' : 'none',
                    transition: 'all 0.2s ease',
                    color: '#ffffff',
                    flexShrink: 0
                  }}
                >
                  <span
                    className="vid-ctx-bg-badge"
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '3.5px',
                      border: '1.5px solid #ffffff',
                      background: 'transparent',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxSizing: 'border-box',
                      flexShrink: 0,
                      userSelect: 'none'
                    }}
                  >
                    <span
                      style={{
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '11px',
                        lineHeight: 1,
                        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                        userSelect: 'none'
                      }}
                    >
                      A
                    </span>
                  </span>
                  <span>Box</span>
                </button>
              );
            })()}

            {/* 6. Blur Button */}
            <button
              type="button"
              data-setting-btn="blur"
              className={`btn btn-xs vid-ctx-btn vid-ctx-btn-blur ${activeSubmenu === 'blur' ? 'active' : ''}`}
              title="Text Blur & Opacity settings"
              onClick={() => handleToggleSubmenu('blur')}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                background: activeSubmenu === 'blur' ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                border: activeSubmenu === 'blur' ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: activeSubmenu === 'blur' ? '0 2px 10px rgba(6, 182, 212, 0.4), 0 0 8px rgba(99, 102, 241, 0.4)' : 'none',
                transition: 'all 0.2s ease',
                color: '#ffffff',
                flexShrink: 0
              }}
            >
              <Droplet style={{ width: 13, height: 13, color: '#ffffff' }} />
              <span>Blur</span>
            </button>

            {/* 7. Effects Button */}
            <button
              type="button"
              data-setting-btn="effects"
              className={`btn btn-xs vid-ctx-btn vid-ctx-btn-effects ${activeSubmenu === 'effects' ? 'active' : ''}`}
              title="Text Effects (Arch, Smile, Shadow, Glow, Glitch, 3D, Hollow)"
              onClick={() => handleToggleSubmenu('effects')}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                background: (activeSubmenu === 'effects' || (activeCaption.effect && activeCaption.effect !== 'flat') || activeCaption.curve) ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                border: (activeSubmenu === 'effects' || (activeCaption.effect && activeCaption.effect !== 'flat') || activeCaption.curve) ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: (activeSubmenu === 'effects' || (activeCaption.effect && activeCaption.effect !== 'flat') || activeCaption.curve) ? '0 2px 10px rgba(6, 182, 212, 0.4), 0 0 8px rgba(99, 102, 241, 0.4)' : 'none',
                transition: 'all 0.2s ease',
                color: '#ffffff',
                flexShrink: 0
              }}
            >
              <Wand2 style={{ width: 13, height: 13, color: '#ffffff' }} />
              <span>Effects</span>
            </button>

            {/* 8. Bubble Button - Opens BubbleChatBottomSheet */}
            <button
              type="button"
              data-setting-btn="bubble"
              className={`btn btn-xs vid-ctx-btn vid-ctx-btn-bubble ${showBubbleBottomSheet ? 'active' : ''}`}
              title="Chat & Speech Bubbles (iPhone, WhatsApp, Comic)"
              onClick={() => {
                setShowBubbleBottomSheet(!showBubbleBottomSheet);
                setActiveSubmenu(null);
              }}
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
                flexShrink: 0,
                background: (showBubbleBottomSheet || activeCaption.bubbleStyle) ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.08)',
                border: (showBubbleBottomSheet || activeCaption.bubbleStyle) ? '1px solid var(--cyber-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: (showBubbleBottomSheet || activeCaption.bubbleStyle) ? '0 2px 10px rgba(6, 182, 212, 0.4), 0 0 8px rgba(99, 102, 241, 0.4)' : 'none',
                transition: 'all 0.2s ease',
                color: '#ffffff'
              }}
            >
              <MessageSquareQuote style={{ width: 13, height: 13, color: '#ffffff' }} />
              <span>Bubble</span>
            </button>
          </div>
        )
      )}
    </>
  );
}
