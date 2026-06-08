'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import LMSLayout from '@/components/layouts/LMSLayout';

interface AnalyticsData {
  totalUsers: number;
  totalStudents: number;
  totalFaculty: number;
  totalCourses: number;
  totalExams: number;
  totalSubmissions: number;
  avgGpa: number;
  avgAttendance: number;
  topCourses: any[];
  gradeDistribution: any;
  enrollmentTrend: any[];
  submissionStats: any;
  departmentStats: any[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Partial<AnalyticsData>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'courses' | 'exams'>('overview');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, courseRes, studentRes, instRes, examStatsRes] = await Promise.allSettled([
        api.get('/analytics/dashboard'),
        api.get('/analytics/course', { params: { limit: 10 } }),
        api.get('/analytics/student'),
        api.get('/analytics/institution'),
        api.get('/admin/reports/exam-stats'),
      ]);

      let merged: any = {};
      if (dashRes.status === 'fulfilled') merged = { ...merged, ...(dashRes.value.data?.data || {}) };
      if (courseRes.status === 'fulfilled') merged.topCourses = courseRes.value.data?.data || [];
      if (studentRes.status === 'fulfilled') merged.studentData = studentRes.value.data?.data || {};
      if (instRes.status === 'fulfilled') merged.instData = instRes.value.data?.data || {};
      if (examStatsRes.status === 'fulfilled') merged.examStatsData = examStatsRes.value.data?.data || [];

      setData(merged);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const MetricCard = ({ title, value, icon, sub, color }: { title: string; value: any; icon: string; sub?: string; color?: string }) => (
    <div className={`lms-stat-card ${color || ''}`} style={{ flex: 1, minWidth: 150 }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <div className="lms-stat-value" style={{ fontSize: 24 }}>{value ?? '—'}</div>
      <div className="lms-stat-label">{title}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>{sub}</div>}
    </div>
  );

  const gradeColors: Record<string, string> = {
    'A+': '#16a34a', 'A': '#22c55e', 'A-': '#4ade80',
    'B+': '#2563eb', 'B': '#3b82f6', 'B-': '#60a5fa',
    'C+': '#d97706', 'C': '#f59e0b', 'D': '#f87171', 'F': '#dc2626',
  };

  return (
    <LMSLayout pageTitle="Analytics Platform" breadcrumbs={[{ label: 'Admin' }, { label: 'Analytics' }]}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f6cbf 0%, #1d2d3e 100%)',
        color: '#fff', borderRadius: 'var(--radius-lg)', padding: '20px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }} className="animate-fadeInDown">
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}> Analytics Platform</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>Institutional performance insights and academic analytics</div>
        </div>
        <button
          onClick={fetchAnalytics}
          className="lms-btn"
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
        >
           Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="lms-tabs">
        {(['overview', 'students', 'courses', 'exams'] as const).map(t => (
          <button key={t} className={`lms-tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'overview' ? '️ Institution' : t === 'students' ? ' Students' : t === 'courses' ? ' Courses' : ' Exams'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="lms-spinner"><div className="spinner" /><span>Loading analytics...</span></div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              {/* Key Metrics */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                <MetricCard title="Total Users" value={data.totalUsers || (data as any).users?.total || 0} icon="" color="blue" />
                <MetricCard title="Students" value={data.totalStudents || (data as any).students?.total || 0} icon="" color="green" />
                <MetricCard title="Faculty" value={data.totalFaculty || (data as any).faculty?.total || 0} icon="‍" />
                <MetricCard title="Active Courses" value={data.totalCourses || 0} icon="" color="blue" />
                <MetricCard title="Avg. GPA" value={data.avgGpa ? data.avgGpa.toFixed(2) : (data as any).instData?.avgGpa?.toFixed(2) || '—'} icon="" color="green" />
                <MetricCard title="Avg. Attendance" value={data.avgAttendance ? `${Math.round(data.avgAttendance)}%` : '—'} icon="" color="" />
              </div>

              {/* Grade Distribution */}
              <div className="admin-grid" style={{ marginBottom: 20 }}>
                <div className="lms-section">
                  <div className="lms-section-title"> Grade Distribution</div>
                  <div style={{ padding: 16 }}>
                    {data.gradeDistribution ? (
                      Object.entries(data.gradeDistribution).map(([grade, count]: [string, any]) => (
                        <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 32, fontWeight: 700, fontSize: 13, color: gradeColors[grade] || 'var(--text)' }}>
                            {grade}
                          </div>
                          <div style={{ flex: 1, background: 'var(--bg-secondary)', borderRadius: 4, height: 20, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${Math.min(((count as number) / Math.max(...(Object.values(data.gradeDistribution || {}) as number[]))) * 100, 100)}%`,
                              background: (gradeColors as any)[grade] || 'var(--primary)',
                              borderRadius: 4,
                              transition: 'width 0.8s ease',
                            }} />
                          </div>
                          <div style={{ width: 40, textAlign: 'right', fontSize: 13, color: 'var(--text-muted)' }}>
                            {count}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="lms-table-empty" style={{ padding: 24 }}>No grade data available.</div>
                    )}
                  </div>
                </div>

