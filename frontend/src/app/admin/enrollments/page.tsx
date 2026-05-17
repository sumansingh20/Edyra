'use client';

import { useEffect, useState, useCallback } from 'react';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Enrollment {
  _id: string;
  student: { _id: string; firstName: string; lastName: string; email: string; studentId?: string };
  course: { _id: string; title: string; code: string };
  status: 'active' | 'completed' | 'dropped' | 'suspended' | 'pending-approval';
  enrolledAt: string;
  progress: number;
  finalGrade?: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'lms-status-active',
  completed: '',
  dropped: 'lms-status-closed',
  suspended: 'lms-status-closed',
  'pending-approval': 'lms-status-pending',
};

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ studentId: '', courseId: '' });
  const [enrolling, setEnrolling] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: LIMIT };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const r = await api.get('/gradebook/enrollments', { params });
      setEnrollments(r.data?.data?.enrollments || []);
      setTotal(r.data?.data?.total || 0);
    } catch {
      // If endpoint doesn't exist yet, show empty state
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrolling(true);
    try {
      await api.post(`/courses/${enrollForm.courseId}/enroll`, { studentId: enrollForm.studentId });
      toast.success('Student enrolled successfully');
      setShowEnroll(false);
      setEnrollForm({ studentId: '', courseId: '' });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Enrollment failed');
    } finally { setEnrolling(false); }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/gradebook/enrollments/${id}`, { status: newStatus });
      toast.success(`Enrollment ${newStatus}`);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const stats = {
    total: enrollments.length,
    active: enrollments.filter(e => e.status === 'active').length,
    completed: enrollments.filter(e => e.status === 'completed').length,
    dropped: enrollments.filter(e => e.status === 'dropped').length,
  };

  return (
    <LMSLayout pageTitle="Enrollment Management" breadcrumbs={[{ label: 'Administration' }, { label: 'Enrollments' }]}>

      {/* Stats */}
      <div className="lms-stats-row">
        <div className="lms-stat">
          <div className="lms-stat-value">{total}</div>
          <div className="lms-stat-label">Total Enrollments</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--success)' }}>{stats.active}</div>
          <div className="lms-stat-label">Active</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value">{stats.completed}</div>
          <div className="lms-stat-label">Completed</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--danger)' }}>{stats.dropped}</div>
          <div className="lms-stat-label">Dropped</div>
        </div>
      </div>

      {/* Filters */}
      <div className="lms-section">
        <div className="lms-section-title">Filter & Search</div>
        <div className="lms-filter-bar" style={{ padding: '12px 16px' }}>
          <div className="lms-form-group" style={{ margin: 0, flex: '1 1 240px' }}>
            <label className="lms-label">Search</label>
            <input className="lms-input" placeholder="Student name, ID, or course..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="lms-form-group" style={{ margin: 0, width: 160 }}>
            <label className="lms-label">Status</label>
            <select className="lms-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
              <option value="suspended">Suspended</option>
              <option value="pending-approval">Pending</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="lms-btn lms-btn-primary" onClick={() => setShowEnroll(true)}>
              + Enroll Student
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="lms-section">
        <div className="lms-section-title">Enrollment Records</div>
        {loading ? (
          <div className="lms-loading">Loading enrollments...</div>
        ) : enrollments.length === 0 ? (
          <div className="lms-table-empty empty-state-animated">
            <div className="empty-icon" />
            <div>No enrollment records found.</div>
            <button className="lms-btn lms-btn-primary" style={{ marginTop: 12 }} onClick={() => setShowEnroll(true)}>
              Enroll a Student
            </button>
          </div>
        ) : (
          <>
            <div className="lms-table-container">
              <table className="lms-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Student ID</th>
                    <th>Course</th>
                    <th>Code</th>
                    <th>Enrolled</th>
                    <th>Progress</th>
                    <th>Grade</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map(e => (
                    <tr key={e._id}>
                      <td style={{ fontWeight: 500 }}>{e.student?.firstName} {e.student?.lastName}</td>
                      <td className="font-mono">{e.student?.studentId || '-'}</td>
                      <td>{e.course?.title || '-'}</td>
                      <td className="font-mono">{e.course?.code || '-'}</td>
                      <td className="font-mono" style={{ fontSize: 11 }}>
                        {e.enrolledAt ? format(new Date(e.enrolledAt), 'dd/MM/yy') : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="lms-progress-bar" style={{ flex: 1, maxWidth: 80 }}>
                            <div className="lms-progress-fill" style={{ width: `${e.progress || 0}%` }} />
                          </div>
                          <span style={{ fontSize: 11 }}>{e.progress || 0}%</span>
                        </div>
                      </td>
                      <td>
                        {e.finalGrade ? (
                          <span className="lms-status lms-status-info">{e.finalGrade}</span>
                        ) : '-'}
                      </td>
                      <td>
                        <span className={`lms-status ${STATUS_COLORS[e.status] || ''}`}>
                          {e.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {e.status === 'active' && (
                            <button className="lms-btn lms-btn-sm" onClick={() => handleStatusChange(e._id, 'dropped')}>
                              Drop
                            </button>
                          )}
                          {e.status === 'dropped' && (
                            <button className="lms-btn lms-btn-sm lms-btn-primary" onClick={() => handleStatusChange(e._id, 'active')}>
                              Re-enroll
                            </button>
                          )}
                          {e.status === 'pending-approval' && (
                            <button className="lms-btn lms-btn-sm lms-btn-success" onClick={() => handleStatusChange(e._id, 'active')}>
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="lms-pagination">
              <div>Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total}</div>
              <div className="lms-pagination-btns">
                <button className="lms-pagination-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                <button className="lms-pagination-btn active">{page}</button>
                <button className="lms-pagination-btn" disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Manual Enroll Modal */}
      {showEnroll && (
        <div className="lms-modal-overlay">
          <div className="lms-modal">
            <div className="lms-modal-header">Enroll Student in Course</div>
            <form onSubmit={handleEnroll}>
              <div className="lms-modal-body">
                <div className="lms-alert lms-alert-info" style={{ marginBottom: 14 }}>
                  <div>Enter the student's unique ID and the course ID to manually enroll them.</div>
                </div>
                <div className="lms-form-group" style={{ marginBottom: 14 }}>
                  <label className="lms-label">Student ID *</label>
                  <input className="lms-input" placeholder="Student ID (e.g., EDY2024001)" required
                    value={enrollForm.studentId} onChange={e => setEnrollForm({ ...enrollForm, studentId: e.target.value })} />
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Course ID *</label>
                  <input className="lms-input" placeholder="Course MongoDB ID or code" required
                    value={enrollForm.courseId} onChange={e => setEnrollForm({ ...enrollForm, courseId: e.target.value })} />
                  <span className="lms-form-hint">Find the Course ID from the Courses page</span>
                </div>
              </div>
              <div className="lms-modal-footer">
                <button type="button" className="lms-btn" onClick={() => setShowEnroll(false)} disabled={enrolling}>Cancel</button>
                <button type="submit" className="lms-btn lms-btn-primary" disabled={enrolling}>
                  {enrolling ? 'Enrolling...' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </LMSLayout>
  );
}
