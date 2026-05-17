'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Stats { totalStudents: number; totalTeachers: number; totalExams: number; totalSubmissions: number; }
interface ActivityLog { _id: string; action: string; userEmail: string; userRole: string; targetType: string; status: string; createdAt: string; ipAddress?: string; }
interface HealthData { api: { status: string; version: string }; database: { status: string; latency: string }; memory: { heapUsed: number; heapTotal: number; systemUsedPct: number }; uptime: { formatted: string }; }

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats>({ totalStudents: 0, totalTeachers: 0, totalExams: 0, totalSubmissions: 0 });
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, activityRes, healthRes] = await Promise.allSettled([
        api.get('/analytics/overview'),
        api.get('/admin/system/activity', { params: { limit: 8 } }),
        api.get('/admin/system/health'),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data || {});
      if (activityRes.status === 'fulfilled') setActivity(activityRes.value.data.data.logs || []);
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data.data || null);
    } catch { /* silent */ } finally {
      setLoading(false);
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 30000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const sk = (n: number) => loading ? '—' : n.toLocaleString();

  const actionLabel = (action: string) => action.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const getHealthServices = () => {
    if (!health) return [
      { name: 'API Server', pct: 0, color: 'red' },
      { name: 'MongoDB', pct: 0, color: 'red' },
      { name: 'Memory Usage', pct: 0, color: 'blue' },
    ];
    const dbOk = health.database?.status === 'connected';
    const memPct = health.memory?.systemUsedPct ?? 0;
    const memColor = memPct > 85 ? 'red' : memPct > 70 ? 'orange' : 'green';
    return [
      { name: 'API Server', pct: health.api?.status === 'operational' ? 100 : 0, color: 'green' },
      { name: `MongoDB (${health.database?.latency || 'N/A'})`, pct: dbOk ? 100 : 0, color: dbOk ? 'green' : 'red' },
      { name: `Memory (${memPct}% used)`, pct: 100 - memPct, color: memColor },
      { name: `Uptime: ${health.uptime?.formatted || 'N/A'}`, pct: 100, color: 'blue' },
    ];
  };

  return (
    <LMSLayout pageTitle="Administration Dashboard" breadcrumbs={[{ label: 'Administration' }, { label: 'Dashboard' }]}>
      {/* Welcome bar */}
      <div className="lms-alert lms-alert-info" style={{ marginBottom: 16 }}>
        <div>
          <div className="lms-alert-title">Welcome, {user?.firstName} {user?.lastName}</div>
          <div>Logged in as <strong style={{ textTransform: 'capitalize' }}>{user?.role}</strong>. {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="lms-stats-grid">
        <div className="lms-stat-card orange">
          <div className="lms-stat-value">{sk(stats.totalStudents)}</div>
          <div className="lms-stat-label">👥 Total Students</div>
        </div>
        <div className="lms-stat-card blue">
          <div className="lms-stat-value">{sk(stats.totalTeachers)}</div>
          <div className="lms-stat-label">👨‍🏫 Faculty</div>
        </div>
        <div className="lms-stat-card green">
          <div className="lms-stat-value">{sk(stats.totalExams)}</div>
          <div className="lms-stat-label">📝 Total Exams</div>
        </div>
        <div className="lms-stat-card red">
          <div className="lms-stat-value">{sk(stats.totalSubmissions)}</div>
          <div className="lms-stat-label">📤 Submissions</div>
        </div>
      </div>

      {/* Grid */}
      <div className="admin-grid">
        {/* Quick Actions */}
        <div className="lms-section">
          <div className="lms-section-title">⚡ Quick Actions</div>
          <div style={{ padding: 16 }}>
            <div className="quick-action-grid">
              {[
                { label: 'Create Exam', href: '/admin/exams', icon: '📝' },
                { label: 'Add User', href: '/admin/users/create', icon: '👤' },
                { label: 'View Results', href: '/admin/results', icon: '🏆' },
                { label: 'Live Monitor', href: '/admin/monitor', icon: '👁️' },
                { label: 'Question Bank', href: '/admin/questions', icon: '❓' },
                { label: 'Audit Logs', href: '/admin/logs', icon: '📊' },
              ].map(({ label, href, icon }) => (
                <Link key={href} href={href} className="quick-action">
                  <div className="quick-action-icon">{icon}</div>
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* System Health - Real Data */}
        <div className="lms-section">
          <div className="lms-section-title">🖥️ System Health</div>
          <div style={{ padding: 16 }}>
            {healthLoading ? (
              <div className="lms-loading">Checking services...</div>
            ) : (
              <>
                {getHealthServices().map(({ name, pct, color }) => (
                  <div key={name} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text)' }}>{name}</span>
                      <span style={{ fontWeight: 600, color: color === 'green' ? 'var(--success)' : color === 'red' ? 'var(--danger)' : 'var(--secondary)' }}>{pct}%</span>
                    </div>
                    <div className="lms-progress">
                      <div className={`lms-progress-bar ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
                <div className="lms-alert lms-alert-success" style={{ marginTop: 12, padding: '8px 12px' }}>
                  <span className="lms-alert-title" style={{ margin: 0, fontSize: 12 }}>
                    {health?.database?.status === 'connected' ? '✓ All systems operational' : '⚠ Database degraded'}
                  </span>
                </div>
                <Link href="/admin/system" className="lms-btn lms-btn-sm" style={{ marginTop: 8, display: 'block', textAlign: 'center' }}>
                  Full System Details →
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity - Real audit logs */}
      <div className="lms-section">
        <div className="lms-section-title" style={{ justifyContent: 'space-between' }}>
          <span>📋 Recent Activity</span>
          <Link href="/admin/logs" className="lms-btn lms-btn-sm lms-btn-default">View All Logs</Link>
        </div>
        <div className="lms-table-container">
          <table className="lms-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>User</th>
                <th>Resource</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>Loading activity...</td></tr>
              ) : activity.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No recent activity recorded.</td></tr>
              ) : activity.map(log => (
                <tr key={log._id}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{actionLabel(log.action)}</td>
                  <td>
                    <div style={{ fontSize: 13 }}>{log.userEmail}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{log.userRole}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{log.targetType || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {log.createdAt ? format(new Date(log.createdAt), 'dd/MM HH:mm') : '—'}
                  </td>
                  <td>
                    <span className={`lms-status ${log.status === 'success' ? 'lms-status-active' : 'lms-status-closed'}`}>
                      {log.status?.toUpperCase() || 'OK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </LMSLayout>
  );
}
