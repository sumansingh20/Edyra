'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import LMSLayout from '@/components/layouts/LMSLayout';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function StudentProfilePage() {
  const { user, checkAuth } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: (user as any).phoneNumber || '',
      });
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/auth/profile', formData);
      await checkAuth();
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <LMSLayout pageTitle="My Profile" breadcrumbs={[{ label: 'Dashboard', href: '/student/dashboard' }, { label: 'Profile' }]}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Left Col - Avatar & Basics */}
        <div className="lms-main-col">
          <div className="lms-section" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--primary)', color: '#fff', fontSize: 48, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <h2 style={{ margin: '0 0 4px' }}>{user?.firstName} {user?.lastName}</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Student ID: {user?.studentId || 'N/A'}</div>
            <div style={{ marginTop: 20 }}>
              <span className="lms-status lms-status-active">Active Student</span>
            </div>
          </div>

          <div className="lms-section" style={{ marginTop: 24 }}>
            <div className="lms-section-title">Academic Info</div>
            <div style={{ padding: 20 }}>
              <div className="lms-info-row" style={{ marginBottom: 16 }}>
                <div className="lms-info-label" style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department</div>
                <div className="lms-info-value" style={{ fontWeight: 600 }}>School of Computer Science</div>
              </div>
              <div className="lms-info-row" style={{ marginBottom: 16 }}>
                <div className="lms-info-label" style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Joined</div>
                <div className="lms-info-value" style={{ fontWeight: 600 }}>August 2023</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col - Detailed Form */}
        <div className="lms-main-col">
          <div className="lms-section">
            <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Personal Information</span>
              <button className="lms-btn lms-btn-sm" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit Profile'}</button>
            </div>
            <div style={{ padding: 24 }}>
              <form onSubmit={handleUpdate}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div className="lms-form-group">
                    <label className="lms-label">First Name</label>
                    <input className="lms-input" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} disabled={!editing} />
                  </div>
                  <div className="lms-form-group">
                    <label className="lms-label">Last Name</label>
                    <input className="lms-input" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} disabled={!editing} />
                  </div>
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Email Address</label>
                  <input className="lms-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={!editing} />
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Phone Number</label>
                  <input className="lms-input" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} disabled={!editing} />
                </div>

                {editing && (
                  <div style={{ marginTop: 20 }}>
                    <button type="submit" className="lms-btn lms-btn-primary">Save Changes</button>
                  </div>
                )}
              </form>
            </div>
          </div>

          <div className="lms-section" style={{ marginTop: 24 }}>
            <div className="lms-section-title">Account Security</div>
            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Update your password to keep your account secure.</p>
              <Link href="/forgot-password" style={{ color: 'var(--primary)', fontWeight: 600 }}>Change Password →</Link>
            </div>
          </div>
        </div>
      </div>
    </LMSLayout>
  );
}
