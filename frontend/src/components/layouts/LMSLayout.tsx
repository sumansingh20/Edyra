'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface LMSLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

const NAV_CONFIG = {
  admin: [
    { section: 'Administration', items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: '🏠' },
      { label: 'Users', href: '/admin/users', icon: '👥' },
      { label: 'Roles', href: '/admin/roles', icon: '🛡️' },
      { label: 'Semesters', href: '/admin/semesters', icon: '📅' },
      { label: 'Courses', href: '/admin/courses', icon: '📚' },
      { label: 'Enrollments', href: '/admin/enrollments', icon: '📌' },
    ]},
    { section: 'System Control', items: [
      { label: 'Live Monitoring', href: '/admin/monitoring', icon: '👁️' },
      { label: 'System Health', href: '/admin/system', icon: '⚙️' },
      { label: 'Audit Logs', href: '/admin/logs', icon: '📜' },
      { label: 'Backups', href: '/admin/backup', icon: '💾' },
      { label: 'Analytics', href: '/admin/analytics', icon: '📊' },
    ]},
    { section: 'Exam Engine', items: [
      { label: 'Live Monitor', href: '/admin/monitor', icon: '👁️' },
      { label: 'Question Bank', href: '/admin/questions', icon: '❓' },
      { label: 'Reports', href: '/admin/reports', icon: '📈' },
    ]},
  ],
  teacher: [
    { section: 'Faculty Panel', items: [
      { label: 'Dashboard', href: '/faculty/dashboard', icon: '🏠' },
      { label: 'My Courses', href: '/faculty/courses', icon: '📚' },
      { label: 'Attendance', href: '/faculty/attendance', icon: '📅' },
      { label: 'Gradebook', href: '/faculty/grades/manage', icon: '📊' },
      { label: 'Analytics', href: '/faculty/analytics', icon: '📈' },
    ]},
    { section: 'Examinations', items: [
      { label: 'Manage Exams', href: '/faculty/exam/manage', icon: '📋' },
      { label: 'Create Exam', href: '/faculty/exam/create', icon: '➕' },
      { label: 'Live Monitor', href: '/faculty/monitor', icon: '👁️' },
    ]},
    { section: 'Account', items: [
      { label: 'My Profile', href: '/faculty/profile', icon: '👤' },
      { label: 'Communication', href: '/faculty/notifications', icon: '🔔' },
    ]},
  ],
  student: [
    { section: 'Student Portal', items: [
      { label: 'Dashboard', href: '/student/dashboard', icon: '🏠' },
      { label: 'My Courses', href: '/student/courses', icon: '📚' },
      { label: 'Attendance', href: '/student/attendance', icon: '📅' },
      { label: 'My Grades', href: '/student/grades', icon: '📈' },
      { label: 'Transcript', href: '/student/transcript', icon: '📜' },
    ]},
    { section: 'Examinations', items: [
      { label: 'My Exams', href: '/student/exams', icon: '📝' },
      { label: 'Submissions', href: '/student/submissions', icon: '📤' },
    ]},
    { section: 'Account', items: [
      { label: 'My Profile', href: '/student/profile', icon: '👤' },
      { label: 'Notifications', href: '/student/notifications', icon: '🔔' },
    ]},
  ],
};

function getNavItems(role: string) {
  if (role === 'admin' || role === 'super-admin' || role === 'organization-admin' || role === 'campus-admin' || role === 'department-admin' || role === 'institution-admin') {
    return NAV_CONFIG.admin;
  }
  if (role === 'teacher' || role === 'assistant-teacher' || role === 'invigilator') {
    return NAV_CONFIG.teacher;
  }
  return NAV_CONFIG.student;
}

function getDashboardHref(role: string): string {
  if (['admin','super-admin','organization-admin','campus-admin','department-admin','institution-admin'].includes(role)) return '/admin/dashboard';
  if (['teacher','assistant-teacher','invigilator'].includes(role)) return '/faculty/dashboard';
  return '/student/dashboard';
}

