'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Course {
  _id: string;
  title: string;
  code: string;
  description: string;
  department: string;
  credits: number;
  status: 'draft' | 'published' | 'active' | 'archived';
  instructor?: { _id: string; firstName: string; lastName: string; email: string };
  enrolledStudents: string[];
  modules?: string[];
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'lms-status-pending',
  published: 'lms-status-info',
  active: 'lms-status-active',
  archived: 'lms-status-closed',
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: LIMIT };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const r = await api.get('/courses', { params });
      setCourses(r.data?.data?.courses || []);
      setTotal(r.data?.data?.total || 0);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handlePublish = async (id: string) => {
    try {
      await api.put(`/courses/${id}`, { status: 'published' });
      toast.success('Course published');
      load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Archive this course?')) return;
    try {
      await api.put(`/courses/${id}`, { status: 'archived' });
      toast.success('Course archived');
      load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this course? This cannot be undone.')) return;
    try {
      await api.delete(`/courses/${id}`);
      toast.success('Course deleted');
      load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const stats = {
    total,
    active: courses.filter(c => c.status === 'active').length,
    published: courses.filter(c => c.status === 'published').length,
    draft: courses.filter(c => c.status === 'draft').length,
  };

  return (
    <LMSLayout pageTitle="Course Management" breadcrumbs={[{ label: 'Administration' }, { label: 'Courses' }]}>

      {/* Stats */}
      <div className="lms-stats-row">
        <div className="lms-stat">
          <div className="lms-stat-value">{stats.total}</div>
          <div className="lms-stat-label">Total Courses</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--success)' }}>{stats.active}</div>
          <div className="lms-stat-label">Active</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--secondary)' }}>{stats.published}</div>
          <div className="lms-stat-label">Published</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--text-muted)' }}>{stats.draft}</div>
          <div className="lms-stat-label">Draft</div>
        </div>
      </div>

      {/* Filters */}
      <div className="lms-section">
        <div className="lms-section-title">Filter & Search</div>
        <div className="lms-filter-bar" style={{ padding: '12px 16px' }}>
          <div className="lms-form-group" style={{ margin: 0, flex: '1 1 240px' }}>
            <label className="lms-label">Search</label>
            <input className="lms-input" placeholder="Course title, code..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="lms-form-group" style={{ margin: 0, width: 140 }}>
            <label className="lms-label">Status</label>
            <select className="lms-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Link href="/courses/create" className="lms-btn lms-btn-primary">+ Create Course</Link>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="lms-section">
        <div className="lms-section-title">All Courses</div>
        {loading ? (
          <div className="lms-loading">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="lms-table-empty empty-state-animated">
            <div className="empty-icon" />
            <div>No courses found.</div>
            <Link href="/courses/create" className="lms-btn lms-btn-primary" style={{ marginTop: 12 }}>
              Create First Course
            </Link>
          </div>
        ) : (
          <>
            <div className="lms-table-container">
              <table className="lms-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Title</th>
                    <th>Department</th>
                    <th>Credits</th>
                    <th>Instructor</th>
                    <th>Students</th>
                    <th>Modules</th>
                    <th>Created</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(c => (
                    <tr key={c._id}>
                      <td className="font-mono" style={{ fontWeight: 600 }}>{c.code}</td>
                      <td style={{ fontWeight: 500, maxWidth: 200 }}>{c.title}</td>
                      <td>{c.department || '-'}</td>
                      <td style={{ textAlign: 'center' }}>{c.credits || 3}</td>
                      <td>{c.instructor ? `${c.instructor.firstName} ${c.instructor.lastName}` : '-'}</td>
                      <td style={{ textAlign: 'center' }}>{c.enrolledStudents?.length || 0}</td>
                      <td style={{ textAlign: 'center' }}>{c.modules?.length || 0}</td>
                      <td className="font-mono" style={{ fontSize: 11 }}>
                        {c.createdAt ? format(new Date(c.createdAt), 'dd/MM/yy') : '-'}
                      </td>
                      <td>
                        <span className={`lms-status ${STATUS_COLORS[c.status] || ''}`}>
                          {c.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Link href={`/courses/${c._id}`} className="lms-btn lms-btn-sm">View</Link>
                          {c.status === 'draft' && (
                            <button className="lms-btn lms-btn-sm lms-btn-primary" onClick={() => handlePublish(c._id)}>
                              Publish
                            </button>
                          )}
                          {c.status !== 'archived' && (
                            <button className="lms-btn lms-btn-sm" onClick={() => handleArchive(c._id)}>
                              Archive
                            </button>
                          )}
                          <button className="lms-btn lms-btn-sm lms-btn-danger" onClick={() => handleDelete(c._id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
    </LMSLayout>
  );
}
