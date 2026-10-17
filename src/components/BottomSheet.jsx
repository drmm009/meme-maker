import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import ModalPortal from './ModalPortal';

/* ─── Inline stylesheet for scrollbar & hover effects ─── */
const sheetStyleId = 'bottom-sheet-elegant-styles';
const injectStyles = () => {
  if (document.getElementById(sheetStyleId)) return;
  const style = document.createElement('style');
  style.id = sheetStyleId;
  style.textContent = `
    .bs-content-scroll::-webkit-scrollbar { width: 3px; }
    .bs-content-scroll::-webkit-scrollbar-track { background: transparent; }
    .bs-content-scroll::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.12);
      border-radius: 99px;
    }
    .bs-content-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.22);
    }
    .bs-drag-handle:hover .bs-drag-pill {
      width: 52px !important;
      background: rgba(255,255,255,0.40) !important;
    }
  `;
  document.head.appendChild(style);
};

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
  const [isDragging, setIsDragging] = useState(false);
  const dragControls = useDragControls();

  // Inject custom styles
  useEffect(() => { injectStyles(); }, []);

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
            transition={{ duration: 0.25 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99990,
              background: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
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
              transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
              drag="y"
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.25 }}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={(e, { offset, velocity }) => {
                setIsDragging(false);
                if (offset.y > 80 || velocity.y > 300) {
                  onClose();
                }
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '640px',
                maxHeight: maxHeight,
                /* Layered glass background */
                background: `
                  linear-gradient(180deg, rgba(30, 34, 48, 0.98) 0%, rgba(15, 18, 26, 0.99) 100%)
                `,
                backdropFilter: 'blur(24px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
                /* Top glow border */
                borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                borderBottom: 'none',
                borderRadius: '20px 20px 0 0',
                /* Multi-layer shadow for depth */
                boxShadow: `
                  0 -4px 16px rgba(0, 0, 0, 0.3),
                  0 -12px 48px rgba(0, 0, 0, 0.5),
                  inset 0 1px 0 rgba(255, 255, 255, 0.06)
                `,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                touchAction: 'pan-y'
              }}
            >
              {/* Top accent glow line */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '10%',
                  right: '10%',
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 94, 54, 0.4), rgba(236, 72, 153, 0.3), transparent)',
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              />

              {/* Drag Handle */}
              <div
                className="bs-drag-handle"
                onPointerDown={(e) => dragControls.start(e)}
                style={{
                  width: '100%',
                  padding: '10px 0 6px 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  touchAction: 'none'
                }}
              >
                <div
                  className="bs-drag-pill"
                  style={{
                    width: '42px',
                    height: '4px',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.25)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              </div>

              {/* Scrollable Sheet Content */}
              <div
                className="bs-content-scroll"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  overscrollBehavior: 'contain',
                  WebkitOverflowScrolling: 'touch',
                  padding: '6px 20px calc(14px + env(safe-area-inset-bottom, 0px)) 20px',
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
                    padding: '12px 20px calc(12px + env(safe-area-inset-bottom, 0px)) 20px',
                    position: 'relative',
                    background: 'rgba(12, 14, 22, 0.90)',
                    backdropFilter: 'blur(12px)',
                    flexShrink: 0
                  }}
                >
                  {/* Footer top divider – subtle gradient */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '20px',
                      right: '20px',
                      height: '1px',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0.06), transparent)'
                    }}
                  />
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
