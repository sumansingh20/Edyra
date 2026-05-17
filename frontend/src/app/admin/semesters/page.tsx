'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Semester {
  _id: string;
  name: string;
  code: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  enrollmentStart: string;
  enrollmentEnd: string;
  status: 'upcoming' | 'enrollment-open' | 'active' | 'completed' | 'archived';
  isActive: boolean;
  courseCount?: number;
  studentCount?: number;
}

const STATUS_COLORS: Record<string, string> = {
  upcoming: 'lms-status-pending',
  'enrollment-open': 'lms-status-info',
  active: 'lms-status-active',
  completed: '',
  archived: 'lms-status-closed',
};

const EMPTY: Semester = {
  _id: '', name: '', code: '', academicYear: '',
  startDate: '', endDate: '', enrollmentStart: '', enrollmentEnd: '',
  status: 'upcoming', isActive: false,
};

export default function SemestersPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Semester | null>(null);
  const [form, setForm] = useState<Partial<Semester>>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const r = await api.get('/courses?type=semesters');
      // Try dedicated endpoint first, fall back gracefully
      setSemesters(r.data?.data?.semesters || []);
    } catch {
      setSemesters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (s: Semester) => { setEditing(s); setForm(s); setShowModal(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/semesters/${editing._id}`, form);
        toast.success('Semester updated');
      } else {
        await api.post('/admin/semesters', form);
        toast.success('Semester created');
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally { setSaving(false); }
  };

  const handleActivate = async (id: string) => {
    try {
      await api.post(`/admin/semesters/${id}/activate`);
      toast.success('Semester activated');
      load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Archive this semester? This will lock all associated courses.')) return;
    try {
      await api.post(`/admin/semesters/${id}/archive`);
      toast.success('Semester archived');
      load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <LMSLayout pageTitle="Semester Management" breadcrumbs={[{ label: 'Administration' }, { label: 'Semesters' }]}>

      {/* Header actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Manage academic semesters, enrollment windows, and activation states.
        </div>
        <button className="lms-btn lms-btn-primary" onClick={openCreate}>
          + Add Semester
        </button>
      </div>

      {/* Info */}
      <div className="lms-alert lms-alert-info" style={{ marginBottom: 16 }}>
        <div>
          <div className="lms-alert-title">Semester Lifecycle</div>
          <div>Upcoming → Enrollment Open → Active → Completed → Archived. Only one semester can be Active at a time.</div>
        </div>
      </div>

      {/* Table */}
      <div className="lms-section">
        <div className="lms-section-title">📅 All Semesters</div>
        {loading ? (
          <div className="lms-loading">Loading semesters...</div>
        ) : semesters.length === 0 ? (
          <div className="lms-table-empty empty-state-animated">
            <div className="empty-icon" />
            <div>No semesters configured yet.</div>
            <button className="lms-btn lms-btn-primary" style={{ marginTop: 12 }} onClick={openCreate}>
              Create First Semester
            </button>
          </div>
        ) : (
          <div className="lms-table-container">
            <table className="lms-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Academic Year</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Enrollment Window</th>
                  <th>Courses</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {semesters.map(s => (
                  <tr key={s._id}>
                    <td className="font-mono" style={{ fontWeight: 600 }}>{s.code}</td>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td>{s.academicYear}</td>
                    <td className="font-mono">{s.startDate ? format(new Date(s.startDate), 'dd/MM/yyyy') : '-'}</td>
                    <td className="font-mono">{s.endDate ? format(new Date(s.endDate), 'dd/MM/yyyy') : '-'}</td>
                    <td style={{ fontSize: 11 }}>
                      {s.enrollmentStart && s.enrollmentEnd
                        ? `${format(new Date(s.enrollmentStart), 'dd/MM')} – ${format(new Date(s.enrollmentEnd), 'dd/MM')}`
                        : '-'}
                    </td>
                    <td>{s.courseCount ?? 0}</td>
                    <td>{s.studentCount ?? 0}</td>
                    <td><span className={`lms-status ${STATUS_COLORS[s.status] || ''}`}>{s.status.toUpperCase()}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="lms-btn lms-btn-sm" onClick={() => openEdit(s)}>Edit</button>
                        {s.status === 'upcoming' && (
                          <button className="lms-btn lms-btn-sm lms-btn-primary" onClick={() => handleActivate(s._id)}>Activate</button>
                        )}
                        {s.status === 'active' && (
                          <button className="lms-btn lms-btn-sm" onClick={() => handleArchive(s._id)}>Archive</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="lms-modal-overlay">
          <div className="lms-modal" style={{ maxWidth: 560 }}>
            <div className="lms-modal-header">{editing ? 'Edit Semester' : 'Create Semester'}</div>
            <form onSubmit={handleSave}>
              <div className="lms-modal-body">
                <div className="lms-form-row" style={{ marginBottom: 14 }}>
                  <div className="lms-form-group" style={{ margin: 0 }}>
                    <label className="lms-label">Semester Name *</label>
                    <input className="lms-input" placeholder="e.g., Spring 2025" required
                      value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="lms-form-group" style={{ margin: 0 }}>
                    <label className="lms-label">Code *</label>
                    <input className="lms-input" placeholder="e.g., SPR2025" required
                      value={form.code || ''} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} />
                  </div>
                </div>
                <div className="lms-form-group" style={{ marginBottom: 14 }}>
                  <label className="lms-label">Academic Year *</label>
                  <input className="lms-input" placeholder="e.g., 2024-2025" required
                    value={form.academicYear || ''} onChange={e => setForm({ ...form, academicYear: e.target.value })} />
                </div>
                <div className="lms-form-row" style={{ marginBottom: 14 }}>
                  <div className="lms-form-group" style={{ margin: 0 }}>
                    <label className="lms-label">Start Date</label>
                    <input className="lms-input" type="date"
                      value={form.startDate?.split('T')[0] || ''} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                  </div>
                  <div className="lms-form-group" style={{ margin: 0 }}>
                    <label className="lms-label">End Date</label>
                    <input className="lms-input" type="date"
                      value={form.endDate?.split('T')[0] || ''} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                  </div>
                </div>
                <div className="lms-form-row" style={{ marginBottom: 14 }}>
                  <div className="lms-form-group" style={{ margin: 0 }}>
                    <label className="lms-label">Enrollment Opens</label>
                    <input className="lms-input" type="date"
                      value={form.enrollmentStart?.split('T')[0] || ''} onChange={e => setForm({ ...form, enrollmentStart: e.target.value })} />
                  </div>
                  <div className="lms-form-group" style={{ margin: 0 }}>
                    <label className="lms-label">Enrollment Closes</label>
                    <input className="lms-input" type="date"
                      value={form.enrollmentEnd?.split('T')[0] || ''} onChange={e => setForm({ ...form, enrollmentEnd: e.target.value })} />
                  </div>
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Status</label>
                  <select className="lms-select" value={form.status || 'upcoming'} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                    <option value="upcoming">Upcoming</option>
                    <option value="enrollment-open">Enrollment Open</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="lms-modal-footer">
                <button type="button" className="lms-btn" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="lms-btn lms-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Semester'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </LMSLayout>
  );
}
