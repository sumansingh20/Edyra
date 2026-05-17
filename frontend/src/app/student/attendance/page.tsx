'use client';

import { useState, useEffect } from 'react';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function StudentAttendancePage() {
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState('');
  const [marking, setMarking] = useState(false);
  const [gpsMarking, setGpsMarking] = useState(false);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const sumRes = await api.get('/attendance/summary');
        setSummary(sumRes.data.data?.summary || []);

        // Fetch recent attendance sessions to see if any are active for QR/GPS
        const actRes = await api.get('/attendance?limit=5');
        const sessions = actRes.data.data?.records || [];
        // Filter sessions that have qrCode or gpsCenter active
        const active = sessions.filter((s: any) => 
          (s.type === 'qr-code' && s.qrExpiresAt && new Date(s.qrExpiresAt) > new Date()) ||
          (s.type === 'gps' && s.gpsCenter?.latitude)
        );
        setActiveSessions(active);
      } catch (err) {
        console.error('Failed to fetch attendance:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const handleQRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCode.trim()) return;
    setMarking(true);
    try {
      await api.post('/attendance/qr/mark', { qrCode: qrCode.trim() });
      toast.success('Attendance marked successfully via QR Code!');
      setQrCode('');
      // Refresh summary
      const sumRes = await api.get('/attendance/summary');
      setSummary(sumRes.data.data?.summary || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Invalid or expired QR Code');
    } finally {
      setMarking(false);
    }
  };

  const markViaGPS = async (attendanceId: string) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setGpsMarking(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await api.post('/attendance/gps/mark', {
            attendanceId,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
          toast.success('Attendance verified and marked via GPS!');
          // Refresh summary
          const sumRes = await api.get('/attendance/summary');
          setSummary(sumRes.data.data?.summary || []);
        } catch (err: any) {
          toast.error(err.response?.data?.error || err.response?.data?.message || 'GPS verification failed. Are you in the classroom?');
        } finally {
          setGpsMarking(false);
        }
      },
      (err) => {
        toast.error('Failed to get location. Please enable location permissions.');
        setGpsMarking(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <LMSLayout pageTitle="My Attendance" breadcrumbs={[{ label: 'Dashboard', href: '/student/dashboard' }, { label: 'Attendance' }]}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div className="lms-main-col">
          <div className="lms-section">
            <div className="lms-section-title">Course Attendance Overview</div>
            {loading ? (
              <div className="lms-loading">Loading attendance records...</div>
            ) : summary.length === 0 ? (
              <div className="lms-table-empty">No attendance records found for your enrolled courses yet.</div>
            ) : (
              <div className="lms-table-container">
                <table className="lms-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Total Sessions</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Late / Excused</th>
                      <th>Attendance %</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((item, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{item.course?.title || item.course?.code || 'Course'}</td>
                        <td>{item.total}</td>
                        <td style={{ color: '#166534', fontWeight: 600 }}>{item.present}</td>
                        <td style={{ color: '#991b1b', fontWeight: 600 }}>{item.absent}</td>
                        <td>{item.late} / {item.excused}</td>
                        <td style={{ fontWeight: 700 }}>
                          <span style={{ color: item.percentage >= 75 ? '#166534' : item.percentage >= 65 ? '#854d0e' : '#991b1b' }}>
                            {item.percentage}%
                          </span>
                        </td>
                        <td>
                          <span className={`lms-status ${item.percentage >= 75 ? 'lms-status-active' : item.percentage >= 65 ? 'lms-status-pending' : 'lms-status-error'}`}>
                            {item.percentage >= 75 ? 'Optimal' : item.percentage >= 65 ? 'Warning' : 'Critical'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="lms-sidebar-col">
          <div className="lms-section">
            <div className="lms-section-title">Self-Service Check-in</div>
            <div style={{ padding: 20 }}>
              <form onSubmit={handleQRSubmit}>
                <div className="lms-form-group">
                  <label className="lms-label">Enter Class QR / Check-in PIN</label>
                  <input 
                    type="text" 
                    className="lms-input" 
                    placeholder="e.g. A8F9C2..." 
                    value={qrCode} 
                    onChange={e => setQrCode(e.target.value)}
                    required 
                  />
                  <div className="lms-help-text">Enter the live code displayed by your instructor on the projector.</div>
                </div>
                <button type="submit" className="lms-btn lms-btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={marking}>
                  {marking ? 'Verifying...' : 'Verify & Mark Present'}
                </button>
              </form>
            </div>
          </div>

          {activeSessions.length > 0 && (
            <div className="lms-section" style={{ marginTop: 24 }}>
              <div className="lms-section-title">Active GPS Check-ins</div>
              <div style={{ padding: 20 }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  The following courses have active GPS geofencing check-in enabled right now.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {activeSessions.map((session) => (
                    <div key={session._id} style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 6, background: '#f8f9fa' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{session.course?.title || session.course?.code}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Session: {session.session?.toUpperCase()}</div>
                      <button 
                        className="lms-btn lms-btn-sm lms-btn-primary" 
                        style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}
                        onClick={() => markViaGPS(session._id)}
                        disabled={gpsMarking}
                      >
                        {gpsMarking ? 'Checking Location...' : 'Check-in via GPS'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="lms-section" style={{ marginTop: 24 }}>
            <div className="lms-section-title">Attendance Policy</div>
            <div style={{ padding: 20, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <p style={{ marginBottom: 10 }}>
                <strong>Minimum Requirement:</strong> Students must maintain a minimum of <strong>75% attendance</strong> across all registered courses to be eligible for end-semester secure examinations.
              </p>
              <p>
                Medical leaves and institutional duty exemptions must be submitted with valid proof within 7 working days of absence to the Department Head.
              </p>
            </div>
          </div>
        </div>
      </div>
    </LMSLayout>
  );
}
