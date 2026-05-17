'use client';

import { useEffect, useState } from 'react';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/communication/notifications');
      setNotifications(response.data.data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/communication/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/communication/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  return (
    <LMSLayout pageTitle="Notifications" breadcrumbs={[{ label: 'Dashboard', href: '/student/dashboard' }, { label: 'Notifications' }]}>
      <div className="lms-section">
        <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Recent Updates</span>
          <button className="lms-btn lms-btn-sm" onClick={markAllAsRead}>Mark All as Read</button>
        </div>
        
        {loading ? (
          <div className="lms-loading">Loading notifications...</div>
        ) : (
          <div className="lms-notification-list">
            {notifications.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>You have no notifications.</div>
            ) : notifications.map(notif => (
              <div 
                key={notif._id} 
                className={`lms-notification-item ${notif.isRead ? 'read' : 'unread'}`}
                style={{ 
                  padding: '20px', 
                  borderBottom: '1px solid var(--border)', 
                  display: 'flex', 
                  gap: 16,
                  background: notif.isRead ? '#fff' : '#f0f7ff' 
                }}
              >
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: '50%', 
                  background: notif.priority === 'high' ? 'var(--danger)' : 'var(--primary)', 
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {notif.type === 'grade' ? '📈' : notif.type === 'assignment' ? '📋' : '🔔'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{notif.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{format(new Date(notif.createdAt), 'MMM dd, HH:mm')}</div>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 4 }}>{notif.message}</div>
                  {!notif.isRead && (
                    <button 
                      onClick={() => markAsRead(notif._id)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, padding: 0, marginTop: 8, cursor: 'pointer', fontWeight: 600 }}
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </LMSLayout>
  );
}
