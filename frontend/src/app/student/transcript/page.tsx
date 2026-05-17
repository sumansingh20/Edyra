'use client';

import { useEffect, useState } from 'react';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface TranscriptGrade {
  course: { title: string; code: string; credits: number };
  grade: string;
  percentage: number;
  gradePoint: number;
  semester?: string;
  status: string;
}

interface TranscriptData {
  student: { firstName: string; lastName: string; studentId?: string; email: string; department?: string; batch?: string };
  cgpa: number;
  totalCredits: number;
  courses: TranscriptGrade[];
  attendance: { total: number; present: number; percentage: number };
  exams: { exam: string; score: number; total: number; percentage: number }[];
}

const GRADE_COLORS: Record<string, string> = {
  'O': '#22c55e', 'A+': '#16a34a', 'A': '#2563eb', 'B+': '#7c3aed',
  'B': '#6d28d9', 'C': '#d97706', 'D': '#f59e0b', 'F': '#dc2626',
};

export default function StudentTranscriptPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        const res = await api.get('/analytics/student');
        const d = res.data.data;
        setData({
          student: d.student || { firstName: user?.firstName || '', lastName: user?.lastName || '', email: user?.email || '' },
          cgpa: d.cgpa || 0,
          totalCredits: d.totalCredits || 0,
          courses: (d.grades || []).map((g: any) => ({
            course: g.course || { title: 'Unknown', code: 'N/A', credits: 0 },
            grade: g.grade || 'N/A',
            percentage: g.percentage || 0,
            gradePoint: g.gradePoint || 0,
            status: g.grade === 'F' ? 'FAILED' : 'PASSED',
          })),
          attendance: d.attendance || { total: 0, present: 0, percentage: 0 },
          exams: d.exams || [],
        });
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load transcript');
      } finally {
        setLoading(false);
      }
    };
    fetchTranscript();
  }, [user]);

  const handlePrint = () => window.print();

  if (loading) return <LMSLayout pageTitle="Academic Transcript"><div className="lms-loading">Loading transcript...</div></LMSLayout>;
  if (error) return <LMSLayout pageTitle="Academic Transcript"><div className="lms-alert lms-alert-error">{error}</div></LMSLayout>;
  if (!data) return null;

  return (
    <LMSLayout pageTitle="Academic Transcript" breadcrumbs={[{ label: 'Dashboard', href: '/student/dashboard' }, { label: 'Transcript' }]}>

      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="lms-btn lms-btn-primary lms-btn-sm" onClick={handlePrint}>
          🖨️ Print Transcript
        </button>
      </div>

      {/* Student Header */}
      <div className="lms-section" style={{ marginBottom: 24 }}>
        <div style={{ padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--nav-bg)', marginBottom: 4 }}>
              {data.student.firstName} {data.student.lastName}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{data.student.email}</div>
            {data.student.studentId && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                Student ID: <strong style={{ fontFamily: 'monospace' }}>{data.student.studentId}</strong>
              </div>
            )}
            {data.student.department && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                Department: {data.student.department} {data.student.batch && `| Batch: ${data.student.batch}`}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', padding: '16px 24px', background: 'var(--nav-bg)', color: '#fff', borderRadius: 12, minWidth: 120 }}>
            <div style={{ fontSize: 42, fontWeight: 900, lineHeight: 1 }}>{data.cgpa.toFixed(2)}</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4, letterSpacing: 1 }}>CGPA</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>{data.totalCredits} Credits</div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="lms-stats-row" style={{ marginBottom: 24 }}>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--primary)' }}>{data.cgpa.toFixed(2)}</div>
          <div className="lms-stat-label">CGPA</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--success)' }}>{data.totalCredits}</div>
          <div className="lms-stat-label">Credits Earned</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--secondary)' }}>{data.courses.length}</div>
          <div className="lms-stat-label">Courses</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: data.attendance.percentage >= 75 ? 'var(--success)' : 'var(--danger)' }}>
            {data.attendance.percentage}%
          </div>
          <div className="lms-stat-label">Attendance</div>
        </div>
      </div>

      {/* Course Grades Table */}
      <div className="lms-section" style={{ marginBottom: 24 }}>
        <div className="lms-section-title">📚 Course Grades</div>
        {data.courses.length === 0 ? (
          <div className="lms-table-empty">No grade records available. Grades will appear here once faculty publish them.</div>
        ) : (
          <div className="lms-table-container">
            <table className="lms-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Code</th>
                  <th>Credits</th>
                  <th>Percentage</th>
                  <th>Grade Point</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.courses.map((g, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{typeof g.course === 'string' ? g.course : g.course?.title || 'N/A'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{typeof g.course === 'string' ? '—' : g.course?.code || '—'}</td>
                    <td>{typeof g.course === 'string' ? '—' : g.course?.credits || '—'}</td>
                    <td>{(g.percentage || 0).toFixed(1)}%</td>
                    <td style={{ fontWeight: 700 }}>{g.gradePoint?.toFixed(1) || 'N/A'}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 32, height: 32, borderRadius: '50%', fontWeight: 800, fontSize: 13,
                        background: GRADE_COLORS[g.grade] || '#64748b', color: '#fff',
                      }}>{g.grade || 'N/A'}</span>
                    </td>
                    <td>
                      <span className={`lms-status ${g.status === 'PASSED' ? 'lms-status-active' : 'lms-status-closed'}`}>
                        {g.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 700, background: '#f8f9fa' }}>
                  <td colSpan={2}>Cumulative GPA</td>
                  <td>{data.totalCredits}</td>
                  <td colSpan={2}>&nbsp;</td>
                  <td colSpan={2}><strong>{data.cgpa.toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Exam Results */}
      {data.exams.length > 0 && (
        <div className="lms-section" style={{ marginBottom: 24 }}>
          <div className="lms-section-title">📝 Exam Results</div>
          <div className="lms-table-container">
            <table className="lms-table">
              <thead>
                <tr><th>Exam</th><th>Score</th><th>Total</th><th>Percentage</th></tr>
              </thead>
              <tbody>
                {data.exams.map((e, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{e.exam || 'Unknown Exam'}</td>
                    <td>{e.score}</td>
                    <td>{e.total}</td>
                    <td>
                      <span className={`lms-status ${(e.percentage || 0) >= 40 ? 'lms-status-active' : 'lms-status-closed'}`}>
                        {(e.percentage || 0).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance */}
      <div className="lms-section">
        <div className="lms-section-title">📅 Attendance Summary</div>
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
          <div style={{ textAlign: 'center', padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)' }}>{data.attendance.present}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Classes Attended</div>
          </div>
          <div style={{ textAlign: 'center', padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{data.attendance.total}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Total Classes</div>
          </div>
          <div style={{ textAlign: 'center', padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: data.attendance.percentage >= 75 ? 'var(--success)' : 'var(--danger)' }}>
              {data.attendance.percentage}%
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Attendance</div>
          </div>
        </div>
        {data.attendance.percentage < 75 && (
          <div className="lms-alert lms-alert-warning" style={{ margin: '0 24px 24px' }}>
            ⚠️ Your attendance is below the required 75%. Please contact your department advisor.
          </div>
        )}
      </div>
    </LMSLayout>
  );
}
