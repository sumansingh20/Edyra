'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import LMSLayout from '@/components/layouts/LMSLayout';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  type?: string;
  audience?: string;
  createdAt: string;
  author?: any;
  courseId?: any;
}

interface Thread {
  _id: string;
  title: string;
  content: string;
  author?: any;
  courseId?: any;
  replies?: any[];
  upvotes?: number;
  isAnswered?: boolean;
  createdAt: string;
}

type Tab = 'announcements' | 'forum' | 'notifications' | 'messages';

export default function CommunicationPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('announcements');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAnn, setNewAnn] = useState({ title: '', content: '', audience: 'all', type: 'general' });
  const [newThread, setNewThread] = useState({ title: '', content: '', courseId: '' });
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [showThreadForm, setShowThreadForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const isAdmin = ['admin', 'super-admin', 'teacher'].includes(user?.role || '');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [annRes, threadRes, notifRes, courseRes] = await Promise.allSettled([
      api.get('/communication/announcements', { params: { limit: 30 } }),
      api.get('/communication/forum/threads', { params: { limit: 30 } }),
      api.get('/communication/notifications', { params: { limit: 30 } }),
      api.get('/courses', { params: { limit: 50 } }),
    ]);

    if (annRes.status === 'fulfilled') setAnnouncements(annRes.value.data?.data || []);
    if (threadRes.status === 'fulfilled') setThreads(threadRes.value.data?.data || []);
    if (notifRes.status === 'fulfilled') setNotifications(notifRes.value.data?.data || []);
    if (courseRes.status === 'fulfilled') {
      const c = courseRes.value.data?.data?.courses || courseRes.value.data?.data || [];
      setCourses(Array.isArray(c) ? c : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const postAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/communication/announcements', newAnn);
      setShowAnnForm(false);
      setNewAnn({ title: '', content: '', audience: 'all', type: 'general' });
      fetchAll();
    } catch (err: any) { alert(err.response?.data?.error || 'Failed'); } finally { setSaving(false); }
  };

  const postThread = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/communication/forum/threads', newThread);
      setShowThreadForm(false);
      setNewThread({ title: '', content: '', courseId: '' });
      fetchAll();
    } catch (err: any) { alert(err.response?.data?.error || 'Failed'); } finally { setSaving(false); }
  };

  const markAllRead = async () => {
    try {
      await api.put('/communication/notifications/read-all');
      fetchAll();
    } catch { }
  };

  const markRead = async (id: string) => {
    try {
      await api.put(`/communication/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch { }
  };

  const upvoteThread = async (id: string) => {
    try {
      await api.post(`/communication/forum/threads/${id}/upvote`);
      fetchAll();
    } catch { }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <LMSLayout pageTitle="Communication Center" breadcrumbs={[{ label: 'Communication' }]}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f6cbf 0%, #243b55 100%)',
        color: '#fff', borderRadius: 'var(--radius-lg)', padding: '20px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }} className="animate-fadeInDown">
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}> Communication Center</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>Announcements, forums, notifications & messaging</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="lms-tabs">
        <button className={`lms-tab-btn ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveTab('announcements')}>
           Announcements ({announcements.length})
        </button>
        <button className={`lms-tab-btn ${activeTab === 'forum' ? 'active' : ''}`} onClick={() => setActiveTab('forum')}>
           Forum ({threads.length})
        </button>
        <button className={`lms-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
           Notifications {unreadCount > 0 && <span className="lms-num-badge" style={{ marginLeft: 4 }}>{unreadCount}</span>}
        </button>
      </div>

      {loading ? (
        <div className="lms-spinner"><div className="spinner" /><span>Loading...</span></div>
      ) : (
        <>
          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <div>
              {isAdmin && (
                <div style={{ marginBottom: 16 }}>
                  {!showAnnForm ? (
                    <button onClick={() => setShowAnnForm(true)} className="lms-btn lms-btn-primary">
                       Post Announcement
                    </button>
                  ) : (
                    <div className="lms-section animate-scaleIn">
                      <div className="lms-section-title"> New Announcement</div>
                      <form onSubmit={postAnnouncement} style={{ padding: 16 }}>
                        <div className="lms-form-row">
                          <div className="lms-form-group">
                            <label className="lms-label">Title *</label>
                            <input required className="lms-input" value={newAnn.title} onChange={e => setNewAnn(a => ({ ...a, title: e.target.value }))} placeholder="Announcement title..." />
                          </div>
                          <div className="lms-form-group">
                            <label className="lms-label">Audience</label>
                            <select className="lms-select" value={newAnn.audience} onChange={e => setNewAnn(a => ({ ...a, audience: e.target.value }))}>
                              <option value="all">All Users</option>
                              <option value="students">Students Only</option>
                              <option value="faculty">Faculty Only</option>
                              <option value="department">My Department</option>
                            </select>
                          </div>
                        </div>
                        <div className="lms-form-group">
                          <label className="lms-label">Content *</label>
                          <textarea required className="lms-textarea" rows={4} value={newAnn.content} onChange={e => setNewAnn(a => ({ ...a, content: e.target.value }))} placeholder="Announcement content..." />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="submit" disabled={saving} className="lms-btn lms-btn-primary">
                            {saving ? 'Posting...' : ' Post Announcement'}
                          </button>
                          <button type="button" onClick={() => setShowAnnForm(false)} className="lms-btn lms-btn-default">Cancel</button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {announcements.length === 0 ? (
                <div className="lms-section">
                  <div className="lms-table-empty" style={{ padding: 48 }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}></div>
                    <div>No announcements yet.</div>
                  </div>
                </div>
              ) : (
                announcements.map((ann, i) => (
                  <div key={ann._id} className="lms-section animate-fadeIn" style={{ marginBottom: 12, animationDelay: `${i * 0.04}s` }}>
                    <div style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--nav-bg)', marginBottom: 4 }}>{ann.title}</div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {ann.type && <span className="lms-status lms-status-info" style={{ fontSize: 10 }}>{ann.type}</span>}
                            {ann.audience && <span className="lms-status lms-status-pending" style={{ fontSize: 10 }}> {ann.audience}</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                            {typeof ann.author === 'object' ? `${ann.author?.firstName} ${ann.author?.lastName}` : 'Admin'}
                          </div>
                          <div>{ann.createdAt ? format(new Date(ann.createdAt), 'dd MMM yyyy, HH:mm') : ''}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                        {ann.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Forum Tab */}
          {activeTab === 'forum' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                {!showThreadForm ? (
                  <button onClick={() => setShowThreadForm(true)} className="lms-btn lms-btn-primary">
                     Start Discussion
                  </button>
                ) : (
                  <div className="lms-section animate-scaleIn">
                    <div className="lms-section-title"> New Discussion Thread</div>
                    <form onSubmit={postThread} style={{ padding: 16 }}>
                      <div className="lms-form-row">
                        <div className="lms-form-group">
                          <label className="lms-label">Title *</label>
                          <input required className="lms-input" value={newThread.title} onChange={e => setNewThread(t => ({ ...t, title: e.target.value }))} placeholder="Discussion title..." />
                        </div>
                        <div className="lms-form-group">
                          <label className="lms-label">Course (Optional)</label>
                          <select className="lms-select" value={newThread.courseId} onChange={e => setNewThread(t => ({ ...t, courseId: e.target.value }))}>
                            <option value="">General Discussion</option>
                            {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="lms-form-group">
                        <label className="lms-label">Content *</label>
                        <textarea required className="lms-textarea" rows={4} value={newThread.content} onChange={e => setNewThread(t => ({ ...t, content: e.target.value }))} placeholder="Describe your question or topic..." />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="submit" disabled={saving} className="lms-btn lms-btn-primary">
                          {saving ? 'Posting...' : ' Post Thread'}
                        </button>
                        <button type="button" onClick={() => setShowThreadForm(false)} className="lms-btn lms-btn-default">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {threads.length === 0 ? (
                <div className="lms-section">
                  <div className="lms-table-empty" style={{ padding: 48 }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}></div>
                    <div>No discussions yet. Start a conversation!</div>
                  </div>
                </div>
              ) : (
                threads.map((thread, i) => (
                  <div key={thread._id} className="lms-section animate-fadeIn" style={{ marginBottom: 10, animationDelay: `${i * 0.04}s` }}>
                    <div style={{ padding: 16 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%', background: 'var(--secondary)',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 14, flexShrink: 0,
                        }}>
                          {(thread.author?.firstName || '?')[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <Link href={`/communication/forum/${thread._id}`} style={{ fontWeight: 700, fontSize: 14, color: 'var(--nav-bg)' }}>
                            {thread.title}
                          </Link>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, marginBottom: 8 }}>
                            By {thread.author?.firstName} {thread.author?.lastName}
                            {thread.courseId && ` · ${typeof thread.courseId === 'object' ? thread.courseId.title : 'Course'}`}
                            {thread.createdAt && ` · ${format(new Date(thread.createdAt), 'dd MMM yyyy')}`}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
                            {thread.content?.slice(0, 150)}{thread.content?.length > 150 ? '...' : ''}
                          </div>
                          <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                            <button
                              onClick={() => upvoteThread(thread._id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary)', fontSize: 12 }}
                            >
                               {thread.upvotes || 0}
                            </button>
                            <span> {thread.replies?.length || 0} replies</span>
                            {thread.isAnswered && <span style={{ color: 'var(--success)' }}> Answered</span>}
                          </div>
                        </div>
                        <Link href={`/communication/forum/${thread._id}`} className="lms-btn lms-btn-sm lms-btn-secondary">
                          View →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              {unreadCount > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <button onClick={markAllRead} className="lms-btn lms-btn-default lms-btn-sm">
                     Mark All as Read
                  </button>
                </div>
              )}
              {notifications.length === 0 ? (
                <div className="lms-section">
                  <div className="lms-table-empty" style={{ padding: 48 }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}></div>
                    <div>No notifications yet.</div>
                  </div>
                </div>
              ) : (
                <div className="lms-section">
                  {notifications.map((n: any, i: number) => (
                    <div
                      key={n._id || i}
                      onClick={() => !n.isRead && markRead(n._id)}
                      style={{
                        display: 'flex', gap: 12, padding: '12px 16px',
                        borderBottom: '1px solid var(--border)',
                        background: n.isRead ? 'var(--white)' : 'var(--primary-light)',
                        cursor: !n.isRead ? 'pointer' : 'default',
                      }}
                    >
                      <div style={{ fontSize: 20, flexShrink: 0 }}>
                        {n.type === 'exam' ? '' : n.type === 'assignment' ? '' : n.type === 'grade' ? '' : n.type === 'announcement' ? '' : ''}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: n.isRead ? 400 : 700, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>
                          {n.title || n.message || 'Notification'}
                        </div>
                        {n.message && n.title && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{n.message}</div>
                        )}
                        <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4 }}>
                          {n.createdAt ? format(new Date(n.createdAt), 'dd MMM yyyy, HH:mm') : ''}
                        </div>
                      </div>
                      {!n.isRead && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 6 }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </LMSLayout>
  );
}
