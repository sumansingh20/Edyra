'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Category { _id: string; name: string; }

export default function FacultyExamCreatePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subject: '',
    description: '',
    category: '',
    duration: 60,
    totalMarks: 100,
    passingMarks: 40,
    startTime: '',
    endTime: '',
    instructions: '',
    negativeMarkingEnabled: false,
    negativeMarkingValue: 0.25,
    shuffleQuestions: true,
    shuffleOptions: true,
    allowReview: true,
    showCorrectAnswers: false,
    showMarks: true,
    maxAttempts: 1,
    accessCode: '',
    proctoring: true,
  });

  useEffect(() => {
    api.get('/admin/categories').then(r => setCategories(r.data.data.categories || [])).catch(() => {});
  }, []);

  const f = (k: keyof typeof form, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published' = 'draft') => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Exam title is required'); return; }
    if (!form.startTime || !form.endTime) { toast.error('Start and end time are required'); return; }
    if (new Date(form.endTime) <= new Date(form.startTime)) { toast.error('End time must be after start time'); return; }
    if (form.passingMarks > form.totalMarks) { toast.error('Passing marks cannot exceed total marks'); return; }

    setSubmitting(true);
    const tid = toast.loading(status === 'draft' ? 'Saving draft...' : 'Creating exam...');
    try {
      const res = await api.post('/admin/exams', { ...form, status });
      toast.dismiss(tid);
      toast.success(`Exam ${status === 'draft' ? 'saved as draft' : 'created'} successfully`);
      router.push(`/faculty/exam/manage/${res.data.data.exam._id}`);
    } catch (err: any) {
      toast.dismiss(tid);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to create exam');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LMSLayout pageTitle="Create Examination" breadcrumbs={[{ label: 'Dashboard', href: '/faculty/dashboard' }, { label: 'Exams', href: '/faculty/quiz/manage' }, { label: 'Create' }]}>
      <form onSubmit={(e) => handleSubmit(e, 'draft')}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>

          {/* Left column — details */}
          <div>
            <div className="lms-section">
              <div className="lms-section-title">Exam Details</div>
              <div style={{ padding: 24 }}>
                <div className="lms-form-group">
                  <label className="lms-label">Exam Title *</label>
                  <input className="lms-input" required value={form.title} onChange={e => f('title', e.target.value)} placeholder="e.g. Mid-Semester Examination — CS101" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="lms-form-group">
                    <label className="lms-label">Subject *</label>
                    <input className="lms-input" required value={form.subject} onChange={e => f('subject', e.target.value)} placeholder="e.g. Computer Science" />
                  </div>
                  <div className="lms-form-group">
                    <label className="lms-label">Category</label>
                    <select className="lms-input" value={form.category} onChange={e => f('category', e.target.value)}>
                      <option value="">-- Select Category --</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Description / Overview</label>
                  <textarea className="lms-input" rows={3} value={form.description} onChange={e => f('description', e.target.value)} placeholder="Brief description visible to students before they start..." />
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Student Instructions</label>
                  <textarea className="lms-input" rows={5} value={form.instructions} onChange={e => f('instructions', e.target.value)} placeholder="Instructions displayed on the exam briefing screen (rules, what to do, materials allowed, etc.)" />
                </div>
              </div>
            </div>

            {/* Timing */}
            <div className="lms-section" style={{ marginTop: 24 }}>
              <div className="lms-section-title">Timing &amp; Schedule</div>
              <div style={{ padding: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div className="lms-form-group">
                    <label className="lms-label">Duration (minutes) *</label>
                    <input type="number" className="lms-input" min={1} max={360} value={form.duration} onChange={e => f('duration', parseInt(e.target.value) || 60)} />
                  </div>
                  <div className="lms-form-group">
                    <label className="lms-label">Start Time *</label>
                    <input type="datetime-local" className="lms-input" value={form.startTime} onChange={e => f('startTime', e.target.value)} />
                  </div>
                  <div className="lms-form-group">
                    <label className="lms-label">End Time *</label>
                    <input type="datetime-local" className="lms-input" value={form.endTime} onChange={e => f('endTime', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="lms-section" style={{ marginTop: 24 }}>
              <div className="lms-section-title">🔒 Security &amp; Proctoring</div>
              <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { key: 'proctoring', label: 'Enable Proctoring Mode', desc: 'Full-screen lock, violation tracking' },
                  { key: 'shuffleQuestions', label: 'Randomize Question Order', desc: 'Each student gets questions in random order' },
                  { key: 'shuffleOptions', label: 'Randomize Options', desc: 'MCQ options appear in random order' },
                  { key: 'negativeMarkingEnabled', label: 'Negative Marking', desc: `Deduct ${form.negativeMarkingValue} per wrong answer` },
                  { key: 'allowReview', label: 'Allow Answer Review', desc: 'Students can revisit questions before submitting' },
                  { key: 'showCorrectAnswers', label: 'Show Correct Answers', desc: 'Display correct answers after submission' },
                ].map(opt => (
                  <label key={opt.key} style={{ display: 'flex', gap: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: (form as any)[opt.key] ? '#f0f8ff' : '#fff' }}>
                    <input type="checkbox" checked={(form as any)[opt.key]} onChange={e => f(opt.key as keyof typeof form, e.target.checked)} style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div style={{ padding: '0 24px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {form.negativeMarkingEnabled && (
                  <div className="lms-form-group" style={{ marginBottom: 0 }}>
                    <label className="lms-label">Negative Marking Value</label>
                    <input type="number" className="lms-input" step={0.25} min={0} max={1} value={form.negativeMarkingValue} onChange={e => f('negativeMarkingValue', parseFloat(e.target.value))} />
                  </div>
                )}
                <div className="lms-form-group" style={{ marginBottom: 0 }}>
                  <label className="lms-label">Access Code (Optional)</label>
                  <input className="lms-input" value={form.accessCode} onChange={e => f('accessCode', e.target.value)} placeholder="Leave blank for open access" />
                </div>
              </div>
            </div>
          </div>

          {/* Right column — marks & actions */}
          <div>
            <div className="lms-section">
              <div className="lms-section-title">Grading Configuration</div>
              <div style={{ padding: 20 }}>
                <div className="lms-form-group">
                  <label className="lms-label">Total Marks</label>
                  <input type="number" className="lms-input" min={1} value={form.totalMarks} onChange={e => f('totalMarks', parseInt(e.target.value) || 100)} />
                  <span className="lms-form-hint">Will be recalculated from questions when published</span>
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Passing Marks</label>
                  <input type="number" className="lms-input" min={0} value={form.passingMarks} onChange={e => f('passingMarks', parseInt(e.target.value) || 40)} />
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Max Attempts</label>
                  <select className="lms-input" value={form.maxAttempts} onChange={e => f('maxAttempts', parseInt(e.target.value))}>
                    {[1, 2, 3, 5].map(n => <option key={n} value={n}>{n} attempt{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Show Marks to Students</label>
                  <select className="lms-input" value={form.showMarks ? 'yes' : 'no'} onChange={e => f('showMarks', e.target.value === 'yes')}>
                    <option value="yes">Yes — show marks after submission</option>
                    <option value="no">No — hide results</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="lms-section" style={{ marginTop: 16 }}>
              <div className="lms-section-title">Save &amp; Publish</div>
              <div style={{ padding: 20 }}>
                <div className="lms-alert lms-alert-info" style={{ marginBottom: 16 }}>
                  <strong>Next Step:</strong> After creating the exam, add questions from the Question Bank or create them manually.
                </div>
                <button type="submit" className="lms-btn lms-btn-default" style={{ width: '100%', marginBottom: 10 }} disabled={submitting}>
                  {submitting ? 'Saving...' : '💾 Save as Draft'}
                </button>
                <button type="button" className="lms-btn lms-btn-primary" style={{ width: '100%' }} disabled={submitting}
                  onClick={(e) => handleSubmit(e as any, 'published')}>
                  {submitting ? 'Publishing...' : '🚀 Create & Proceed to Questions'}
                </button>
                <button type="button" className="lms-btn" style={{ width: '100%', marginTop: 10 }} onClick={() => router.back()} disabled={submitting}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </LMSLayout>
  );
}
