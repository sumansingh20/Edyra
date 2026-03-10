'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/layouts/SidebarLayout';
import { useAuthStore } from '@/store/authStore';
import { attendanceApi } from '@/lib/edyraApi';
import toast from 'react-hot-toast';

export default function AttendancePage() {
  const { user } = useAuthStore();
  const isStaff = ['admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant'].includes(user?.role || '');
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [tab, setTab] = useState<'manual' | 'qr' | 'gps'>('manual');
  const [courseId, setCourseId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<{ student: string; name: string; status: string; remarks: string }[]>([]);
  const [qrCode, setQrCode] = useState('');
  const [generatedQR, setGeneratedQR] = useState('');
  const [qrInput, setQrInput] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const sumRes = await attendanceApi.summary();
      setSummary(sumRes.data.data);
      const listRes = await attendanceApi.list();
      setRecords(listRes.data.data.records || []);
    } catch { } finally { setLoading(false); }
  };

  const handleMark = async () => {
    if (!courseId) { toast.error('Select a course'); return; }
    try {
      await attendanceApi.mark({ course: courseId, date, type: 'manual', records: students.map(s => ({ student: s.student, status: s.status, remarks: s.remarks })) });
      toast.success('Attendance saved');
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to save'); }
  };

  const handleGenerateQR = async () => {
    if (!courseId) { toast.error('Enter course ID'); return; }
    try {
      const res = await attendanceApi.generateQR({ courseId, date });
      setGeneratedQR(res.data.data.qrCode || 'QR-' + Date.now());
      toast.success('QR Code generated');
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to generate QR'); }
  };

  const handleMarkQR = async () => {
    if (!qrInput.trim()) { toast.error('Enter QR code'); return; }
    try {
      await attendanceApi.markViaQR(qrInput);
      toast.success('Attendance marked via QR');
      setQrInput('');
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.error || 'QR marking failed'); }
  };

  const handleMarkGPS = async () => {
    if (!courseId) { toast.error('Enter course ID'); return; }
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await attendanceApi.markViaGPS({ courseId, latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          toast.success('Attendance marked via GPS');
          fetchData();
        } catch (err: any) { toast.error(err.response?.data?.error || 'GPS marking failed'); }
      },
      () => toast.error('Location access denied')
    );
  };

  const updateStudentStatus = (idx: number, status: string) => {
    setStudents(prev => prev.map((s, i) => i === idx ? { ...s, status } : s));
  };

  const attPct = summary ? (summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0) : 0;
  const pctColor = attPct >= 75 ? 'text-green-600' : attPct >= 60 ? 'text-yellow-600' : 'text-red-600';
  const barColor = attPct >= 75 ? 'bg-green-500' : attPct >= 60 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <SidebarLayout pageTitle="Attendance" breadcrumbs={[{ label: 'EDYRA' }, { label: 'Attendance' }]}>
      <div className="space-y-6">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Classes', val: summary.total || 0, border: 'border-l-blue-500' },
              { label: 'Present', val: summary.present || 0, border: 'border-l-green-500' },
              { label: 'Absent', val: summary.absent || 0, border: 'border-l-red-500' },
              { label: 'Late', val: summary.late || 0, border: 'border-l-yellow-500' },
              { label: 'Attendance %', val: `${attPct}%`, border: 'border-l-purple-500', extra: pctColor },
            ].map((c, i) => (
              <div key={i} className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 border-l-4 ${c.border}`}>
                <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
                <p className={`text-2xl font-bold mt-1 ${c.extra || 'text-gray-900 dark:text-white'}`}>{c.val}</p>
              </div>
            ))}
          </div>
        )}

        {summary && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Overall Attendance</span>
              <span className={`font-semibold ${pctColor}`}>{attPct}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div className={`${barColor} rounded-full h-3 transition-all`} style={{ width: `${attPct}%` }} />
            </div>
          </div>
        )}

        {/* Staff: Mark Attendance */}
        {isStaff && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mark Attendance</h2>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
              {(['manual', 'qr', 'gps'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 px-3 py-2 text-sm rounded-md ${tab === t ? 'bg-white dark:bg-gray-700 shadow-sm font-medium text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                  {t === 'manual' ? 'Manual' : t === 'qr' ? 'QR Code' : 'GPS'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={courseId} onChange={e => setCourseId(e.target.value)} placeholder="Course ID" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm" />
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm" />
            </div>

            {tab === 'manual' && (
              <>
                <button onClick={() => setStudents(prev => [...prev, { student: '', name: '', status: 'present', remarks: '' }])} className="px-3 py-1 text-sm border-2 border-dashed border-gray-300 rounded-lg text-gray-500">+ Add Student Row</button>
                {students.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <input value={s.student} onChange={e => setStudents(prev => prev.map((st, idx) => idx === i ? { ...st, student: e.target.value } : st))} placeholder="Student ID" className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800" />
                    <select value={s.status} onChange={e => updateStudentStatus(i, e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800">
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                      <option value="excused">Excused</option>
                    </select>
                    <button onClick={() => setStudents(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 text-sm">Remove</button>
                  </div>
                ))}
                <button onClick={handleMark} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">Save Attendance</button>
              </>
            )}

            {tab === 'qr' && (
              <div className="space-y-4">
                <button onClick={handleGenerateQR} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Generate QR Code</button>
                {generatedQR && (
                  <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
                    <p className="text-sm text-gray-500 mb-2">Share this code with students:</p>
                    <p className="text-3xl font-mono font-bold text-gray-900 dark:text-white tracking-wider">{generatedQR}</p>
                  </div>
                )}
              </div>
            )}

            {tab === 'gps' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">GPS-based attendance will verify student location against the class location. Students must be within the configured radius.</p>
                <button onClick={handleMarkGPS} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">Mark via GPS</button>
              </div>
            )}
          </div>
        )}

        {/* Student: QR & GPS Mark */}
        {!isStaff && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Mark via QR Code</h3>
              <input value={qrInput} onChange={e => setQrInput(e.target.value)} placeholder="Enter QR code..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
              <button onClick={handleMarkQR} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm w-full">Mark Attendance</button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Mark via Location</h3>
              <input value={courseId} onChange={e => setCourseId(e.target.value)} placeholder="Course ID" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
              <button onClick={handleMarkGPS} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm w-full">Mark via GPS</button>
            </div>
          </div>
        )}

        {/* Recent Records */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Attendance Records</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900"><tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No records</td></tr>
                ) : records.map((r: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{r.course?.title || r.course || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{r.type || r.method || 'manual'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded ${r.status === 'present' ? 'bg-green-100 text-green-700' : r.status === 'late' ? 'bg-yellow-100 text-yellow-700' : r.status === 'excused' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{r.status || '-'}</span>
                    </td>
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
