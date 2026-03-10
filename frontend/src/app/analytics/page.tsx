'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/layouts/SidebarLayout';
import { useAuthStore } from '@/store/authStore';
import { analyticsApi } from '@/lib/edyraApi';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const isAdmin = ['admin', 'super-admin', 'institute-admin'].includes(user?.role || '');
  const isTeacher = user?.role === 'teacher' || user?.role === 'teaching-assistant';
  const isStudent = user?.role === 'student';

  return (
    <SidebarLayout pageTitle="Analytics Dashboard" breadcrumbs={[{ label: 'EDYRA' }, { label: 'Analytics' }]}>
      {isAdmin && <AdminAnalytics />}
      {isTeacher && <TeacherAnalytics />}
      {isStudent && <StudentAnalytics />}
      {!isAdmin && !isTeacher && !isStudent && <div className="text-center py-12 text-gray-400">No analytics available for your role</div>}
    </SidebarLayout>
  );
}

function AdminAnalytics() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [institution, setInstitution] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashRes, instRes] = await Promise.all([analyticsApi.dashboard(), analyticsApi.institution()]);
      setDashboard(dashRes.data.data.overview);
      setInstitution(instRes.data.data);
    } catch { toast.error('Failed to load analytics'); } finally { setLoading(false); }
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>;

  const stats = dashboard ? [
    { label: 'Total Students', val: dashboard.totalStudents, border: 'border-l-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
    { label: 'Total Teachers', val: dashboard.totalTeachers, border: 'border-l-green-500', bg: 'bg-green-50 dark:bg-green-900/10' },
    { label: 'Active Courses', val: dashboard.activeCourses, border: 'border-l-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10' },
    { label: 'Active Exams', val: dashboard.activeExams, border: 'border-l-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10' },
    { label: 'Pending Admissions', val: dashboard.totalAdmissions, border: 'border-l-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/10' },
    { label: 'Pending Fees', val: dashboard.pendingFees, border: 'border-l-red-500', bg: 'bg-red-50 dark:bg-red-900/10' },
  ] : [];

  const enrollTrend = institution?.enrollmentTrend || [];
  const maxEnroll = Math.max(...enrollTrend.map((e: any) => e.count), 1);
  const deptStats = institution?.departmentStats || [];
  const maxDeptCount = Math.max(...deptStats.map((d: any) => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`rounded-xl border border-gray-200 dark:border-gray-700 p-4 border-l-4 ${s.border} ${s.bg}`}>
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{s.val ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Enrollment Trend</h3>
          {enrollTrend.length > 0 ? (
            <div className="flex items-end gap-2 h-48">
              {enrollTrend.map((e: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                  <span className="text-xs text-gray-500 mb-1">{e.count}</span>
                  <div className="w-full bg-blue-500 rounded-t-md transition-all hover:bg-blue-600" style={{ height: `${(e.count / maxEnroll) * 100}%`, minHeight: '4px' }} />
                  <span className="text-xs text-gray-400 mt-1 truncate w-full text-center">{e._id?.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No data</p>}
        </div>

        {/* Department Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Department Distribution</h3>
          {deptStats.length > 0 ? (
            <div className="space-y-3">
              {deptStats.map((d: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300">{d._id || 'Unknown'}</span>
                    <span className="text-gray-500">{d.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-500 rounded-full h-2" style={{ width: `${(d.count / maxDeptCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No data</p>}
        </div>

        {/* Fee Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Fee Collection</h3>
          <div className="grid grid-cols-2 gap-3">
            {(institution?.feeStats || []).map((f: any, i: number) => {
              const colors: Record<string, string> = { paid: 'border-l-green-500', pending: 'border-l-yellow-500', overdue: 'border-l-red-500', partial: 'border-l-blue-500' };
              return (
                <div key={i} className={`p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border-l-4 ${colors[f._id] || 'border-l-gray-400'}`}>
                  <p className="text-xs text-gray-500 capitalize">{f._id}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{f.count}</p>
                  <p className="text-xs text-gray-400">${f.collectedAmount?.toLocaleString() || 0} collected</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Admission Pipeline */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Admission Pipeline</h3>
          <div className="grid grid-cols-2 gap-3">
            {(institution?.admissionStats || []).map((a: any, i: number) => {
              const colors: Record<string, string> = { applied: 'bg-blue-100 text-blue-700', 'under-review': 'bg-yellow-100 text-yellow-700', accepted: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', enrolled: 'bg-emerald-100 text-emerald-700' };
              return (
                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
                  <span className={`px-2 py-0.5 text-xs rounded ${colors[a._id] || 'bg-gray-100 text-gray-700'}`}>{a._id}</span>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{a.count}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeacherAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    try { setLoading(true); const res = await analyticsApi.teacher(); setData(res.data.data); } catch { } finally { setLoading(false); }
  };

  if (loading) return <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>;
  if (!data) return <div className="text-center py-12 text-gray-400">No data available</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'My Courses', val: data.totalCourses, border: 'border-l-blue-500' },
          { label: 'Total Students', val: data.totalStudents, border: 'border-l-green-500' },
          { label: 'Assignments', val: data.totalAssignments, border: 'border-l-purple-500' },
          { label: 'Exams', val: data.totalExams, border: 'border-l-orange-500' },
        ].map((s, i) => (
          <div key={i} className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 border-l-4 ${s.border}`}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{s.val ?? 0}</p>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">My Courses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(data.courses || []).map((c: any, i: number) => (
            <div key={i} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white">{c.title}</h4>
              <p className="text-sm text-gray-500 mt-1">{c.code} | {c.students} students | {c.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudentAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    try { setLoading(true); const res = await analyticsApi.student(); setData(res.data.data); } catch { } finally { setLoading(false); }
  };

  if (loading) return <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>;
  if (!data) return <div className="text-center py-12 text-gray-400">No data available</div>;

  const att = data.attendance || {};
  const attPct = att.percentage ?? 0;
  const attColor = attPct >= 75 ? 'text-green-600' : attPct >= 60 ? 'text-yellow-600' : 'text-red-600';
  const attGrad = attPct >= 75 ? '#22c55e' : attPct >= 60 ? '#eab308' : '#ef4444';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 border-l-4 border-l-blue-500 text-center">
          <p className="text-xs text-gray-500">CGPA</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{data.cgpa ?? '-'}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 border-l-4 border-l-green-500 text-center">
          <p className="text-xs text-gray-500">Attendance</p>
          <p className={`text-3xl font-bold mt-1 ${attColor}`}>{attPct}%</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 border-l-4 border-l-purple-500 text-center">
          <p className="text-xs text-gray-500">Courses</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{data.coursesEnrolled ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 border-l-4 border-l-orange-500 text-center">
          <p className="text-xs text-gray-500">Credits</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{data.totalCredits ?? 0}</p>
        </div>
      </div>

      {/* Attendance donut */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Attendance Overview</h3>
        <div className="flex items-center gap-8">
          <div className="w-32 h-32 rounded-full relative" style={{ background: `conic-gradient(${attGrad} ${attPct * 3.6}deg, #e5e7eb ${attPct * 3.6}deg)` }}>
            <div className="absolute inset-3 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
              <span className={`text-xl font-bold ${attColor}`}>{attPct}%</span>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-gray-700 dark:text-gray-300">Total: {att.total || 0} classes</p>
            <p className="text-green-600">Present: {att.present || 0}</p>
            <p className="text-red-600">Absent: {(att.total || 0) - (att.present || 0)}</p>
          </div>
        </div>
      </div>

      {/* Grades */}
      {data.grades && data.grades.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Grade History</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b dark:border-gray-700">
              <th className="py-2 text-left text-xs text-gray-500">Course</th>
              <th className="py-2 text-left text-xs text-gray-500">Grade</th>
              <th className="py-2 text-left text-xs text-gray-500">%</th>
              <th className="py-2 text-left text-xs text-gray-500">Points</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.grades.map((g: any, i: number) => (
                <tr key={i}>
                  <td className="py-2 text-gray-900 dark:text-white">{g.course}</td>
                  <td className="py-2"><span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold rounded">{g.grade}</span></td>
                  <td className="py-2 text-gray-600 dark:text-gray-400">{g.percentage}%</td>
                  <td className="py-2 text-gray-600 dark:text-gray-400">{g.gradePoint}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Exams */}
      {data.exams && data.exams.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Exam History</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b dark:border-gray-700">
              <th className="py-2 text-left text-xs text-gray-500">Exam</th>
              <th className="py-2 text-left text-xs text-gray-500">Score</th>
              <th className="py-2 text-left text-xs text-gray-500">Total</th>
              <th className="py-2 text-left text-xs text-gray-500">%</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.exams.map((e: any, i: number) => (
                <tr key={i}>
                  <td className="py-2 text-gray-900 dark:text-white">{e.exam}</td>
                  <td className="py-2 text-gray-600 dark:text-gray-400">{e.score}</td>
                  <td className="py-2 text-gray-600 dark:text-gray-400">{e.total}</td>
                  <td className="py-2 text-gray-600 dark:text-gray-400">{e.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
