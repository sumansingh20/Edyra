'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

const ADMIN_ROLES = ['admin','super-admin','organization-admin','campus-admin'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    checkAuth().catch(console.error).finally(() => { if (!cancelled) setChecked(true); });
    return () => { cancelled = true; };
  }, [checkAuth]);

  if (!checked) {
    return (
      <div className="auth-status-page">
        <div className="spinner" />
        <p className="auth-status-desc">Loading administration panel...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-status-page">
        <h1 className="auth-status-title error">Session Expired</h1>
        <p className="auth-status-desc">Please sign in to access the administration panel.</p>
        <a href="/login" className="auth-status-btn">Sign In</a>
      </div>
    );
  }

  if (!ADMIN_ROLES.includes(user?.role || '')) {
    return (
      <div className="auth-status-page">
        <h1 className="auth-status-title" style={{ color: 'var(--warning)' }}>Access Denied</h1>
        <p className="auth-status-desc">You do not have permission to access the administration area.</p>
        <a href={user?.role === 'teacher' ? '/teacher' : '/my'} className="auth-status-btn">Go to My Dashboard</a>
      </div>
    );
  }

  return <>{children}</>;
}
