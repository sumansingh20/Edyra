'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import LMSLayout from '@/components/layouts/LMSLayout';
import { format } from 'date-fns';

interface AttendanceRecord {
  _id: string;
  date: string;
  courseId?: any;
  status: 'present' | 'absent' | 'late' | 'excused';
  markedAt?: string;
  qrAttendance?: boolean;
}

interface CourseAttendance {
  courseId: string;
  courseName: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

export default function StudentAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [courseStats, setCourseStats] = useState<CourseAttendance[]>([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, late: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'qr'>('overview');
  const [qrScanning, setQrScanning] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [qrMessage, setQrMessage] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCourse, setFilterCourse] = useState('');

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryRes, recordsRes] = await Promise.allSettled([
        api.get('/attendance/summary'),
        api.get('/attendance', { params: { limit: 200, month: filterMonth, courseId: filterCourse } }),
      ]);

      if (summaryRes.status === 'fulfilled') {
        const s = summaryRes.value.data?.data || {};
        setSummary({
          total: s.total || s.totalClasses || 0,
          present: s.present || s.attendedClasses || 0,
          absent: s.absent || 0,
          late: s.late || 0,
          percentage: s.percentage || s.overallPercentage || 0,
        });
        if (s.courseWise || s.courses) {
          setCourseStats(s.courseWise || s.courses || []);
        }
      }

