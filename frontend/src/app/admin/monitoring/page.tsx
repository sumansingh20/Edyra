'use client';

import { useState, useEffect } from 'react';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminMonitoringPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeExams, setActiveExams] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'exams' | 'users' | 'system'>('exams');
  const [terminating, setTerminating] = useState<string | null>(null);

  const fetchMonitoringData = async () => {
    try {
      const [sessRes, examRes, userRes, healthRes] = await Promise.all([
        api.get('/admin/monitor/sessions'),
        api.get('/admin/monitor/active-exams'),
        api.get('/admin/users/online'),
        api.get('/admin/system/health')
      ]);

      setSessions(sessRes.data.data?.sessions || sessRes.data.data?.records || []);
      setActiveExams(examRes.data.data?.exams || []);
      setOnlineUsers(userRes.data.data?.users || []);
      setHealth(healthRes.data.data || null);
    } catch (err) {
      console.error('Failed to fetch monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 60000); // 60s auto refresh
    return () => clearInterval(interval);
  }, []);

  const handleForceSubmit = async (sessionId: string) => {
    if (!confirm('Are you sure you want to force submit this exam session?')) return;
    setTerminating(sessionId);
    try {
      await api.post(`/admin/monitor/sessions/${sessionId}/force-submit`);
      toast.success('Exam session force submitted successfully');
      fetchMonitoringData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to force submit session');
    } finally {
      setTerminating(null);
    }
  };

  const handleTerminate = async (sessionId: string) => {
    if (!confirm('Are you sure you want to terminate and invalidate this session?')) return;
    setTerminating(sessionId);
    try {
      await api.post(`/admin/monitor/sessions/${sessionId}/terminate`);
      toast.success('Exam session terminated immediately');
      fetchMonitoringData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to terminate session');
    } finally {
      setTerminating(null);
    }
  };

  return (
    <LMSLayout pageTitle="Institutional Monitoring Center" breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Live Monitoring' }]}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div className="lms-main-col">
          <div className="lms-section">
            <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className={`lms-btn lms-btn-sm ${activeTab === 'exams' ? 'lms-btn-primary' : ''}`} onClick={() => setActiveTab('exams')}>
                  Active Exam Sessions ({sessions.length})
                </button>
                <button className={`lms-btn lms-btn-sm ${activeTab === 'users' ? 'lms-btn-primary' : ''}`} onClick={() => setActiveTab('users')}>
                  Online Users ({onlineUsers.length})
                </button>
                <button className={`lms-btn lms-btn-sm ${activeTab === 'system' ? 'lms-btn-primary' : ''}`} onClick={() => setActiveTab('system')}>
                  Infrastructure Health
                </button>
              </div>
              <button className="lms-btn lms-btn-sm" onClick={fetchMonitoringData}>🔄 Refresh</button>
            </div>

            {loading ? (
              <div className="lms-loading">Loading real-time monitoring streams...</div>
            ) : activeTab === 'exams' ? (
              sessions.length === 0 ? (
                <div className="lms-table-empty">No active secure examination sessions currently in progress.</div>
              ) : (
                <div className="lms-table-container">
                  <table className="lms-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Exam</th>
                        <th>IP Address</th>
                        <th>Violations</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((sess) => (
                        <tr key={sess._id}>
                          <td style={{ fontWeight: 600 }}>{sess.student?.firstName} {sess.student?.lastName}</td>
                          <td>{sess.exam?.title}</td>
                          <td style={{ fontFamily: 'monospace' }}>{sess.ipAddress || '127.0.0.1'}</td>
                          <td>
                            <span style={{ 
                              padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                              background: (sess.violationsCount || 0) > 2 ? '#fee2e2' : (sess.violationsCount || 0) > 0 ? '#fef9c3' : '#dcfce7',
                              color: (sess.violationsCount || 0) > 2 ? '#991b1b' : (sess.violationsCount || 0) > 0 ? '#854d0e' : '#166534'
                            }}>
                              {sess.violationsCount || 0}
                            </span>
                          </td>
                          <td>
                            <span className="lms-status lms-status-active">{sess.status || 'Active'}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button 
                                className="lms-btn lms-btn-sm" 
                                style={{ background: '#f59e0b', color: '#fff', borderColor: '#f59e0b' }}
                                onClick={() => handleForceSubmit(sess._id)}
                                disabled={terminating === sess._id}
                              >
                                Force Submit
                              </button>
                              <button 
                                className="lms-btn lms-btn-sm" 
                                style={{ background: '#ef4444', color: '#fff', borderColor: '#ef4444' }}
                                onClick={() => handleTerminate(sess._id)}
                                disabled={terminating === sess._id}
                              >
                                Terminate
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : activeTab === 'users' ? (
              onlineUsers.length === 0 ? (
                <div className="lms-table-empty">No users have been active in the last 15 minutes.</div>
              ) : (
                <div className="lms-table-container">
                  <table className="lms-table">
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Last Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {onlineUsers.map((u) => (
                        <tr key={u._id}>
                          <td style={{ fontWeight: 600 }}>{u.name}</td>
                          <td>{u.email}</td>
                          <td><span className="lms-status" style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
                          <td>{format(new Date(u.lastActive), 'HH:mm:ss (dd MMM)')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              health ? (
                <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ padding: 20, border: '1px solid var(--border)', borderRadius: 8, background: '#f8f9fa' }}>
                    <h4 style={{ marginBottom: 14, color: 'var(--primary)' }}>Database Subsystem</h4>
                    <div className="lms-info-row"><span className="lms-info-label">Status</span><span className="lms-info-value lms-status lms-status-active">{health.database?.status}</span></div>
                    <div className="lms-info-row" style={{ marginTop: 10 }}><span className="lms-info-label">Latency</span><span className="lms-info-value" style={{ fontFamily: 'monospace' }}>{health.database?.latency}</span></div>
                    <div className="lms-info-row" style={{ marginTop: 10 }}><span className="lms-info-label">Active DB Name</span><span className="lms-info-value">{health.database?.name}</span></div>
                  </div>

                  <div style={{ padding: 20, border: '1px solid var(--border)', borderRadius: 8, background: '#f8f9fa' }}>
                    <h4 style={{ marginBottom: 14, color: 'var(--primary)' }}>Memory Allocation</h4>
                    <div className="lms-info-row"><span className="lms-info-label">RSS Memory</span><span className="lms-info-value" style={{ fontFamily: 'monospace' }}>{health.memory?.rss} MB</span></div>
                    <div className="lms-info-row" style={{ marginTop: 10 }}><span className="lms-info-label">Heap Used / Total</span><span className="lms-info-value" style={{ fontFamily: 'monospace' }}>{health.memory?.heapUsed} MB / {health.memory?.heapTotal} MB</span></div>
                    <div className="lms-info-row" style={{ marginTop: 10 }}><span className="lms-info-label">System Memory Used</span><span className="lms-info-value">{health.memory?.systemUsedPct}%</span></div>
                  </div>

                  <div style={{ padding: 20, border: '1px solid var(--border)', borderRadius: 8, background: '#f8f9fa' }}>
                    <h4 style={{ marginBottom: 14, color: 'var(--primary)' }}>System Uptime & Load</h4>
                    <div className="lms-info-row"><span className="lms-info-label">Uptime</span><span className="lms-info-value">{health.uptime?.formatted}</span></div>
                    <div className="lms-info-row" style={{ marginTop: 10 }}><span className="lms-info-label">Load Average (1m/5m/15m)</span><span className="lms-info-value" style={{ fontFamily: 'monospace' }}>{health.load?.avg1} / {health.load?.avg5} / {health.load?.avg15}</span></div>
                  </div>

                  <div style={{ padding: 20, border: '1px solid var(--border)', borderRadius: 8, background: '#f8f9fa' }}>
                    <h4 style={{ marginBottom: 14, color: 'var(--primary)' }}>Runtime Environment</h4>
                    <div className="lms-info-row"><span className="lms-info-label">Node Version</span><span className="lms-info-value" style={{ fontFamily: 'monospace' }}>{health.node?.version} ({health.node?.arch})</span></div>
                    <div className="lms-info-row" style={{ marginTop: 10 }}><span className="lms-info-label">API Status</span><span className="lms-info-value lms-status lms-status-active">{health.api?.status} (v{health.api?.version})</span></div>
                  </div>
                </div>
              ) : (
                <div className="lms-table-empty">Unable to load infrastructure health data.</div>
              )
            )}
          </div>
        </div>

        <div className="lms-sidebar-col">
          <div className="lms-section">
            <div className="lms-section-title">Active Metrics</div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Active Exams</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{activeExams.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Active Sessions</span>
                <span style={{ fontWeight: 700, color: '#166534' }}>{sessions.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Online Users</span>
                <span style={{ fontWeight: 700, color: '#2563eb' }}>{onlineUsers.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 600 }}>System Status</span>
                <span className="lms-status lms-status-active">Optimal</span>
              </div>
            </div>
          </div>

          <div className="lms-section" style={{ marginTop: 24 }}>
            <div className="lms-section-title">Security & Integrity</div>
            <div style={{ padding: 20, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <p style={{ marginBottom: 10 }}>
                <strong>Proctoring Engine:</strong> All active sessions are monitored via secure browser hooks detecting tab-switches, fullscreen exits, and window blurs.
              </p>
              <p>
                Terminating a session immediately invalidates the student's launch token and logs an immutable integrity violation audit trail.
              </p>
            </div>
          </div>
        </div>
      </div>
    </LMSLayout>
  );
}
