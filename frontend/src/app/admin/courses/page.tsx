'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import LMSLayout from '@/components/layouts/LMSLayout';
import { format } from 'date-fns';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '', code: '', description: '', credits: 3,
    facultyId: '', departmentId: '', category: '', semester: '',
  });

  const LIMIT = 20;

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/courses', { params: { search, page, limit: LIMIT, admin: true } });
      const data = res.data?.data || {};
      const list = data.courses || data || [];
      setCourses(Array.isArray(list) ? list : []);
      setTotal(data.total || data.count || list.length);
    } catch { setLoading(false); } finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  useEffect(() => {
    Promise.allSettled([
      api.get('/departments', { params: { limit: 100 } }),
      api.get('/admin/users', { params: { role: 'teacher', limit: 100 } }),
    ]).then(([dRes, fRes]) => {
      if (dRes.status === 'fulfilled') setDepartments(dRes.value.data?.data?.departments || dRes.value.data?.data || []);
      if (fRes.status === 'fulfilled') setFaculty(fRes.value.data?.data?.users || fRes.value.data?.data || []);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/courses', form);
      setSuccess('Course created!');
      setModal(false);
      setForm({ title: '', code: '', description: '', credits: 3, facultyId: '', departmentId: '', category: '', semester: '' });
      fetchCourses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create course');
    } finally { setSaving(false); }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm('Delete this course? All enrollments will be removed.')) return;
    try {
      await api.delete(`/courses/${id}`);
      setSuccess('Course deleted.');
      fetchCourses();
    } catch { }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <LMSLayout pageTitle="Course Management" breadcrumbs={[{ label: 'Admin' }, { label: 'Courses' }]}>
      {success && <div className="lms-alert lms-alert-success animate-fadeIn" style={{ marginBottom: 16 }}><div>{success}</div></div>}

      {/* Filter Bar */}
      <div className="lms-filter-bar">
        <div className="lms-form-group">
          <input className="lms-input" placeholder=" Search courses..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <button onClick={() => setModal(true)} className="lms-btn lms-btn-primary"> Add Course</button>
        <Link href="/courses" className="lms-btn lms-btn-default">View Catalog →</Link>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        {total} total courses · Page {page}/{totalPages || 1}
      </div>

      {/* Courses Table */}
      <div className="lms-section">
        <div className="lms-table-container">
          {loading ? (
            <div className="lms-spinner" style={{ padding: 40 }}><div className="spinner" /></div>
          ) : courses.length === 0 ? (
            <div className="lms-table-empty" style={{ padding: 48 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}></div>
              <div>No courses found.</div>
            </div>
          ) : (
            <table className="lms-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Code</th>
                  <th>Faculty</th>
                  <th>Credits</th>
                  <th>Enrolled</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c: any) => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                      {c.category && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.category}</div>}
                    </td>
                    <td className="font-mono" style={{ fontSize: 11 }}>{c.code || '—'}</td>
                    <td style={{ fontSize: 12 }}>
                      {typeof c.faculty === 'object' ? `${c.faculty?.firstName} ${c.faculty?.lastName}` : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>{c.credits || 3}</td>
                    <td style={{ textAlign: 'center' }}>{c.enrolledCount || 0}</td>
                    <td>
                      <span className={`lms-status ${c.status === 'active' || !c.status ? 'lms-status-active' : 'lms-status-closed'}`} style={{ fontSize: 10 }}>
                        {c.status || 'Active'}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {c.createdAt ? format(new Date(c.createdAt), 'dd/MM/yy') : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Link href={`/admin/courses/${c._id}`} className="lms-btn lms-btn-sm lms-btn-secondary">Edit</Link>
                        <button onClick={() => deleteCourse(c._id)} className="lms-btn lms-btn-sm lms-btn-default">️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="lms-pagination">
            <span>Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total}</span>
            <div className="lms-pagination-btns">
              <button className="lms-pagination-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                <button key={i + 1} className={`lms-pagination-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
              ))}
              <button className="lms-pagination-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {modal && (
        <div className="lms-modal-overlay" onClick={() => setModal(false)}>
          <div className="lms-modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="lms-modal-header"> Create New Course</div>
            <form onSubmit={handleSubmit}>
              <div className="lms-modal-body">
                {error && <div className="lms-alert lms-alert-error" style={{ marginBottom: 12 }}><div>{error}</div></div>}
                <div className="lms-form-row">
                  <div className="lms-form-group">
                    <label className="lms-label">Course Title *</label>
                    <input required className="lms-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div className="lms-form-group">
                    <label className="lms-label">Course Code</label>
                    <input className="lms-input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="CS101" style={{ fontFamily: 'monospace' }} />
                  </div>
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Description</label>
                  <textarea className="lms-textarea" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="lms-form-row">
                  <div className="lms-form-group">
                    <label className="lms-label">Credits</label>
                    <input type="number" min={1} max={10} className="lms-input" value={form.credits} onChange={e => setForm(f => ({ ...f, credits: parseInt(e.target.value) }))} />
                  </div>
                  <div className="lms-form-group">
                    <label className="lms-label">Category</label>
                    <input className="lms-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Computer Science" />
                  </div>
                </div>
                <div className="lms-form-row">
                  <div className="lms-form-group">
                    <label className="lms-label">Assigned Faculty</label>
                    <select className="lms-select" value={form.facultyId} onChange={e => setForm(f => ({ ...f, facultyId: e.target.value }))}>
                      <option value="">— Select Faculty —</option>
                      {faculty.map((f: any) => (
                        <option key={f._id} value={f._id}>{f.firstName} {f.lastName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="lms-form-group">
                    <label className="lms-label">Department</label>
                    <select className="lms-select" value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}>
                      <option value="">— Select Department —</option>
                      {departments.map((d: any) => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="lms-modal-footer">
                <button type="button" onClick={() => setModal(false)} className="lms-btn lms-btn-default">Cancel</button>
                <button type="submit" disabled={saving} className="lms-btn lms-btn-primary">
                  {saving ? 'Creating...' : ' Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </LMSLayout>
  );
}
