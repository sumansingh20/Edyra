'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LMSLayout from '@/components/layouts/LMSLayout';
import { assignmentApi } from '@/lib/edyraApi';
import toast from 'react-hot-toast';

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    course: '', title: '', description: '', type: 'homework',
    totalMarks: '100', passingMarks: '40', dueDate: '',
    lateSubmissionAllowed: false, latePenaltyPercent: '10',
    maxFileSize: '10', allowedFileTypes: 'pdf,docx,zip,py,js',
  });
  const [rubric, setRubric] = useState<{ name: string; maxMarks: string; description: string }[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const addRubricItem = () => setRubric(prev => [...prev, { name: '', maxMarks: '', description: '' }]);
  const removeRubricItem = (idx: number) => setRubric(prev => prev.filter((_, i) => i !== idx));
  const updateRubricItem = (idx: number, field: string, value: string) => {
    setRubric(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.course || !form.dueDate) {
      toast.error('Title, Course, and Due Date are required');
      return;
    }
    try {
      setLoading(true);
      const data = {
        ...form,
        totalMarks: parseInt(form.totalMarks),
        passingMarks: parseInt(form.passingMarks),
        maxFileSize: parseInt(form.maxFileSize) * 1024 * 1024,
        allowedFileTypes: form.allowedFileTypes.split(',').map(t => t.trim()),
        rubric: rubric.map(r => ({ ...r, maxMarks: parseInt(r.maxMarks) || 0 })),
      };
      await assignmentApi.create(data);
      toast.success('Assignment created');
      router.push('/assignments');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LMSLayout pageTitle="Create Assignment" breadcrumbs={[{ label: 'Edyra' }, { label: 'Assignments', href: '/assignments' }, { label: 'Create' }]}>
      <form onSubmit={handleSubmit} style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="lms-section">
          <div className="lms-section-title">Assignment Details</div>
          <div style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="lms-form-group">
                <label className="lms-label">Course ID *</label>
                <input name="course" value={form.course} onChange={handleChange} required className="lms-input" placeholder="Course ObjectId" />
              </div>
              <div className="lms-form-group">
                <label className="lms-label">Type</label>
                <select name="type" value={form.type} onChange={handleChange} className="lms-input">
                  <option value="homework">Homework</option>
                  <option value="project">Project</option>
                  <option value="lab-report">Lab Report</option>
                  <option value="research">Research</option>
                  <option value="presentation">Presentation</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="lms-form-group" style={{ marginTop: 16 }}>
              <label className="lms-label">Title *</label>
              <input name="title" value={form.title} onChange={handleChange} required className="lms-input" />
            </div>

            <div className="lms-form-group" style={{ marginTop: 16 }}>
              <label className="lms-label">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="lms-textarea" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
              <div className="lms-form-group">
                <label className="lms-label">Total Marks</label>
                <input name="totalMarks" type="number" value={form.totalMarks} onChange={handleChange} className="lms-input" />
              </div>
              <div className="lms-form-group">
                <label className="lms-label">Passing Marks</label>
                <input name="passingMarks" type="number" value={form.passingMarks} onChange={handleChange} className="lms-input" />
              </div>
              <div className="lms-form-group">
                <label className="lms-label">Due Date *</label>
                <input name="dueDate" type="datetime-local" value={form.dueDate} onChange={handleChange} required className="lms-input" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
              <div className="lms-form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
                <input name="lateSubmissionAllowed" type="checkbox" checked={form.lateSubmissionAllowed} onChange={handleChange} />
                <label className="lms-label" style={{ marginBottom: 0 }}>Allow Late Submission</label>
              </div>
              {form.lateSubmissionAllowed ? (
                <div className="lms-form-group">
                  <label className="lms-label">Late Penalty %</label>
                  <input name="latePenaltyPercent" type="number" value={form.latePenaltyPercent} onChange={handleChange} className="lms-input" />
                </div>
              ) : <div />}
              <div className="lms-form-group">
                <label className="lms-label">Max File Size (MB)</label>
                <input name="maxFileSize" type="number" value={form.maxFileSize} onChange={handleChange} className="lms-input" />
              </div>
            </div>

            <div className="lms-form-group" style={{ marginTop: 16 }}>
              <label className="lms-label">Allowed File Types (comma separated)</label>
              <input name="allowedFileTypes" value={form.allowedFileTypes} onChange={handleChange} className="lms-input" />
            </div>
          </div>
        </div>

        {/* Rubric */}
        <div className="lms-section" style={{ marginTop: 24 }}>
          <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Grading Rubric</span>
            <button type="button" onClick={addRubricItem} className="lms-btn lms-btn-sm lms-btn-default">+ Add Criteria</button>
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {rubric.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#f8f9fa', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 100px 2fr', gap: 12 }}>
                    <input value={item.name} onChange={e => updateRubricItem(idx, 'name', e.target.value)} placeholder="Criteria name" className="lms-input" />
                    <input value={item.maxMarks} onChange={e => updateRubricItem(idx, 'maxMarks', e.target.value)} type="number" placeholder="Marks" className="lms-input" />
                    <input value={item.description} onChange={e => updateRubricItem(idx, 'description', e.target.value)} placeholder="Description" className="lms-input" />
                  </div>
                  <button type="button" onClick={() => removeRubricItem(idx)} className="lms-btn lms-btn-sm lms-btn-default" style={{ color: 'var(--danger)' }}>Remove</button>
                </div>
              ))}
              {rubric.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No rubric criteria added. Click "Add Criteria" to define grading rubric.</p>}
            </div>
          </div>
        </div>

        <div className="lms-form-actions" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" onClick={() => router.back()} className="lms-btn lms-btn-default">Cancel</button>
          <button type="submit" disabled={loading} className="lms-btn lms-btn-primary">
            {loading ? 'Creating...' : ' Create Assignment'}
          </button>
        </div>
      </form>
    </LMSLayout>
  );
}
