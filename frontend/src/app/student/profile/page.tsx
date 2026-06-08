'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import LMSLayout from '@/components/layouts/LMSLayout';
import { useAuthStore } from '@/store/authStore';

type ProfileTab = 'personal' | 'security' | 'preferences';

export default function ProfilePage() {
  const { user, checkAuth } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    bio: '', department: '', studentId: '', employeeId: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [changingPwd, setChangingPwd] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      const u = res.data?.data || res.data?.user || res.data;
      setProfile(u);
      setForm({
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        email: u.email || '',
        phone: u.phone || '',
        bio: u.bio || '',
        department: u.department || '',
        studentId: u.studentId || '',
        employeeId: u.employeeId || '',
      });
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/auth/profile', form);
      await checkAuth();
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally { setSaving(false); }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setChangingPwd(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setSuccess('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password.');
    } finally { setChangingPwd(false); }
  };

  const currentUser = profile || user;
  const initials = `${currentUser?.firstName?.[0] || ''}${currentUser?.lastName?.[0] || ''}`.toUpperCase();

  if (loading) {
    return (
      <LMSLayout pageTitle="My Profile">
        <div className="lms-spinner"><div className="spinner" /><span>Loading profile...</span></div>
      </LMSLayout>
    );
  }

  return (
    <LMSLayout pageTitle="My Profile" breadcrumbs={[{ label: 'Profile' }]}>
      {/* Profile Header */}
      <div style={{
        background: 'var(--grad-nav)', color: '#fff',
        borderRadius: 'var(--radius-lg)', padding: '24px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
      }} className="animate-fadeInDown">
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--primary)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 24, flexShrink: 0,
          border: '3px solid rgba(255,255,255,0.3)',
        }}>
          {initials || '?'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
            {currentUser?.firstName} {currentUser?.lastName}
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>
            {currentUser?.email} · <span style={{ textTransform: 'capitalize' }}>{currentUser?.role}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {currentUser?.studentId && (
              <span className="lms-status lms-status-info" style={{ fontSize: 10 }}>ID: {currentUser.studentId}</span>
            )}
            {currentUser?.department && (
              <span className="lms-status lms-status-pending" style={{ fontSize: 10 }}>️ {currentUser.department}</span>
            )}
            {currentUser?.isEmailVerified && (
              <span className="lms-status lms-status-active" style={{ fontSize: 10 }}> Verified</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="lms-tabs">
        {(['personal', 'security', 'preferences'] as ProfileTab[]).map(t => (
          <button key={t} className={`lms-tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'personal' ? ' Personal Info' : t === 'security' ? ' Security' : '️ Preferences'}
          </button>
        ))}
      </div>

      {error && (
        <div className="lms-alert lms-alert-error animate-fadeIn" style={{ marginBottom: 16 }}>
          <div>{error}</div>
        </div>
      )}
      {success && (
        <div className="lms-alert lms-alert-success animate-fadeIn" style={{ marginBottom: 16 }}>
          <div>{success}</div>
        </div>
      )}

      {/* Personal Info Tab */}
      {activeTab === 'personal' && (
        <div style={{ maxWidth: 640 }}>
          <form onSubmit={saveProfile} className="lms-section">
            <div className="lms-section-title"> Personal Information</div>
            <div style={{ padding: 20 }}>
              <div className="lms-form-row">
                <div className="lms-form-group">
                  <label className="lms-label">First Name *</label>
                  <input required className="lms-input" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Last Name *</label>
                  <input required className="lms-input" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                </div>
              </div>
              <div className="lms-form-group">
                <label className="lms-label">Email Address</label>
                <input type="email" className="lms-input" value={form.email} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                <div className="lms-help-text">Email cannot be changed. Contact admin to update.</div>
              </div>
              <div className="lms-form-row">
                <div className="lms-form-group">
                  <label className="lms-label">Phone Number</label>
                  <input className="lms-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 9876543210" />
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Department</label>
                  <input className="lms-input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
                </div>
              </div>
              {currentUser?.role === 'student' && (
                <div className="lms-form-group">
                  <label className="lms-label">Student ID</label>
                  <input className="lms-input" value={form.studentId} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                </div>
              )}
              <div className="lms-form-group">
                <label className="lms-label">Bio / About Me</label>
                <textarea
                  className="lms-textarea"
                  rows={4}
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Write a brief about yourself..."
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="submit" disabled={saving} className="lms-btn lms-btn-primary">
                  {saving ? ' Saving...' : ' Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div style={{ maxWidth: 480 }}>
          <form onSubmit={changePassword} className="lms-section">
            <div className="lms-section-title"> Change Password</div>
            <div style={{ padding: 20 }}>
              <div className="lms-form-group">
                <label className="lms-label">Current Password *</label>
                <input required type="password" className="lms-input" value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))} />
              </div>
              <div className="lms-form-group">
                <label className="lms-label">New Password *</label>
                <input required type="password" className="lms-input" value={passwordForm.newPassword}
                  onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                  placeholder="Min. 8 characters" />
              </div>
              <div className="lms-form-group">
                <label className="lms-label">Confirm New Password *</label>
                <input required type="password" className="lms-input" value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))} />
              </div>

              {/* Password strength indicator */}
              {passwordForm.newPassword && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Password Strength</div>
                  <div className="lms-progress" style={{ height: 6 }}>
                    <div
                      className="lms-progress-bar"
                      style={{
                        width: `${Math.min(passwordForm.newPassword.length * 8, 100)}%`,
                        background: passwordForm.newPassword.length < 8 ? 'var(--danger)' : passwordForm.newPassword.length < 12 ? 'var(--warning)' : 'var(--success)',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {passwordForm.newPassword.length < 8 ? 'Weak' : passwordForm.newPassword.length < 12 ? 'Good' : 'Strong'}
                  </div>
                </div>
              )}

              <button type="submit" disabled={changingPwd} className="lms-btn lms-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {changingPwd ? ' Changing...' : ' Change Password'}
              </button>
            </div>
          </form>

          {/* 2FA Section */}
          <div className="lms-section">
            <div className="lms-section-title">️ Two-Factor Authentication</div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>TOTP Authentication</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Add an extra layer of security with authenticator apps (Google Authenticator, Authy).
                  </div>
                </div>
                <span className="lms-status lms-status-pending" style={{ flexShrink: 0 }}>
                  {currentUser?.twoFactorEnabled ? ' Enabled' : 'Disabled'}
                </span>
              </div>
              {!currentUser?.twoFactorEnabled && (
                <a href="/settings/2fa" className="lms-btn lms-btn-default lms-btn-sm" style={{ marginTop: 12 }}>
                  Enable 2FA →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div style={{ maxWidth: 480 }}>
          <div className="lms-section">
            <div className="lms-section-title"> Display Preferences</div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Theme</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Choose light or dark mode</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['light', 'dark'].map(theme => (
                    <button
                      key={theme}
                      onClick={() => document.documentElement.setAttribute('data-theme', theme)}
                      className="lms-btn lms-btn-sm"
                      style={{ textTransform: 'capitalize' }}
                    >
                      {theme === 'light' ? '️' : ''} {theme}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Email Notifications</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Receive emails for assignments, grades, exams</div>
                </div>
                <label className="lms-check-item">
                  <input type="checkbox" defaultChecked />
                  <span>Enabled</span>
                </label>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="lms-section">
            <div className="lms-section-title">️ Account Information</div>
            <div style={{ padding: 16, fontSize: 13 }}>
              {[
                { label: 'Account Created', value: currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                { label: 'Last Login', value: currentUser?.lastLogin ? new Date(currentUser.lastLogin).toLocaleString('en-IN') : 'N/A' },
                { label: 'Role', value: currentUser?.role },
                { label: 'Email Verified', value: currentUser?.isEmailVerified ? ' Yes' : ' No' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                  <span style={{ fontWeight: 500 }}>{item.value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </LMSLayout>
  );
}
