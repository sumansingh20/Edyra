'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/authStore';

interface DashboardData {
  courses: any[];
  upcomingExams: any[];
  recentResults: any[];
  performance: {
    gpa: string;
    avgPercentage: string;
    totalExamsTaken: number;
  };
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/student/dashboard');
        setData(response.data.data);
      } catch (err) {
        console.error('Failed to fetch student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <LMSLayout pageTitle="Student Dashboard" breadcrumbs={[{ label: 'Dashboard' }]}>
      <div className="lms-welcome-box" style={{ marginBottom: 24, padding: 24, background: 'var(--nav-bg)', borderRadius: 'var(--radius)', color: '#fff' }}>
        <h2 style={{ margin: 0, fontSize: 24 }}>Welcome back, {user?.firstName}!</h2>
        <p style={{ margin: '8px 0 0', opacity: 0.8 }}>You have {data?.upcomingExams.length || 0} upcoming exams and {data?.courses.length || 0} active courses.</p>
      </div>

      <div className="lms-stats-row" style={{ marginBottom: 24 }}>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--primary)' }}>{data?.performance.gpa || '0.00'}</div>
          <div className="lms-stat-label">Current GPA</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--secondary)' }}>{data?.performance.avgPercentage || '0.0'}%</div>
          <div className="lms-stat-label">Average Score</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--success)' }}>{data?.performance.totalExamsTaken || 0}</div>
          <div className="lms-stat-label">Exams Completed</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        {/* Enrolled Courses */}
        <div className="lms-section">
          <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>My Enrolled Courses</span>
            <Link href="/student/courses" className="lms-link-btn" style={{ fontSize: 12 }}>View All</Link>
          </div>
          {loading ? <div className="lms-loading">Loading...</div> : (
            <div className="lms-course-list">
              {data?.courses.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No courses enrolled.</div>
              ) : data?.courses.map(course => (
                <div key={course._id} className="lms-info-row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{course.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{course.code} • {course.instructor?.firstName} {course.instructor?.lastName}</div>
                  </div>
                  <Link href={`/student/course/${course._id}`} className="lms-btn lms-btn-sm">Enter</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Exams */}
        <div className="lms-section">
          <div className="lms-section-title">Upcoming Exams</div>
          {loading ? <div className="lms-loading">Loading...</div> : (
            <div className="lms-exam-list">
              {data?.upcomingExams.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No upcoming exams.</div>
              ) : data?.upcomingExams.map(exam => (
                <div key={exam._id} className="lms-info-row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{exam.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(exam.startTime), 'MMM dd, yyyy HH:mm')} • {exam.duration} mins</div>
                  </div>
                  <Link href="/student/quiz" className="lms-btn lms-btn-sm lms-btn-primary">View</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Results */}
        <div className="lms-section" style={{ gridColumn: '1 / -1' }}>
          <div className="lms-section-title">Recent Exam Results</div>
          {loading ? <div className="lms-loading">Loading...</div> : (
            <div className="lms-table-container">
              <table className="lms-table">
                <thead>
                  <tr>
                    <th>Exam Title</th>
                    <th>Subject</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Submitted At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recentResults.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center' }}>No results available.</td></tr>
                  ) : data?.recentResults.map(result => (
                    <tr key={result.id}>
                      <td style={{ fontWeight: 600 }}>{result.examTitle}</td>
                      <td>{result.subject}</td>
                      <td>{result.marksObtained} / {result.totalMarks}</td>
                      <td>
                        <span className={`lms-status ${result.percentage >= 40 ? 'lms-status-active' : 'lms-status-closed'}`}>
                          {result.percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td>{format(new Date(result.submittedAt), 'dd/MM/yyyy HH:mm')}</td>
                      <td>
                        <Link href={`/student/grades`} className="lms-btn lms-btn-sm">Details</Link>
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
