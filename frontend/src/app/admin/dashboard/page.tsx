'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import LMSLayout from '@/components/layouts/LMSLayout';
import { format } from 'date-fns';
import { Users, UserCheck, UserCog, BookOpen, FileText, Activity, ShieldCheck, FileSpreadsheet, Layers, BarChart2, Bell, Settings, Monitor, Link as LinkIcon, AlertCircle, Database, Server } from 'lucide-react';

interface DashStats {
  totalUsers: number;
  totalStudents: number;
  totalFaculty: number;
  totalCourses: number;
  totalExams: number;
  activeExams: number;
  totalSubmissions: number;
  newUsersToday: number;
  systemHealth: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashStats>({
    totalUsers: 0, totalStudents: 0, totalFaculty: 0, totalCourses: 0,
    totalExams: 0, activeExams: 0, totalSubmissions: 0, newUsersToday: 0, systemHealth: 'ok',
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [analyticsRes, usersRes, logsRes, healthRes] = await Promise.allSettled([
        api.get('/analytics/dashboard'),
        api.get('/admin/users', { params: { limit: 8, sortBy: 'createdAt', sortOrder: 'desc' } }),
        api.get('/admin/system/activity', { params: { limit: 10 } }),
        api.get('/admin/system/health'),
      ]);

      if (analyticsRes.status === 'fulfilled') {
        const d = analyticsRes.value.data?.data?.overview || {};
        setStats({
          totalUsers: d.totalUsers || 0,
          totalStudents: d.totalStudents || 0,
          totalFaculty: d.totalTeachers || d.totalFaculty || 0,
          totalCourses: d.totalCourses || 0,
          totalExams: d.totalExams || 0,
          activeExams: d.activeExams || 0,
          totalSubmissions: d.totalSubmissions || 0,
          newUsersToday: d.newUsersToday || 0,
          systemHealth: 'ok',
        });
      }

      if (usersRes.status === 'fulfilled') {
        const u = usersRes.value.data?.data?.users || usersRes.value.data?.data || [];
        setRecentUsers(Array.isArray(u) ? u : []);
      }

      if (logsRes.status === 'fulfilled') {
        const l = logsRes.value.data?.data?.logs || [];
        setRecentActivity(Array.isArray(l) ? l.slice(0, 10) : []);
      }

      if (healthRes.status === 'fulfilled') {
        const h = healthRes.value.data?.data || {};
        setSystemStatus([
          { name: 'Web Portal', status: h.api?.status === 'operational' ? 'Operational' : 'Degraded' },
          { name: 'MongoDB', status: h.database?.status === 'connected' ? 'Connected' : 'Disconnected' },
          { name: 'Uptime', status: h.uptime?.formatted || 'Unknown' },
          { name: 'API Version', status: h.api?.version || 'v3.0' }
        ]);
      } else {
        setSystemStatus([
          { name: 'Web Portal', status: 'Unknown' },
          { name: 'MongoDB', status: 'Unknown' },
        ]);
      }

    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: <Users size={24} />, color: 'blue', href: '/admin/users', sub: `+${stats.newUsersToday} today` },
    { label: 'Students', value: stats.totalStudents, icon: <UserCheck size={24} />, color: 'green', href: '/admin/users?role=student' },
    { label: 'Faculty', value: stats.totalFaculty, icon: <UserCog size={24} />, color: 'orange', href: '/admin/users?role=teacher' },
    { label: 'Active Courses', value: stats.totalCourses, icon: <BookOpen size={24} />, color: 'blue', href: '/admin/courses' },
    { label: 'Total Exams', value: stats.totalExams, icon: <FileText size={24} />, color: 'purple', href: '/admin/exams' },
    { label: 'Active Exams', value: stats.activeExams, icon: <Activity size={24} />, color: stats.activeExams > 0 ? 'red' : 'green', href: '/admin/monitoring' },
    { label: 'Submissions', value: stats.totalSubmissions, icon: <FileSpreadsheet size={24} />, color: 'indigo', href: '/admin/reports' },
    { label: 'System Health', value: stats.systemHealth === 'ok' ? ' Good' : 'Issue', icon: <ShieldCheck size={24} />, color: stats.systemHealth === 'ok' ? 'green' : 'red', href: '/admin/system' },
  ];

