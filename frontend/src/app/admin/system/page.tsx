'use client';

import { useEffect, useState, useCallback } from 'react';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface HealthData {
  api: { status: string; version: string; environment: string };
  database: { status: string; latency: string; name: string };
  memory: { heapUsed: number; heapTotal: number; rss: number; systemTotal: number; systemFree: number; systemUsedPct: number };
  uptime: { seconds: number; formatted: string };
  load: { avg1: string; avg5: string; avg15: string };
  node: { version: string; platform: string; arch: string };
  timestamp: string;
}

interface AuditFinding { level: string; message: string; }

export default function AdminSystemPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [auditFindings, setAuditFindings] = useState<AuditFinding[]>([]);

  const fetchHealth = useCallback(async () => {
    try {
      const response = await api.get('/admin/system/health');
      setHealth(response.data.data);
    } catch (err) {
      console.error('Failed to fetch system health:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, 15000);
    return () => clearInterval(id);
  }, [fetchHealth]);

  const handleAction = async (actionKey: string, endpoint: string, method: 'post' | 'get' = 'post', label: string) => {
    setActionLoading(actionKey);
    const tid = toast.loading(`${label}...`);
    try {
      const res = await (method === 'post' ? api.post(endpoint) : api.get(endpoint));
      toast.dismiss(tid);

      if (actionKey === 'audit') {
        const findings: AuditFinding[] = res.data.data?.findings || [];
        setAuditFindings(findings);
        toast.success(`Security audit complete — ${findings.length} finding(s)`);
      } else if (actionKey === 'gpa') {
        toast.success(`GPA recalculation complete — ${res.data.data?.studentsProcessed || 0} students processed`);
      } else {
        toast.success(res.data.message || `${label} completed`);
      }

      if (actionKey === 'cache') fetchHealth();
    } catch (err: any) {
      toast.dismiss(tid);
      toast.error(err.response?.data?.error || `${label} failed`);
    } finally {
      setActionLoading(null);
    }
  };

  const dbOk = health?.database?.status === 'connected';
  const apiOk = health?.api?.status === 'operational';
  const memPct = health?.memory?.systemUsedPct ?? 0;

  return (
    <LMSLayout pageTitle="System Administration" breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'System' }]}>

      {/* Health grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 24 }}>

        {/* API */}
        <div className="lms-section">
          <div className="lms-section-title">API Server Status</div>
          <div style={{ padding: 24, textAlign: 'center' }}>
            {loading ? <div className="lms-loading">Checking...</div> : (
              <>
                <div style={{ fontSize: 48, marginBottom: 10 }}>{apiOk ? '🟢' : '🔴'}</div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{apiOk ? 'Operational' : 'Degraded'}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Version: {health?.api?.version}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  <span className={`lms-status ${health?.api?.environment === 'production' ? 'lms-status-active' : 'lms-status-pending'}`}>
                    {health?.api?.environment?.toUpperCase()}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Database */}
        <div className="lms-section">
          <div className="lms-section-title">Database &amp; Storage</div>
          <div style={{ padding: 24 }}>
            <div className="lms-info-row" style={{ marginBottom: 14 }}>
              <div className="lms-info-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>MongoDB Status</div>
              <div className="lms-info-value">
                <span className={`lms-status ${dbOk ? 'lms-status-active' : 'lms-status-closed'}`}>
                  {dbOk ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>
            </div>
            <div className="lms-info-row" style={{ marginBottom: 14 }}>
              <div className="lms-info-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>DB Latency</div>
              <div className="lms-info-value" style={{ fontWeight: 600 }}>{health?.database?.latency || 'N/A'}</div>
            </div>
            <div className="lms-info-row" style={{ marginBottom: 14 }}>
              <div className="lms-info-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Database Name</div>
              <div className="lms-info-value" style={{ fontFamily: 'monospace', fontSize: 12 }}>{health?.database?.name || 'N/A'}</div>
            </div>
            <div className="lms-info-row">
              <div className="lms-info-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>System Memory</div>
              <div className="lms-info-value">
                <div className="lms-progress" style={{ marginTop: 4 }}>
                  <div className={`lms-progress-bar ${memPct > 85 ? 'red' : memPct > 70 ? 'orange' : 'green'}`} style={{ width: `${memPct}%` }} />
                </div>
                <div style={{ fontSize: 11, marginTop: 4 }}>{memPct}% used ({health?.memory?.systemFree} MB free)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Node Environment */}
        <div className="lms-section">
          <div className="lms-section-title">Runtime Environment</div>
          <div style={{ padding: 24 }}>
            <div className="lms-info-row" style={{ marginBottom: 14 }}>
              <div className="lms-info-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Node.js</div>
              <div className="lms-info-value" style={{ fontFamily: 'monospace' }}>{health?.node?.version || 'N/A'}</div>
            </div>
            <div className="lms-info-row" style={{ marginBottom: 14 }}>
              <div className="lms-info-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Platform</div>
              <div className="lms-info-value" style={{ textTransform: 'capitalize' }}>{health?.node?.platform} ({health?.node?.arch})</div>
            </div>
            <div className="lms-info-row" style={{ marginBottom: 14 }}>
              <div className="lms-info-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Server Uptime</div>
              <div className="lms-info-value" style={{ fontWeight: 600 }}>{health?.uptime?.formatted || 'N/A'}</div>
            </div>
            <div className="lms-info-row">
              <div className="lms-info-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Load Average</div>
              <div className="lms-info-value" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                {health?.load?.avg1} / {health?.load?.avg5} / {health?.load?.avg15}
              </div>
            </div>
          </div>
        </div>

        {/* Heap Memory */}
        <div className="lms-section">
          <div className="lms-section-title">Process Memory (Heap)</div>
          <div style={{ padding: 24 }}>
            <div className="lms-info-row" style={{ marginBottom: 14 }}>
              <div className="lms-info-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Heap Used</div>
              <div className="lms-info-value" style={{ fontWeight: 600 }}>{health?.memory?.heapUsed} MB</div>
            </div>
            <div className="lms-info-row" style={{ marginBottom: 14 }}>
              <div className="lms-info-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Heap Total</div>
              <div className="lms-info-value">{health?.memory?.heapTotal} MB</div>
            </div>
            <div className="lms-info-row" style={{ marginBottom: 14 }}>
              <div className="lms-info-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>RSS</div>
              <div className="lms-info-value">{health?.memory?.rss} MB</div>
            </div>
            {health && (
              <div className="lms-progress" style={{ marginTop: 4 }}>
                <div className="lms-progress-bar blue" style={{ width: `${Math.round((health.memory.heapUsed / health.memory.heapTotal) * 100)}%` }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Actions — all wired to real endpoints */}
      <div className="lms-section">
        <div className="lms-section-title">⚙️ Administrative Actions</div>
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <button
            id="btn-clear-cache"
            className="lms-btn"
            disabled={actionLoading === 'cache'}
            onClick={() => handleAction('cache', '/admin/system/cache/clear', 'post', 'Clearing system cache')}
          >
            {actionLoading === 'cache' ? 'Clearing...' : '🗑️ Clear System Cache'}
          </button>

          <button
            id="btn-recalc-gpa"
            className="lms-btn"
            disabled={actionLoading === 'gpa'}
            onClick={() => handleAction('gpa', '/admin/system/gpa/recalculate', 'post', 'Recalculating GPAs')}
          >
            {actionLoading === 'gpa' ? 'Processing...' : '🎓 Recalculate All GPAs'}
          </button>

          <button
            id="btn-sync-org"
            className="lms-btn"
            disabled={actionLoading === 'sync'}
            onClick={() => handleAction('sync', '/admin/system/sync', 'post', 'Syncing organization data')}
          >
            {actionLoading === 'sync' ? 'Syncing...' : '🔄 Sync Organization Data'}
          </button>

          <button
            id="btn-security-audit"
            className="lms-btn"
            disabled={actionLoading === 'audit'}
            onClick={() => handleAction('audit', '/admin/system/audit/run', 'post', 'Running security audit')}
          >
            {actionLoading === 'audit' ? 'Auditing...' : '🔒 Trigger Security Audit'}
          </button>

          <button
            id="btn-create-backup"
            className="lms-btn lms-btn-primary"
            disabled={actionLoading === 'backup'}
            onClick={() => handleAction('backup', '/admin/system/backup', 'post', 'Creating backup snapshot')}
          >
            {actionLoading === 'backup' ? 'Backing up...' : '💾 Create Backup Snapshot'}
          </button>

          <button
            id="btn-refresh-health"
            className="lms-btn"
            disabled={loading}
            onClick={fetchHealth}
          >
            {loading ? 'Refreshing...' : '🔃 Refresh Health Status'}
          </button>
        </div>
      </div>

      {/* Security Audit Results */}
      {auditFindings.length > 0 && (
        <div className="lms-section" style={{ marginTop: 24 }}>
          <div className="lms-section-title">🔒 Security Audit Results</div>
          <div style={{ padding: 24 }}>
            {auditFindings.map((f, i) => (
              <div
                key={i}
                className={`lms-alert ${f.level === 'warning' ? 'lms-alert-warning' : f.level === 'ok' ? 'lms-alert-success' : 'lms-alert-info'}`}
                style={{ marginBottom: 10 }}
              >
                {f.level === 'warning' ? '⚠️' : f.level === 'ok' ? '✅' : 'ℹ️'} {f.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {health && (
        <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
          Last health check: {new Date(health.timestamp).toLocaleString()}
        </div>
      )}
    </LMSLayout>
  );
}
