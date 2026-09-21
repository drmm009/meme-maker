import React from 'react';
import { createPortal } from 'react-dom';
import { Settings, Moon, Sun, Info, Check } from 'lucide-react';

const PALETTES = [
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    description: 'Warm molten honey & amber highlights',
    gradient: 'linear-gradient(135deg, #ff4500 0%, #f97316 50%, #ffb300 100%)',
    glow: 'rgba(249, 115, 22, 0.4)',
  },
  {
    id: 'cyber-violet',
    name: 'Cyber Violet',
    description: 'Electric neon purple & deep indigo',
    gradient: 'linear-gradient(135deg, #6d28d9 0%, #a855f7 50%, #c084fc 100%)',
    glow: 'rgba(168, 85, 247, 0.4)',
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    description: 'Cool aqua depths & crystal cyan',
    gradient: 'linear-gradient(135deg, #0369a1 0%, #06b6d4 50%, #67e8f9 100%)',
    glow: 'rgba(6, 182, 212, 0.4)',
  },
  {
    id: 'neon-green',
    name: 'Neon Green',
    description: 'Matrix lime energy & deep emerald',
    gradient: 'linear-gradient(135deg, #166534 0%, #22c55e 50%, #86efac 100%)',
    glow: 'rgba(34, 197, 94, 0.4)',
  },
];

export default function SettingsModal({
  isOpen = true,
  onClose,
  theme,
  onToggleTheme,
  palette = 'sunset-orange',
  onChangePalette,
}) {
  if (isOpen === false) return null;

  return createPortal(
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="modal-content glass-card modal-md animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header flex-between align-center margin-bottom-xs">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Settings className="icon-sm" style={{ color: 'var(--primary-accent)', flexShrink: 0 }} />
            <span>App Preferences</span>
          </h3>
          <button className="btn-close" onClick={onClose} title="Close" aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          {/* Theme Mode Toggle */}
          {onToggleTheme && (
            <div
              className="settings-item flex-between glass-panel"
              style={{ padding: '10px 14px', borderRadius: '12px', marginBottom: '16px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {theme === 'dark' ? (
                  <Moon className="icon-sm text-cyan" />
                ) : (
                  <Sun className="icon-sm" style={{ color: '#ffc93c' }} />
                )}
                <div>
                  <strong>Appearance</strong>
                  <p className="subtitle" style={{ margin: 0, fontSize: '0.78rem' }}>
                    Currently in {theme === 'dark' ? 'Dark' : 'Light'} Mode
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onToggleTheme}
                style={{ padding: '5px 12px', fontSize: '0.8rem' }}
              >
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>
          )}

          {/* Color Palette Switcher */}
          {onChangePalette && (
            <div style={{ marginBottom: '16px' }}>
              <p
                style={{
                  margin: '0 0 10px 0',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Color Palette
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {PALETTES.map((p) => {
                  const isActive = palette === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onChangePalette(p.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        background: isActive
                          ? 'rgba(255,255,255,0.07)'
                          : 'var(--glass-bg)',
                        border: isActive
                          ? `1.5px solid var(--primary-accent)`
                          : '1.5px solid var(--glass-border)',
                        boxShadow: isActive
                          ? `0 0 14px ${p.glow}`
                          : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'left',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: p.gradient,
                          boxShadow: isActive ? `0 4px 12px ${p.glow}` : 'none',
                          flexShrink: 0,
                          transition: 'box-shadow 0.2s ease',
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {p.name}
                        </div>
                        <div
                          style={{
                            fontSize: '0.68rem',
                            color: 'var(--text-muted)',
                            marginTop: '2px',
                            lineHeight: 1.3,
                          }}
                        >
                          {p.description}
                        </div>
                      </div>
                      {isActive && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: 'var(--primary-accent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Check size={11} color="#fff" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div
            className="settings-item flex-between glass-panel"
            style={{ padding: '10px 14px', borderRadius: '12px', marginBottom: '10px' }}
          >
            <div>
              <strong>Default Font Family</strong>
              <p className="subtitle" style={{ margin: 0, fontSize: '0.78rem' }}>Impact (Classic Meme Font)</p>
            </div>
            <span className="badge">Classic</span>
          </div>

          <div
            className="settings-item flex-between glass-panel"
            style={{ padding: '10px 14px', borderRadius: '12px' }}
          >
            <div>
              <strong>Export Resolution</strong>
              <p className="subtitle" style={{ margin: 0, fontSize: '0.78rem' }}>High Definition PNG (2000px max canvas)</p>
            </div>
            <span className="badge badge-success">HD 1080p</span>
          </div>

          <div className="app-info-footer margin-top text-center" style={{ opacity: 0.6, fontSize: '0.75rem', marginTop: '16px' }}>
            <p>
              <Info className="icon-xs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              Meme Creator Web / PWA App v2.5
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
