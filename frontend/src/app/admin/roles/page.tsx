'use client';

import { useEffect, useState } from 'react';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', permissions: [] });

  const fetchRoles = async () => {
    try {
      const response = await api.get('/admin/roles');
      setRoles(response.data.data.roles);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/roles', formData);
      toast.success('Role created successfully');
      setShowModal(false);
      fetchRoles();
    } catch (err) {
      toast.error('Failed to create role');
    }
  };

  const deleteRole = async (id: string) => {
    if (!confirm('Are you sure? This may affect users assigned to this role.')) return;
    try {
      await api.delete(`/admin/roles/${id}`);
      toast.success('Role deleted');
      fetchRoles();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete role');
    }
  };

  return (
    <LMSLayout pageTitle="Role Management" breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Roles' }]}>
      <div className="lms-section">
        <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>System Roles</span>
          <button className="lms-btn lms-btn-sm lms-btn-primary" onClick={() => setShowModal(true)}>+ Define New Role</button>
        </div>
        
        {loading ? (
          <div className="lms-loading">Loading roles...</div>
        ) : (
          <div className="lms-table-container">
            <table className="lms-table">
              <thead>
                <tr>
                  <th>Role Name</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Permissions</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map(role => (
                  <tr key={role._id}>
                    <td style={{ fontWeight: 700 }}>{role.name}</td>
                    <td style={{ fontSize: 13 }}>{role.description || 'No description'}</td>
                    <td>
                      <span className={`lms-status ${role.isSystem ? 'lms-status-active' : 'lms-status-pending'}`}>
                        {role.isSystem ? 'SYSTEM' : 'CUSTOM'}
                      </span>
                    </td>
                    <td>{role.permissions?.length || 0} assigned</td>
                    <td>{new Date(role.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="lms-btn lms-btn-sm">Edit</button>
                        {!role.isSystem && (
                          <button className="lms-btn lms-btn-sm lms-btn-danger" onClick={() => deleteRole(role._id)}>Delete</button>
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

      {showModal && (
        <div className="lms-modal-overlay">
          <div className="lms-modal" style={{ width: 500 }}>
            <div className="lms-modal-header">Define New System Role</div>
            <div className="lms-modal-body">
              <form onSubmit={handleSubmit}>
                <div className="lms-form-group">
                  <label className="lms-label">Role Name</label>
                  <input className="lms-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Content_Manager" />
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Description</label>
                  <textarea className="lms-input" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="What can this role do?" />
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                  <button type="button" className="lms-btn" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="lms-btn lms-btn-primary">Create Role</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </LMSLayout>
  );
}
