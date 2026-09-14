import React from 'react';
import { createPortal } from 'react-dom';
import { Settings, Moon, Sun, Info } from 'lucide-react';

export default function SettingsModal({ isOpen = true, onClose, theme, onToggleTheme }) {
  if (isOpen === false) return null;

  return createPortal(
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-content glass-card modal-md animate-scale-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header flex-between align-center margin-bottom-xs">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Settings className="icon-sm text-cyan" style={{ flexShrink: 0 }} />
            <span>App Preferences</span>
          </h3>
          <button className="btn-close" onClick={onClose} title="Close" aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'none' }}></div>

          <div className="settings-item flex-between glass-panel margin-top">
            <div>
              <strong>Default Font Family</strong>
              <p className="subtitle">Impact (Classic Meme Font)</p>
            </div>
            <span className="badge">Classic</span>
          </div>

          <div className="settings-item flex-between glass-panel margin-top">
            <div>
              <strong>Export Resolution</strong>
              <p className="subtitle">High Definition PNG (2000px max canvas)</p>
            </div>
            <span className="badge badge-success">HD 1080p</span>
          </div>

          <div className="app-info-footer margin-top text-center">
            <p><Info className="icon-xs" /> Meme Creator Web / PWA App v1.0.0</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