export default function LMSLayout({ children, pageTitle, breadcrumbs }: LMSLayoutProps) {
  const pathname = usePathname();
  const { user, logout, isAuthenticated, checkAuth } = useAuthStore();
  const [serverTime, setServerTime] = useState('');
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth().catch(console.error).finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    const tick = () => {
      setServerTime(new Date().toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      }));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    window.location.href = '/login';
  }, [logout]);

  if (!mounted || !authChecked) {
    return (
      <div className="auth-status-page">
        <div className="spinner" />
        <p className="auth-status-desc">Loading portal...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="auth-status-page">
        <h1 className="auth-status-title error">Session Expired</h1>
        <p className="auth-status-desc">Your session has expired. Please log in again.</p>
        <a href="/login" className="auth-status-btn">Sign In</a>
      </div>
    );
  }

  const navSections = getNavItems(user.role || 'student');
  const dashboardHref = getDashboardHref(user.role || 'student');
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="lms-app">
      {/* ── Top Header ── */}
      <header className="lms-header">
        <div className="lms-header-left">
          <Link href={dashboardHref} className="lms-logo">
            <div className="lms-logo-icon">E</div>
            <div>
              <div className="lms-logo-text">EDYRA</div>
              <div className="lms-logo-subtitle">Learning Management System</div>
            </div>
          </Link>

          {/* Top nav links */}
          <nav className="lms-header-nav" style={{ marginLeft: 12 }}>
            <Link href={dashboardHref} className={pathname === dashboardHref ? 'active' : ''}>Home</Link>
            <Link href="/courses" className={pathname.startsWith('/courses') ? 'active' : ''}>Courses</Link>
            {(user.role === 'admin' || user.role === 'teacher') && (
              <Link href="/gradebook" className={pathname.startsWith('/gradebook') ? 'active' : ''}>Gradebook</Link>
            )}
          </nav>
        </div>

        <div className="lms-header-right">
          <div className="lms-header-time">{serverTime}</div>

          {/* User menu */}
          <div style={{ position: 'relative' }}>
            <div
              className="lms-user-avatar"
              onClick={() => setUserMenuOpen(o => !o)}
              title={`${user.firstName} ${user.lastName}`}
            >
              {initials}
            </div>
            {userMenuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 6,
                background: '#fff', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)',
                minWidth: 200, zIndex: 200,
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: '#f8f9fa' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--nav-bg)' }}>
                    {user.firstName} {user.lastName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {user.email}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <span className="lms-status lms-status-info" style={{ fontSize: 10 }}>{user.role}</span>
                  </div>
                </div>
                <Link
                  href={`/${user.role === 'student' ? 'student' : user.role === 'teacher' ? 'faculty' : 'admin'}/profile`}
                  onClick={() => setUserMenuOpen(false)}
                  style={{ display: 'block', padding: '10px 16px', fontSize: 13, color: 'var(--text)', borderBottom: '1px solid #f0f2f4' }}
                >
                  👤 My Profile
                </Link>
                <Link
                  href={`/${user.role === 'student' ? 'student' : user.role === 'teacher' ? 'faculty' : 'admin'}/notifications`}
                  onClick={() => setUserMenuOpen(false)}
                  style={{ display: 'block', padding: '10px 16px', fontSize: 13, color: 'var(--text)', borderBottom: '1px solid #f0f2f4' }}
                >
                  🔔 Notifications
                </Link>
                <button
                  onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '10px 16px', fontSize: 13, color: 'var(--danger)',
                    background: 'none', border: 'none', cursor: 'pointer',
                  }}
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>

          <button className="lms-logout-btn" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="lms-body" style={{ flex: 1, minHeight: 0 }}>
        {/* ── Sidebar ── */}
        <aside className="lms-sidebar">
          {/* User info block */}
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid var(--border)',
            background: '#f8f9fa', marginBottom: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--primary)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 14, flexShrink: 0,
              }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--nav-bg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.firstName} {user.lastName}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {user.studentId ? `ID: ${user.studentId}` : user.role}
                </div>
              </div>
            </div>
          </div>

          {navSections.map((group, i) => (
            <div key={i} className="lms-sidebar-section">
              <div className="lms-sidebar-title">{group.section}</div>
              <ul className="lms-nav">
                {group.items.map(item => {
                  const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
                  return (
                    <li key={item.href} className="lms-nav-item">
                      <Link href={item.href} className={`lms-nav-link${active ? ' active' : ''}`}>
                        <span className="lms-nav-icon">{item.icon}</span>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>

        {/* ── Main ── */}
        <main className="lms-main">
          {/* Page header with breadcrumb */}
          {(pageTitle || breadcrumbs) && (
            <div className="lms-page-header">
              {pageTitle && <h1 className="lms-page-title">{pageTitle}</h1>}
              {breadcrumbs && (
                <div className="lms-breadcrumb">
                  <Link href={dashboardHref}>Home</Link>
                  {breadcrumbs.map((crumb, i) => (
                    <span key={i}>
                      <span> / </span>
                      {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span>{crumb.label}</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="lms-content">
            {children}
          </div>
        </main>
      </div>

      {/* ── Footer ── */}
      <footer className="lms-footer">
        <div>© {new Date().getFullYear()} EDYRA — Learning Management System</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link href="/help">Help</Link>
          <Link href="/profile">Profile</Link>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>v3.0</span>
        </div>
      </footer>
    </div>
  );
}
