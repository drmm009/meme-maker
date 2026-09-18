import React from 'react';
import { createPortal } from 'react-dom';
import { Settings, Moon, Sun, Info } from 'lucide-react';

export default function SettingsModal({
  isOpen = true,
  onClose,
  theme,
  onToggleTheme
}) {
  if (isOpen === false) return null;

  return createPortal(
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-content glass-card modal-md animate-scale-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header flex-between align-center margin-bottom-xs">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Settings className="icon-sm" style={{ color: 'var(--primary-accent)', flexShrink: 0 }} />
            <span>App Preferences</span>
          </h3>
          <button className="btn-close" onClick={onClose} title="Close" aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          {/* Active Color Scheme Showcase */}
          <div className="settings-item flex-between glass-panel" style={{ padding: '12px 14px', borderRadius: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ff4500 0%, #f97316 50%, #ffb300 100%)',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.4)',
                  flexShrink: 0
                }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '0.94rem' }}>Sunset Orange</strong>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'var(--primary-accent)',
                      color: '#171310'
                    }}
                  >
                    Active Palette 🔥
                  </span>
                </div>
                <p className="subtitle" style={{ margin: 0, fontSize: '0.78rem', opacity: 0.8 }}>
                  Signature warm sunset energy with molten honey & amber highlights
                </p>
              </div>
            </div>
          </div>

          {/* Theme Mode Toggle */}
          {onToggleTheme && (
            <div className="settings-item flex-between glass-panel margin-top" style={{ padding: '10px 14px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {theme === 'dark' ? <Moon className="icon-sm text-cyan" /> : <Sun className="icon-sm" style={{ color: '#ffc93c' }} />}
                <div>
                  <strong>Appearance</strong>
                  <p className="subtitle" style={{ margin: 0, fontSize: '0.78rem' }}>Currently in {theme === 'dark' ? 'Dark' : 'Light'} Mode</p>
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

          <div className="settings-item flex-between glass-panel margin-top" style={{ padding: '10px 14px', borderRadius: '12px' }}>
            <div>
              <strong>Default Font Family</strong>
              <p className="subtitle" style={{ margin: 0, fontSize: '0.78rem' }}>Impact (Classic Meme Font)</p>
            </div>
            <span className="badge">Classic</span>
          </div>

          <div className="settings-item flex-between glass-panel margin-top" style={{ padding: '10px 14px', borderRadius: '12px' }}>
            <div>
              <strong>Export Resolution</strong>
              <p className="subtitle" style={{ margin: 0, fontSize: '0.78rem' }}>High Definition PNG (2000px max canvas)</p>
            </div>
            <span className="badge badge-success">HD 1080p</span>
          </div>

          <div className="app-info-footer margin-top text-center" style={{ opacity: 0.6, fontSize: '0.75rem', marginTop: '16px' }}>
            <p><Info className="icon-xs" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Meme Creator Web / PWA App v2.5</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
