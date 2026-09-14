import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, Crown, ShieldCheck, Mail, Lock } from 'lucide-react';

export default function AccountModal({ isOpen = true, onClose }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (isOpen === false) return null;

  const handleLogin = (e) => {
    e.preventDefault();
    if (email) {
      setIsLoggedIn(true);
    }
  };

  return createPortal(
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-content glass-card modal-md animate-scale-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header flex-between align-center margin-bottom-xs">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <User className="icon-sm text-cyan" style={{ flexShrink: 0 }} />
            <span>Account & Sync</span>
          </h3>
          <button className="btn-close" onClick={onClose} title="Close" aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          {isLoggedIn ? (
            <div className="account-profile text-center">
              <div className="profile-avatar flex-center">
                <User className="icon-lg text-cyan" />
              </div>
              <h3>Welcome Back!</h3>
              <p className="user-email">{email || 'creator@meme.app'}</p>
              <span className="badge badge-pro margin-top inline-block">
                <Crown className="icon-xs" /> Pro Creator Plan Active
              </span>

              <div className="account-stats grid-3 margin-top">
                <div className="stat-card glass-panel">
                  <span className="stat-val">24</span>
                  <span className="stat-label">Memes Saved</span>
                </div>
                <div className="stat-card glass-panel">
                  <span className="stat-val">☁️ Synced</span>
                  <span className="stat-label">Cloud Sync</span>
                </div>
                <div className="stat-card glass-panel">
                  <span className="stat-val">Unlimited</span>
                  <span className="stat-label">Pro Templates</span>
                </div>
              </div>

              <button className="btn btn-secondary margin-top" onClick={() => setIsLoggedIn(false)}>
                Sign Out
              </button>
            </div>
          ) : (
            <div className="account-form-wrapper">
              <form onSubmit={handleLogin} className="account-form">
                <div className="form-field" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '7px' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Mail
                      className="text-cyan"
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        zIndex: 2,
                        width: '18px',
                        height: '18px',
                        color: 'var(--cyber-cyan)',
                        opacity: 0.9
                      }}
                    />
                    <input
                      type="email"
                      className="form-input"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        padding: '12px 14px 12px 42px',
                        height: '44px',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                        width: '100%'
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="form-field" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '7px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock
                      className="text-cyan"
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        zIndex: 2,
                        width: '18px',
                        height: '18px',
                        color: 'var(--cyber-cyan)',
                        opacity: 0.9
                      }}
                    />
                    <input
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        padding: '12px 14px 12px 42px',
                        height: '44px',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                        width: '100%'
                      }}
                      required
                    />
                  </div>
                </div>

                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '6px', marginBottom: '16px', lineHeight: '1.4' }}>
                  💡 You can create, edit, export & save memes locally without an account.
                </p>

                {/* Side-by-side Sign In Button & Neon Guest Mode Box */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '12px' }}>
                  <button type="submit" className="btn btn-primary shadow-glow" style={{ flex: 1, padding: '11px 16px', fontSize: '0.88rem', borderRadius: '24px' }}>
                    Sign In / Register
                  </button>

                  <div
                    style={{
                      flex: '0 0 auto',
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.28) 0%, rgba(168, 85, 247, 0.24) 50%, rgba(168, 85, 247, 0.2) 100%)',
                      padding: '9px 14px',
                      borderRadius: '24px',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      boxShadow: '0 4px 16px rgba(139, 92, 246, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '0.78rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <ShieldCheck className="icon-xs text-cyan" />
                    <span>Guest Mode Active</span>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
