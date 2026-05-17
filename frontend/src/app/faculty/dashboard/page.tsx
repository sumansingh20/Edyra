'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function FacultyDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/teacher/dashboard');
        setStats(response.data.data);
      } catch (err) {
        console.error('Failed to fetch faculty stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <LMSLayout pageTitle="Faculty Dashboard" breadcrumbs={[{ label: 'Dashboard' }]}>
      <div className="lms-welcome-box" style={{ marginBottom: 24, padding: 24, background: 'var(--nav-bg)', borderRadius: 'var(--radius)', color: '#fff' }}>
        <h2 style={{ margin: 0, fontSize: 24 }}>Academic Console: {user?.firstName} {user?.lastName}</h2>
        <p style={{ margin: '8px 0 0', opacity: 0.8 }}>Manage your courses, assignments, and student performance from here.</p>
      </div>

      <div className="lms-stats-row" style={{ marginBottom: 24 }}>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--primary)' }}>{stats?.stats?.totalExams || 0}</div>
          <div className="lms-stat-label">Total Quizzes</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--secondary)' }}>{stats?.stats?.activeExams || 0}</div>
          <div className="lms-stat-label">Active Exams</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--success)' }}>{stats?.stats?.totalStudents || 0}</div>
          <div className="lms-stat-label">Enrolled Students</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--warning)' }}>{stats?.stats?.recentViolations || 0}</div>
          <div className="lms-stat-label">Proctoring Alerts</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        {/* Recent Exams */}
        <div className="lms-section">
          <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>My Quizzes & Exams</span>
            <Link href="/faculty/quiz/create" className="lms-btn lms-btn-sm lms-btn-primary">+ Create New</Link>
          </div>
          {loading ? <div className="lms-loading">Loading...</div> : (
            <div className="lms-exam-list">
              {stats?.recentExams.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No exams found.</div>
              ) : stats?.recentExams.map((exam: any) => (
                <div key={exam._id} className="lms-info-row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{exam.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{exam.subject} • {exam.status.toUpperCase()}</div>
                  </div>
                  <Link href={`/faculty/quiz/manage/${exam._id}`} className="lms-btn lms-btn-sm">Manage</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Submissions */}
        <div className="lms-section">
          <div className="lms-section-title">Recent Submissions</div>
          {loading ? <div className="lms-loading">Loading...</div> : (
            <div className="lms-submission-list">
              {stats?.recentSubmissions.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No submissions yet.</div>
              ) : stats?.recentSubmissions.map((s: any) => (
                <div key={s._id} className="lms-info-row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{s.student?.firstName} {s.student?.lastName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.exam?.title} • {s.marksObtained}/{s.totalMarks}</div>
                  </div>
                  <Link href={`/faculty/submissions/${s._id}`} className="lms-btn lms-btn-sm">Review</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </LMSLayout>
  );
}
