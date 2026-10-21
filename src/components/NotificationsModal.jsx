import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Flame, Sparkles, Bot, ShieldCheck, CheckCheck, X, ArrowRight } from 'lucide-react';
import ModalPortal from './ModalPortal';
import './NotificationsModal.css';

export default function NotificationsModal({
  isOpen,
  onClose,
  notifications = [],
  onMarkAllRead,
  onDismissNotification,
  onNotificationAction
}) {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIconForType = (type) => {
    switch (type) {
      case 'trending':
        return <Flame className="notif-type-icon text-amber" size={18} />;
      case 'feature':
        return <Sparkles className="notif-type-icon text-sunset" size={18} />;
      case 'ai':
        return <Bot className="notif-type-icon text-cyan" size={18} />;
      case 'tip':
      default:
        return <ShieldCheck className="notif-type-icon text-emerald" size={18} />;
    }
  };

  return (
    <ModalPortal>
      <div className="notif-backdrop" onClick={onClose}>
        <motion.div
          className="notif-panel glass-card"
          initial={{ opacity: 0, scale: 0.94, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: -10 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="notif-header">
            <div className="notif-header-title">
              <div className="notif-header-bell-wrap">
                <Bell size={18} className="notif-header-bell" />
                {unreadCount > 0 && <span className="notif-header-dot" />}
              </div>
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <span className="notif-count-pill">{unreadCount} new</span>
              )}
            </div>
            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button
                  className="notif-mark-read-btn"
                  onClick={onMarkAllRead}
                  title="Mark all as read"
                >
                  <CheckCheck size={14} />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                className="notif-close-btn"
                onClick={onClose}
                aria-label="Close notifications"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty-state">
                <div className="notif-empty-icon">🎉</div>
                <h4>You're all caught up!</h4>
                <p>Check back later for fresh trending meme templates and studio updates.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`notif-card ${item.read ? 'is-read' : 'is-unread'}`}
                  onClick={() => onNotificationAction?.(item)}
                >
                  <div className="notif-card-icon-wrap">
                    {getIconForType(item.type)}
                  </div>
                  <div className="notif-card-content">
                    <div className="notif-card-top-row">
                      <span className="notif-card-title">{item.title}</span>
                      <span className="notif-card-time">{item.timestamp}</span>
                    </div>
                    <p className="notif-card-message">{item.message}</p>
                    {item.action && (
                      <div className="notif-card-action-row">
                        <button
                          className="notif-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNotificationAction?.(item);
                          }}
                        >
                          <span>{item.action.label}</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                  {!item.read && <span className="notif-unread-dot" />}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </ModalPortal>
  );
}
