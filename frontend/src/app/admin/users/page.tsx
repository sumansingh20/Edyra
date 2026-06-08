'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import LMSLayout from '@/components/layouts/LMSLayout';
import { format } from 'date-fns';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  studentId?: string;
  employeeId?: string;
  isEmailVerified?: boolean;
  isActive?: boolean;
  createdAt: string;
  department?: string;
}

type ModalMode = 'create' | 'edit' | null;

const ROLES = ['student', 'teacher', 'admin', 'super-admin', 'teaching-assistant', 'invigilator'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalMode>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', role: 'student',
    studentId: '', employeeId: '', department: '',
  });

  const LIMIT = 20;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users', {
        params: { search, role: roleFilter, page, limit: LIMIT, sortBy: 'createdAt', sortOrder: 'desc' },
      });
      const data = res.data?.data || {};
      const userList = data.users || data || [];
      setUsers(Array.isArray(userList) ? userList : []);
      setTotal(data.total || data.count || userList.length);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally { setLoading(false); }
  }, [search, roleFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => {
    setForm({ firstName: '', lastName: '', email: '', password: '', role: 'student', studentId: '', employeeId: '', department: '' });
    setModal('create');
    setError('');
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, password: '', role: u.role, studentId: u.studentId || '', employeeId: u.employeeId || '', department: u.department || '' });
    setModal('edit');
    setError('');
  };

  const closeModal = () => { setModal(null); setEditUser(null); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (modal === 'create') {
        await api.post('/admin/users', form);
        setSuccess('User created successfully!');
      } else if (modal === 'edit' && editUser) {
        const { password, ...rest } = form;
        await api.put(`/admin/users/${editUser._id}`, password ? form : rest);
        setSuccess('User updated successfully!');
      }
      closeModal();
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Operation failed');
    } finally { setSaving(false); }
  };

  const deleteUser = async (id: string) => {
    setDeleting(id);
    try {
      await api.delete(`/admin/users/${id}`);
      setSuccess('User deleted.');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Delete failed');
    } finally { setDeleting(null); setConfirmDelete(null); }
  };

  const toggleActive = async (u: User) => {
    try {
      await api.patch(`/admin/users/${u._id}/status`, { isActive: !u.isActive });
      fetchUsers();
    } catch { }
  };

  const resetPassword = async (id: string) => {
    if (!confirm('Send password reset email to this user?')) return;
    try {
      await api.post(`/admin/users/${id}/reset-password`);
      alert('Password reset email sent.');
    } catch { alert('Failed to send reset email.'); }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      'super-admin': 'lms-status-closed',
      'admin': 'lms-status-pending',
      'teacher': 'lms-status-info',
      'student': 'lms-status-active',
      'teaching-assistant': 'lms-status-info',
      'invigilator': 'lms-status-pending',
    };
    return colors[role] || 'lms-status-info';
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <LMSLayout pageTitle="User Management" breadcrumbs={[{ label: 'Admin' }, { label: 'Users' }]}>
      {success && (
        <div className="lms-alert lms-alert-success animate-fadeIn" style={{ marginBottom: 16 }}>
          <div>{success}</div>
        </div>
      )}
      {error && !modal && (
        <div className="lms-alert lms-alert-error animate-fadeIn" style={{ marginBottom: 16 }}>
          <div>{error}</div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="lms-filter-bar">
        <div className="lms-form-group">
          <input
            className="lms-input"
            placeholder=" Search name, email, ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="lms-form-group">
          <select className="lms-select" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <button onClick={openCreate} className="lms-btn lms-btn-primary">
           Add User
        </button>
        <button
          onClick={() => {
            const link = document.createElement('a');
            link.href = `/api/admin/users/export?role=${roleFilter}&search=${search}`;
            link.download = `users_${format(new Date(), 'yyyy-MM-dd')}.csv`;
            link.click();
          }}
          className="lms-btn lms-btn-default"
        >
           Export CSV
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, fontSize: 13 }}>
        <span style={{ color: 'var(--text-muted)' }}>Total: <strong>{total}</strong></span>
        <span style={{ color: 'var(--text-muted)' }}>Page {page} of {totalPages || 1}</span>
      </div>

      {/* Users Table */}
      <div className="lms-section">
        <div className="lms-table-container">
          {loading ? (
            <div className="lms-spinner" style={{ padding: 40 }}><div className="spinner" /><span>Loading users...</span></div>
          ) : users.length === 0 ? (
            <div className="lms-table-empty" style={{ padding: 48 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}></div>
              <div>No users found{search ? ` matching "${search}"` : ''}.</div>
            </div>
          ) : (
            <table className="lms-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>ID</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 11, flexShrink: 0,
                        }}>
                          {(u.firstName?.[0] || '?')}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{u.email}</td>
                    <td className="font-mono" style={{ fontSize: 11 }}>{u.studentId || u.employeeId || '—'}</td>
                    <td>
                      <span className={`lms-status ${getRoleBadge(u.role)}`} style={{ fontSize: 10, textTransform: 'capitalize' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.department || '—'}</td>
                    <td>
                      <button
                        onClick={() => toggleActive(u)}
                        className={`lms-status ${u.isActive !== false ? 'lms-status-active' : 'lms-status-closed'}`}
                        style={{ border: 'none', cursor: 'pointer', fontSize: 10 }}
                        title="Click to toggle"
                      >
                        {u.isActive !== false ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {u.createdAt ? format(new Date(u.createdAt), 'dd/MM/yy') : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEdit(u)} className="lms-btn lms-btn-sm lms-btn-secondary">Edit</button>
                        <button onClick={() => resetPassword(u._id)} className="lms-btn lms-btn-sm lms-btn-default" title="Reset Password"></button>
                        {confirmDelete === u._id ? (
                          <>
                            <button onClick={() => deleteUser(u._id)} disabled={!!deleting} className="lms-btn lms-btn-sm lms-btn-danger">
                              Confirm
                            </button>
                            <button onClick={() => setConfirmDelete(null)} className="lms-btn lms-btn-sm">Cancel</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDelete(u._id)} className="lms-btn lms-btn-sm lms-btn-default">️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="lms-pagination">
            <span>Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total}</span>
            <div className="lms-pagination-btns">
              <button
                className="lms-pagination-btn"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >‹</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = page <= 4 ? i + 1 : page - 3 + i;
                if (p > totalPages) return null;
                return (
                  <button key={p} className={`lms-pagination-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                );
              })}
              <button
                className="lms-pagination-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >›</button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <div className="lms-modal-overlay" onClick={closeModal}>
          <div className="lms-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="lms-modal-header">
              {modal === 'create' ? ' Create New User' : `️ Edit User — ${editUser?.firstName} ${editUser?.lastName}`}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="lms-modal-body">
                {error && (
                  <div className="lms-alert lms-alert-error" style={{ marginBottom: 16 }}>
                    <div>{error}</div>
                  </div>
                )}
                <div className="lms-form-row">
                  <div className="lms-form-group">
                    <label className="lms-label">First Name *</label>
                    <input required className="lms-input" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
                  </div>
                  <div className="lms-form-group">
                    <label className="lms-label">Last Name *</label>
                    <input required className="lms-input" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
                  </div>
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Email Address *</label>
                  <input required type="email" className="lms-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">{modal === 'create' ? 'Password *' : 'New Password (leave blank to keep)'}</label>
                  <input
                    type="password"
                    className="lms-input"
                    required={modal === 'create'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder={modal === 'edit' ? 'Leave blank to keep current' : ''}
                  />
                </div>
                <div className="lms-form-row">
                  <div className="lms-form-group">
                    <label className="lms-label">Role *</label>
                    <select required className="lms-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="lms-form-group">
                    <label className="lms-label">Department</label>
                    <input className="lms-input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
                  </div>
                </div>
                {form.role === 'student' && (
                  <div className="lms-form-group">
                    <label className="lms-label">Student ID</label>
                    <input className="lms-input" value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))} placeholder="e.g., EDY2024001" />
                  </div>
                )}
                {form.role !== 'student' && (
                  <div className="lms-form-group">
                    <label className="lms-label">Employee ID</label>
                    <input className="lms-input" value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} placeholder="e.g., FAC001" />
                  </div>
                )}
              </div>
              <div className="lms-modal-footer">
                <button type="button" onClick={closeModal} className="lms-btn lms-btn-default">Cancel</button>
                <button type="submit" disabled={saving} className="lms-btn lms-btn-primary">
                  {saving ? 'Saving...' : modal === 'create' ? 'Create User' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </LMSLayout>
  );
}
