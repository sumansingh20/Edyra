'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LMSLayout from '@/components/layouts/LMSLayout';
import { courseApi } from '@/lib/edyraApi';
import toast from 'react-hot-toast';

export default function CreateCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', code: '', description: '', category: '', department: '',
    semester: '', credits: '3', maxStudents: '100', enrollmentType: 'open',
    status: 'draft'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.code) {
      toast.error('Title and Code are required');
      return;
    }
    try {
      setLoading(true);
      const data = {
        ...form,
        semester: form.semester ? parseInt(form.semester) : undefined,
        credits: parseInt(form.credits),
        maxStudents: parseInt(form.maxStudents)
      };
      const res = await courseApi.create(data);
      toast.success('Course created successfully');
      router.push(`/courses/${res.data.data.course._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LMSLayout pageTitle="Create Course" breadcrumbs={[{ label: 'Edyra' }, { label: 'Courses', href: '/courses' }, { label: 'Create' }]}>
      <form onSubmit={handleSubmit} style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="lms-section">
          <div className="lms-section-title">Course Details</div>
          
          <div style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="lms-form-group">
                <label className="lms-label">Course Title *</label>
                <input name="title" value={form.title} onChange={handleChange} required className="lms-input" placeholder="e.g. Data Structures" />
              </div>
              <div className="lms-form-group">
                <label className="lms-label">Course Code *</label>
                <input name="code" value={form.code} onChange={handleChange} required className="lms-input" placeholder="e.g. CS201" style={{ textTransform: 'uppercase' }} />
              </div>
            </div>

            <div className="lms-form-group" style={{ marginTop: 16 }}>
              <label className="lms-label">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="lms-textarea" placeholder="Course description..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
              <div className="lms-form-group">
                <label className="lms-label">Department</label>
                <input name="department" value={form.department} onChange={handleChange} className="lms-input" />
              </div>
              <div className="lms-form-group">
                <label className="lms-label">Semester</label>
                <input name="semester" type="number" min="1" max="10" value={form.semester} onChange={handleChange} className="lms-input" />
              </div>
              <div className="lms-form-group">
                <label className="lms-label">Credits</label>
                <input name="credits" type="number" min="1" max="10" value={form.credits} onChange={handleChange} className="lms-input" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
              <div className="lms-form-group">
                <label className="lms-label">Category</label>
                <input name="category" value={form.category} onChange={handleChange} className="lms-input" />
              </div>
              <div className="lms-form-group">
                <label className="lms-label">Max Students</label>
                <input name="maxStudents" type="number" value={form.maxStudents} onChange={handleChange} className="lms-input" />
              </div>
              <div className="lms-form-group">
                <label className="lms-label">Enrollment Type</label>
                <select name="enrollmentType" value={form.enrollmentType} onChange={handleChange} className="lms-input">
                  <option value="open">Open</option>
                  <option value="approval">Approval Required</option>
                  <option value="invite-only">Invite Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="lms-form-actions" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" onClick={() => router.back()} className="lms-btn lms-btn-default">Cancel</button>
          <button type="submit" disabled={loading} className="lms-btn lms-btn-primary">
            {loading ? 'Creating...' : ' Create Course'}
          </button>
        </div>
      </form>
    </LMSLayout>
  );
}
