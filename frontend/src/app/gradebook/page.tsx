'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SidebarLayout from '@/components/layouts/SidebarLayout';
import { useAuthStore } from '@/store/authStore';
import { gradebookApi } from '@/lib/edyraApi';
import toast from 'react-hot-toast';

export default function GradebookPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<any[]>([]);
  const [courseId, setCourseId] = useState('');
  const [courseGrades, setCourseGrades] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const isStaff = ['admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant'].includes(user?.role || '');

  useEffect(() => {
    if (!isStaff) fetchStudentGrades();
    else setLoading(false);
  }, []);

  const fetchStudentGrades = async () => {
    try {
      setLoading(true);
      const res = await gradebookApi.myGrades();
      const data = res.data.data;
      setGrades(data.grades || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      toast.error('Failed to load grades');
    } finally { setLoading(false); }
  };

  const fetchCourseGradebook = async () => {
    if (!courseId.trim()) { toast.error('Enter a Course ID'); return; }
    try {
      setLoading(true);
      const res = await gradebookApi.courseGradebook(courseId);
      setCourseGrades(res.data.data.grades || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load course gradebook');
    } finally { setLoading(false); }
  };

  const handleFinalize = async () => {
    try {
      await gradebookApi.finalize({ courseId });
      toast.success('Grades finalized');
      fetchCourseGradebook();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to finalize'); }
  };

  const handlePublish = async () => {
    try {
      await gradebookApi.publish({ courseId });
      toast.success('Grades published');
      fetchCourseGradebook();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to publish'); }
  };

  // Student View
  if (!isStaff) {
    const cgpa = summary?.cgpa ?? 0;
    const totalCredits = summary?.totalCredits ?? 0;
    return (
      <SidebarLayout pageTitle="My Grades" breadcrumbs={[{ label: 'EDYRA' }, { label: 'Gradebook' }]}>
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 border-l-4 border-l-blue-500">
              <p className="text-sm text-gray-500 dark:text-gray-400">CGPA</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{cgpa}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 border-l-4 border-l-green-500">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Credits</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalCredits}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 border-l-4 border-l-purple-500">
              <p className="text-sm text-gray-500 dark:text-gray-400">Courses Graded</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{grades.length}</p>
            </div>
          </div>

          {/* Grades Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">Grade Report</h2>
              <button onClick={() => router.push('/gradebook/transcript')} className="px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg">View Transcript</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">%</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {loading ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
                  ) : grades.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No grades yet</td></tr>
                  ) : grades.map((g: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">{g.course?.code || '-'}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{g.course?.title || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{g.course?.credits || '-'}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold rounded">{g.grade || '-'}</span></td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{g.gradePoint ?? '-'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{g.percentage != null ? `${g.percentage}%` : '-'}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded ${g.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{g.status || 'pending'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // Teacher/Admin View
  return (
    <SidebarLayout pageTitle="Course Gradebook" breadcrumbs={[{ label: 'EDYRA' }, { label: 'Gradebook' }]}>
      <div className="space-y-6">
        <div className="flex gap-3">
          <input value={courseId} onChange={e => setCourseId(e.target.value)} placeholder="Enter Course ID..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm" />
          <button onClick={fetchCourseGradebook} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Load</button>
        </div>

        {courseGrades.length > 0 && (
          <>
            <div className="flex gap-3 justify-end">
              <button onClick={handleFinalize} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm">Finalize Grades</button>
              <button onClick={handlePublish} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">Publish Grades</button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">%</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {courseGrades.map((g: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{g.student?.firstName} {g.student?.lastName}</td>
                        <td className="px-4 py-3 text-gray-500">{g.student?.rollNumber || '-'}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{g.totalMarks ?? '-'}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{g.percentage != null ? `${g.percentage}%` : '-'}</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold rounded">{g.grade || '-'}</span></td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{g.gradePoint ?? '-'}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded ${g.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{g.status || 'draft'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        {!loading && courseGrades.length === 0 && courseId && <div className="text-center py-8 text-gray-400">No grades found. Enter a valid Course ID and click Load.</div>}
      </div>
    </SidebarLayout>
  );
}
