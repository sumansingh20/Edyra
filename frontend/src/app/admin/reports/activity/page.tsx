'use client';

import { useEffect, useState, useCallback } from 'react';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface AuditEntry {
  _id: string;
  action: string;
  userEmail: string;
  userRole: string;
  targetType: string;
  ipAddress?: string;
  status: string;
  createdAt: string;
  details?: string;
}

const ACTION_COLORS: Record<string, string> = {
  login: 'lms-status-active',
  logout: '',
  'exam-create': 'lms-status-info',
  'exam-update': 'lms-status-pending',
  'exam-delete': 'lms-status-closed',
  'exam-publish': 'lms-status-active',
  'exam-activate': 'lms-status-active',
  'grade-change': 'lms-status-info',
  'user-create': 'lms-status-info',
  'user-delete': 'lms-status-closed',
  'user-update': 'lms-status-pending',
  'submission': 'lms-status-active',
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PER_PAGE = 50;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { limit: PER_PAGE, page };
      if (actionFilter) params.action = actionFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const r = await api.get('/admin/audit-logs', { params });
      const data = r.data?.data;
      setLogs(data?.logs || data || []);
      setTotal(data?.total || 0);
    } catch (err: any) {
      toast.error('Failed to load audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const exportCSV = () => {
    const headers = ['Timestamp', 'Action', 'User', 'Role', 'Target', 'IP', 'Status'];
    const rows = logs.map(l => [
      l.createdAt ? format(new Date(l.createdAt), 'dd/MM/yyyy HH:mm:ss') : '',
      l.action, l.userEmail, l.userRole, l.targetType, l.ipAddress || '', l.status
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast.success('Audit log exported');
  };

  const filtered = logs.filter(l =>
    !search ||
    l.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.targetType?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <LMSLayout pageTitle="Audit Logs" breadcrumbs={[{ label: 'Administration' }, { label: 'Reports', href: '/admin/reports' }, { label: 'Audit Logs' }]}>

      {/* Stats */}
      <div className="lms-stats-row">
        <div className="lms-stat">
          <div className="lms-stat-value">{total || filtered.length}</div>
          <div className="lms-stat-label">Total Entries</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--danger)' }}>
            {filtered.filter(l => l.action?.includes('delete')).length}
          </div>
          <div className="lms-stat-label">Delete Events</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--success)' }}>
            {filtered.filter(l => l.action?.includes('login')).length}
          </div>
          <div className="lms-stat-label">Login Events</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--warning)' }}>
            {filtered.filter(l => l.status === 'failed').length}
          </div>
          <div className="lms-stat-label">Failed Events</div>
        </div>
      </div>

      {/* Filters */}
      <div className="lms-section">
        <div className="lms-section-title">Filter Audit Log</div>
        <div className="lms-filter-bar" style={{ padding: '12px 16px' }}>
          <div className="lms-form-group" style={{ margin: 0, flex: '1 1 220px' }}>
            <label className="lms-label">Search</label>
            <input className="lms-input" placeholder="User email, action, target..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="lms-form-group" style={{ margin: 0, width: 180 }}>
            <label className="lms-label">Action Type</label>
            <select className="lms-select" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}>
              <option value="">All Actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="exam-create">Exam Create</option>
              <option value="exam-publish">Exam Publish</option>
              <option value="exam-delete">Exam Delete</option>
              <option value="user-create">User Create</option>
              <option value="user-delete">User Delete</option>
              <option value="grade-change">Grade Change</option>
              <option value="submission">Submission</option>
              <option value="semester-create">Semester Create</option>
              <option value="semester-activate">Semester Activate</option>
            </select>
          </div>
          <div className="lms-form-group" style={{ margin: 0, width: 150 }}>
            <label className="lms-label">From Date</label>
            <input className="lms-input" type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
          </div>
          <div className="lms-form-group" style={{ margin: 0, width: 150 }}>
            <label className="lms-label">To Date</label>
            <input className="lms-input" type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
            <button className="lms-btn" onClick={() => { setSearch(''); setActionFilter(''); setDateFrom(''); setDateTo(''); setPage(1); }}>Clear</button>
            <button className="lms-btn lms-btn-default" onClick={exportCSV}>Export CSV</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="lms-section">
        <div className="lms-section-title">Log Entries</div>
        {loading ? (
          <div className="lms-loading">Loading audit logs...</div>
        ) : filtered.length === 0 ? (
          <div className="lms-table-empty empty-state-animated">
            <div className="empty-icon" />
            <div>No audit log entries found for the selected filters.</div>
          </div>
        ) : (
          <>
            <div className="lms-table-container">
              <table className="lms-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Target</th>
                    <th>IP Address</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(log => (
                    <tr key={log._id}>
                      <td className="font-mono" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                        {log.createdAt ? format(new Date(log.createdAt), 'dd/MM/yy HH:mm:ss') : '-'}
                      </td>
                      <td style={{ fontWeight: 500, fontSize: 13 }}>{log.action}</td>
                      <td style={{ fontSize: 12 }}>{log.userEmail || '-'}</td>
                      <td>
                        <span className="lms-status lms-status-info" style={{ fontSize: 10 }}>
                          {log.userRole || '-'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12 }}>{log.targetType || '-'}</td>
                      <td className="font-mono" style={{ fontSize: 11 }}>{log.ipAddress || '-'}</td>
                      <td>
                        <span className={`lms-status ${ACTION_COLORS[log.action] || (log.status === 'failed' ? 'lms-status-closed' : '')} `} style={{ fontSize: 10 }}>
                          {log.status?.toUpperCase() || 'OK'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lms-pagination">
              <div>Showing {filtered.length} entries (page {page})</div>
              <div className="lms-pagination-btns">
                <button className="lms-pagination-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <button className="lms-pagination-btn active">{page}</button>
                <button className="lms-pagination-btn" disabled={logs.length < PER_PAGE} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>
    </LMSLayout>
  );
}
