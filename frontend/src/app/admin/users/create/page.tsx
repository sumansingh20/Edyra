'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const ROLES = ['student', 'teacher', 'assistant-teacher', 'invigilator', 'department-admin', 'admin'];
const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Mathematics', 'Physics', 'Chemistry', 'Management', 'Commerce', 'Arts'];
const BATCHES = ['2020-2024', '2021-2025', '2022-2026', '2023-2027', '2024-2028'];

export default function AdminCreateUserPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', role: 'student',
    studentId: '', employeeId: '', rollNumber: '', dateOfBirth: '',
    department: '', batch: '', semester: '', section: '', phone: '',
  });

  const f = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.firstName || !form.lastName) {
      toast.error('First name, last name, email, and password are required');
      return;
    }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }

    setSubmitting(true);
    const tid = toast.loading('Creating user account...');
    try {
      const payload: any = { ...form };
      // Remove empty optional fields
      Object.keys(payload).forEach(k => { if (payload[k] === '' || payload[k] === undefined) delete payload[k]; });

      await api.post('/admin/users', payload);
      toast.dismiss(tid);
      toast.success(`${form.role.charAt(0).toUpperCase() + form.role.slice(1)} account created successfully`);
      router.push('/admin/users');
    } catch (err: any) {
      toast.dismiss(tid);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to create user';
      toast.error(msg);
    } finally { setSubmitting(false); }
  };

  const isStudent = form.role === 'student';
  const isFaculty = ['teacher', 'assistant-teacher', 'invigilator'].includes(form.role);

  return (
    <LMSLayout pageTitle="Create User Account" breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Users', href: '/admin/users' }, { label: 'Create' }]}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>

          {/* Left — core details */}
          <div>
            <div className="lms-section">
              <div className="lms-section-title">Personal Information</div>
              <div style={{ padding: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="lms-form-group">
                    <label className="lms-label">First Name *</label>
                    <input className="lms-input" required value={form.firstName} onChange={e => f('firstName', e.target.value)} placeholder="First name" />
                  </div>
                  <div className="lms-form-group">
                    <label className="lms-label">Last Name *</label>
                    <input className="lms-input" required value={form.lastName} onChange={e => f('lastName', e.target.value)} placeholder="Last name" />
                  </div>
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Email Address *</label>
                  <input type="email" className="lms-input" required value={form.email} onChange={e => f('email', e.target.value)} placeholder="user@institution.edu" />
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Phone Number</label>
                  <input type="tel" className="lms-input" value={form.phone} onChange={e => f('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Date of Birth</label>
                  <input type="date" className="lms-input" value={form.dateOfBirth} onChange={e => f('dateOfBirth', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Academic details */}
            <div className="lms-section" style={{ marginTop: 24 }}>
              <div className="lms-section-title">Academic / Institutional Details</div>
              <div style={{ padding: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="lms-form-group">
                    <label className="lms-label">Department</label>
                    <select className="lms-input" value={form.department} onChange={e => f('department', e.target.value)}>
                      <option value="">-- Select Department --</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  {isStudent && (
                    <div className="lms-form-group">
                      <label className="lms-label">Batch</label>
                      <select className="lms-input" value={form.batch} onChange={e => f('batch', e.target.value)}>
                        <option value="">-- Select Batch --</option>
                        {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                {isStudent && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <div className="lms-form-group">
                      <label className="lms-label">Student ID</label>
                      <input className="lms-input" value={form.studentId} onChange={e => f('studentId', e.target.value)} placeholder="e.g. EDY2024001" />
                    </div>
                    <div className="lms-form-group">
                      <label className="lms-label">Roll Number</label>
                      <input className="lms-input" value={form.rollNumber} onChange={e => f('rollNumber', e.target.value)} placeholder="e.g. 24CS001" />
                    </div>
                    <div className="lms-form-group">
                      <label className="lms-label">Semester</label>
                      <select className="lms-input" value={form.semester} onChange={e => f('semester', e.target.value)}>
                        <option value="">--</option>
                        {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
                      </select>
                    </div>
                  </div>
                )}
                {isStudent && (
                  <div className="lms-form-group">
                    <label className="lms-label">Section</label>
                    <input className="lms-input" value={form.section} onChange={e => f('section', e.target.value)} placeholder="e.g. A, B, C" />
                  </div>
                )}
                {isFaculty && (
                  <div className="lms-form-group">
                    <label className="lms-label">Employee ID</label>
                    <input className="lms-input" value={form.employeeId} onChange={e => f('employeeId', e.target.value)} placeholder="e.g. FAC2024001" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right — role + password + submit */}
          <div>
            <div className="lms-section">
              <div className="lms-section-title">Account Configuration</div>
              <div style={{ padding: 20 }}>
                <div className="lms-form-group">
                  <label className="lms-label">Role *</label>
                  <select className="lms-input" required value={form.role} onChange={e => f('role', e.target.value)}>
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1).replace(/-/g, ' ')}</option>)}
                  </select>
                </div>

                <div className="lms-form-group">
                  <label className="lms-label">Initial Password *</label>
                  <input type="password" className="lms-input" required minLength={8} value={form.password}
                    onChange={e => f('password', e.target.value)} placeholder="Minimum 8 characters" />
                  <span className="lms-form-hint">User can reset their password after first login.</span>
                </div>

                <div className="lms-alert lms-alert-info" style={{ marginTop: 4, marginBottom: 16 }}>
                  <div>Account will be created as <strong>Verified &amp; Active</strong> immediately.</div>
                </div>

                {/* Role description */}
                <div style={{ padding: 12, background: '#f8f9fa', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                  {form.role === 'student' && '🎓 Student — can enroll in courses, take exams, submit assignments, and view grades.'}
                  {form.role === 'teacher' && '👨‍🏫 Teacher — can create courses, exams, assignments, grade students, and view analytics.'}
                  {form.role === 'assistant-teacher' && '🧑‍🏫 Assistant Teacher — limited faculty access for grading and assignment management.'}
                  {form.role === 'invigilator' && '👁️ Invigilator — can monitor live exams and manage exam sessions.'}
                  {form.role === 'department-admin' && '🏛️ Department Admin — manages users and courses in their department.'}
                  {form.role === 'admin' && '⚙️ Administrator — full system access including user management, exams, analytics, and system settings.'}
                </div>

                <button type="submit" className="lms-btn lms-btn-primary" style={{ width: '100%' }} disabled={submitting}>
                  {submitting ? 'Creating Account...' : '✓ Create User Account'}
                </button>
                <button type="button" className="lms-btn" style={{ width: '100%', marginTop: 10 }} onClick={() => router.push('/admin/users')} disabled={submitting}>
                  Cancel
                </button>
              </div>
            </div>

            {/* Bulk import hint */}
            <div className="lms-section" style={{ marginTop: 16 }}>
              <div className="lms-section-title">Bulk Import</div>
              <div style={{ padding: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                Need to create multiple accounts? Use the Bulk Import feature on the Users page to upload a CSV file.
                <a href="/admin/users" style={{ marginLeft: 6, color: 'var(--primary)' }}>Go to Users →</a>
              </div>
            </div>
          </div>
        </div>
      </form>
    </LMSLayout>
  );
}
