'use client';

import { useEffect, useState } from 'react';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';

export default function SystemHealthPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.get('/admin/health');
        setHealth(res.data.data);
      } catch (err) {
        setHealth({ status: 'error', message: 'Could not connect to server' });
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
    
    // Poll every 10 seconds
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <LMSLayout pageTitle="System Health" breadcrumbs={[{ label: 'Admin' }, { label: 'System Health' }]}>
      <div className="lms-section animate-fadeInDown">
        <div className="lms-section-title">
          ️ Server Status
          {health && (
            <span className={`lms-status ${health.status === 'ok' ? 'lms-status-active' : 'lms-status-closed'}`} style={{ marginLeft: 'auto' }}>
              {health.status === 'ok' ? 'Healthy' : 'Critical'}
            </span>
          )}
        </div>
        <div style={{ padding: 24 }}>
          {loading && !health ? (
            <div className="lms-spinner"><div className="spinner" /></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div className="lms-stat-card">
                <div className="lms-stat-label">Uptime</div>
                <div className="lms-stat-value font-mono" style={{ fontSize: 20 }}>
                  {health?.uptime ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : '—'}
                </div>
              </div>
              <div className="lms-stat-card">
                <div className="lms-stat-label">Memory Usage</div>
                <div className="lms-stat-value font-mono" style={{ fontSize: 20 }}>
                  {health?.memoryUsage?.heapUsed ? `${Math.round(health.memoryUsage.heapUsed / 1024 / 1024)} MB` : '—'}
                </div>
              </div>
              <div className="lms-stat-card">
                <div className="lms-stat-label">Database Connection</div>
                <div className="lms-stat-value font-mono" style={{ fontSize: 20 }}>
                  {health?.dbState === 1 ? 'Connected (1)' : health?.dbState ?? '—'}
                </div>
              </div>
              <div className="lms-stat-card">
                <div className="lms-stat-label">Node Version</div>
                <div className="lms-stat-value font-mono" style={{ fontSize: 20 }}>
                  {health?.nodeVersion || '—'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="lms-section animate-fadeInUp">
        <div className="lms-section-title">️ Environment Details</div>
        <div className="lms-table-container">
          <table className="lms-table">
            <tbody>
              <tr><td style={{ width: 200, fontWeight: 600 }}>Environment</td><td>{health?.env || 'production'}</td></tr>
              <tr><td style={{ fontWeight: 600 }}>Timestamp</td><td className="font-mono">{health?.timestamp || new Date().toISOString()}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </LMSLayout>
  );
}
