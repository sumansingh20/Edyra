'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

type Mode = 'student' | 'staff';

export default function LoginPage() {
  const { login, dobLogin } = useAuthStore();
  const [mode, setMode] = useState<Mode>('student');
  const [staffForm, setStaffForm] = useState({ email: '', password: '' });
  const [studentForm, setStudentForm] = useState({ studentId: '', dob: '' });
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [serverTime, setServerTime] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const tickTime = useCallback(() => {
    setServerTime(new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
  }, []);

  useEffect(() => {
    if (!mounted) return;
    tickTime();
    const t = setInterval(tickTime, 1000);
    return () => clearInterval(t);
  }, [mounted, tickTime]);

  const handleStaff = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess(''); setSubmitting(true);
    try {
      const r = await login(staffForm.email, staffForm.password);
      if (r.success && r.user) {
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          if (['admin','super-admin','organization-admin','campus-admin'].includes(r.user!.role)) window.location.href = '/admin/dashboard';
          else if (['teacher','assistant-teacher','invigilator'].includes(r.user!.role)) window.location.href = '/faculty/dashboard';
          else window.location.href = '/student/dashboard';
        }, 400);
      } else { setError(r.error || 'Invalid credentials. Please try again.'); setSubmitting(false); }
    } catch (err: any) { setError(err.message || 'Login failed.'); setSubmitting(false); }
  };

  const handleStudent = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('');
    const dob = studentForm.dob.replace(/\D/g, '');
    if (dob.length !== 8) { setError('Please enter DOB in DDMMYYYY format (e.g., 01012000).'); return; }
    setSubmitting(true);
    try {
      const r = await dobLogin(studentForm.studentId, dob);
      if (r.success) { setSuccess('Login successful! Redirecting...'); setTimeout(() => { window.location.href = '/student/dashboard'; }, 400); }
      else { setError(r.error || 'Invalid Student ID or Date of Birth.'); setSubmitting(false); }
    } catch (err: any) { setError(err.message || 'Login failed.'); setSubmitting(false); }
  };

  if (!mounted) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}><div className="spinner" /></div>;
  }

  return (
    <div className="login-page">
      {/* Header */}
      <header className="pub-header">
        <Link href="/" className="lms-logo">
          <div className="lms-logo-icon">E</div>
          <div>
            <div className="lms-logo-text">EDYRA</div>
            <div className="lms-logo-subtitle">Learning Management System</div>
          </div>
        </Link>
        <div className="lms-header-time">{serverTime}</div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Moodle-style site name above card */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--nav-bg)' }}>EDYRA Portal</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Enterprise Learning Management System
            </div>
          </div>

          <div className="login-card">
            <div className="login-card-header">
              <h2>Sign in</h2>
              <p>Use your institutional credentials to continue</p>
            </div>

            {/* Tabs */}
            <div className="login-tabs">
              <button className={`login-tab${mode === 'student' ? ' active' : ''}`} onClick={() => { setMode('student'); setError(''); setSuccess(''); }}>
                🎓 Student
              </button>
              <button className={`login-tab${mode === 'staff' ? ' active' : ''}`} onClick={() => { setMode('staff'); setError(''); setSuccess(''); }}>
                👤 Staff / Admin
              </button>
            </div>

            <div className="login-form-body">
              {success && (
                <div className="lms-alert lms-alert-success" style={{ marginBottom: 14 }}>
                  <div>{success}</div>
                </div>
              )}
              {error && (
                <div className="lms-alert lms-alert-error" style={{ marginBottom: 14 }}>
                  <div>{error}</div>
                </div>
              )}

              {/* Student form */}
              {mode === 'student' && (
                <form onSubmit={handleStudent}>
                  <div className="lms-form-group">
                    <label className="lms-label" htmlFor="studentId">Student ID / Roll Number</label>
                    <input id="studentId" className="lms-input" type="text" placeholder="e.g., EDY2024001" required autoComplete="username"
                      value={studentForm.studentId} onChange={e => setStudentForm({ ...studentForm, studentId: e.target.value })} />
                    <div className="lms-help-text">Enter the Student ID provided by your institution</div>
                  </div>
                  <div className="lms-form-group">
                    <label className="lms-label" htmlFor="dob">Date of Birth</label>
                    <input id="dob" className="lms-input" type="text" placeholder="DDMMYYYY" required maxLength={8} autoComplete="bday"
                      style={{ fontFamily: 'monospace', letterSpacing: '2px' }}
                      value={studentForm.dob}
                      onChange={e => setStudentForm({ ...studentForm, dob: e.target.value.replace(/\D/g, '').slice(0, 8) })} />
                    <div className="lms-help-text">Format: DDMMYYYY — e.g., 01-Jan-2000 → <code>01012000</code></div>
                  </div>
                  <button type="submit" disabled={submitting} className="lms-btn lms-btn-primary lms-btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                    {submitting ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>
              )}

              {/* Staff form */}
              {mode === 'staff' && (
                <form onSubmit={handleStaff}>
                  <div className="lms-form-group">
                    <label className="lms-label" htmlFor="email">Email Address</label>
                    <input id="email" className="lms-input" type="email" placeholder="you@institution.edu" required autoComplete="email"
                      value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} />
                  </div>
                  <div className="lms-form-group">
                    <label className="lms-label" htmlFor="password">Password</label>
                    <div style={{ position: 'relative' }}>
                      <input id="password" className="lms-input" type={showPw ? 'text' : 'password'} placeholder="Enter your password" required autoComplete="current-password"
                        style={{ paddingRight: 48 }}
                        value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} />
                      <button type="button" onClick={() => setShowPw(p => !p)} tabIndex={-1}
                        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', padding: '4px 6px' }}>
                        {showPw ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: 4 }}>
                      <Link href="/forgot-password" style={{ fontSize: 12, color: 'var(--secondary)' }}>Forgot password?</Link>
                    </div>
                  </div>
                  <button type="submit" disabled={submitting} className="lms-btn lms-btn-primary lms-btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                    {submitting ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>
              )}

              {/* Security notice */}
              <div className="login-notice" style={{ marginTop: 14 }}>
                <strong>Notice:</strong>{' '}
                {mode === 'student'
                  ? 'Student login is enabled during scheduled examination windows only. All access attempts are logged.'
                  : 'This is a secured administration system. All activities are monitored and logged.'}
              </div>
            </div>

            <div className="login-card-footer">
              <Link href="/register">Create account</Link>
              <span>·</span>
              <Link href="/help">Help</Link>
              <span>·</span>
              <Link href="/">Home</Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="pub-footer">
        <div>© {new Date().getFullYear()} EDYRA — Learning Management System</div>
        <div style={{ fontFamily: 'monospace', fontSize: 11 }}>{serverTime}</div>
      </footer>
    </div>
  );
}
