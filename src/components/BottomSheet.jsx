import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ModalPortal from './ModalPortal';

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  icon,
  badge,
  children,
  footer,
  maxHeight = '82vh',
  className = '',
  contentStyle = {}
}) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <ModalPortal>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="bottom-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99990,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              alignItems: 'center',
              touchAction: 'none'
            }}
          >
            <motion.div
              className={`bottom-sheet-panel ${className}`}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.3 }}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > 90 || velocity.y > 350) {
                  onClose();
                }
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '640px',
                maxHeight: maxHeight,
                background: 'rgba(15, 18, 26, 0.96)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderBottom: 'none',
                borderRadius: '24px 24px 0 0',
                boxShadow: '0 -12px 48px rgba(0, 0, 0, 0.75)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                touchAction: 'pan-y'
              }}
            >
              {/* Top Drag Handle Bar */}
              <div
                style={{
                  width: '100%',
                  padding: '10px 0 4px 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'grab'
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '4.5px',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.28)',
                    transition: 'background 0.2s'
                  }}
                />
              </div>

              {/* Header */}
              {(title || icon) && (
                <div
                  style={{
                    padding: '8px 18px 12px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    flexShrink: 0
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {icon}
                    {title && (
                      <span style={{ fontSize: '0.96rem', fontWeight: 700, color: '#ffffff' }}>
                        {title}
                      </span>
                    )}
                    {badge}
                  </div>

                  <button
                    type="button"
                    className="btn btn-icon btn-ghost btn-xs"
                    onClick={onClose}
                    title="Close"
                    aria-label="Close"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      cursor: 'pointer'
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>
              )}

              {/* Scrollable Sheet Content */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  overscrollBehavior: 'contain',
                  WebkitOverflowScrolling: 'touch',
                  padding: '14px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  ...contentStyle
                }}
              >
                {children}
              </div>

              {/* Optional Bottom Action Footer */}
              {footer && (
                <div
                  style={{
                    padding: '10px 18px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(10, 12, 18, 0.85)',
                    backdropFilter: 'blur(10px)',
                    flexShrink: 0
                  }}
                >
                  {footer}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}
