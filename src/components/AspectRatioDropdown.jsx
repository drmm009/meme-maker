import React from 'react';
import { Monitor, ChevronDown } from 'lucide-react';

const AspectRatioDropdown = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);
  const selected = options.find(o => o.value === value) || options[0];

  React.useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', zIndex: isOpen ? 1000 : 'auto' }}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`aspect-ratio-display glass-card ${isOpen ? 'active' : ''}`}
        style={{ 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          padding: '5px 10px', 
          borderRadius: '8px', 
          height: '32px', 
          gap: '6px',
          background: isOpen ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          color: 'var(--text-main, #ffffff)',
          outline: 'none',
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        {/* Desktop View: Monitor icon + single full label */}
        <Monitor className="icon-xs aspect-ratio-desktop-icon" style={{ width: 14, height: 14, opacity: 0.8 }} />
        <span className="aspect-ratio-text aspect-ratio-desktop-text" style={{ fontSize: '0.78rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
          {selected.label}
        </span>

        {/* Mobile View: Compact ratio or monitor icon */}
        <div className="aspect-ratio-mobile-icon aspect-ratio-mobile-badge" style={{ display: 'none', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: '700', lineHeight: 1 }}>
          {value === 'original' || !value ? (
            <Monitor className="icon-xs" style={{ width: 14, height: 14 }} />
          ) : (
            selected.label.split(' ')[0]
          )}
        </div>

        <ChevronDown 
          className="icon-xs aspect-ratio-chevron" 
          style={{ 
            width: 14, 
            height: 14, 
            opacity: 0.7, 
            transition: 'transform 0.2s ease', 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' 
          }} 
        />
      </button>
      
      {isOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} onClick={() => setIsOpen(false)} />
          <div 
            className="glass-card aspect-ratio-menu" 
            style={{ 
              position: 'absolute', 
              top: 'calc(100% + 8px)', 
              right: 0, 
              zIndex: 99999, 
              display: 'flex', 
              flexDirection: 'column', 
              minWidth: '160px', 
              padding: '8px', 
              borderRadius: 'var(--radius-md)', 
              background: 'rgba(15, 15, 20, 0.96)', 
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)', 
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)' 
            }}
          >
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
