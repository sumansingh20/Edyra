'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import LMSLayout from '@/components/layouts/LMSLayout';
import { format } from 'date-fns';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: number;
  courseId?: any;
  submitted?: boolean;
  submission?: any;
  allowLate?: boolean;
  status?: string;
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'overdue'>('all');
  const [search, setSearch] = useState('');

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/assignments', { params: { limit: 50 } });
      const raw = res.data?.data || [];
      setAssignments(Array.isArray(raw) ? raw : []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  const now = new Date();
  const filtered = assignments.filter(a => {
    const matchSearch = a.title?.toLowerCase().includes(search.toLowerCase());
    const isOverdue = !a.submitted && new Date(a.dueDate) < now;
    const isPending = !a.submitted && new Date(a.dueDate) >= now;
    if (!matchSearch) return false;
    if (filter === 'pending') return isPending;
    if (filter === 'submitted') return a.submitted;
    if (filter === 'overdue') return isOverdue;
    return true;
  });

  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => !a.submitted && new Date(a.dueDate) >= now).length,
    submitted: assignments.filter(a => a.submitted).length,
    overdue: assignments.filter(a => !a.submitted && new Date(a.dueDate) < now).length,
  };

  const getDueColor = (dueDate: string, submitted: boolean) => {
    if (submitted) return 'var(--success)';
    const d = new Date(dueDate);
    if (d < now) return 'var(--danger)';
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 2) return 'var(--warning)';
    return 'var(--text)';
  };

  return (
    <LMSLayout pageTitle="My Assignments" breadcrumbs={[{ label: 'Student' }, { label: 'Assignments' }]}>
      {/* Stats */}
      <div className="lms-stats-row" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total', value: stats.total, color: '' },
          { label: 'Pending', value: stats.pending, color: 'var(--warning)' },
          { label: 'Submitted', value: stats.submitted, color: 'var(--success)' },
          { label: 'Overdue', value: stats.overdue, color: 'var(--danger)' },
        ].map(s => (
          <div key={s.label} className="lms-stat">
            <div className="lms-stat-value" style={{ color: s.color || 'var(--nav-bg)' }}>{s.value}</div>
            <div className="lms-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="lms-filter-bar">
        <div className="lms-form-group">
          <input className="lms-input" placeholder=" Search assignments..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'pending', 'submitted', 'overdue'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`lms-btn lms-btn-sm ${filter === f ? 'lms-btn-primary' : 'lms-btn-default'}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && <span style={{ marginLeft: 4 }}>({stats[f]})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Overdue Alert */}
      {stats.overdue > 0 && (
        <div className="lms-alert lms-alert-error animate-fadeIn" style={{ marginBottom: 16 }}>
          <div>
            <div className="lms-alert-title"> Overdue Assignments</div>
            <div>You have {stats.overdue} overdue assignment(s). Submit as soon as possible.</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="lms-spinner"><div className="spinner" /><span>Loading assignments...</span></div>
      ) : (
        <div>
          {filtered.length === 0 ? (
            <div className="lms-section">
              <div className="lms-table-empty" style={{ padding: 48 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}></div>
                <div>No assignments found.</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((a, i) => {
                const isOverdue = !a.submitted && new Date(a.dueDate) < now;
                const daysLeft = Math.ceil((new Date(a.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={a._id} className="lms-section animate-fadeIn" style={{
                    animationDelay: `${i * 0.05}s`,
                    borderLeft: `4px solid ${a.submitted ? 'var(--success)' : isOverdue ? 'var(--danger)' : 'var(--primary)'}`,
                  }}>
                    <div style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--nav-bg)' }}>{a.title}</span>
                            {a.submitted ? (
                              <span className="lms-status lms-status-active"> Submitted</span>
                            ) : isOverdue ? (
                              <span className="lms-status lms-status-closed">Overdue</span>
                            ) : (
                              <span className="lms-status lms-status-pending">Pending</span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                            {typeof a.courseId === 'object' ? a.courseId?.title : a.courseId || 'Course'} · {a.maxMarks} marks
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{a.description?.slice(0, 120)}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 12, color: getDueColor(a.dueDate, !!a.submitted), fontWeight: 600, marginBottom: 4 }}>
                             {a.dueDate ? format(new Date(a.dueDate), 'dd MMM yyyy, HH:mm') : '-'}
                          </div>
                          {!a.submitted && !isOverdue && daysLeft >= 0 && (
                            <div style={{ fontSize: 11, color: daysLeft <= 2 ? 'var(--warning)' : 'var(--text-muted)' }}>
                              {daysLeft === 0 ? 'Due today!' : `${daysLeft} day(s) left`}
                            </div>
                          )}
                          <div style={{ marginTop: 8 }}>
                            <Link
                              href={`/student/assignment/${a._id}`}
                              className={`lms-btn lms-btn-sm ${a.submitted ? 'lms-btn-default' : isOverdue ? 'lms-btn-danger' : 'lms-btn-primary'}`}
                            >
                              {a.submitted ? 'View Submission' : isOverdue ? 'Submit Late' : 'Submit Now'}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </LMSLayout>
  );
}
