import React from 'react';
import ModalPortal from './ModalPortal';
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

  return (
    <ModalPortal>
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
      </div>
    </ModalPortal>
  );
}
