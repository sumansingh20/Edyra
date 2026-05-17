'use client';

import { useEffect, useState } from 'react';
import LMSLayout from '@/components/layouts/LMSLayout';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

import { Suspense } from 'react';

function FacultyProfileContent() {
  const { user, checkAuth } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: (user as any)?.phone || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: (user as any).phone || '',
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
    <LMSLayout pageTitle="Faculty Profile" breadcrumbs={[{ label: 'Dashboard', href: '/faculty/dashboard' }, { label: 'Profile' }]}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        <div className="lms-main-col">
          <div className="lms-section" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--secondary)', color: '#fff', fontSize: 48, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <h2 style={{ margin: '0 0 4px' }}>{user?.firstName} {user?.lastName}</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Faculty ID: {user?.employeeId || 'N/A'}</div>
            <div style={{ marginTop: 20 }}>
              <span className="lms-status lms-status-active">Active Faculty</span>
            </div>
          </div>
        </div>

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
                  <input className="lms-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} disabled={!editing} />
                </div>
                {editing && <button type="submit" className="lms-btn lms-btn-primary">Save Changes</button>}
              </form>
            </div>
          </div>
        </div>
      </div>
    </LMSLayout>
  );
}

export default function FacultyProfilePage() {
  return (
    <Suspense fallback={<div className="lms-loading">Loading...</div>}>
      <FacultyProfileContent />
    </Suspense>
  );
}