  const quickActions = [
    { href: '/admin/users', icon: <UserCog size={20} />, label: 'Add User' },
    { href: '/admin/courses', icon: <BookOpen size={20} />, label: 'Manage Courses' },
    { href: '/admin/semesters', icon: <Layers size={20} />, label: 'Semesters' },
    { href: '/admin/departments', icon: <Database size={20} />, label: 'Departments' },
    { href: '/admin/enrollments', icon: <LinkIcon size={20} />, label: 'Enrollments' },
    { href: '/admin/analytics', icon: <BarChart2 size={20} />, label: 'Analytics' },
    { href: '/admin/reports', icon: <FileSpreadsheet size={20} />, label: 'Reports' },
    { href: '/admin/logs', icon: <AlertCircle size={20} />, label: 'Audit Logs' },
    { href: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' },
    { href: '/admin/monitoring', icon: <Monitor size={20} />, label: 'Live Monitor' },
    { href: '/erp', icon: <Server size={20} />, label: 'ERP Module' },
    { href: '/communication', icon: <Bell size={20} />, label: 'Announcements' },
  ];

  return (
    <LMSLayout pageTitle="Administration Dashboard" breadcrumbs={[{ label: 'Admin' }, { label: 'Dashboard' }]}>
      {/* Header Banner */}
      <div style={{
        background: 'var(--grad-hero)', color: '#fff', borderRadius: 'var(--radius-lg)',
        padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        boxShadow: 'var(--shadow-md)'
      }} className="animate-fadeInDown">
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>EDYRA Administration</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>
            {format(new Date(), 'EEEE, dd MMMM yyyy HH:mm')} · System Operational
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/admin/users" className="lms-btn lms-btn-primary">+ Add User</Link>
          <Link href="/admin/reports" className="lms-btn" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
             Reports
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 24 }}>
        {statCards.map((s, i) => (
          <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}
            className={`lms-stat-card ${s.color} animate-fadeInUp stagger-${(i % 6) + 1}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
            </div>
            <div className="lms-stat-value">{s.value}</div>
            <div className="lms-stat-label">{s.label}</div>
            {s.sub && <div style={{ fontSize: 10, color: 'var(--success)', marginTop: 2 }}>{s.sub}</div>}
          </Link>
        ))}
      </div>

      <div className="admin-grid three" style={{ gap: 16 }}>
        {/* Quick Actions */}
        <div>
          <div className="lms-section animate-fadeIn">
            <div className="lms-section-title"> Quick Actions</div>
            <div style={{ padding: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {quickActions.map(a => (
                  <Link key={a.href} href={a.href} className="quick-action">
                    <div className="quick-action-icon">{a.icon}</div>
                    <span style={{ fontSize: 12 }}>{a.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div>
          <div className="lms-section animate-fadeIn stagger-2">
            <div className="lms-section-title">
               Recent Users
              <Link href="/admin/users" className="lms-btn lms-btn-sm" style={{ marginLeft: 'auto' }}>Manage All →</Link>
            </div>
            <div style={{ padding: '0 0 4px' }}>
              {loading ? (
                <div className="lms-spinner" style={{ padding: 20 }}><div className="spinner" /></div>
              ) : recentUsers.length > 0 ? (
                recentUsers.map((u: any) => (
                  <div key={u._id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 12, flexShrink: 0,
                    }}>
                      {(u.firstName?.[0] || '?')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.firstName} {u.lastName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                    </div>
                    <span className="lms-status lms-status-info" style={{ fontSize: 10, textTransform: 'capitalize' }}>
                      {u.role}
                    </span>
                  </div>
                ))
              ) : (
                <div className="lms-table-empty" style={{ padding: 24 }}>No users yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Audit Logs */}
        <div>
          <div className="lms-section animate-fadeIn stagger-3">
            <div className="lms-section-title">
               Audit Log
              <Link href="/admin/logs" className="lms-btn lms-btn-sm" style={{ marginLeft: 'auto' }}>View All →</Link>
            </div>
            <div style={{ padding: '0 0 4px' }}>
              {recentActivity.length > 0 ? (
                recentActivity.map((log: any, i: number) => (
                  <div key={log._id || i} style={{
                    padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 12,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{log.action || 'Action'}</span>
                      <span style={{ color: 'var(--text-light)', fontSize: 10 }}>
                        {log.createdAt ? format(new Date(log.createdAt), 'HH:mm') : ''}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-muted)' }}>
                      {log.userId?.firstName || 'User'} · {log.ip || 'N/A'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="lms-table-empty" style={{ padding: 24 }}>No recent activity.</div>
              )}
            </div>
          </div>

          {/* System Status */}
          <div className="lms-section animate-fadeIn stagger-4">
            <div className="lms-section-title">️ System Status</div>
            <div style={{ padding: 16 }}>
              {systemStatus.length > 0 ? systemStatus.map(s => (
                <div key={s.name} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 12,
                }}>
                  <span>{s.name}</span>
                  <span className={`lms-status ${s.status === 'Operational' || s.status === 'Connected' ? 'lms-status-active' : 'lms-status-warning'}`} style={{ fontSize: 10 }}>
                    {s.status === 'Operational' || s.status === 'Connected' ? '' : '️'} {s.status}
                  </span>
                </div>
              )) : (
                <div className="lms-spinner" style={{ padding: 10 }}><div className="spinner" style={{ width: 16, height: 16 }} /></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </LMSLayout>
  );
}
