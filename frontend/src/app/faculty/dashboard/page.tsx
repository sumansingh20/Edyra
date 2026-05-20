'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import LMSLayout from '@/components/layouts/LMSLayout';
import StatCard from '@/components/ui/StatCard';
import AnimatedCard from '@/components/ui/AnimatedCard';
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

  const STAT_CARDS = [
    { title: 'Total Quizzes', value: stats?.stats?.totalExams || 0, icon: '📋', variant: 'blue' as const },
    { title: 'Active Exams', value: stats?.stats?.activeExams || 0, icon: '🔥', variant: 'orange' as const },
    { title: 'Enrolled Students', value: stats?.stats?.totalStudents || 0, icon: '👥', variant: 'teal' as const },
    { title: 'Proctoring Alerts', value: stats?.stats?.recentViolations || 0, icon: '🚨', variant: 'red' as const },
  ];

  return (
    <LMSLayout pageTitle="Faculty Portal" breadcrumbs={[{ label: 'Dashboard' }]}>
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: 32 }}
      >
        <div style={{
          background: 'var(--grad-purple)',
          borderRadius: 'var(--radius-xl)',
          padding: '40px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {/* Abstract decoration */}
          <div style={{
            position: 'absolute', top: -50, right: -50, width: 250, height: 250,
            borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
            border: '2px solid rgba(255,255,255,0.1)'
          }} />
          <div style={{
            position: 'absolute', bottom: -80, right: 100, width: 200, height: 200,
            borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
            border: '2px solid rgba(255,255,255,0.05)'
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{
              margin: '0 0 12px 0',
              fontSize: 36,
              fontWeight: 800,
              fontFamily: "'Outfit', 'Inter', sans-serif",
              letterSpacing: '-0.02em'
            }}>
              Academic Console: {user?.firstName} {user?.lastName}
            </h2>
            <p style={{ margin: 0, fontSize: 16, opacity: 0.9, maxWidth: 600, lineHeight: 1.6 }}>
              Manage your courses, exams, and student performance from here. You currently have {stats?.stats?.activeExams || 0} active exams and {stats?.recentSubmissions?.length || 0} pending submissions to review.
            </p>
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <Link href="/faculty/quiz/create" className="lms-btn" style={{
                background: '#ffffff', color: 'var(--nav-bg)', fontWeight: 600, border: 'none', padding: '10px 24px'
              }}>
                + Create Exam
              </Link>
              <Link href="/faculty/courses" className="lms-btn" style={{
                background: 'rgba(255,255,255,0.15)', color: '#ffffff', fontWeight: 600, border: '1px solid rgba(255,255,255,0.3)', padding: '10px 24px', backdropFilter: 'blur(8px)'
              }}>
                Manage Courses
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 32,
      }}>
        {STAT_CARDS.map((card, i) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            variant={card.variant}
            delay={i * 0.08}
            loading={loading}
          />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        {/* Recent Exams */}
        <AnimatedCard delay={0.2} hover={false}>
          <div className="lms-section" style={{ height: '100%', minHeight: 350 }}>
            <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>📋</span> My Quizzes & Exams
              </span>
              <Link href="/faculty/exam/manage" style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>Manage All →</Link>
            </div>
            <div className="lms-section-body" style={{ padding: 0 }}>
              {loading ? (
                <div style={{ padding: 20 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 12, width: '40%' }} />
                    </div>
                  ))}
                </div>
              ) : stats?.recentExams?.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                  No exams found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {stats?.recentExams?.map((exam: any, i: number) => (
                    <motion.div
                      key={exam._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + (i * 0.05) }}
                      style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--card-bg)',
                        transition: 'background 0.2s',
                      }}
                      whileHover={{ background: 'var(--card-hover)' }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15, marginBottom: 4 }}>
                          {exam.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
                            {exam.subject}
                          </span>
                          <span className={`lms-status ${
                            exam.status === 'published' ? 'lms-status-active' :
                            exam.status === 'draft' ? 'lms-status-pending' :
                            'lms-status-closed'
                          }`}>
                            {exam.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <Link href={`/faculty/quiz/manage/${exam._id}`} className="lms-btn lms-btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }}>
                        Manage
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </AnimatedCard>

        {/* Recent Submissions */}
        <AnimatedCard delay={0.25} hover={false}>
          <div className="lms-section" style={{ height: '100%', minHeight: 350 }}>
            <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>📤</span> Recent Submissions
              </span>
              <Link href="/faculty/grades/manage" style={{ fontSize: 12, fontWeight: 600 }}>Gradebook →</Link>
            </div>
            <div className="lms-section-body" style={{ padding: 0 }}>
              {loading ? (
                <div style={{ padding: 20 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 12, width: '50%' }} />
                    </div>
                  ))}
                </div>
              ) : stats?.recentSubmissions?.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
                  No submissions pending review.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {stats?.recentSubmissions?.map((s: any, i: number) => (
                    <motion.div
                      key={s._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + (i * 0.05) }}
                      style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--card-bg)',
                      }}
                      whileHover={{ background: 'var(--card-hover)' }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14, marginBottom: 4 }}>
                          {s.student?.firstName} {s.student?.lastName}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            📝 {s.exam?.title}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'monospace' }}>
                            📊 {s.marksObtained}/{s.totalMarks}
                          </span>
                        </div>
                      </div>
                      <Link href={`/faculty/submissions/${s._id}`} className="lms-btn lms-btn-sm lms-btn-primary" style={{ whiteSpace: 'nowrap' }}>
                        Review
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </AnimatedCard>
      </div>
    </LMSLayout>
  );
}
