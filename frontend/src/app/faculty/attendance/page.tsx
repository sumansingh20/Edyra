'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import LMSLayout from '@/components/layouts/LMSLayout';
import { format } from 'date-fns';

interface AttendanceStudent {
  studentId: string;
  name: string;
  rollNumber?: string;
  status: 'present' | 'absent' | 'late' | 'excused' | '';
}

export default function FacultyAttendancePage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [qrExpiry, setQrExpiry] = useState('');
  const [generatingQr, setGeneratingQr] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'qr' | 'history'>('manual');
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await api.get('/courses', { params: { faculty: true, limit: 50 } });
      const c = res.data?.data?.courses || res.data?.data || [];
      setCourses(Array.isArray(c) ? c : []);
    } catch { }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const fetchStudents = useCallback(async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      const [enrollRes, attRes] = await Promise.allSettled([
        api.get(`/courses/${selectedCourse}/students`),
        api.get('/attendance', { params: { courseId: selectedCourse, date: selectedDate } }),
      ]);

      const enrolled = enrollRes.status === 'fulfilled'
        ? (enrollRes.value.data?.data?.students || enrollRes.value.data?.data || [])
        : [];

      const existing = attRes.status === 'fulfilled'
        ? (attRes.value.data?.data || [])
        : [];

      const existingMap: Record<string, string> = {};
      existing.forEach((r: any) => {
        const sid = typeof r.studentId === 'object' ? r.studentId?._id : r.studentId;
        existingMap[sid] = r.status;
      });

      setStudents(enrolled.map((s: any) => ({
        studentId: s._id || s.studentId,
        name: `${s.firstName} ${s.lastName}`,
        rollNumber: s.rollNumber || s.studentId,
        status: existingMap[s._id || s.studentId] || '' as any,
      })));
    } catch { } finally { setLoading(false); }
  }, [selectedCourse, selectedDate]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const markAll = (status: 'present' | 'absent') => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const setStatus = (idx: number, status: AttendanceStudent['status']) => {
    setStudents(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], status };
      return next;
    });
  };

  const saveAttendance = async () => {
    const unmarked = students.filter(s => !s.status);
    if (unmarked.length > 0) {
      if (!confirm(`${unmarked.length} student(s) not marked. Mark them absent?`)) return;
      setStudents(prev => prev.map(s => ({ ...s, status: s.status || 'absent' })));
    }
    setSaving(true);
    try {
      await api.post('/attendance/mark', {
        courseId: selectedCourse,
        date: selectedDate,
        records: students.map(s => ({ studentId: s.studentId, status: s.status || 'absent' })),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save attendance');
    } finally { setSaving(false); }
  };

  const generateQR = async () => {
    if (!selectedCourse) { alert('Select a course first.'); return; }
    setGeneratingQr(true);
    try {
      const res = await api.post('/attendance/qr/generate', {
        courseId: selectedCourse,
        date: selectedDate,
        expiryMinutes: 15,
      });
      setQrCode(res.data?.data?.code || res.data?.data?.qrCode || '');
      setQrExpiry(res.data?.data?.expiresAt || '');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to generate QR');
    } finally { setGeneratingQr(false); }
  };

  const fetchHistory = useCallback(async () => {
    if (!selectedCourse) return;
    setHistoryLoading(true);
    try {
      const res = await api.get('/attendance', { params: { courseId: selectedCourse, limit: 100 } });
      const data = res.data?.data || [];
      // Group by date
      const grouped: Record<string, any[]> = {};
      (Array.isArray(data) ? data : []).forEach((r: any) => {
        const d = r.date || r.createdAt?.split('T')[0];
        if (!grouped[d]) grouped[d] = [];
        grouped[d].push(r);
      });
      setHistory(Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).slice(0, 20));
    } catch { } finally { setHistoryLoading(false); }
  }, [selectedCourse]);

  useEffect(() => { if (activeTab === 'history') fetchHistory(); }, [activeTab, fetchHistory]);

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const unmarkedCount = students.filter(s => !s.status).length;

  return (
    <LMSLayout pageTitle="Attendance Management" breadcrumbs={[{ label: 'Faculty' }, { label: 'Attendance' }]}>
      {/* Course + Date Selector */}
      <div className="lms-section animate-fadeInDown">
        <div className="lms-section-title"> Select Course & Date</div>
        <div style={{ padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="lms-form-group" style={{ margin: 0, flex: 1, minWidth: 200 }}>
            <label className="lms-label">Course</label>
            <select className="lms-select" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
              <option value="">— Select Course —</option>
              {courses.map((c: any) => (
                <option key={c._id} value={c._id}>{c.title} ({c.code || 'N/A'})</option>
              ))}
            </select>
          </div>
          <div className="lms-form-group" style={{ margin: 0 }}>
            <label className="lms-label">Date</label>
            <input
              type="date"
              className="lms-input"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="lms-tabs">
        {(['manual', 'qr', 'history'] as const).map(t => (
          <button key={t} className={`lms-tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'manual' ? ' Manual Attendance' : t === 'qr' ? ' QR Code' : ' History'}
          </button>
        ))}
      </div>

      {/* Manual Attendance */}
      {activeTab === 'manual' && (
        <div>
          {!selectedCourse ? (
            <div className="lms-section">
              <div className="lms-table-empty" style={{ padding: 48 }}>Select a course above to start marking attendance.</div>
            </div>
          ) : loading ? (
            <div className="lms-spinner"><div className="spinner" /><span>Loading students...</span></div>
          ) : students.length === 0 ? (
            <div className="lms-section">
              <div className="lms-table-empty" style={{ padding: 48 }}>No students enrolled in this course.</div>
            </div>
          ) : (
            <div className="lms-section animate-fadeIn">
              <div className="lms-section-title">
                 Student Roster — {students.length} Students
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button onClick={() => markAll('present')} className="lms-btn lms-btn-sm lms-btn-success">
                     All Present
                  </button>
                  <button onClick={() => markAll('absent')} className="lms-btn lms-btn-sm lms-btn-danger">
                     All Absent
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 16, padding: '12px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontSize: 13, flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}> Present: {presentCount}</span>
                <span style={{ color: 'var(--danger)', fontWeight: 600 }}> Absent: {absentCount}</span>
                <span style={{ color: 'var(--warning)', fontWeight: 600 }}>? Unmarked: {unmarkedCount}</span>
                <span style={{ color: 'var(--text-muted)' }}>Total: {students.length}</span>
              </div>

              <div className="lms-table-container">
                <table className="lms-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Roll No.</th>
                      <th>Student Name</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={s.studentId} style={{ background: s.status === 'present' ? 'rgba(22,163,74,0.05)' : s.status === 'absent' ? 'rgba(220,38,38,0.05)' : '' }}>
                        <td style={{ color: 'var(--text-muted)', width: 40 }}>{i + 1}</td>
                        <td className="font-mono" style={{ fontSize: 12 }}>{s.rollNumber || '-'}</td>
                        <td style={{ fontWeight: 500 }}>{s.name}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {(['present', 'absent', 'late', 'excused'] as const).map(status => (
                              <button
                                key={status}
                                onClick={() => setStatus(i, status)}
                                className="lms-btn lms-btn-sm"
                                style={{
                                  padding: '3px 8px', fontSize: 11,
                                  background: s.status === status
                                    ? status === 'present' ? 'var(--success)'
                                    : status === 'absent' ? 'var(--danger)'
                                    : status === 'late' ? 'var(--warning)'
                                    : 'var(--secondary)'
                                    : 'var(--bg)',
                                  color: s.status === status ? '#fff' : 'var(--text-muted)',
                                  border: '1px solid var(--border)',
                                }}
                              >
                                {status === 'present' ? 'P' : status === 'absent' ? 'A' : status === 'late' ? 'L' : 'E'}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Save */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {saved && <span style={{ color: 'var(--success)', fontWeight: 600 }}> Attendance saved!</span>}
                {!saved && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{unmarkedCount > 0 ? `${unmarkedCount} students not yet marked` : 'All marked'}</span>}
                <button onClick={saveAttendance} disabled={saving} className="lms-btn lms-btn-primary">
                  {saving ? ' Saving...' : ' Save Attendance'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QR Code Tab */}
      {activeTab === 'qr' && (
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div className="lms-section animate-scaleIn">
            <div className="lms-section-title"> Generate QR Code</div>
            <div style={{ padding: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                Generate a QR code that students can scan to mark their attendance automatically.
                Codes expire after 15 minutes.
              </p>
              <button onClick={generateQR} disabled={generatingQr || !selectedCourse} className="lms-btn lms-btn-primary lms-btn-lg">
                {generatingQr ? ' Generating...' : ' Generate QR Code'}
              </button>
              {qrCode && (
                <div style={{ marginTop: 24 }}>
                  <div style={{
                    background: '#fff', padding: 20, borderRadius: 'var(--radius)',
                    display: 'inline-block', border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-md)',
                  }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 32, fontWeight: 800, letterSpacing: 4, color: 'var(--nav-bg)' }}>
                      {qrCode}
                    </div>
                  </div>
                  <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                    Share this code with students — they enter it in the QR attendance section.
                  </div>
                  {qrExpiry && (
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--warning)', fontWeight: 600 }}>
                       Expires: {format(new Date(qrExpiry), 'HH:mm:ss')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="lms-section">
          <div className="lms-section-title"> Attendance History</div>
          {historyLoading ? (
            <div className="lms-spinner"><div className="spinner" /></div>
          ) : history.length === 0 ? (
            <div className="lms-table-empty" style={{ padding: 40 }}>No attendance history. {!selectedCourse && 'Select a course first.'}</div>
          ) : (
            <div className="lms-table-container">
              <table className="lms-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(([date, records]: [string, any[]]) => {
                    const pct = Math.round((records.filter((r: any) => r.status === 'present').length / records.length) * 100);
                    return (
                      <tr key={date}>
                        <td className="font-mono">{date ? format(new Date(date), 'dd MMM yyyy') : date}</td>
                        <td>{records.length}</td>
                        <td style={{ color: 'var(--success)' }}>{records.filter((r: any) => r.status === 'present').length}</td>
                        <td style={{ color: 'var(--danger)' }}>{records.filter((r: any) => r.status === 'absent').length}</td>
                        <td>
                          <span className={`lms-status ${pct >= 75 ? 'lms-status-active' : 'lms-status-pending'}`}>
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </LMSLayout>
  );
}
