'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import SidebarLayout from '@/components/layouts/SidebarLayout';
import { useAuthStore } from '@/store/authStore';
import { assignmentApi } from '@/lib/edyraApi';
import toast from 'react-hot-toast';

export default function AssignmentDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitNote, setSubmitNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeForm, setGradeForm] = useState({ marks: '', feedback: '' });

  const isStaff = ['admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant'].includes(user?.role || '');

  useEffect(() => { if (id) fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await assignmentApi.get(id as string);
      setAssignment(res.data.data.assignment);
      if (isStaff) {
        const subRes = await assignmentApi.getSubmissions(id as string);
        setSubmissions(subRes.data.data.submissions || []);
      }
    } catch (err: any) {
      toast.error('Failed to load assignment');
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await assignmentApi.submit(id as string, { notes: submitNote });
      toast.success('Assignment submitted!');
      setSubmitNote('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  const handleGrade = async (submissionId: string) => {
    if (!gradeForm.marks) { toast.error('Enter marks'); return; }
    try {
      await assignmentApi.grade(submissionId, { marks: parseInt(gradeForm.marks), feedback: gradeForm.feedback });
      toast.success('Graded successfully');
      setGradingId(null);
      setGradeForm({ marks: '', feedback: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Grading failed');
    }
  };

  if (loading) return <SidebarLayout><div className="text-center py-12 text-gray-500">Loading...</div></SidebarLayout>;
  if (!assignment) return <SidebarLayout><div className="text-center py-12 text-gray-500">Not found</div></SidebarLayout>;

  const isPastDue = new Date(assignment.dueDate) < new Date();
  const mySubmission = assignment.mySubmission;

  return (
    <SidebarLayout breadcrumbs={[{ label: 'EDYRA' }, { label: 'Assignments', href: '/assignments' }, { label: assignment.title }]}>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded">{assignment.type}</span>
            <span className={`px-2 py-1 text-xs rounded ${isPastDue ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'}`}>
              {isPastDue ? 'Past Due' : 'Open'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{assignment.title}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>Due: {new Date(assignment.dueDate).toLocaleString()}</span>
            <span>Marks: {assignment.totalMarks}</span>
            <span>Pass: {assignment.passingMarks}</span>
            {assignment.lateSubmissionAllowed && <span>Late penalty: {assignment.latePenaltyPercent}%</span>}
          </div>
          {assignment.description && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{assignment.description}</div>
          )}
        </div>

        {/* Rubric */}
        {assignment.rubric && assignment.rubric.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Grading Rubric</h2>
            <table className="w-full text-sm">
              <thead><tr className="border-b dark:border-gray-700">
                <th className="text-left py-2 text-gray-500">Criteria</th>
                <th className="text-left py-2 text-gray-500">Max Marks</th>
                <th className="text-left py-2 text-gray-500">Description</th>
              </tr></thead>
              <tbody>
                {assignment.rubric.map((r: any, i: number) => (
                  <tr key={i} className="border-b dark:border-gray-700">
                    <td className="py-2 text-gray-900 dark:text-white font-medium">{r.name}</td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">{r.maxMarks}</td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Student: My Submission */}
        {user?.role === 'student' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Submission</h2>
            {mySubmission ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs rounded ${mySubmission.status === 'graded' ? 'bg-green-100 text-green-700' : mySubmission.status === 'submitted' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {mySubmission.status}
                  </span>
                  <span className="text-sm text-gray-500">Submitted: {new Date(mySubmission.submittedAt).toLocaleString()}</span>
                </div>
                {mySubmission.marks !== undefined && mySubmission.marks !== null && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{mySubmission.marks}</span>
                    <span className="text-gray-500">/{assignment.totalMarks}</span>
                    {mySubmission.feedback && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{mySubmission.feedback}</p>}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <textarea value={submitNote} onChange={e => setSubmitNote(e.target.value)} placeholder="Add notes about your submission..." rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm" />
                <button onClick={handleSubmit} disabled={submitting || isPastDue}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50">
                  {submitting ? 'Submitting...' : isPastDue ? 'Past Due' : 'Submit Assignment'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Teacher: All Submissions */}
        {isStaff && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Submissions ({submissions.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-500 text-xs uppercase">Student</th>
                  <th className="text-left py-2 px-3 text-gray-500 text-xs uppercase">Submitted</th>
                  <th className="text-left py-2 px-3 text-gray-500 text-xs uppercase">Status</th>
                  <th className="text-left py-2 px-3 text-gray-500 text-xs uppercase">Marks</th>
                  <th className="text-left py-2 px-3 text-gray-500 text-xs uppercase">Actions</th>
                </tr></thead>
                <tbody>
                  {submissions.map((sub: any) => (
                    <tr key={sub._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="py-3 px-3 text-gray-900 dark:text-white">{sub.student?.firstName} {sub.student?.lastName}</td>
                      <td className="py-3 px-3 text-gray-500">{new Date(sub.submittedAt).toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 text-xs rounded ${sub.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{sub.status}</span>
                      </td>
                      <td className="py-3 px-3 text-gray-700 dark:text-gray-300">{sub.marks ?? '-'}/{assignment.totalMarks}</td>
                      <td className="py-3 px-3">
                        {sub.status !== 'graded' && (
                          <button onClick={() => { setGradingId(sub._id); setGradeForm({ marks: '', feedback: '' }); }}
                            className="px-3 py-1 text-xs bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg">Grade</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {submissions.length === 0 && <div className="text-center py-8 text-gray-400">No submissions yet</div>}
            </div>

            {/* Grading Inline */}
            {gradingId && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Grade Submission</h3>
                <div className="flex gap-3">
                  <input value={gradeForm.marks} onChange={e => setGradeForm(p => ({ ...p, marks: e.target.value }))} type="number" placeholder="Marks"
                    className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
                  <input value={gradeForm.feedback} onChange={e => setGradeForm(p => ({ ...p, feedback: e.target.value }))} placeholder="Feedback"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleGrade(gradingId)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Save Grade</button>
                  <button onClick={() => setGradingId(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 dark:text-gray-300">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
