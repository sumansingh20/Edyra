'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface AssignmentData {
  _id: string; title: string; totalMarks: number; dueDate: string;
  status: string; course: { title: string; _id: string };
}

interface Sub {
  _id: string; student: { _id: string; firstName: string; lastName: string; email: string; studentId?: string };
  textContent?: string; status: string; submittedAt?: string; marks?: number;
  percentage?: number; feedback?: string; gradedAt?: string; gradedBy?: { firstName: string; lastName: string };
}

export default function FacultySubmissionsPage() {
  const { assignmentId } = useParams();
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [submissions, setSubmissions] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Sub | null>(null);
  const [gradeForm, setGradeForm] = useState({ marks: '', feedback: '' });
  const [grading, setGrading] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/assignments/${assignmentId}/submissions`);
      setAssignment(res.data.data.assignment);
      setSubmissions(res.data.data.submissions || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load submissions');
    } finally { setLoading(false); }
  }, [assignmentId]);

  useEffect(() => { load(); }, [load]);

  const openGrade = (sub: Sub) => {
    setSelected(sub);
    setGradeForm({ marks: sub.marks?.toString() || '', feedback: sub.feedback || '' });
  };

  const submitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !gradeForm.marks) { toast.error('Please enter marks'); return; }
    const marks = parseFloat(gradeForm.marks);
    if (isNaN(marks) || marks < 0) { toast.error('Invalid marks'); return; }
    if (assignment && marks > assignment.totalMarks) { toast.error(`Marks cannot exceed ${assignment.totalMarks}`); return; }

    setGrading(true);
    try {
      await api.put(`/assignments/${assignmentId}/submissions/${selected._id}/grade`, {
        marks, feedback: gradeForm.feedback,
      });
      toast.success('Grade submitted successfully');
      setSelected(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Grading failed');
    } finally { setGrading(false); }
  };

  const releaseGrades = async () => {
    try {
      await api.post(`/assignments/${assignmentId}/release-grades`);
      toast.success('Grades released to students');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to release grades');
    }
  };

  const filtered = submissions.filter(s =>
    `${s.student?.firstName} ${s.student?.lastName} ${s.student?.email} ${s.student?.studentId}`.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: submissions.length,
    graded: submissions.filter(s => s.status === 'graded').length,
    pending: submissions.filter(s => s.status === 'submitted').length,
    avgMark: submissions.filter(s => s.marks !== undefined).length
      ? Math.round(submissions.filter(s => s.marks !== undefined).reduce((a, s) => a + (s.marks || 0), 0) / submissions.filter(s => s.marks !== undefined).length * 10) / 10 : 0,
  };

  return (
    <LMSLayout pageTitle={assignment ? `Submissions: ${assignment.title}` : 'Submissions'}
      breadcrumbs={[{ label: 'Dashboard', href: '/faculty/dashboard' }, { label: 'Assignment Submissions' }]}>

      {/* Stats */}
      <div className="lms-stats-row" style={{ marginBottom: 20 }}>
        <div className="lms-stat"><div className="lms-stat-value">{stats.total}</div><div className="lms-stat-label">Total Submissions</div></div>
        <div className="lms-stat"><div className="lms-stat-value" style={{ color: 'var(--success)' }}>{stats.graded}</div><div className="lms-stat-label">Graded</div></div>
        <div className="lms-stat"><div className="lms-stat-value" style={{ color: 'var(--warning)' }}>{stats.pending}</div><div className="lms-stat-label">Pending Review</div></div>
        <div className="lms-stat"><div className="lms-stat-value" style={{ color: 'var(--primary)' }}>{stats.avgMark}</div><div className="lms-stat-label">Average Marks</div></div>
      </div>

      {/* Toolbar */}
      <div className="lms-section" style={{ marginBottom: 16 }}>
        <div style={{ padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="lms-input" style={{ flex: 1, minWidth: 200, maxWidth: 340 }} placeholder="Search by name, email, or student ID..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Due: {assignment?.dueDate ? format(new Date(assignment.dueDate), 'dd/MM/yyyy HH:mm') : '—'} &nbsp;|&nbsp; Max Marks: {assignment?.totalMarks}
          </div>
          {stats.graded > 0 && stats.pending === 0 && (
            <button className="lms-btn lms-btn-sm lms-btn-success" onClick={releaseGrades}>
              📣 Release All Grades
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="lms-section">
        <div className="lms-section-title">Student Submissions</div>
        {loading ? (
          <div className="lms-loading">Loading submissions...</div>
        ) : filtered.length === 0 ? (
          <div className="lms-table-empty">No submissions found. {search && 'Try a different search.'}</div>
        ) : (
          <div className="lms-table-container">
            <table className="lms-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Submitted</th>
                  <th>Marks</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.student?.firstName} {s.student?.lastName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.student?.email}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.student?.studentId || '—'}</td>
                    <td style={{ fontSize: 12 }}>
                      {s.submittedAt ? format(new Date(s.submittedAt), 'dd/MM/yyyy HH:mm') : '—'}
                    </td>
                    <td>
                      {s.marks !== undefined
                        ? <span style={{ fontWeight: 700 }}>{s.marks} / {assignment?.totalMarks}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>Not graded</span>}
                    </td>
                    <td>
                      <span className={`lms-status ${s.status === 'graded' ? 'lms-status-active' : s.status === 'submitted' ? 'lms-status-pending' : ''}`}>
                        {s.status?.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button className="lms-btn lms-btn-sm lms-btn-primary" onClick={() => openGrade(s)}>
                        {s.status === 'graded' ? 'Re-grade' : 'Grade'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grade Modal */}
      {selected && (
        <div className="lms-modal-overlay">
          <div className="lms-modal" style={{ maxWidth: 600, width: '100%' }}>
            <div className="lms-modal-header">
              Grade Submission — {selected.student?.firstName} {selected.student?.lastName}
            </div>
            <form onSubmit={submitGrade}>
              <div className="lms-modal-body">
                {/* Submission content */}
                {selected.textContent && (
                  <div style={{ marginBottom: 20, padding: 16, background: '#f8f9fa', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Student Submission:</div>
                    <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto' }}>{selected.textContent}</div>
                  </div>
                )}
                <div className="lms-form-group">
                  <label className="lms-label">Marks Awarded (out of {assignment?.totalMarks}) *</label>
                  <input type="number" className="lms-input" required min={0} max={assignment?.totalMarks}
                    value={gradeForm.marks} onChange={e => setGradeForm(f => ({ ...f, marks: e.target.value }))} />
                  {gradeForm.marks && assignment && (
                    <span className="lms-form-hint">
                      {((parseFloat(gradeForm.marks) / assignment.totalMarks) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="lms-form-group">
                  <label className="lms-label">Feedback (Optional)</label>
                  <textarea className="lms-input" rows={4} value={gradeForm.feedback}
                    onChange={e => setGradeForm(f => ({ ...f, feedback: e.target.value }))}
                    placeholder="Provide constructive feedback to the student..." />
                </div>
              </div>
              <div className="lms-modal-footer">
                <button type="button" className="lms-btn" onClick={() => setSelected(null)} disabled={grading}>Cancel</button>
                <button type="submit" className="lms-btn lms-btn-primary" disabled={grading}>
                  {grading ? 'Saving Grade...' : '✓ Submit Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </LMSLayout>
  );
}
