'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please check the email address and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <header className="pub-header">
        <Link href="/" className="lms-logo">
          <div className="lms-logo-icon">E</div>
          <div>
            <div className="lms-logo-text">EDYRA</div>
            <div className="lms-logo-subtitle">Learning Management System</div>
          </div>
        </Link>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--nav-bg)' }}>Reset Password</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>EDYRA — Learning Management System</div>
          </div>

          <div className="login-card">
            <div className="login-card-header">
              <h2>Forgot your password?</h2>
              <p>Enter your registered email to receive a reset link</p>
            </div>

            <div className="login-form-body">
              {submitted ? (
                <div className="lms-alert lms-alert-success">
                  <div>
                    <div className="lms-alert-title">Reset Email Sent</div>
                    <div>If that email is registered, you will receive a password reset link within a few minutes. Check your spam folder if you don't see it.</div>
                    <div style={{ marginTop: 12 }}>
                      <Link href="/login" className="lms-btn lms-btn-primary lms-btn-sm">Return to Login</Link>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="lms-alert lms-alert-error" style={{ marginBottom: 14 }}>
                      <div>{error}</div>
                    </div>
                  )}
                  <div className="lms-form-group">
                    <label className="lms-label" htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      className="lms-input"
                      type="email"
                      placeholder="you@institution.edu"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                    <div className="lms-help-text">Enter the email address associated with your EDYRA account</div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="lms-btn lms-btn-primary lms-btn-lg"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {submitting ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  <div className="login-notice" style={{ marginTop: 14 }}>
                    <strong>Note:</strong> Students using DOB-based login cannot reset passwords here. Contact your administrator.
                  </div>
                </form>
              )}
            </div>

            <div className="login-card-footer">
              <Link href="/login">Back to Login</Link>
              <span>·</span>
              <Link href="/help">Help</Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="pub-footer">
        <div>© {new Date().getFullYear()} EDYRA — Learning Management System</div>
      </footer>
    </div>
  );
}