                {/* Department Stats */}
                <div className="lms-section">
                  <div className="lms-section-title">️ Department Performance</div>
                  <div className="lms-table-container">
                    {(data.departmentStats || (data as any).instData?.departments || []).length > 0 ? (
                      <table className="lms-table">
                        <thead>
                          <tr>
                            <th>Department</th>
                            <th>Students</th>
                            <th>Avg. GPA</th>
                            <th>Attendance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(data.departmentStats || (data as any).instData?.departments || []).map((d: any, i: number) => (
                            <tr key={d.name || i}>
                              <td style={{ fontWeight: 500 }}>{d.name}</td>
                              <td>{d.students || d.studentCount || 0}</td>
                              <td>{d.avgGpa ? d.avgGpa.toFixed(2) : '—'}</td>
                              <td>
                                <span className={`lms-status ${(d.attendance || 0) >= 75 ? 'lms-status-active' : 'lms-status-pending'}`}>
                                  {d.attendance ? `${Math.round(d.attendance)}%` : '—'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="lms-table-empty" style={{ padding: 24 }}>No department data.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div>
              <div className="admin-grid">
                <div className="lms-section">
                  <div className="lms-section-title"> Student Performance Metrics</div>
                  <div style={{ padding: 16 }}>
                    {[
                      { label: 'Average GPA', value: (data as any).studentData?.avgGpa?.toFixed(2) || '—', icon: '' },
                      { label: 'Pass Rate', value: (data as any).studentData?.passRate ? `${Math.round((data as any).studentData.passRate)}%` : '—', icon: '' },
                      { label: 'Avg. Attendance', value: (data as any).studentData?.avgAttendance ? `${Math.round((data as any).studentData.avgAttendance)}%` : '—', icon: '' },
                      { label: 'At Risk (< 75% attendance)', value: (data as any).studentData?.atRisk || 0, icon: '️' },
                      { label: 'Active Enrollments', value: (data as any).studentData?.activeEnrollments || 0, icon: '' },
                    ].map(m => (
                      <div key={m.label} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 0', borderBottom: '1px solid var(--border)',
                      }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span>{m.icon}</span>
                          <span style={{ fontSize: 13 }}>{m.label}</span>
                        </div>
                        <strong style={{ fontSize: 16, color: 'var(--nav-bg)' }}>{m.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="lms-section">
                  <div className="lms-section-title"> Enrollment by Department</div>
                  <div style={{ padding: 16 }}>
                    {((data as any).instData?.enrollmentByDept || []).map((d: any, i: number) => (
                      <div key={i} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                          <span>{d.name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{d.count || 0} students</span>
                        </div>
                        <div className="lms-progress">
                          <div className="lms-progress-bar blue" style={{ width: `${Math.min((d.count / ((data as any).totalStudents || 1)) * 100, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                    {!((data as any).instData?.enrollmentByDept?.length) && (
                      <div className="lms-table-empty" style={{ padding: 24 }}>No enrollment data.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div className="lms-section">
              <div className="lms-section-title"> Course Performance</div>
              <div className="lms-table-container">
                {(data.topCourses || []).length > 0 ? (
                  <table className="lms-table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Enrolled</th>
                        <th>Avg. Score</th>
                        <th>Pass Rate</th>
                        <th>Completion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.topCourses || []).map((c: any, i: number) => (
                        <tr key={c._id || i}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{c.title || c.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.code}</div>
                          </td>
                          <td>{c.enrolledCount || c.students || 0}</td>
                          <td>{c.avgScore ? `${Math.round(c.avgScore)}%` : '—'}</td>
                          <td>
                            <span className={`lms-status ${(c.passRate || 0) >= 80 ? 'lms-status-active' : 'lms-status-pending'}`}>
                              {c.passRate ? `${Math.round(c.passRate)}%` : '—'}
                            </span>
                          </td>
                          <td>
                            <div className="lms-progress" style={{ minWidth: 80 }}>
                              <div className="lms-progress-bar" style={{ width: `${c.completion || 0}%` }} />
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.completion || 0}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="lms-table-empty" style={{ padding: 40 }}>No course analytics data.</div>
                )}
              </div>
            </div>
          )}

          {/* Exams Tab */}
          {activeTab === 'exams' && (
            <div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                {[
                  { title: 'Total Exams', value: data.totalExams || 0, icon: '' },
                  { title: 'Total Submissions', value: data.totalSubmissions || 0, icon: '' },
                  { title: 'Avg. Score', value: (data as any).submissionStats?.avgScore ? `${Math.round((data as any).submissionStats.avgScore)}%` : '—', icon: '' },
                  { title: 'Pass Rate', value: (data as any).submissionStats?.passRate ? `${Math.round((data as any).submissionStats.passRate)}%` : '—', icon: '' },
                ].map(m => (
                  <MetricCard key={m.title} {...m} />
                ))}
              </div>
              <div className="lms-section">
                <div className="lms-section-title"> Exam Statistics</div>
                <div className="lms-table-container">
                  {((data as any).examStatsData || []).length > 0 ? (
                    <table className="lms-table">
                      <thead>
                        <tr>
                          <th>Exam Title</th>
                          <th>Subject</th>
                          <th>Students Enrolled</th>
                          <th>Submissions</th>
                          <th>Avg Score</th>
                          <th>Pass Rate</th>
                          <th>Avg Time (s)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {((data as any).examStatsData || []).map((e: any, i: number) => (
                          <tr key={e._id || i}>
                            <td style={{ fontWeight: 600 }}>{e.title}</td>
                            <td>{e.subject || 'N/A'}</td>
                            <td>{e.totalStudents}</td>
                            <td>{e.totalSubmissions}</td>
                            <td>{e.avgScore}%</td>
                            <td>
                              <span className={`lms-status ${(e.passRate || 0) >= 60 ? 'lms-status-active' : 'lms-status-warning'}`}>
                                {e.passRate}%
                              </span>
                            </td>
                            <td>{e.avgTimeSpent}s</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="lms-table-empty" style={{ padding: 40 }}>
                      No examination data available.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </LMSLayout>
  );
}
