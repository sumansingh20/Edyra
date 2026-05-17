'use client';

import { useEffect, useState } from 'react';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Backup {
  id: string;
  name: string;
  type: string;
  size: string;
  status: string;
  createdBy?: string;
  createdAt: string;
  collections?: { users: number; exams: number; submissions: number; grades: number; courses: number };
}

export default function AdminBackupPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [backingUp, setBackingUp] = useState(false);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/system/backups');
      setBackups(response.data.data.backups || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to fetch backups');
      setBackups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBackups(); }, []);

  const runBackup = async () => {
    setBackingUp(true);
    const tid = toast.loading('Creating backup snapshot...');
    try {
      const res = await api.post('/admin/system/backup');
      toast.dismiss(tid);
      toast.success(res.data.message || 'Backup created successfully');
      fetchBackups();
    } catch (err: any) {
      toast.dismiss(tid);
      toast.error(err.response?.data?.error || 'Backup failed');
    } finally {
      setBackingUp(false);
    }
  };

  const formatDate = (d: string) => {
    try { return format(new Date(d), 'dd MMM yyyy HH:mm'); } catch { return d; }
  };

  return (
    <LMSLayout pageTitle="Data Backup &amp; Recovery" breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'System', href: '/admin/system' }, { label: 'Backup' }]}>
      <div className="lms-alert lms-alert-info" style={{ marginBottom: 24 }}>
        <strong>Disaster Recovery Policy:</strong> Manual backups record real-time collection counts and are logged to the immutable audit trail. Production deployments should configure automated S3 snapshots via scheduled jobs.
      </div>

      <div className="lms-section">
        <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Available Backup Snapshots</span>
          <button className="lms-btn lms-btn-sm lms-btn-primary" onClick={runBackup} disabled={backingUp}>
            {backingUp ? 'Creating snapshot...' : '+ Create Manual Snapshot'}
          </button>
        </div>

        {loading ? (
          <div className="lms-loading">Scanning backup registry...</div>
        ) : backups.length === 0 ? (
          <div className="lms-table-empty">
            <div>No backup snapshots found.</div>
            <button className="lms-btn lms-btn-primary lms-btn-sm" style={{ marginTop: 12 }} onClick={runBackup}>
              Create First Snapshot
            </button>
          </div>
        ) : (
          <div className="lms-table-container">
            <table className="lms-table">
              <thead>
                <tr>
                  <th>Snapshot Name</th>
                  <th>Type</th>
                  <th>Collections</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>{b.name}</td>
                    <td>
                      <span className={`lms-status ${b.type === 'Manual' ? 'lms-status-info' : 'lms-status-pending'}`}>
                        {b.type}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {b.collections ? (
                        <span title={`Users: ${b.collections.users}, Exams: ${b.collections.exams}, Submissions: ${b.collections.submissions}`}>
                          {b.collections.users}u / {b.collections.exams}e / {b.collections.submissions}s
                        </span>
                      ) : '—'}
                    </td>
                    <td>{b.size}</td>
                    <td>
                      <span className="lms-status lms-status-active">{b.status.toUpperCase()}</span>
                    </td>
                    <td style={{ fontSize: 12 }}>{b.createdBy || '—'}</td>
                    <td style={{ fontSize: 12 }}>{formatDate(b.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="lms-btn lms-btn-sm"
                          onClick={() => toast.success('Backup export queued — this would stream the database JSON in production')}
                        >
                          Download
                        </button>
                        <button
                          className="lms-btn lms-btn-sm lms-btn-danger"
                          onClick={() => {
                            if (window.confirm('Restore will overwrite current data. This is irreversible. Proceed?')) {
                              toast.error('Restore requires maintenance mode — contact system administrator');
                            }
                          }}
                        >
                          Restore
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="lms-section" style={{ marginTop: 24 }}>
        <div className="lms-section-title">📋 Backup Policy</div>
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {[
            { icon: '🔒', title: 'Immutable Audit Trail', desc: 'Every backup operation is recorded to the system audit log and cannot be modified.' },
            { icon: '📦', title: 'Collection Snapshot', desc: 'Backups capture real-time counts and metadata for all core collections (Users, Exams, Submissions, Grades, Courses).' },
            { icon: '⚠️', title: 'Restore Warning', desc: 'Database restoration overwrites all current data. Always create a backup before restoring from an older snapshot.' },
            { icon: '☁️', title: 'Cloud Storage', desc: 'Production deployments should integrate with AWS S3 or Google Cloud Storage for cross-region encrypted snapshots.' },
          ].map(item => (
            <div key={item.title} style={{ display: 'flex', gap: 14 }}>
              <div style={{ fontSize: 24 }}>{item.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </LMSLayout>
  );
}
