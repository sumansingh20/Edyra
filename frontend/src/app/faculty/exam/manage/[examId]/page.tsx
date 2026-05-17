'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface ExamData {
  _id: string; title: string; subject: string; status: string; duration: number;
  totalMarks: number; passingMarks: number; startTime: string; endTime: string;
  negativeMarkingEnabled: boolean; shuffleQuestions: boolean; proctoring: boolean;
  createdAt: string; questionsCount?: number; submissionsCount?: number;
}

interface Submission {
  _id: string; student: { firstName: string; lastName: string; email: string; studentId?: string };
  marksObtained: number; totalMarks: number; percentage: number; status: string;
  submittedAt: string; totalViolations: number;
}

interface Analytic {
  totalSubmissions: number; averageScore: number; highestScore: number;
  lowestScore: number; passRate: number; averageTime: number;
}

export default function FacultyExamManagePage() {
  const { examId } = useParams();
  const router = useRouter();
  const [exam, setExam] = useState<ExamData | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [analytics, setAnalytics] = useState<Analytic | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<'overview' | 'questions' | 'submissions' | 'analytics'>('overview');

  const load = useCallback(async () => {
    try {
      const [examRes, subsRes] = await Promise.allSettled([
        api.get(`/admin/exams/${examId}`),
        api.get(`/admin/exams/${examId}/submissions`),
      ]);
      if (examRes.status === 'fulfilled') {
        setExam(examRes.value.data.data.exam);
        setQuestions(examRes.value.data.data.questions || []);
      }
      if (subsRes.status === 'fulfilled') {
        setSubmissions(subsRes.value.data.data.submissions || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [examId]);

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await api.get(`/admin/exams/${examId}/analytics`);
      setAnalytics(res.data.data.stats);
    } catch { /* silent */ }
  }, [examId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === 'analytics') loadAnalytics(); }, [tab, loadAnalytics]);

  const handleAction = async (action: string, label: string) => {
    setActionLoading(action);
    const tid = toast.loading(`${label}...`);
    try {
      if (action === 'publish') await api.post(`/admin/exams/${examId}/publish`);
      else if (action === 'activate') await api.post(`/admin/exams/${examId}/activate`);
      else if (action === 'complete') await api.post(`/admin/exams/${examId}/complete`);
      else if (action === 'archive') await api.post(`/admin/exams/${examId}/archive`);
      else if (action === 'delete') {
        if (!window.confirm('Delete this exam? This cannot be undone.')) { toast.dismiss(tid); setActionLoading(null); return; }
        await api.delete(`/admin/exams/${examId}`);
        toast.dismiss(tid);
        toast.success('Exam deleted');
        router.push('/faculty/quiz/manage');
        return;
      }
      toast.dismiss(tid);
      toast.success(`${label} successful`);
      load();
    } catch (err: any) {
      toast.dismiss(tid);
      toast.error(err.response?.data?.error || `${label} failed`);
    } finally { setActionLoading(null); }
  };

  const exportResults = async () => {
    try {
      const res = await api.get(`/admin/exams/${examId}/export?format=csv`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `exam-results-${examId}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { draft: 'lms-status-pending', published: 'lms-status-info', ongoing: 'lms-status-active', completed: '', archived: 'lms-status-closed' };
    return <span className={`lms-status ${map[s] || ''}`}>{s?.toUpperCase()}</span>;
  };

  if (loading) return <LMSLayout pageTitle="Loading Exam..."><div className="lms-loading">Loading exam data...</div></LMSLayout>;
  if (!exam) return <LMSLayout pageTitle="Not Found"><div className="lms-alert lms-alert-error">Exam not found.</div></LMSLayout>;

  return (
    <LMSLayout pageTitle={exam.title} breadcrumbs={[{ label: 'Dashboard', href: '/faculty/dashboard' }, { label: 'Exams', href: '/faculty/quiz/manage' }, { label: 'Manage' }]}>

      {/* Header */}
      <div className="lms-section" style={{ marginBottom: 20 }}>
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{exam.title}</h2>
              {statusBadge(exam.status)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {exam.subject} • {exam.duration} min • {exam.totalMarks} marks • {questions.length} questions
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {exam.status === 'draft' && (
              <button className="lms-btn lms-btn-sm lms-btn-primary" disabled={!!actionLoading}
                onClick={() => handleAction('publish', 'Publishing exam')}>
                {actionLoading === 'publish' ? 'Publishing...' : '🚀 Publish'}
              </button>
            )}
            {exam.status === 'published' && (
              <button className="lms-btn lms-btn-sm lms-btn-success" disabled={!!actionLoading}
                onClick={() => handleAction('activate', 'Activating exam')}>
                {actionLoading === 'activate' ? 'Activating...' : '▶️ Activate'}
              </button>
            )}
            {exam.status === 'ongoing' && (
              <button className="lms-btn lms-btn-sm" disabled={!!actionLoading}
                onClick={() => handleAction('complete', 'Completing exam')}>
                {actionLoading === 'complete' ? 'Completing...' : '✅ Complete'}
              </button>
            )}
            {exam.status === 'completed' && (
              <button className="lms-btn lms-btn-sm" disabled={!!actionLoading}
                onClick={() => handleAction('archive', 'Archiving exam')}>
                {actionLoading === 'archive' ? 'Archiving...' : '📦 Archive'}
              </button>
            )}
            {submissions.length > 0 && (
              <button className="lms-btn lms-btn-sm" onClick={exportResults}>📥 Export CSV</button>
            )}
            {exam.status === 'draft' && (
              <button className="lms-btn lms-btn-sm lms-btn-danger" disabled={!!actionLoading}
                onClick={() => handleAction('delete', 'Deleting exam')}>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        {(['overview', 'questions', 'submissions', 'analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 20px', border: 'none', borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent', background: 'none', cursor: 'pointer', fontWeight: tab === t ? 700 : 400, fontSize: 14, color: tab === t ? 'var(--primary)' : 'var(--text-muted)', marginBottom: -2, textTransform: 'capitalize' }}>
            {t === 'overview' ? '📋 Overview' : t === 'questions' ? `❓ Questions (${questions.length})` : t === 'submissions' ? `📤 Submissions (${submissions.length})` : '📊 Analytics'}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {[
            { label: 'Status', val: <>{statusBadge(exam.status)}</> },
            { label: 'Duration', val: `${exam.duration} minutes` },
            { label: 'Total Marks', val: exam.totalMarks },
            { label: 'Passing Marks', val: exam.passingMarks },
            { label: 'Start Time', val: exam.startTime ? format(new Date(exam.startTime), 'dd/MM/yyyy HH:mm') : 'Not set' },
            { label: 'End Time', val: exam.endTime ? format(new Date(exam.endTime), 'dd/MM/yyyy HH:mm') : 'Not set' },
            { label: 'Questions', val: questions.length },
            { label: 'Submissions', val: submissions.length },
            { label: 'Proctoring', val: exam.proctoring ? '🔒 Enabled' : '🔓 Disabled' },
            { label: 'Shuffle Questions', val: exam.shuffleQuestions ? 'Yes' : 'No' },
            { label: 'Negative Marking', val: exam.negativeMarkingEnabled ? 'Yes' : 'No' },
            { label: 'Created', val: exam.createdAt ? format(new Date(exam.createdAt), 'dd/MM/yyyy') : 'N/A' },
          ].map(item => (
            <div key={item.label} className="lms-section" style={{ padding: 0 }}>
              <div style={{ padding: '14px 20px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>{item.label}</div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{item.val}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QUESTIONS */}
      {tab === 'questions' && (
        <div className="lms-section">
          <div className="lms-section-title" style={{ justifyContent: 'space-between' }}>
            <span>Question Bank ({questions.length})</span>
            {exam.status === 'draft' && (
              <Link href={`/admin/exams/${examId}/questions`} className="lms-btn lms-btn-sm lms-btn-primary">
                + Add Questions
              </Link>
            )}
          </div>
          {questions.length === 0 ? (
            <div className="lms-table-empty">No questions added. {exam.status === 'draft' && <span>Add questions to publish this exam.</span>}</div>
          ) : (
            <div className="lms-table-container">
              <table className="lms-table">
                <thead><tr><th>#</th><th>Question</th><th>Type</th><th>Marks</th></tr></thead>
                <tbody>
                  {questions.map((q, i) => (
                    <tr key={q._id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{i + 1}</td>
                      <td style={{ maxWidth: 500 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{q.questionText}</div></td>
                      <td><span className="lms-status lms-status-info" style={{ textTransform: 'uppercase', fontSize: 10 }}>{q.questionType}</span></td>
                      <td style={{ fontWeight: 700 }}>{q.marks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBMISSIONS */}
      {tab === 'submissions' && (
        <div className="lms-section">
          <div className="lms-section-title" style={{ justifyContent: 'space-between' }}>
            <span>Student Submissions ({submissions.length})</span>
            {submissions.length > 0 && <button className="lms-btn lms-btn-sm" onClick={exportResults}>📥 Export CSV</button>}
          </div>
          {submissions.length === 0 ? (
            <div className="lms-table-empty">No submissions yet.</div>
          ) : (
            <div className="lms-table-container">
              <table className="lms-table">
                <thead>
                  <tr><th>Student</th><th>Student ID</th><th>Score</th><th>Percentage</th><th>Status</th><th>Violations</th><th>Submitted</th><th>Detail</th></tr>
                </thead>
                <tbody>
                  {submissions.map(s => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 600 }}>{s.student?.firstName} {s.student?.lastName}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.student?.studentId || '—'}</td>
                      <td>{s.marksObtained} / {s.totalMarks}</td>
                      <td>
                        <span className={`lms-status ${(s.percentage || 0) >= (exam.passingMarks / exam.totalMarks * 100) ? 'lms-status-active' : 'lms-status-closed'}`}>
                          {(s.percentage || 0).toFixed(1)}%
                        </span>
                      </td>
                      <td><span className="lms-status lms-status-info" style={{ fontSize: 10 }}>{s.status}</span></td>
                      <td style={{ color: s.totalViolations > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>{s.totalViolations}</td>
                      <td style={{ fontSize: 12 }}>{s.submittedAt ? format(new Date(s.submittedAt), 'dd/MM HH:mm') : '—'}</td>
                      <td>
                        <Link href={`/admin/submissions/${s._id}`} className="lms-btn lms-btn-sm">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS */}
      {tab === 'analytics' && (
        analytics ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {[
              { label: 'Total Submissions', val: analytics.totalSubmissions },
              { label: 'Average Score', val: `${analytics.averageScore?.toFixed(1)}%` },
              { label: 'Highest Score', val: analytics.highestScore },
              { label: 'Lowest Score', val: analytics.lowestScore },
              { label: 'Pass Rate', val: `${analytics.passRate?.toFixed(1)}%` },
              { label: 'Avg Time Taken', val: `${Math.round((analytics.averageTime || 0) / 60)} min` },
            ].map(item => (
              <div key={item.label} className="lms-section">
                <div style={{ padding: '16px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)' }}>{item.val}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="lms-loading">Loading analytics...</div>
        )
      )}
    </LMSLayout>
  );
}
