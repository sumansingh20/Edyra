'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import DarkModeToggle from '@/components/common/DarkModeToggle';
import NotificationPanel from '@/components/common/NotificationPanel';

interface LMSLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

import {
  LayoutDashboard, Users, Building, ShieldCheck, Calendar, BookOpen, UserPlus,
  MessageSquare, Activity, HardDrive, FileText, Database, PieChart,
  BookMarked, ClipboardList, GraduationCap, Video, CheckSquare, Settings, Bell, User,
  FileEdit, BarChart, Inbox, MonitorPlay, HelpCircle, LogOut
} from 'lucide-react';

const NAV_CONFIG = {
  admin: [
    { section: 'Administration', items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
      { label: 'Academic ERP', href: '/erp', icon: <Database size={18} /> },
      { label: 'Users', href: '/admin/users', icon: <Users size={18} /> },
      { label: 'Departments', href: '/admin/departments', icon: <Building size={18} /> },
      { label: 'Roles', href: '/admin/roles', icon: <ShieldCheck size={18} /> },
      { label: 'Semesters', href: '/admin/semesters', icon: <Calendar size={18} /> },
      { label: 'Courses', href: '/admin/courses', icon: <BookOpen size={18} /> },
      { label: 'Enrollments', href: '/admin/enrollments', icon: <UserPlus size={18} /> },
      { label: 'Communication', href: '/communication', icon: <MessageSquare size={18} /> },
    ]},
    { section: 'System Control', items: [
      { label: 'Live Monitoring', href: '/admin/monitor', icon: <Activity size={18} /> },
      { label: 'System Health', href: '/admin/system', icon: <HardDrive size={18} /> },
      { label: 'Audit Logs', href: '/admin/logs', icon: <FileText size={18} /> },
      { label: 'Backups', href: '/admin/backup', icon: <Database size={18} /> },
      { label: 'Analytics', href: '/admin/analytics', icon: <PieChart size={18} /> },
    ]},
    { section: 'Exam Engine', items: [
      { label: 'Live Monitor', href: '/admin/monitor', icon: <MonitorPlay size={18} /> },
      { label: 'Question Bank', href: '/admin/questions', icon: <FileEdit size={18} /> },
      { label: 'Reports', href: '/admin/reports', icon: <BarChart size={18} /> },
    ]},
  ],
  teacher: [
    { section: 'Faculty Panel', items: [
      { label: 'Dashboard', href: '/faculty/dashboard', icon: <LayoutDashboard size={18} /> },
      { label: 'My Courses', href: '/faculty/courses', icon: <BookOpen size={18} /> },
      { label: 'Attendance', href: '/faculty/attendance', icon: <CheckSquare size={18} /> },
      { label: 'Assignments', href: '/faculty/assignment/manage', icon: <FileText size={18} /> },
      { label: 'Gradebook', href: '/faculty/grades/manage', icon: <BarChart size={18} /> },
      { label: 'Analytics', href: '/faculty/analytics', icon: <PieChart size={18} /> },
    ]},
    { section: 'Examinations', items: [
      { label: 'Exam Dashboard', href: '/teacher', icon: <LayoutDashboard size={18} /> },
      { label: 'Manage Exams', href: '/teacher/exams', icon: <FileEdit size={18} /> },
      { label: 'Create Exam', href: '/teacher/exams/create', icon: <FileText size={18} /> },
      { label: 'Live Monitor', href: '/teacher/monitor', icon: <MonitorPlay size={18} /> },
      { label: 'Question Bank', href: '/teacher/questions', icon: <Database size={18} /> },
    ]},
    { section: 'Account', items: [
      { label: 'My Profile', href: '/faculty/profile', icon: <User size={18} /> },
      { label: 'Notifications', href: '/faculty/notifications', icon: <Bell size={18} /> },
      { label: 'Communication', href: '/communication', icon: <MessageSquare size={18} /> },
    ]},
  ],
  student: [
    { section: 'Student Portal', items: [
      { label: 'Dashboard', href: '/student/dashboard', icon: <LayoutDashboard size={18} /> },
      { label: 'My Courses', href: '/student/courses', icon: <BookOpen size={18} /> },
      { label: 'Assignments', href: '/student/assignment', icon: <FileText size={18} /> },
      { label: 'Attendance', href: '/student/attendance', icon: <CheckSquare size={18} /> },
      { label: 'My Grades', href: '/student/grades', icon: <BarChart size={18} /> },
      { label: 'Transcript', href: '/student/transcript', icon: <FileText size={18} /> },
    ]},
    { section: 'Examinations', items: [
      { label: 'My Exams', href: '/student/exams', icon: <FileEdit size={18} /> },
      { label: 'Submissions', href: '/student/submissions', icon: <Inbox size={18} /> },
    ]},
    { section: 'Account', items: [
      { label: 'My Profile', href: '/student/profile', icon: <User size={18} /> },
      { label: 'Notifications', href: '/student/notifications', icon: <Bell size={18} /> },
      { label: 'Communication', href: '/communication', icon: <MessageSquare size={18} /> },
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

import LiveClock from '@/components/common/LiveClock';

// Normalize role strings to the actual portal sections/routes we have in `src/app/*`
const normalizeRole = (role?: string) => {
  const r = (role || '').toLowerCase();
  if (['student'].includes(r)) return 'student';
  // Teacher-like roles map to the `faculty/*` routes
  if (['teacher', 'assistant-teacher', 'invigilator', 'teaching-assistant'].includes(r)) return 'teacher';
  // Admin-like roles map to the `admin/*` routes
  if (['admin', 'super-admin', 'organization-admin', 'campus-admin', 'department-admin', 'institution-admin', 'institute-admin'].includes(r)) return 'admin';
  return 'student';
};

export default function LMSLayout({ children, pageTitle, breadcrumbs }: LMSLayoutProps) {
  const pathname = usePathname();
  const { user, logout, isAuthenticated, checkAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth().catch(console.error).finally(() => setAuthChecked(true));
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
          <LiveClock />

          {/* Notification Bell */}
          <NotificationPanel />

          {/* Dark Mode Toggle */}
          <DarkModeToggle />

          {/* User avatar + menu */}
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
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                background: 'var(--card-bg)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
                minWidth: 220, zIndex: 200, overflow: 'hidden',
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                    {user.firstName} {user.lastName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {user.email}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <span className="lms-status lms-status-info" style={{ fontSize: 10 }}>{user.role}</span>
                  </div>
                </div>
                <Link
                  href={`/${normalizeRole(user.role) === 'student' ? 'student' : normalizeRole(user.role) === 'teacher' ? 'faculty' : 'admin'}/profile`}

                  onClick={() => setUserMenuOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 13, color: 'var(--text)', borderBottom: '1px solid var(--border)' }}
                >
                  <span></span> My Profile
                </Link>
                <Link
                  href={`/${normalizeRole(user.role) === 'student' ? 'student' : normalizeRole(user.role) === 'teacher' ? 'faculty' : 'admin'}/notifications`}

                  onClick={() => setUserMenuOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 13, color: 'var(--text)', borderBottom: '1px solid var(--border)' }}
                >
                  <span></span> Notifications
                </Link>
                <button
                  onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                    padding: '11px 16px', fontSize: 13, color: 'var(--danger)',
                    background: 'none', border: 'none', cursor: 'pointer',
                  }}
                >
                  <span></span> Sign Out
                </button>
              </div>
            )}
          </div>
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
