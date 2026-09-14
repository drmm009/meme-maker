import React from 'react';
import { Monitor } from 'lucide-react';

const AspectRatioDropdown = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div style={{ position: 'relative' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="aspect-ratio-display glass-card shadow-glow"
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px 12px', borderRadius: '24px', height: '32px', gap: '6px' }}
      >
        {value === 'original' || !value ? (
          <Monitor className="icon-xs aspect-ratio-mobile-icon" />
        ) : (
          <div className="aspect-ratio-mobile-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', lineHeight: 1, transform: 'translateY(1px)' }}>
            {selected.label.split(' ')[0]}
          </div>
        )}
        <span className="aspect-ratio-text" style={{ fontSize: '0.75rem', fontWeight: '600', whiteSpace: 'nowrap' }}>{selected.label}</span>
      </div>
      
      {isOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setIsOpen(false)} />
          <div className="glass-card" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', zIndex: 100, display: 'flex', flexDirection: 'column', minWidth: '160px', padding: '8px', borderRadius: 'var(--radius-md)', background: 'rgba(15, 15, 20, 0.95)', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            {options.map(opt => (
              <div 
                key={opt.value}
                onClick={() => { setIsOpen(false); setTimeout(() => onChange(opt.value), 0); }}
                style={{ padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', color: opt.value === value ? 'var(--cyber-cyan)' : 'var(--text-main)', background: opt.value === value ? 'rgba(168, 85, 247, 0.15)' : 'transparent', transition: 'background 0.2s', marginBottom: '4px', fontWeight: opt.value === value ? '600' : 'normal' }}
                onMouseEnter={(e) => { if (opt.value !== value) e.target.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={(e) => { if (opt.value !== value) e.target.style.background = 'transparent' }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AspectRatioDropdown;