      if (recordsRes.status === 'fulfilled') {
        const r = recordsRes.value.data?.data || [];
        setRecords(Array.isArray(r) ? r : []);
      }
    } catch { } finally { setLoading(false); }
  }, [filterMonth, filterCourse]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const handleQRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCode.trim()) return;
    setQrScanning(true);
    setQrMessage('');
    try {
      await api.post('/attendance/qr/mark', { qrCode });
      setQrMessage(' Attendance marked successfully!');
      setQrCode('');
      fetchAttendance();
    } catch (err: any) {
      setQrMessage(' ' + (err.response?.data?.error || 'Invalid QR code or already marked.'));
    } finally {
      setQrScanning(false);
    }
  };

  const exportAttendance = async () => {
    try {
      const res = await api.get('/attendance/export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
    } catch { alert('Export failed.'); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'lms-status-active';
      case 'absent': return 'lms-status-closed';
      case 'late': return 'lms-status-pending';
      case 'excused': return 'lms-status-info';
      default: return '';
    }
  };

  const filteredRecords = records.filter(r => {
    const matchMonth = filterMonth ? r.date?.startsWith(filterMonth) : true;
    const matchCourse = filterCourse
      ? (typeof r.courseId === 'object' ? r.courseId?._id === filterCourse : r.courseId === filterCourse)
      : true;
    return matchMonth && matchCourse;
  });

  return (
    <LMSLayout pageTitle="My Attendance" breadcrumbs={[{ label: 'Student' }, { label: 'Attendance' }]}>
      {/* Stats Overview */}
      <div className="lms-stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Overall %', value: `${Math.round(summary.percentage)}%`, color: summary.percentage >= 75 ? 'green' : 'red' },
          { label: 'Total Classes', value: summary.total, color: '' },
          { label: 'Present', value: summary.present, color: 'green' },
          { label: 'Absent', value: summary.absent, color: 'red' },
          { label: 'Late', value: summary.late, color: 'orange' },
        ].map(s => (
          <div key={s.label} className={`lms-stat-card ${s.color}`}>
            <div className="lms-stat-value">{s.value}</div>
            <div className="lms-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Attendance Threshold Warning */}
      {summary.percentage < 75 && summary.total > 0 && (
        <div className="lms-alert lms-alert-error animate-fadeIn" style={{ marginBottom: 20 }}>
          <div>
            <div className="lms-alert-title"> Below Minimum Attendance</div>
            <div>
              Your attendance is {Math.round(summary.percentage)}%, below the required 75%.
              You need to attend {Math.ceil((0.75 * summary.total - summary.present) / 0.25)} more classes to reach 75%.
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="lms-tabs">
        {(['overview', 'history', 'qr'] as const).map(t => (
          <button key={t} className={`lms-tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'overview' ? ' Course-wise' : t === 'history' ? ' History' : ' QR Attendance'}
          </button>
        ))}
      </div>

      {/* Course Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {courseStats.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {courseStats.map((c, i) => (
                <div key={c.courseId || i} className="lms-section animate-fadeIn" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--nav-bg)' }}>{c.courseName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {c.present}/{c.total} classes attended
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: 22, fontWeight: 800,
                          color: c.percentage >= 75 ? 'var(--success)' : 'var(--danger)',
                        }}>
                          {Math.round(c.percentage)}%
                        </div>
                        <span className={`lms-status ${c.percentage >= 75 ? 'lms-status-active' : 'lms-status-closed'}`} style={{ fontSize: 10 }}>
                          {c.percentage >= 75 ? 'Good Standing' : 'At Risk'}
                        </span>
                      </div>
                    </div>
                    <div className="lms-progress" style={{ height: 8 }}>
                      <div
                        className={`lms-progress-bar ${c.percentage >= 75 ? 'green' : ''}`}
                        style={{
                          width: `${c.percentage}%`,
                          background: c.percentage < 75 ? 'var(--danger)' : undefined,
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--success)' }}> {c.present} Present</span>
                      <span style={{ color: 'var(--danger)' }}> {c.absent} Absent</span>
                      {c.late > 0 && <span style={{ color: 'var(--warning)' }}> {c.late} Late</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="lms-section">
              <div className="lms-table-empty" style={{ padding: 40 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}></div>
                <div>No attendance records found.</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          <div className="lms-filter-bar">
            <div className="lms-form-group">
              <input
                type="month"
                className="lms-input"
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
              />
            </div>
            <button onClick={exportAttendance} className="lms-btn lms-btn-default">
               Export CSV
            </button>
          </div>

          {loading ? (
            <div className="lms-spinner"><div className="spinner" /><span>Loading...</span></div>
          ) : (
            <div className="lms-section">
              <div className="lms-table-container">
                {filteredRecords.length > 0 ? (
                  <table className="lms-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Course</th>
                        <th>Status</th>
                        <th>Method</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((r) => (
                        <tr key={r._id}>
                          <td className="font-mono">{r.date ? format(new Date(r.date), 'dd MMM yyyy') : '-'}</td>
                          <td>{typeof r.courseId === 'object' ? r.courseId?.title : r.courseId || '-'}</td>
                          <td>
                            <span className={`lms-status ${getStatusColor(r.status)}`}>
                              {r.status?.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {r.qrAttendance ? ' QR' : ' Manual'}
                            </span>
                          </td>
                          <td className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {r.markedAt ? format(new Date(r.markedAt), 'HH:mm') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="lms-table-empty">No attendance records for selected period.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* QR Tab */}
      {activeTab === 'qr' && (
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div className="lms-section animate-scaleIn">
            <div className="lms-section-title"> Mark Attendance via QR</div>
            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.7 }}>
                Your faculty will display a QR code during class. Scan it with your phone's camera or enter the code manually below to mark your attendance.
              </p>

              <form onSubmit={handleQRSubmit}>
                <div className="lms-form-group">
                  <label className="lms-label">QR Code / Attendance Code</label>
                  <input
                    className="lms-input"
                    style={{ fontFamily: 'monospace', letterSpacing: 2, fontSize: 16, textAlign: 'center' }}
                    placeholder="Enter attendance code..."
                    value={qrCode}
                    onChange={e => setQrCode(e.target.value.toUpperCase())}
                    maxLength={20}
                  />
                  <div className="lms-help-text">Code is case-insensitive. Usually 6-8 characters.</div>
                </div>

                {qrMessage && (
                  <div className={`lms-alert ${qrMessage.startsWith('') ? 'lms-alert-success' : 'lms-alert-error'}`} style={{ marginBottom: 16 }}>
                    <div>{qrMessage}</div>
                  </div>
                )}

                <button type="submit" disabled={qrScanning || !qrCode} className="lms-btn lms-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  {qrScanning ? ' Marking...' : ' Mark Attendance'}
                </button>
              </form>

              <div className="lms-alert lms-alert-info" style={{ marginTop: 20 }}>
                <div>
                  <div className="lms-alert-title"> Note</div>
                  <div style={{ fontSize: 12 }}>QR codes expire after 15 minutes. Each code can only be used once per student.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </LMSLayout>
  );
}
