'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface ActiveSession {
  _id: string;
  student: { firstName: string; lastName: string; email: string; studentId?: string };
  exam: { title: string; subject: string; duration: number };
  status: string;
  startedAt: string;
  answeredCount?: number;
  currentQuestion?: number;
  violations?: number;
  remainingTime?: number;
  ipAddress?: string;
}

interface ActiveExam {
  _id: string; title: string; subject: string; status: string;
  startTime: string; endTime: string;
}

export default function FacultyMonitorPage() {
  const [exams, setExams] = useState<ActiveExam[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [examsLoading, setExamsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load active exams
  useEffect(() => {
    api.get('/admin/monitor/active-exams').then(r => {
      setExams(r.data.data?.exams || []);
    }).catch(() => setExams([])).finally(() => setExamsLoading(false));
  }, []);

  const loadSessions = useCallback(async () => {
    if (!selectedExam) return;
    setLoading(true);
    try {
      const res = await api.get('/admin/monitor/sessions', { params: { examId: selectedExam } });
      setSessions(res.data.data?.sessions || []);
      setLastRefresh(new Date());
    } catch { setSessions([]); }
    finally { setLoading(false); }
  }, [selectedExam]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // Auto-refresh every 10s
  useEffect(() => {
    if (!autoRefresh || !selectedExam) return;
    intervalRef.current = setInterval(loadSessions, 10000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, selectedExam, loadSessions]);

  const forceSubmit = async (sessionId: string, name: string) => {
    if (!window.confirm(`Force-submit exam for ${name}? This cannot be undone.`)) return;
    try {
      await api.post(`/admin/monitor/sessions/${sessionId}/force-submit`);
      toast.success(`Submission forced for ${name}`);
      loadSessions();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Force submit failed');
    }
  };

  const terminateSession = async (sessionId: string, name: string) => {
    if (!window.confirm(`Terminate session for ${name}? This will lock them out of the exam.`)) return;
    try {
      await api.post(`/admin/monitor/sessions/${sessionId}/terminate`);
      toast.success(`Session terminated for ${name}`);
      loadSessions();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Termination failed');
    }
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const stats = {
    active: sessions.filter(s => s.status === 'in-progress').length,
    violations: sessions.reduce((a, s) => a + (s.violations || 0), 0),
    avgProgress: sessions.length ? Math.round(sessions.reduce((a, s) => a + (s.answeredCount || 0), 0) / sessions.length) : 0,
  };

  return (
    <LMSLayout pageTitle="Live Exam Monitor" breadcrumbs={[{ label: 'Dashboard', href: '/faculty/dashboard' }, { label: 'Monitor' }]}>
      {/* Controls */}
      <div className="lms-section" style={{ marginBottom: 20 }}>
        <div style={{ padding: '14px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <label className="lms-label">Select Active Exam</label>
            <select className="lms-input" value={selectedExam} onChange={e => { setSelectedExam(e.target.value); setSessions([]); }}>
              <option value="">-- Choose an exam to monitor --</option>
              {exams.map(e => (
                <option key={e._id} value={e._id}>{e.title} ({e.status?.toUpperCase()})</option>
              ))}
              {!examsLoading && exams.length === 0 && <option disabled>No active exams</option>}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', fontSize: 13 }}>
              <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
              Auto-refresh (10s)
            </label>
            <button className="lms-btn lms-btn-sm" onClick={loadSessions} disabled={loading || !selectedExam}>
              🔃 Refresh Now
            </button>
          </div>
          {lastRefresh && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Last updated: {format(lastRefresh, 'HH:mm:ss')}
            </div>
          )}
        </div>
      </div>

      {/* Live stats */}
      {selectedExam && (
        <div className="lms-stats-row" style={{ marginBottom: 20 }}>
          <div className="lms-stat">
            <div className="lms-stat-value" style={{ color: 'var(--success)' }}>{stats.active}</div>
            <div className="lms-stat-label">Currently Active</div>
          </div>
          <div className="lms-stat">
            <div className="lms-stat-value">{sessions.length}</div>
            <div className="lms-stat-label">Total Sessions</div>
          </div>
          <div className="lms-stat">
            <div className="lms-stat-value" style={{ color: stats.violations > 0 ? 'var(--danger)' : 'var(--success)' }}>{stats.violations}</div>
            <div className="lms-stat-label">Total Violations</div>
          </div>
          <div className="lms-stat">
            <div className="lms-stat-value" style={{ color: 'var(--primary)' }}>{stats.avgProgress}</div>
            <div className="lms-stat-label">Avg Questions Answered</div>
          </div>
        </div>
      )}

      {/* Sessions table */}
      <div className="lms-section">
        <div className="lms-section-title">
          {selectedExam ? `Active Student Sessions${loading ? ' (refreshing...)' : ''}` : 'Student Sessions'}
        </div>
        {!selectedExam ? (
          <div className="lms-table-empty">Select an active exam to monitor student sessions in real-time.</div>
        ) : loading && sessions.length === 0 ? (
          <div className="lms-loading">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="lms-table-empty">No active sessions for this exam. Students have not started yet, or the exam has ended.</div>
        ) : (
          <div className="lms-table-container">
            <table className="lms-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Answered</th>
                  <th>Time Left</th>
                  <th>Violations</th>
                  <th>Started</th>
                  <th>IP</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s._id} style={{ background: (s.violations || 0) >= 3 ? '#fff5f5' : undefined }}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.student?.firstName} {s.student?.lastName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.student?.studentId || s.student?.email}</div>
                    </td>
                    <td>
                      <span className={`lms-status ${s.status === 'in-progress' ? 'lms-status-active' : s.status === 'submitted' ? '' : 'lms-status-closed'}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {s.status === 'in-progress' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />}
                        {s.status?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.answeredCount ?? '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: (s.remainingTime || 0) < 300 ? 'var(--danger)' : undefined }}>
                      {s.remainingTime !== undefined ? fmt(s.remainingTime) : '—'}
                    </td>
                    <td>
                      {(s.violations || 0) > 0 ? (
                        <span style={{ fontWeight: 800, color: 'var(--danger)', fontSize: 14 }}>⚠️ {s.violations}</span>
                      ) : (
                        <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ 0</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {s.startedAt ? format(new Date(s.startedAt), 'HH:mm') : '—'}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{s.ipAddress || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {s.status === 'in-progress' && (
                          <>
                            <button className="lms-btn lms-btn-sm" title="Force submit this student's exam"
                              onClick={() => forceSubmit(s._id, `${s.student?.firstName} ${s.student?.lastName}`)}>
                              ⏹ Force Submit
                            </button>
                            <button className="lms-btn lms-btn-sm lms-btn-danger" title="Terminate and lock session"
                              onClick={() => terminateSession(s._id, `${s.student?.firstName} ${s.student?.lastName}`)}>
                              🚫 Terminate
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </LMSLayout>
  );
}
