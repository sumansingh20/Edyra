'use client';

import { useState, useEffect } from 'react';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function FacultyAttendancePage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [session, setSession] = useState('morning');
  const [type, setType] = useState('manual');
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<any>(null);

  useEffect(() => {
    api.get('/faculty/courses').then(res => {
      setCourses(res.data.data?.courses || []);
      if (res.data.data?.courses?.length > 0) setSelectedCourse(res.data.data.courses[0]._id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    const fetchClassData = async () => {
      try {
        const enrolRes = await api.get(`/faculty/courses/${selectedCourse}/students`);
        const enrolledStudents = enrolRes.data.data?.students || [];
        setStudents(enrolledStudents);

        // Fetch existing attendance for this date/session
        const attRes = await api.get(`/attendance?courseId=${selectedCourse}&date=${date}`);
        const existing = attRes.data.data?.records?.find((r: any) => r.session === session);
        
        if (existing && existing.records?.length > 0) {
          setAttendance(existing.records);
          setType(existing.type);
        } else {
          // Default to all absent
          setAttendance(enrolledStudents.map((s: any) => ({
            student: s.user?._id || s._id,
            status: 'absent'
          })));
        }
      } catch (err) {
        console.error('Failed to fetch attendance data:', err);
      }
    };
    fetchClassData();
  }, [selectedCourse, date, session]);

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendance(prev => prev.map(a => a.student === studentId ? { ...a, status } : a));
  };

  const markAll = (status: string) => {
    setAttendance(prev => prev.map(a => ({ ...a, status })));
  };

  const saveAttendance = async () => {
    if (!selectedCourse) return;
    setSubmitting(true);
    try {
      await api.post('/attendance/mark', {
        courseId: selectedCourse,
        date,
        session,
        type,
        records: attendance.map(a => ({
          student: a.student,
          status: a.status,
          method: type,
        }))
      });
      toast.success('Attendance saved successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const generateQR = async () => {
    if (!selectedCourse) return;
    try {
      const res = await api.post('/attendance/qr/generate', { courseId: selectedCourse, date, session, expiryMinutes: 15 });
      setQrCodeData(res.data.data);
      setType('qr-code');
      toast.success('QR Code generated. Students can now scan it.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to generate QR');
    }
  };

  return (
    <LMSLayout pageTitle="Attendance Management" breadcrumbs={[{ label: 'Dashboard', href: '/faculty/dashboard' }, { label: 'Attendance' }]}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div className="lms-main-col">
          <div className="lms-section">
            <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Class Roster & Attendance</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="lms-btn lms-btn-sm" onClick={() => markAll('present')}>Mark All Present</button>
                <button className="lms-btn lms-btn-sm" onClick={() => markAll('absent')}>Mark All Absent</button>
              </div>
            </div>
            {loading ? (
              <div className="lms-loading">Loading...</div>
            ) : !selectedCourse ? (
              <div className="lms-table-empty">Please select a course to view attendance.</div>
            ) : students.length === 0 ? (
              <div className="lms-table-empty">No students enrolled in this course yet.</div>
            ) : (
              <div className="lms-table-container">
                <table className="lms-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Roll Number</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => {
                      const uid = s.user?._id || s._id;
                      const u = s.user || s;
                      const att = attendance.find(a => a.student === uid);
                      return (
                        <tr key={uid}>
                          <td style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</td>
                          <td style={{ fontFamily: 'monospace' }}>{u.rollNumber || u.studentId || '—'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {['present', 'absent', 'late', 'excused'].map(st => (
                                <button key={st} 
                                  onClick={() => handleStatusChange(uid, st)}
                                  style={{
                                    padding: '4px 10px', fontSize: 12, borderRadius: 4, cursor: 'pointer', border: '1px solid var(--border)', fontWeight: 600, textTransform: 'capitalize',
                                    background: att?.status === st ? (st === 'present' ? '#dcfce7' : st === 'absent' ? '#fee2e2' : st === 'late' ? '#fef9c3' : '#e0e7ff') : '#fff',
                                    color: att?.status === st ? (st === 'present' ? '#166534' : st === 'absent' ? '#991b1b' : st === 'late' ? '#854d0e' : '#3730a3') : 'var(--text-muted)'
                                  }}>
                                  {st}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {students.length > 0 && (
              <div style={{ padding: 20, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="lms-btn lms-btn-primary" onClick={saveAttendance} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Attendance Records'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lms-sidebar-col">
          <div className="lms-section">
            <div className="lms-section-title">Session Settings</div>
            <div style={{ padding: 20 }}>
              <div className="lms-form-group">
                <label className="lms-label">Course</label>
                <select className="lms-input" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.code} - {c.title}</option>)}
                </select>
              </div>
              <div className="lms-form-group">
                <label className="lms-label">Date</label>
                <input type="date" className="lms-input" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="lms-form-group">
                <label className="lms-label">Session</label>
                <select className="lms-input" value={session} onChange={e => setSession(e.target.value)}>
                  <option value="morning">Morning (FN)</option>
                  <option value="afternoon">Afternoon (AN)</option>
                  <option value="evening">Evening</option>
                  <option value="full-day">Full Day</option>
                </select>
              </div>
              <div className="lms-form-group">
                <label className="lms-label">Collection Method</label>
                <select className="lms-input" value={type} onChange={e => setType(e.target.value)}>
                  <option value="manual">Manual Roll Call</option>
                  <option value="qr-code">QR Code (Student Scan)</option>
                  <option value="gps">GPS Location Match</option>
                </select>
              </div>
            </div>
          </div>

          {type === 'qr-code' && (
            <div className="lms-section" style={{ marginTop: 24 }}>
              <div className="lms-section-title">QR Code Collection</div>
              <div style={{ padding: 20, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Generate a QR code for students to scan with their mobile devices to mark their own attendance.
                </p>
                <button className="lms-btn lms-btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={generateQR}>
                  Generate Live QR Code
                </button>
                {qrCodeData && (
                  <div style={{ marginTop: 20, padding: 20, background: '#f8f9fa', borderRadius: 8, border: '2px dashed var(--border)' }}>
                    <div style={{ fontSize: 48, letterSpacing: 4, fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)' }}>
                      {qrCodeData.qrCode.substring(0, 6).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 12, color: 'var(--danger)' }}>
                      Expires at {format(new Date(qrCodeData.expiresAt), 'HH:mm')}
                    </div>
                    <div style={{ fontSize: 11, marginTop: 4, color: 'var(--text-muted)' }}>
                      Students can enter this code or scan on their dashboard.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="lms-section" style={{ marginTop: 24 }}>
            <div className="lms-section-title">Summary</div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: 'var(--text-muted)' }}>Present</span>
                <span style={{ fontWeight: 700, color: '#166534' }}>{attendance.filter(a => a.status === 'present').length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: 'var(--text-muted)' }}>Absent</span>
                <span style={{ fontWeight: 700, color: '#991b1b' }}>{attendance.filter(a => a.status === 'absent').length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: 'var(--text-muted)' }}>Late</span>
                <span style={{ fontWeight: 700, color: '#854d0e' }}>{attendance.filter(a => a.status === 'late').length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 600 }}>Total Enrolled</span>
                <span style={{ fontWeight: 700 }}>{students.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LMSLayout>
  );
}
