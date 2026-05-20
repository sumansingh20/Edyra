'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import LMSLayout from '@/components/layouts/LMSLayout';
import StatCard from '@/components/ui/StatCard';
import AnimatedCard from '@/components/ui/AnimatedCard';
import api from '@/lib/api';

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalExams: number;
  activeExams: number;
  totalSubmissions: number;
  pendingGrading: number;
  onlineUsers?: number;
}

interface RecentActivity {
  id: string;
  action: string;
  userEmail: string;
  userRole: string;
  createdAt: string;
  status: 'success' | 'failure' | 'blocked';
}

const QUICK_ACTIONS = [
  { label: 'Create Exam', icon: '📝', href: '/admin/exams' },
  { label: 'Add User', icon: '👤', href: '/admin/users' },
  { label: 'Question Bank', icon: '❓', href: '/admin/questions' },
  { label: 'Live Monitor', icon: '👁️', href: '/admin/monitor' },
  { label: 'Audit Logs', icon: '📜', href: '/admin/logs' },
  { label: 'Analytics', icon: '📊', href: '/admin/analytics' },
  { label: 'Manage Courses', icon: '📚', href: '/admin/courses' },
  { label: 'System Health', icon: '⚙️', href: '/admin/system' },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.allSettled([
        api.get('/admin/dashboard'),
        api.get('/admin/audit-logs?limit=8&sort=-createdAt'),
      ]);

      if (statsRes.status === 'fulfilled') {
        const d = statsRes.value.data?.data || statsRes.value.data;
        setStats({
          totalUsers: d.totalUsers ?? d.users ?? 0,
          totalStudents: d.totalStudents ?? d.students ?? 0,
          totalTeachers: d.totalTeachers ?? d.teachers ?? 0,
          totalCourses: d.totalCourses ?? d.courses ?? 0,
          totalExams: d.totalExams ?? d.exams ?? 0,
          activeExams: d.activeExams ?? d.liveExams ?? 0,
          totalSubmissions: d.totalSubmissions ?? d.submissions ?? 0,
          pendingGrading: d.pendingGrading ?? 0,
          onlineUsers: d.onlineUsers ?? 0,
        });
      }

      if (activityRes.status === 'fulfilled') {
        const logs = activityRes.value.data?.data?.logs || activityRes.value.data?.logs || [];
        setActivity(logs.slice(0, 8));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const STAT_CARDS = [
    { title: 'Total Users', value: stats?.totalUsers ?? 0, icon: '👥', variant: 'blue' as const, change: 'Registered accounts', changeType: 'neutral' as const },
    { title: 'Students', value: stats?.totalStudents ?? 0, icon: '🎓', variant: 'orange' as const, change: 'Enrolled learners', changeType: 'neutral' as const },
    { title: 'Teachers', value: stats?.totalTeachers ?? 0, icon: '👨‍🏫', variant: 'purple' as const, change: 'Faculty members', changeType: 'neutral' as const },
    { title: 'Courses', value: stats?.totalCourses ?? 0, icon: '📚', variant: 'teal' as const, change: 'Learning modules', changeType: 'neutral' as const },
    { title: 'Total Exams', value: stats?.totalExams ?? 0, icon: '📝', variant: 'blue' as const, change: 'All exam records', changeType: 'neutral' as const },
    { title: 'Active Now', value: stats?.activeExams ?? 0, icon: '🔴', variant: 'red' as const, change: 'Live exams running', changeType: stats?.activeExams ? 'up' as const : 'neutral' as const },
    { title: 'Submissions', value: stats?.totalSubmissions ?? 0, icon: '📤', variant: 'green' as const, change: 'Total exam attempts', changeType: 'neutral' as const },
    { title: 'Online Users', value: stats?.onlineUsers ?? 0, icon: '🟢', variant: 'green' as const, change: 'Currently online', changeType: 'neutral' as const },
  ];

  return (
    <LMSLayout pageTitle="Admin Dashboard" breadcrumbs={[{ label: 'Dashboard' }]}>
      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        {STAT_CARDS.map((card, i) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            variant={card.variant}
            change={card.change}
            changeType={card.changeType}
            delay={i * 0.06}
            loading={loading}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <AnimatedCard delay={0.15} hover={false} className="lms-section" style={{ marginBottom: 24 }}>
        <div className="lms-section-title">⚡ Quick Actions</div>
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {QUICK_ACTIONS.map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.04 }}
            >
              <Link
                href={action.href}
                className="quick-action"
                style={{ textDecoration: 'none' }}
              >
                <span style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius)',
                  background: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  flexShrink: 0,
                }}>
                  {action.icon}
                </span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{action.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </AnimatedCard>

      {/* Bottom Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>

        {/* Recent Activity */}
        <AnimatedCard delay={0.25} hover={false}>
          <div className="lms-section">
            <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📋 Recent Activity</span>
              <Link href="/admin/logs" style={{ fontSize: 12, fontWeight: 500 }}>View all →</Link>
            </div>
            <div className="lms-section-body" style={{ padding: 0 }}>
              {activity.length === 0 && !loading ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No recent activity
                </div>
              ) : (
                <div className="lms-table-container">
                  <table className="lms-table">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>User</th>
                        <th>Status</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        [1, 2, 3, 4].map(i => (
                          <tr key={i}>
                            {[1, 2, 3, 4].map(j => (
                              <td key={j}><div className="skeleton" style={{ height: 12, width: '80%' }} /></td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        activity.map((item, i) => (
                          <motion.tr
                            key={item.id || i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                              {item.action}
                            </td>
                            <td style={{ fontSize: 12, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.userEmail || '—'}
                            </td>
                            <td>
                              <span className={`lms-status ${
                                item.status === 'success' ? 'lms-status-active' :
                                item.status === 'failure' ? 'lms-status-closed' :
                                'lms-status-pending'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {item.createdAt ? timeAgo(item.createdAt) : '—'}
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </AnimatedCard>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* System Status */}
          <AnimatedCard delay={0.3} hover={false}>
            <div className="lms-section">
              <div className="lms-section-title">🟢 System Status</div>
              <div className="lms-section-body">
                {[
                  { name: 'API Server', status: 'Operational', ok: true },
                  { name: 'Database (MongoDB)', status: 'Operational', ok: true },
                  { name: 'Redis Cache', status: 'Operational', ok: true },
                  { name: 'Exam Engine', status: 'Operational', ok: true },
                  { name: 'File Storage', status: 'Operational', ok: true },
                  { name: 'AI Services', status: 'Active', ok: true },
                ].map(({ name, status, ok }) => (
                  <div key={name} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 13,
                  }}>
                    <span style={{ color: 'var(--text)' }}>{name}</span>
                    <span className={`lms-status ${ok ? 'lms-status-active' : 'lms-status-closed'}`}>
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedCard>

          {/* Platform Info */}
          <AnimatedCard delay={0.35} hover={false}>
            <div className="lms-section">
              <div className="lms-section-title">ℹ️ Platform Info</div>
              <div className="lms-section-body">
                {[
                  ['Platform', 'EDYRA v3.0'],
                  ['Environment', process.env.NODE_ENV || 'production'],
                  ['API', process.env.NEXT_PUBLIC_API_URL || '/api'],
                  ['Build', new Date().toLocaleDateString()],
                ].map(([label, value]) => (
                  <div key={label} className="lms-info-row">
                    <span className="lms-info-label">{label}</span>
                    <span className="lms-info-value" style={{ fontFamily: 'monospace', fontSize: 12 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedCard>

        </div>
      </div>

      {error && (
        <div className="lms-alert lms-alert-error" style={{ marginTop: 16 }}>
          <div>
            <div className="lms-alert-title">Dashboard Error</div>
            <div>{error}</div>
          </div>
        </div>
      )}
    </LMSLayout>
  );
}
