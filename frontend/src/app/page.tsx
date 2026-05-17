'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

const FEATURES = [
  { title: 'Secure Examinations', desc: 'Anti-cheat proctoring, tab-switch detection, anomaly scoring, and full audit trails.', icon: '🔒' },
  { title: 'AI-Powered Learning', desc: 'Adaptive quizzes, intelligent content recommendations, and automated grading.', icon: '🧠' },
  { title: 'Real-Time Classrooms', desc: 'WebRTC video, collaborative whiteboard, live polls, and instant Q&A.', icon: '📡' },
  { title: 'Deep Analytics', desc: 'Student performance, engagement heatmaps, and predictive risk scoring.', icon: '📊' },
];

const STATS = [
  { value: '50,000+', label: 'Active Students' },
  { value: '2,400+', label: 'Courses' },
  { value: '180+', label: 'Institutions' },
  { value: '99.9%', label: 'Uptime' },
];

export default function HomePage() {
  const { isAuthenticated, user, isLoading, checkAuth } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkAuth().finally(() => setChecked(true));
  }, [checkAuth]);

  if (!checked || isLoading) {
    return (
      <div className="auth-status-page" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <div className="spinner" />
        <p className="auth-status-desc">Loading EDYRA...</p>
      </div>
    );
  }

  if (isAuthenticated && user) {
    const role = user.role as string;
    const dest = ['admin','super-admin','organization-admin','campus-admin'].includes(role)
      ? '/admin/dashboard'
      : ['teacher','assistant-teacher','invigilator'].includes(role)
      ? '/teacher'
      : '/my';
    return (
      <div className="auth-status-page" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <div className="spinner" />
        <p className="auth-status-desc">Redirecting to your dashboard...</p>
        <script dangerouslySetInnerHTML={{ __html: `window.location.href="${dest}"` }} />
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header className="pub-header">
        <Link href="/" className="lms-logo">
          <div className="lms-logo-icon">E</div>
          <div>
            <div className="lms-logo-text">EDYRA</div>
            <div className="lms-logo-subtitle">Learning Management System</div>
          </div>
        </Link>
        <nav className="pub-nav">
          <Link href="/courses">Courses</Link>
          <Link href="/help">Help</Link>
          <Link href="/login" style={{ background: 'var(--primary)', color: '#fff', borderRadius: 4, padding: '6px 14px', fontWeight: 600 }}>Log In</Link>
        </nav>
      </header>

      {/* ── Hero ── */}
      <div className="pub-hero">
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'rgba(249,128,18,0.2)', border: '1px solid rgba(249,128,18,0.4)', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 600, color: '#ffc266', marginBottom: 16, letterSpacing: '.04em' }}>
            🎓 Enterprise Educational Ecosystem v3.0
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#fff', marginBottom: 14, lineHeight: 1.15 }}>
            EDYRA — Modern LMS for <span style={{ color: 'var(--primary)' }}>Every Institution</span>
          </h1>
          <p style={{ fontSize: 16, opacity: 0.85, marginBottom: 28, lineHeight: 1.7 }}>
            A complete, secure, AI-powered Learning Management System with online examinations, real-time collaboration, and deep analytics — designed for universities, colleges, and enterprises.
          </p>
          <div className="pub-hero-actions">
            <Link href="/login" className="lms-btn lms-btn-primary lms-btn-lg">
              Sign In to Portal
            </Link>
            <Link href="/register" className="lms-btn lms-btn-default lms-btn-lg" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
              Register Account
            </Link>
            <Link href="/courses" className="lms-btn lms-btn-default lms-btn-lg" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
              Browse Courses
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 40, flexWrap: 'wrap' }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{s.value}</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="pub-main">
        {/* Left column */}
        <div>
          <div className="pub-widget">
            <div className="pub-widget-header">📚 Platform Features</div>
            <div className="pub-features" style={{ margin: 14 }}>
              {FEATURES.map(f => (
                <div key={f.title} className="pub-feature-card">
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pub-widget">
            <div className="pub-widget-header">📋 Available Course Categories</div>
            <div className="pub-widget-body">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Computer Science','Mathematics','Physics','Chemistry','Biology','English','History','Business Management','Engineering','Economics','Art & Design','Law'].map(cat => (
                  <Link
                    key={cat}
                    href={`/courses?category=${encodeURIComponent(cat)}`}
                    style={{
                      padding: '5px 12px', border: '1px solid var(--border)',
                      borderRadius: 20, fontSize: 12, color: 'var(--secondary)',
                      background: '#fff', fontWeight: 500,
                    }}
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="pub-widget">
            <div className="pub-widget-header">🔒 Security & Compliance</div>
            <div className="pub-widget-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  ['TOTP 2FA Authentication','✓'],
                  ['OAuth2 (Google, GitHub)','✓'],
                  ['Device Fingerprinting','✓'],
                  ['Brute-Force Protection','✓'],
                  ['Full Audit Logs','✓'],
                  ['CSP Security Headers','✓'],
                  ['NoSQL Injection Prevention','✓'],
                  ['Anomaly Detection','✓'],
                ].map(([item, check]) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '6px 0', borderBottom: '1px solid #f0f2f4' }}>
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>{check}</span>
                    <span style={{ color: 'var(--text)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar column */}
        <div className="pub-sidebar-col">
          {/* Login widget */}
          <div className="pub-widget">
            <div className="pub-widget-header">🔑 Sign In</div>
            <div className="pub-widget-body">
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
                Access your courses, exams, and learning materials.
              </p>
              <Link href="/login" className="lms-btn lms-btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 8 }}>
                Sign In
              </Link>
              <Link href="/register" className="lms-btn lms-btn-default" style={{ width: '100%', justifyContent: 'center' }}>
                Create Account
              </Link>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Quick Access:</div>
                <Link href="/login?role=student" style={{ fontSize: 12, padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--secondary)' }}>
                  🎓 Student Portal
                </Link>
                <Link href="/login?role=teacher" style={{ fontSize: 12, padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--secondary)' }}>
                  👨‍🏫 Teacher Panel
                </Link>
                <Link href="/admin/dashboard" style={{ fontSize: 12, padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--secondary)' }}>
                  ⚙️ Admin Dashboard
                </Link>
              </div>
            </div>
          </div>

          {/* News / Announcements */}
          <div className="pub-widget">
            <div className="pub-widget-header">📢 Latest News</div>
            <div className="pub-widget-body">
              {[
                { title: 'EDYRA v3.0 Released', date: 'May 2026', desc: 'AI-powered learning, WebRTC classrooms, and enterprise multi-tenancy.' },
                { title: 'New Proctoring Engine', date: 'Apr 2026', desc: 'Advanced anomaly detection with real-time behavior analytics.' },
                { title: 'Certificate System Live', date: 'Mar 2026', desc: 'Auto-generate verifiable certificates upon course completion.' },
              ].map(item => (
                <div key={item.title} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid #f0f2f4' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--nav-bg)', marginBottom: 2 }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 4 }}>{item.date}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* System status */}
          <div className="pub-widget">
            <div className="pub-widget-header">🟢 System Status</div>
            <div className="pub-widget-body">
              {[
                { name: 'Web Portal', status: 'Operational' },
                { name: 'Exam Engine', status: 'Operational' },
                { name: 'Video Classrooms', status: 'Operational' },
                { name: 'AI Services', status: 'Operational' },
              ].map(({ name, status }) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f0f2f4', fontSize: 13 }}>
                  <span>{name}</span>
                  <span className="lms-status lms-status-active">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="pub-footer">
        <div>© {new Date().getFullYear()} EDYRA — Enterprise Learning Management System</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link href="/help">Help</Link>
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
        </div>
      </footer>
    </div>
  );
}
