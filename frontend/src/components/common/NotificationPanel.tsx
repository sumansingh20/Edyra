'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { socketService } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'exam' | 'assignment' | 'announcement';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  link?: string;
}

const TYPE_CONFIG = {
  info:         { icon: 'ℹ️', color: 'var(--info)' },
  success:      { icon: '✅', color: 'var(--success)' },
  warning:      { icon: '⚠️', color: 'var(--warning)' },
  error:        { icon: '🚨', color: 'var(--danger)' },
  exam:         { icon: '📝', color: '#7c3aed' },
  assignment:   { icon: '📋', color: 'var(--secondary)' },
  announcement: { icon: '📢', color: 'var(--primary)' },
};

const BellIcon = ({ hasUnread }: { hasUnread: boolean }) => (
  <div style={{ position: 'relative', cursor: 'pointer' }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
    {hasUnread && (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        style={{
          position: 'absolute',
          top: -3,
          right: -3,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: 'var(--danger)',
          border: '2px solid var(--nav-bg)',
        }}
      />
    )}
  </div>
);

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { accessToken } = useAuthStore();

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/communication/notifications?limit=20');
      const data = res.data?.data?.notifications || res.data?.notifications || [];
      setNotifications(data);
    } catch {
      // Silently fail — notifications are non-critical
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);

  // Connect to notification socket
  useEffect(() => {
    if (!accessToken) return;
    
    // Connect to global notifications namespace
    socketService.connectNotifications(accessToken);
    
    // Listen for new notifications
    socketService.onNotification((notification) => {
      // Add new notification to top of list
      setNotifications(prev => {
        // Prevent duplicates
        if (prev.some(n => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
    });
    
    return () => {
      socketService.off('notification:new');
      socketService.off('exam:started');
      socketService.off('exam:ending');
      socketService.off('announcement:new');
    };
  }, [accessToken]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    api.patch('/communication/notifications/read-all').catch(() => {});
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    api.patch(`/communication/notifications/${id}/read`).catch(() => {});
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.2)',
          background: open ? 'rgba(249,128,18,0.2)' : 'rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <BellIcon hasUnread={unreadCount > 0} />
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              width: 360,
              maxHeight: 480,
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-secondary)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span style={{
                    background: 'var(--danger)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 99,
                    lineHeight: 1.6,
                  }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--secondary)',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loading ? (
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i}>
                      <div className="skeleton" style={{ height: 12, width: '70%', marginBottom: 6 }} />
                      <div className="skeleton" style={{ height: 10, width: '50%' }} />
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div style={{
                  padding: 40,
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                  <div>No notifications</div>
                </div>
              ) : (
                notifications.map((notif, i) => {
                  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => markRead(notif.id)}
                      style={{
                        padding: '12px 18px',
                        borderBottom: '1px solid var(--border)',
                        background: notif.read ? 'var(--card-bg)' : 'var(--primary-light)',
                        cursor: 'pointer',
                        transition: 'background .15s',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                      }}
                    >
                      <span style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius)',
                        background: cfg.color + '20',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        flexShrink: 0,
                      }}>
                        {cfg.icon}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13,
                          fontWeight: notif.read ? 500 : 700,
                          color: 'var(--text)',
                          marginBottom: 2,
                        }}>
                          {notif.title}
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          lineHeight: 1.5,
                          marginBottom: 4,
                        }}>
                          {notif.message}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
                          {timeAgo(notif.createdAt)}
                        </div>
                      </div>
                      {!notif.read && (
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          flexShrink: 0,
                          marginTop: 4,
                        }} />
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '10px 18px',
              borderTop: '1px solid var(--border)',
              textAlign: 'center',
              background: 'var(--bg-secondary)',
            }}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--secondary)',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                View all notifications →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
