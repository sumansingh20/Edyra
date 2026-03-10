'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/layouts/SidebarLayout';
import { gradebookApi } from '@/lib/edyraApi';
import toast from 'react-hot-toast';

export default function TranscriptPage() {
  const [loading, setLoading] = useState(true);
  const [transcript, setTranscript] = useState<any>(null);

  useEffect(() => { fetchTranscript(); }, []);

  const fetchTranscript = async () => {
    try {
      setLoading(true);
      const res = await gradebookApi.transcript();
      setTranscript(res.data.data);
    } catch (err: any) {
      toast.error('Failed to load transcript');
    } finally { setLoading(false); }
  };

  if (loading) return <SidebarLayout><div className="text-center py-12 text-gray-500">Loading transcript...</div></SidebarLayout>;
  if (!transcript) return <SidebarLayout><div className="text-center py-12 text-gray-500">Transcript not available</div></SidebarLayout>;

  const student = transcript.student || {};
  const semesters = transcript.semesters || [];

  return (
    <SidebarLayout breadcrumbs={[{ label: 'EDYRA' }, { label: 'Gradebook', href: '/gradebook' }, { label: 'Transcript' }]}>
      <div className="max-w-4xl mx-auto space-y-6 print:space-y-4">
        {/* Actions */}
        <div className="flex justify-end gap-3 print:hidden">
          <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Print Transcript</button>
          <button onClick={() => toast('PDF generation coming soon')} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300">Download PDF</button>
        </div>

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center print:border-none">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">EDYRA Academic Learning Management System</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">Official Academic Transcript</p>
          <hr className="my-4 border-gray-200 dark:border-gray-700" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-left">
            <div><span className="text-gray-500">Name:</span><p className="font-medium text-gray-900 dark:text-white">{student.firstName} {student.lastName}</p></div>
            <div><span className="text-gray-500">Roll No:</span><p className="font-medium text-gray-900 dark:text-white">{student.rollNumber || student.studentId || '-'}</p></div>
            <div><span className="text-gray-500">Department:</span><p className="font-medium text-gray-900 dark:text-white">{student.department || '-'}</p></div>
            <div><span className="text-gray-500">Program:</span><p className="font-medium text-gray-900 dark:text-white">{student.program || 'B.Tech'}</p></div>
          </div>
        </div>

        {/* Semester-wise Grades */}
        {semesters.length > 0 ? semesters.map((sem: any, sIdx: number) => (
          <div key={sIdx} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden print:break-inside-avoid">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Semester {sem.semester || sIdx + 1}</h3>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b dark:border-gray-700">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Code</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Course Title</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Credits</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Grade</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Grade Points</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {(sem.courses || []).map((c: any, cIdx: number) => (
                  <tr key={cIdx}>
                    <td className="px-4 py-2 font-mono text-gray-600 dark:text-gray-400">{c.code || '-'}</td>
                    <td className="px-4 py-2 text-gray-900 dark:text-white">{c.title || '-'}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{c.credits || '-'}</td>
                    <td className="px-4 py-2 font-bold text-blue-700 dark:text-blue-300">{c.grade || '-'}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{c.gradePoint ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 text-sm text-right">
              <span className="text-gray-500 mr-4">Credits: {sem.totalCredits || '-'}</span>
              <span className="font-semibold text-gray-900 dark:text-white">SGPA: {sem.sgpa ?? '-'}</span>
            </div>
          </div>
        )) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <table className="w-full text-sm">
              <thead><tr className="border-b dark:border-gray-700">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Code</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Course</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Credits</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Grade</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Points</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {(transcript.grades || []).map((g: any, i: number) => (
                  <tr key={i}>
                    <td className="px-4 py-2 font-mono text-gray-600 dark:text-gray-400">{g.course?.code || '-'}</td>
                    <td className="px-4 py-2 text-gray-900 dark:text-white">{g.course?.title || '-'}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{g.course?.credits || '-'}</td>
                    <td className="px-4 py-2 font-bold text-blue-700 dark:text-blue-300">{g.grade || '-'}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{g.gradePoint ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Cumulative */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center print:break-inside-avoid">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Total Credits Earned</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{transcript.totalCredits || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cumulative GPA (CGPA)</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{transcript.cgpa ?? '-'}</p>
            </div>
          </div>
          <p className="mt-6 text-xs text-gray-400">This is a system-generated transcript from EDYRA Academic LMS. Generated on {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </SidebarLayout>
  );
}
