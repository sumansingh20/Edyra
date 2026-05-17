'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

import { Suspense } from 'react';

function FacultyAssignmentCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  const [courses, setCourses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: courseId || '',
    type: 'assignment',
    totalMarks: 100,
    dueDate: '',
    instructions: '',
    lateSubmissionAllowed: false,
    maxLatedays: 3,
    status: 'draft'
  });

  const [rubric, setRubric] = useState([{ criterion: '', maxScore: 0, description: '' }]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/courses');
        setCourses(response.data.data.courses);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      }
    };
    fetchCourses();
  }, []);

  const addRubricItem = () => {
    setRubric([...rubric, { criterion: '', maxScore: 0, description: '' }]);
  };

  const updateRubricItem = (index: number, field: string, value: any) => {
    const newRubric = [...rubric];
    (newRubric[index] as any)[field] = value;
    setRubric(newRubric);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.course) {
      toast.error('Please select a course');
      return;
    }

    try {
      const data = { ...formData, rubric: rubric.filter(r => r.criterion) };
      await api.post('/assignments', data);
      toast.success('Assignment created successfully');
      router.push(`/faculty/course/${formData.course}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create assignment');
    }
  };

  return (
    <LMSLayout pageTitle="Create Assignment" breadcrumbs={[{ label: 'Dashboard', href: '/faculty/dashboard' }, { label: 'Assignments', href: '/faculty/assignments' }, { label: 'Create' }]}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div className="lms-main-col">
            <div className="lms-section">
              <div className="lms-section-title">Assignment Details</div>
              <div style={{ padding: 24 }}>
                <div className="lms-form-group">
                  <label className="lms-label">Assignment Title</label>
                  <input className="lms-input" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Midterm Project, Week 4 Homework" />
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Description & Overview</label>
                  <textarea className="lms-input" rows={6} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe what students need to do..." />
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Specific Instructions (Internal)</label>
                  <textarea className="lms-input" rows={4} value={formData.instructions} onChange={e => setFormData({...formData, instructions: e.target.value})} placeholder="Any specific technical instructions..." />
                </div>
              </div>
            </div>

            <div className="lms-section" style={{ marginTop: 24 }}>
              <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Grading Rubric</span>
                <button type="button" className="lms-btn lms-btn-sm" onClick={addRubricItem}>+ Add Criterion</button>
              </div>
              <div style={{ padding: 24 }}>
                {rubric.map((item, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16, padding: 16, border: '1px solid var(--border)', borderRadius: 8 }}>
                    <div className="lms-form-group" style={{ marginBottom: 0 }}>
                      <label className="lms-label">Criterion Name</label>
                      <input className="lms-input" value={item.criterion} onChange={e => updateRubricItem(index, 'criterion', e.target.value)} placeholder="e.g. Code Quality, Logic, Documentation" />
                    </div>
                    <div className="lms-form-group" style={{ marginBottom: 0 }}>
                      <label className="lms-label">Max Score</label>
                      <input type="number" className="lms-input" value={item.maxScore} onChange={e => updateRubricItem(index, 'maxScore', parseInt(e.target.value))} />
                    </div>
                    <div className="lms-form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                      <label className="lms-label">Description (Optional)</label>
                      <input className="lms-input" value={item.description} onChange={e => updateRubricItem(index, 'description', e.target.value)} placeholder="What defines full marks in this criterion?" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lms-sidebar-col">
            <div className="lms-section">
              <div className="lms-section-title">Submission Settings</div>
              <div style={{ padding: 20 }}>
                <div className="lms-form-group">
                  <label className="lms-label">Select Course</label>
                  <select className="lms-input" required value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})}>
                    <option value="">-- Select Course --</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.code} - {c.title}</option>)}
                  </select>
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Due Date & Time</label>
                  <input type="datetime-local" className="lms-input" required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Total Marks</label>
                  <input type="number" className="lms-input" value={formData.totalMarks} onChange={e => setFormData({...formData, totalMarks: parseInt(e.target.value)})} />
                </div>
                <div className="lms-form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" checked={formData.lateSubmissionAllowed} onChange={e => setFormData({...formData, lateSubmissionAllowed: e.target.checked})} />
                  <label className="lms-label" style={{ marginBottom: 0 }}>Allow Late Submission</label>
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Status</label>
                  <select className="lms-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="draft">Draft (Private)</option>
                    <option value="published">Published (Visible to Students)</option>
                  </select>
                </div>

                <div style={{ marginTop: 24 }}>
                  <button type="submit" className="lms-btn lms-btn-primary" style={{ width: '100%' }}>Create Assignment</button>
                  <button type="button" className="lms-btn" style={{ width: '100%', marginTop: 10 }} onClick={() => router.back()}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </LMSLayout>
  );
}

export default function FacultyAssignmentCreatePage() {
  return (
    <Suspense fallback={<div className="lms-loading">Loading...</div>}>
      <FacultyAssignmentCreateContent />
    </Suspense>
  );
}
