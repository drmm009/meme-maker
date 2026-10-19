import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';
import ModalPortal from './ModalPortal';
import './BottomSheet.css';

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
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
          >
            <motion.div
              className={`bottom-sheet-panel ${className}`}
              initial={{ y: '100%', opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0.6 }}
              transition={{ type: 'spring', damping: 32, stiffness: 340, mass: 0.8 }}
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
              style={{ maxHeight }}
            >
              {/* Specular Top Glow Beam */}
              <div className="bs-specular-beam" />

              {/* Ambient Radiant Glow */}
              <div className="bs-ambient-glow" />

              {/* Drag Handle */}
              <div
                className="bs-drag-handle"
                onPointerDown={(e) => dragControls.start(e)}
                aria-label="Drag to dismiss"
              >
                <div className="bs-drag-pill" />
              </div>

              {/* Header */}
              {(title || icon) && (
                <div className="bs-header">
                  <div className="bs-header-left">
                    {icon && <div className="bs-header-icon">{icon}</div>}
                    {title && <span className="bs-title">{title}</span>}
                    {badge}
                  </div>

                  <button
                    type="button"
                    className="bs-close-btn"
                    onClick={onClose}
                    title="Close"
                    aria-label="Close"
                  >
                    <X size={15} strokeWidth={2.4} />
                  </button>

                  <div className="bs-header-divider" />
                </div>
              )}

              {/* Scrollable Sheet Content */}
              <div
                className="bs-content-scroll"
                style={{
                  padding: '10px 18px calc(16px + env(safe-area-inset-bottom, 0px)) 18px',
                  ...contentStyle
                }}
              >
                {children}
              </div>

              {/* Optional Bottom Action Footer */}
              {footer && (
                <div className="bs-footer">
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
