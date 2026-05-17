'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function StudentAssignmentPage() {
  const { assignmentId } = useParams();
  const router = useRouter();
  const [assignment, setAssignment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [textContent, setTextContent] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get(`/assignments/${assignmentId}`);
        setAssignment(response.data.data.assignment);
        setSubmission(response.data.data.submission);
        if (response.data.data.submission) {
          setTextContent(response.data.data.submission.textContent || '');
        }
      } catch (err) {
        console.error('Failed to fetch assignment:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [assignmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim()) {
      toast.error('Please enter your submission content.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/assignments/${assignmentId}/submit`, { textContent });
      toast.success('Assignment submitted successfully!');
      router.push(`/student/course/${assignment.course._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LMSLayout pageTitle="Loading Assignment..."><div className="lms-loading">Loading...</div></LMSLayout>;
  if (!assignment) return <LMSLayout pageTitle="Not Found"><div className="lms-alert lms-alert-error">Assignment not found.</div></LMSLayout>;

  const isClosed = new Date() > new Date(assignment.dueDate) && !assignment.lateSubmissionAllowed;

  return (
    <LMSLayout pageTitle={assignment.title} breadcrumbs={[{ label: 'Dashboard', href: '/student/dashboard' }, { label: 'Course', href: `/student/course/${assignment.course._id}` }, { label: 'Assignment' }]}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>
        <div className="lms-main-col">
          <div className="lms-section">
            <div className="lms-section-title">Instructions</div>
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 16, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{assignment.description}</div>
              {assignment.instructions && (
                <div style={{ marginTop: 20, padding: 16, background: '#f8f9fa', borderRadius: 8, borderLeft: '4px solid var(--primary)' }}>
                  <h4 style={{ margin: '0 0 10px' }}>Specific Instructions:</h4>
                  <div style={{ fontSize: 14 }}>{assignment.instructions}</div>
                </div>
              )}
            </div>
          </div>

          <div className="lms-section" style={{ marginTop: 24 }}>
            <div className="lms-section-title">Submission</div>
            <div style={{ padding: 24 }}>
              {submission && submission.status !== 'resubmit' ? (
                <div className="lms-alert lms-alert-info">
                  <strong>Assignment Submitted</strong>
                  <p>You submitted this assignment on {format(new Date(submission.submittedAt || submission.createdAt), 'dd/MM/yyyy HH:mm')}.</p>
                  {submission.status === 'graded' && (
                    <div style={{ marginTop: 12, padding: 12, background: 'var(--success-bg)', borderRadius: 4 }}>
                      <strong>Grade: {submission.marks} / {assignment.totalMarks}</strong>
                      <p style={{ margin: '4px 0 0' }}>Feedback: {submission.feedback || 'No feedback provided.'}</p>
                    </div>
                  )}
                </div>
              ) : isClosed ? (
                <div className="lms-alert lms-alert-error">
                  This assignment is closed for submissions. The deadline was {format(new Date(assignment.dueDate), 'dd/MM/yyyy HH:mm')}.
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="lms-form-group">
                    <label className="lms-label">Your Response / Notes</label>
                    <textarea 
                      className="lms-input" 
                      rows={10} 
                      value={textContent} 
                      onChange={e => setTextContent(e.target.value)}
                      placeholder="Type your submission here..."
                      disabled={submitting}
                    />
                  </div>
                  <div className="lms-form-group">
                    <label className="lms-label">Upload Files (Optional)</label>
                    <input type="file" className="lms-input" disabled={submitting} />
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      Accepted formats: {assignment.allowedFileTypes?.join(', ') || 'Any'}. Max size: {assignment.maxFileSize || 10}MB.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                    <button type="submit" className="lms-btn lms-btn-primary" disabled={submitting}>
                      {submitting ? 'Submitting...' : submission ? 'Re-submit Assignment' : 'Submit Assignment'}
                    </button>
                    <Link href={`/student/course/${assignment.course._id}`} className="lms-btn">Cancel</Link>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="lms-sidebar-col">
          <div className="lms-section">
            <div className="lms-section-title">Submission Status</div>
            <div style={{ padding: 20 }}>
              <div className="lms-info-row" style={{ marginBottom: 12 }}>
                <div className="lms-info-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status</div>
                <div className="lms-info-value" style={{ fontWeight: 600 }}>
                  {submission ? submission.status.toUpperCase() : 'NOT SUBMITTED'}
                </div>
              </div>
              <div className="lms-info-row" style={{ marginBottom: 12 }}>
                <div className="lms-info-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Grading Status</div>
                <div className="lms-info-value" style={{ fontWeight: 600 }}>
                  {submission?.status === 'graded' ? 'GRADED' : 'NOT GRADED'}
                </div>
              </div>
              <div className="lms-info-row" style={{ marginBottom: 12 }}>
                <div className="lms-info-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Due Date</div>
                <div className="lms-info-value" style={{ fontWeight: 600, color: 'var(--danger)' }}>
                  {format(new Date(assignment.dueDate), 'eeee, MMM dd, HH:mm')}
                </div>
              </div>
              <div className="lms-info-row">
                <div className="lms-info-label" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Time Remaining</div>
                <div className="lms-info-value" style={{ fontWeight: 600 }}>
                  {isClosed ? 'Expired' : 'Active'}
                </div>
              </div>
            </div>
          </div>

          <div className="lms-section" style={{ marginTop: 24 }}>
            <div className="lms-section-title">Grading Rubric</div>
            <div style={{ padding: 20 }}>
              {assignment.rubric?.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No rubric defined.</div>
              ) : assignment.rubric?.map((item: any, i: number) => (
                <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
                    <span>{item.criterion}</span>
                    <span>{item.maxScore} pts</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{item.description}</div>
                </div>
              ))}
              <div style={{ textAlign: 'right', fontWeight: 700, marginTop: 10 }}>Total: {assignment.totalMarks} points</div>
            </div>
          </div>
        </div>
      </div>
    </LMSLayout>
  );
}
