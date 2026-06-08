'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import LMSLayout from '@/components/layouts/LMSLayout';
import { format } from 'date-fns';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate: string;
  maxMarks: number;
  allowLate?: boolean;
  allowedFileTypes?: string[];
  rubric?: { criterion: string; maxMarks: number }[];
  courseId?: any;
  submission?: Submission;
}

interface Submission {
  _id: string;
  status: string;
  submittedAt: string;
  files?: string[];
  textContent?: string;
  marksObtained?: number;
  feedback?: string;
  grade?: string;
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const assignmentId = params?.id as string;
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchAssignment = useCallback(async () => {
    if (!assignmentId) return;
    try {
      setLoading(true);
      const res = await api.get(`/assignments/${assignmentId}`);
      setAssignment(res.data?.data || res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load assignment');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => { fetchAssignment(); }, [fetchAssignment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent && files.length === 0) {
      setError('Please provide text content or upload files.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('textContent', textContent);
      files.forEach(f => formData.append('files', f));
      await api.post(`/assignments/${assignmentId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Assignment submitted successfully!');
      fetchAssignment();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...dropped]);
  };

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const now = new Date();
  const isOverdue = assignment ? new Date(assignment.dueDate) < now : false;
  const isSubmitted = !!assignment?.submission;

  if (loading) {
    return (
      <LMSLayout pageTitle="Assignment">
        <div className="lms-spinner"><div className="spinner" /><span>Loading...</span></div>
      </LMSLayout>
    );
  }

  if (!assignment) {
    return (
      <LMSLayout pageTitle="Assignment Not Found">
        <div className="lms-alert lms-alert-error"><div>{error || 'Assignment not found.'}</div></div>
        <Link href="/student/assignment" className="lms-btn lms-btn-default">← Back</Link>
      </LMSLayout>
    );
  }

  return (
    <LMSLayout
      pageTitle={assignment.title}
      breadcrumbs={[{ label: 'Assignments', href: '/student/assignment' }, { label: assignment.title }]}
    >
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Assignment Header */}
        <div className="lms-section animate-fadeInDown">
          <div style={{
            background: isSubmitted ? 'var(--success-bg)' : isOverdue ? 'var(--danger-bg)' : 'var(--info-bg)',
            borderBottom: '1px solid var(--border)', padding: '16px 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--nav-bg)', marginBottom: 4 }}>{assignment.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {typeof assignment.courseId === 'object' ? assignment.courseId?.title : 'Course'} · Max Marks: {assignment.maxMarks}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: isOverdue ? 'var(--danger)' : 'var(--text)' }}>
                Due: {assignment.dueDate ? format(new Date(assignment.dueDate), 'dd MMM yyyy, HH:mm') : '-'}
              </div>
              {isSubmitted ? (
                <span className="lms-status lms-status-active" style={{ marginTop: 4 }}> Submitted</span>
              ) : isOverdue ? (
                <span className="lms-status lms-status-closed" style={{ marginTop: 4 }}>Overdue</span>
              ) : (
                <span className="lms-status lms-status-pending" style={{ marginTop: 4 }}>Pending</span>
              )}
            </div>
          </div>

          <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Description</div>
              <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {assignment.description}
              </div>
            </div>

            {assignment.instructions && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Instructions</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {assignment.instructions}
                </div>
              </div>
            )}

            {assignment.rubric && assignment.rubric.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Grading Rubric</div>
                <table className="lms-table" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr><th>Criterion</th><th>Marks</th></tr>
                  </thead>
                  <tbody>
                    {assignment.rubric.map((r, i) => (
                      <tr key={i}>
                        <td>{r.criterion}</td>
                        <td>{r.maxMarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Submitted View */}
        {isSubmitted && assignment.submission && (
          <div className="lms-section animate-fadeIn">
            <div className="lms-section-title" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
               Your Submission
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Submitted At</div>
                  <div style={{ fontWeight: 600 }}>
                    {assignment.submission.submittedAt ? format(new Date(assignment.submission.submittedAt), 'dd MMM yyyy, HH:mm') : '-'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Status</div>
                  <span className={`lms-status ${assignment.submission.status === 'graded' ? 'lms-status-active' : 'lms-status-info'}`}>
                    {assignment.submission.status}
                  </span>
                </div>
                {assignment.submission.marksObtained !== undefined && (
                  <>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Marks Obtained</div>
                      <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--nav-bg)' }}>
                        {assignment.submission.marksObtained} / {assignment.maxMarks}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Grade</div>
                      <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--primary)' }}>
                        {assignment.submission.grade || '-'}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {assignment.submission.textContent && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Your Answer</div>
                  <div style={{
                    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                    padding: 12, fontSize: 13, lineHeight: 1.7, maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-wrap',
                  }}>
                    {assignment.submission.textContent}
                  </div>
                </div>
              )}

              {assignment.submission.feedback && (
                <div className="lms-alert lms-alert-info">
                  <div>
                    <div className="lms-alert-title"> Instructor Feedback</div>
                    <div>{assignment.submission.feedback}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submission Form */}
        {!isSubmitted && (
          <div className="lms-section animate-fadeIn">
            <div className="lms-section-title">
              {isOverdue ? ' Late Submission' : ' Submit Assignment'}
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 20 }}>
              {isOverdue && assignment.allowLate && (
                <div className="lms-alert lms-alert-warning" style={{ marginBottom: 16 }}>
                  <div>
                    <div className="lms-alert-title">Late Submission</div>
                    <div>This assignment is past the due date. Late submissions may be penalized.</div>
                  </div>
                </div>
              )}
              {isOverdue && !assignment.allowLate && (
                <div className="lms-alert lms-alert-error" style={{ marginBottom: 16 }}>
                  <div>
                    <div className="lms-alert-title">Submission Closed</div>
                    <div>This assignment no longer accepts submissions.</div>
                  </div>
                </div>
              )}

              {error && (
                <div className="lms-alert lms-alert-error" style={{ marginBottom: 16 }}>
                  <div>{error}</div>
                </div>
              )}
              {success && (
                <div className="lms-alert lms-alert-success" style={{ marginBottom: 16 }}>
                  <div>{success}</div>
                </div>
              )}

              {(!isOverdue || assignment.allowLate) && (
                <>
                  {/* Text Content */}
                  <div className="lms-form-group">
                    <label className="lms-label">Your Answer / Response</label>
                    <textarea
                      className="lms-textarea"
                      rows={8}
                      placeholder="Type your answer here..."
                      value={textContent}
                      onChange={e => setTextContent(e.target.value)}
                    />
                  </div>

                  {/* File Upload */}
                  <div className="lms-form-group">
                    <label className="lms-label">Attach Files (Optional)</label>
                    <div
                      className={`submission-zone ${dragging ? 'dragging' : ''}`}
                      onDragOver={e => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileRef.current?.click()}
                    >
                      <div style={{ fontSize: 32, marginBottom: 8 }}></div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Drag & drop files here</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        or click to browse · PDF, DOC, ZIP, Images
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        multiple
                        style={{ display: 'none' }}
                        onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
                      />
                    </div>
                    {files.length > 0 && (
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {files.map((f, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                            background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                            fontSize: 13,
                          }}>
                            <span></span>
                            <span style={{ flex: 1 }}>{f.name}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                              {(f.size / 1024).toFixed(0)} KB
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFile(i)}
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 16 }}
                            >×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <Link href="/student/assignment" className="lms-btn lms-btn-default">Cancel</Link>
                    <button type="submit" disabled={submitting} className="lms-btn lms-btn-primary">
                      {submitting ? ' Submitting...' : ' Submit Assignment'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        )}
      </div>
    </LMSLayout>
  );
}
