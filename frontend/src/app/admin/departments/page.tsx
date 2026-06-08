'use client';

import { useEffect, useState, useCallback } from 'react';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  programs?: string[];
  studentCount?: number;
  facultyCount?: number;
  createdAt?: string;
}

interface DeptForm {
  name: string;
  code: string;
  description: string;
  programs: string;
}

const EMPTY_FORM: DeptForm = { name: '', code: '', description: '', programs: '' };

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [form, setForm] = useState<DeptForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const r = await api.get('/departments');
      setDepartments(r.data?.data?.departments || r.data?.data || r.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load departments');
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditDept(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (dept: Department) => {
    setEditDept(dept);
    setForm({
      name: dept.name || '',
      code: dept.code || '',
      description: dept.description || '',
      programs: (dept.programs || []).join(', '),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditDept(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and code are required');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      programs: form.programs
        ? form.programs.split(',').map(p => p.trim()).filter(Boolean)
        : [],
    };
    try {
      if (editDept) {
        await api.put(`/departments/${editDept._id}`, payload);
        toast.success('Department updated');
      } else {
        await api.post('/departments', payload);
        toast.success('Department created');
      }
      closeModal();
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/departments/${deleteTarget._id}`);
      toast.success('Department deleted');
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = departments.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <LMSLayout
      pageTitle="Department Management"
      breadcrumbs={[{ label: 'Administration' }, { label: 'Departments' }]}
    >
      {/* Stats */}
      <div className="lms-stats-row">
        <div className="lms-stat">
          <div className="lms-stat-value">{departments.length}</div>
          <div className="lms-stat-label">Total Departments</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--success)' }}>
            {departments.reduce((s, d) => s + (d.studentCount || 0), 0)}
          </div>
          <div className="lms-stat-label">Total Students</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--secondary)' }}>
            {departments.reduce((s, d) => s + (d.facultyCount || 0), 0)}
          </div>
          <div className="lms-stat-label">Total Faculty</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--warning)' }}>
            {departments.reduce((s, d) => s + (d.programs?.length || 0), 0)}
          </div>
          <div className="lms-stat-label">Total Programs</div>
        </div>
      </div>

      {/* Filter + Action */}
      <div className="lms-section">
        <div className="lms-section-title">Filter &amp; Search</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', padding: '12px 16px' }}>
          <div className="lms-form-group" style={{ margin: 0, flex: '1 1 240px' }}>
            <label className="lms-label">Search</label>
            <input
              className="lms-input"
              placeholder="Department name or code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="lms-btn lms-btn-primary" onClick={openCreate}>
              + Add Department
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="lms-section">
        <div className="lms-section-title">All Departments</div>
        {loading ? (
          <div className="lms-loading">Loading departments...</div>
        ) : filtered.length === 0 ? (
          <div className="lms-table-empty empty-state-animated">
            <div className="empty-icon" />
            <div>No departments found.</div>
            <button className="lms-btn lms-btn-primary" style={{ marginTop: 12 }} onClick={openCreate}>
              Create First Department
            </button>
          </div>
        ) : (
          <div className="lms-table-container">
            <table className="lms-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'center' }}>Students</th>
                  <th style={{ textAlign: 'center' }}>Faculty</th>
                  <th>Programs</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(dept => (
                  <tr key={dept._id}>
                    <td style={{ fontWeight: 600 }}>{dept.name}</td>
                    <td>
                      <span className="lms-status lms-status-info" style={{ fontFamily: 'monospace' }}>
                        {dept.code}
                      </span>
                    </td>
                    <td style={{ maxWidth: 220, color: 'var(--text-muted)', fontSize: 13 }}>
                      {dept.description ? (
                        dept.description.length > 80
                          ? dept.description.slice(0, 80) + '…'
                          : dept.description
                      ) : '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="lms-status">{dept.studentCount ?? 0}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="lms-status">{dept.facultyCount ?? 0}</span>
                    </td>
                    <td>
                      {dept.programs && dept.programs.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {dept.programs.slice(0, 3).map((p, i) => (
                            <span key={i} className="lms-status lms-status-pending" style={{ fontSize: 11 }}>{p}</span>
                          ))}
                          {dept.programs.length > 3 && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{dept.programs.length - 3} more</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>None</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="lms-btn lms-btn-sm" onClick={() => openEdit(dept)}>
                          Edit
                        </button>
                        <button
                          className="lms-btn lms-btn-sm lms-btn-danger"
                          onClick={() => setDeleteTarget(dept)}
                        >
                          Delete
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="lms-modal-overlay">
          <div className="lms-modal" style={{ maxWidth: 520 }}>
            <div className="lms-modal-header">
              {editDept ? 'Edit Department' : 'Create Department'}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="lms-modal-body">
                <div className="lms-form-group">
                  <label className="lms-label">Department Name *</label>
                  <input
                    className="lms-input"
                    placeholder="e.g. Computer Science"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Department Code *</label>
                  <input
                    className="lms-input"
                    placeholder="e.g. CS"
                    required
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value })}
                    style={{ textTransform: 'uppercase' }}
                  />
                  <span className="lms-form-hint">Short unique identifier (will be uppercased)</span>
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Description</label>
                  <textarea
                    className="lms-input"
                    rows={3}
                    placeholder="Brief description of the department..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Programs (comma-separated)</label>
                  <input
                    className="lms-input"
                    placeholder="e.g. B.Tech, M.Tech, Ph.D"
                    value={form.programs}
                    onChange={e => setForm({ ...form, programs: e.target.value })}
                  />
                  <span className="lms-form-hint">Enter program names separated by commas</span>
                </div>
              </div>
              <div className="lms-modal-footer">
                <button type="button" className="lms-btn" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="lms-btn lms-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editDept ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="lms-modal-overlay">
          <div className="lms-modal" style={{ maxWidth: 420 }}>
            <div className="lms-modal-header">Confirm Delete</div>
            <div className="lms-modal-body">
              <p>
                Are you sure you want to delete department{' '}
                <strong>{deleteTarget.name} ({deleteTarget.code})</strong>?
              </p>
              <p style={{ marginTop: 8, color: 'var(--error)', fontSize: 13 }}>
                This action cannot be undone and may affect associated users and courses.
              </p>
            </div>
            <div className="lms-modal-footer">
              <button className="lms-btn" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="lms-btn lms-btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </LMSLayout>
  );
}
