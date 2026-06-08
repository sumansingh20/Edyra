'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

const FEATURES = [
  { title: 'Secure Examinations', desc: 'Anti-cheat proctoring, tab-switch detection, anomaly scoring, and full audit trails.', icon: '' },
  { title: 'Advanced Assessments', desc: 'Secure quizzes, detailed rubrics, comprehensive analytics, and automated grading.', icon: '' },
  { title: 'Real-Time Classrooms', desc: 'WebRTC video, collaborative whiteboard, live polls, and instant Q&A.', icon: '' },
  { title: 'Deep Analytics', desc: 'Student performance, engagement heatmaps, and predictive risk scoring.', icon: '' },
];

export default function HomePage() {
  const { isAuthenticated, user, isLoading, checkAuth } = useAuthStore();
  const [checked, setChecked] = useState(false);
  const [stats, setStats] = useState([
    { value: '...', label: 'Active Students' },
    { value: '...', label: 'Courses' },
    { value: '...', label: 'Institutions' },
    { value: '...', label: 'Uptime' },
  ]);

  const [categories, setCategories] = useState<string[]>(['Computer Science', 'Mathematics']);
  const [systemStatus, setSystemStatus] = useState([
    { name: 'Web Portal Services', status: 'Checking...' },
    { name: 'Database Servers', status: 'Checking...' },
    { name: 'API Nodes', status: 'Checking...' }
  ]);
  const [updates, setUpdates] = useState([
    { title: 'EDYRA v3.0 Released', date: 'Latest', desc: 'Secure exams, interactive classrooms, and multi-tenant structures.' }
  ]);

  useEffect(() => {
    checkAuth().finally(() => setChecked(true));

    api.get('/analytics/public-stats').then(res => {
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        setStats([
          { value: Number(d.students || 0).toLocaleString(), label: 'Active Students' },
          { value: Number(d.courses || 0).toLocaleString(), label: 'Courses' },
          { value: Number(d.institutions || 0).toLocaleString(), label: 'Institutions' },
          { value: (d.uptime || 99.9) + '%', label: 'Uptime' },
        ]);
        if (d.categories && d.categories.length > 0) {
          setCategories(d.categories);
        }
        if (d.status && d.status.length > 0) {
          setSystemStatus(d.status);
        }
        // In a full implementation, updates would come from /api/public-updates. 
        // We will keep a static default for now if it's not provided by the API, but ideally it should be fetched.
      }
    }).catch(err => console.error('Failed to fetch public stats', err));
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const role = user.role as string;
      const dest = ['admin', 'super-admin', 'organization-admin', 'campus-admin'].includes(role)
        ? '/admin/dashboard'
        : ['teacher', 'assistant-teacher', 'invigilator'].includes(role)
          ? '/faculty/dashboard'
          : '/student/dashboard';
      window.location.href = dest;
    }
  }, [isAuthenticated, user]);

  if (!checked || isLoading || (isAuthenticated && user)) {
    return (
      <div className="auth-status-page" style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
        <p className="auth-status-desc" style={{ marginTop: 16 }}>{isAuthenticated ? 'Redirecting to your dashboard...' : 'Loading EDYRA...'}</p>
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
          <Link href="/login" className="lms-btn lms-btn-primary lms-btn-sm" style={{ color: '#fff' }}>Log In</Link>
        </nav>
      </header>

      {/* ── Hero ── */}
      <div className="pub-hero">
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'rgba(249, 128, 18, 0.15)', border: '1px solid rgba(249, 128, 18, 0.3)', borderRadius: 24, padding: '6px 16px', fontSize: 13, fontWeight: 600, color: '#ffb05c', marginBottom: 24, letterSpacing: '0.02em' }}>
             Enterprise Educational Ecosystem v3.0
          </div>
          <h1>
            EDYRA — Modern LMS for <span style={{ color: 'var(--primary)' }}>Every Institution</span>
          </h1>
          <p>
            A complete, secure Learning Management System with online examinations, real-time collaboration, and deep analytics — designed for universities, colleges, and enterprises.
          </p>
          <div className="pub-hero-actions">
            <Link href="/login" className="lms-btn lms-btn-primary lms-btn-lg" style={{ minWidth: 160, color: '#fff' }}>
              Sign In to Portal
            </Link>
            <Link href="/register" className="lms-btn lms-btn-default lms-btn-lg" style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)', color: '#fff', minWidth: 160 }}>
              Register Account
            </Link>
            <Link href="/courses" className="lms-btn lms-btn-default lms-btn-lg" style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)', color: '#fff', minWidth: 160 }}>
              Browse Courses
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats Strip ── */}
      <div className="pub-stats">
        {stats.map(s => (
          <div key={s.label} className="pub-stat-card">
            <div className="pub-stat-value">{s.value}</div>
            <div className="pub-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Main Portal Columns ── */}
      <div className="pub-main" style={{ marginTop: 24 }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Features Widget */}
          <div className="pub-widget">
            <div className="pub-widget-header"> Platform Features</div>
            <div className="pub-widget-body">
              <div className="pub-features" style={{ margin: 0, gap: 16 }}>
                {FEATURES.map(f => (
                  <div key={f.title} className="pub-feature-card" style={{ padding: '20px', minHeight: 'auto' }}>
                    <div className="pub-feature-icon" style={{ width: '48px', height: '48px', lineHeight: '48px', borderRadius: '12px', fontSize: '24px', marginBottom: '12px' }}>
                      {f.icon}
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--nav-bg)', marginBottom: 8 }}>{f.title}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Categories Widget */}
          <div className="pub-widget">
            <div className="pub-widget-header"> Available Course Categories</div>
            <div className="pub-widget-body">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {categories.map(cat => (
                  <Link
                    key={cat}
                    href={`/courses?category=${encodeURIComponent(cat)}`}
                    style={{
                      padding: '6px 14px',
                      border: '1px solid var(--border)',
                      borderRadius: 30,
                      fontSize: 12,
                      color: 'var(--secondary)',
                      background: '#fff',
                      fontWeight: 500,
                    }}
                    className="category-pill"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Security & Compliance Widget */}
          <div className="pub-widget">
            <div className="pub-widget-header"> Security & Compliance</div>
            <div className="pub-widget-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                {[
                  'TOTP 2-Factor Authentication',
                  'OAuth2 (Google & GitHub SSO)',
                  'Device & Browser Fingerprinting',
                  'Brute-Force Login Protection',
                  'Full System Audit Logs',
                  'CSP Security Headers',
                  'NoSQL Injection Prevention',
                  'Real-Time Anomaly Detection'
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f8f9fa', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }}>
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}></span>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar Column */}
        <div className="pub-sidebar-col" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Sign In Widget */}
          <div className="pub-widget">
            <div className="pub-widget-header"> Portal Sign In</div>
            <div className="pub-widget-body">
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                Access your personalized workspace, classes, assignments, and secure examinations.
              </p>
              <Link href="/login" className="lms-btn lms-btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 10, color: '#fff' }}>
                Sign In to Portal
              </Link>
              <Link href="/register" className="lms-btn lms-btn-default" style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}>
                Create Account
              </Link>
              
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--nav-bg)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quick Access links:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Link href="/login?role=student" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '8px 12px', background: 'var(--primary-light)', border: '1px solid rgba(249,128,18,0.2)', borderRadius: 4, color: 'var(--primary-dark)', fontWeight: 600 }}>
                     Student Portal
                  </Link>
                  <Link href="/login?role=teacher" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '8px 12px', background: 'rgba(15,108,191,0.08)', border: '1px solid rgba(15,108,191,0.2)', borderRadius: 4, color: 'var(--secondary-dark)', fontWeight: 600 }}>
                    ‍ Faculty Panel
                  </Link>
                  <Link href="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '8px 12px', background: '#f0f2f4', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)', fontWeight: 600 }}>
                    ️ Admin Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Latest News Widget */}
          <div className="pub-widget">
            <div className="pub-widget-header"> Latest Updates</div>
            <div className="pub-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {updates.map(item => (
                <div key={item.title} style={{ paddingBottom: 10, borderBottom: '1px solid #f0f2f4' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--nav-bg)', marginBottom: 2 }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 4, fontWeight: 500 }}>{item.date}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* System Status Widget */}
          <div className="pub-widget">
            <div className="pub-widget-header"> System Status</div>
            <div className="pub-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {systemStatus.map(({ name, status }) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, paddingBottom: 6, borderBottom: '1px solid #f8f9fa' }}>
                  <span style={{ fontWeight: 500 }}>{name}</span>
                  <span className={`lms-status ${status === 'Operational' ? 'lms-status-active' : 'lms-status-inactive'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>{status}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* ── Footer ── */}
      <footer className="pub-footer" style={{ marginTop: 'auto' }}>
        <div className="pub-footer-section" style={{ flex: '1.5', minWidth: '280px' }}>
          <div className="lms-logo" style={{ marginBottom: 16 }}>
            <div className="lms-logo-icon">E</div>
            <div className="lms-logo-text">EDYRA System</div>
          </div>
          <p style={{ opacity: 0.6, fontSize: 13, maxWidth: 300, color: '#e2e8f0', lineHeight: 1.6 }}>
            The all-in-one platform unifying learning, administration, and secure assessments.
          </p>
        </div>
        <div className="pub-footer-section">
          <h4 className="pub-footer-title">Product</h4>
          <Link href="/features" className="pub-footer-link">Features</Link>
          <Link href="/pricing" className="pub-footer-link">Pricing</Link>
          <Link href="/security" className="pub-footer-link">Security</Link>
        </div>
        <div className="pub-footer-section">
          <h4 className="pub-footer-title">Resources</h4>
          <Link href="/docs" className="pub-footer-link">Documentation</Link>
          <Link href="/help" className="pub-footer-link">Help Center</Link>
          <Link href="/api" className="pub-footer-link">API Reference</Link>
        </div>
      </footer>
    </div>
  );
}
