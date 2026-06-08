'use client';

import { useEffect, useState } from 'react';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface TeacherAnalytics {
  totalCourses: number;
  totalStudents: number;
  totalAssignments: number;
  totalExams: number;
  courses: { title: string; code: string; students: number; status: string }[];
}

interface ExamStat {
  _id: string;
  title: string;
  subject: string;
  totalSubmissions: number;
  avgScore: number;
  passRate: number;
}

export default function FacultyAnalyticsPage() {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<TeacherAnalytics | null>(null);
  const [examStats, setExamStats] = useState<ExamStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [teacherRes, examRes] = await Promise.allSettled([
          api.get('/analytics/teacher'),
          api.get('/admin/reports/exam-stats'),
        ]);
        if (teacherRes.status === 'fulfilled') setAnalytics(teacherRes.value.data.data);
        if (examRes.status === 'fulfilled') setExamStats(examRes.value.data.data?.slice(0, 5) || []);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const maxStudents = Math.max(...(analytics?.courses || []).map(c => c.students), 1);

  return (
    <LMSLayout pageTitle="Academic Analytics" breadcrumbs={[{ label: 'Dashboard', href: '/faculty/dashboard' }, { label: 'Analytics' }]}>
      {/* Stats */}
      <div className="lms-stats-row" style={{ marginBottom: 24 }}>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--primary)' }}>{analytics?.totalCourses || 0}</div>
          <div className="lms-stat-label">My Courses</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--success)' }}>{analytics?.totalStudents || 0}</div>
          <div className="lms-stat-label">Students Taught</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--secondary)' }}>{analytics?.totalAssignments || 0}</div>
          <div className="lms-stat-label">Assignments Created</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--warning)' }}>{analytics?.totalExams || 0}</div>
          <div className="lms-stat-label">Exams Created</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>

        {/* Course-wise student distribution */}
        <div className="lms-section">
          <div className="lms-section-title">Course-wise Student Count</div>
          <div style={{ padding: 24 }}>
            {loading ? (
              <div className="lms-loading">Loading course data...</div>
            ) : !analytics?.courses?.length ? (
              <div className="lms-table-empty">No courses assigned to you. Contact admin to assign courses.</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 200, marginBottom: 12 }}>
                  {analytics.courses.slice(0, 6).map(c => {
                    const pct = Math.round((c.students / maxStudents) * 100);
                    return (
                      <div key={c.code} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{c.students}</div>
                        <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                          <div style={{ width: '100%', background: 'var(--primary)', height: `${Math.max(pct, 4)}%`, borderRadius: '4px 4px 0 0', transition: 'height 0.5s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 14, fontSize: 10, fontWeight: 600, textAlign: 'center' }}>
                  {analytics.courses.slice(0, 6).map(c => (
                    <div key={c.code} style={{ flex: 1, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.code}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Exam performance stats */}
        <div className="lms-section">
          <div className="lms-section-title">Recent Exam Performance</div>
          <div className="lms-table-container">
            {loading ? (
              <div className="lms-loading">Loading exam stats...</div>
            ) : examStats.length === 0 ? (
              <div className="lms-table-empty">No exam results available yet.</div>
            ) : (
              <table className="lms-table">
                <thead>
                  <tr>
                    <th>Exam Title</th>
                    <th>Submissions</th>
                    <th>Avg Score</th>
                    <th>Pass Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {examStats.map((exam) => (
                    <tr key={exam._id}>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{exam.title}</td>
                      <td>{exam.totalSubmissions}</td>
                      <td>{(exam.avgScore || 0).toFixed(1)}%</td>
                      <td>
                        <span className={`lms-status ${(exam.passRate || 0) >= 60 ? 'lms-status-active' : 'lms-status-closed'}`}>
                          {(exam.passRate || 0).toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Course status breakdown */}
        <div className="lms-section" style={{ gridColumn: '1 / -1' }}>
          <div className="lms-section-title">My Course Overview</div>
          {loading ? (
            <div className="lms-loading">Loading courses...</div>
          ) : !analytics?.courses?.length ? (
            <div className="lms-table-empty">No courses found.</div>
          ) : (
            <div className="lms-table-container">
              <table className="lms-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Code</th>
                    <th>Students Enrolled</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.courses.map(c => (
                    <tr key={c.code}>
                      <td style={{ fontWeight: 600 }}>{c.title}</td>
                      <td style={{ fontFamily: 'monospace' }}>{c.code}</td>
                      <td>{c.students}</td>
                      <td>
                        <span className={`lms-status ${c.status === 'published' || c.status === 'active' ? 'lms-status-active' : c.status === 'draft' ? 'lms-status-pending' : 'lms-status-closed'}`}>
                          {c.status?.toUpperCase() || 'ACTIVE'}
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
    </LMSLayout>
  );
}
