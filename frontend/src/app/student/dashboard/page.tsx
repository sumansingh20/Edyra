'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import LMSLayout from '@/components/layouts/LMSLayout';
import StatCard from '@/components/ui/StatCard';
import AnimatedCard from '@/components/ui/AnimatedCard';
import GlassPanel from '@/components/ui/GlassPanel';
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
    attendanceRate?: number;
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

  const STAT_CARDS = [
    { title: 'Current GPA', value: data?.performance.gpa || '0.00', icon: '🏆', variant: 'blue' as const },
    { title: 'Average Score', value: `${data?.performance.avgPercentage || '0.0'}%`, icon: '📈', variant: 'green' as const },
    { title: 'Exams Completed', value: data?.performance.totalExamsTaken || 0, icon: '📝', variant: 'orange' as const },
    { title: 'Attendance Rate', value: `${data?.performance.attendanceRate || '0.0'}%`, icon: '📅', variant: 'purple' as const },
  ];

  return (
    <LMSLayout pageTitle="Student Portal" breadcrumbs={[{ label: 'Dashboard' }]}>
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: 32 }}
      >
        <div style={{
          background: 'var(--grad-hero)',
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
              Welcome back, {user?.firstName}! 👋
            </h2>
            <p style={{ margin: 0, fontSize: 16, opacity: 0.9, maxWidth: 500, lineHeight: 1.6 }}>
              You have {data?.upcomingExams.length || 0} upcoming exams and {data?.courses.length || 0} active courses in this semester. Keep up the good work!
            </p>
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <Link href="/student/courses" className="lms-btn" style={{
                background: '#ffffff', color: 'var(--nav-bg)', fontWeight: 600, border: 'none', padding: '10px 24px'
              }}>
                Resume Learning
              </Link>
              <Link href="/student/exams" className="lms-btn" style={{
                background: 'rgba(255,255,255,0.15)', color: '#ffffff', fontWeight: 600, border: '1px solid rgba(255,255,255,0.3)', padding: '10px 24px', backdropFilter: 'blur(8px)'
              }}>
                View Schedule
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
        
        {/* Enrolled Courses */}
        <AnimatedCard delay={0.2} hover={false}>
          <div className="lms-section" style={{ height: '100%', minHeight: 350 }}>
            <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>📚</span> My Courses
              </span>
              <Link href="/student/courses" style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>View All →</Link>
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
              ) : data?.courses.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                  No courses enrolled this semester.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {data?.courses.map((course, i) => (
                    <motion.div
                      key={course._id}
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
                          {course.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
                            {course.code}
                          </span>
                          <span>Prof. {course.instructor?.lastName}</span>
                        </div>
                      </div>
                      <Link href={`/student/course/${course._id}`} className="lms-btn lms-btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }}>
                        Enter
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </AnimatedCard>

        {/* Upcoming Exams */}
        <AnimatedCard delay={0.25} hover={false}>
          <div className="lms-section" style={{ height: '100%', minHeight: 350 }}>
            <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>⏱️</span> Upcoming Exams
              </span>
              <Link href="/student/exams" style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)' }}>Schedule →</Link>
            </div>
            <div className="lms-section-body" style={{ padding: 0 }}>
              {loading ? (
                <div style={{ padding: 20 }}>
                  {[1, 2].map(i => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 12, width: '50%' }} />
                    </div>
                  ))}
                </div>
              ) : data?.upcomingExams.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
                  No upcoming exams right now.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {data?.upcomingExams.map((exam, i) => {
                    const isSoon = new Date(exam.startTime).getTime() - Date.now() < 86400000; // less than 24h
                    return (
                      <motion.div
                        key={exam._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + (i * 0.05) }}
                        style={{
                          padding: '16px 20px',
                          borderBottom: '1px solid var(--border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: isSoon ? 'var(--danger-bg)' : 'var(--card-bg)',
                          borderLeft: isSoon ? '3px solid var(--danger)' : '3px solid transparent',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14, marginBottom: 4 }}>
                            {exam.title}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: isSoon ? 'var(--danger)' : 'inherit', fontWeight: isSoon ? 600 : 400 }}>
                              📅 {format(new Date(exam.startTime), 'MMM dd, yyyy - HH:mm')}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              ⏳ {exam.duration}m
                            </span>
                          </div>
                        </div>
                        <Link href="/student/exams" className="lms-btn lms-btn-sm lms-btn-primary" style={{ whiteSpace: 'nowrap' }}>
                          View
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </AnimatedCard>

        {/* Recent Results Table */}
        <AnimatedCard delay={0.3} hover={false} className="lms-section" style={{ gridColumn: '1 / -1' }}>
          <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>📊</span> Recent Results
            </span>
            <Link href="/student/transcript" style={{ fontSize: 12, fontWeight: 600 }}>View Transcript →</Link>
          </div>
          <div className="lms-section-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: 20 }}>
                <div className="skeleton" style={{ height: 200, width: '100%' }} />
              </div>
            ) : (
              <div className="lms-table-container">
                <table className="lms-table">
                  <thead>
                    <tr>
                      <th>Exam / Assessment</th>
                      <th>Subject</th>
                      <th>Score</th>
                      <th>Percentage</th>
                      <th>Completed</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentResults.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                          No recent results to display.
                        </td>
                      </tr>
                    ) : (
                      data?.recentResults.map((result, i) => (
                        <motion.tr
                          key={result.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 + (i * 0.05) }}
                        >
                          <td style={{ fontWeight: 600, color: 'var(--text)' }}>{result.examTitle}</td>
                          <td style={{ fontSize: 13 }}>{result.subject}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 500 }}>
                            {result.marksObtained} <span style={{ color: 'var(--text-muted)' }}>/ {result.totalMarks}</span>
                          </td>
                          <td>
                            <span className={`lms-status ${
                              result.percentage >= 75 ? 'lms-status-active' :
                              result.percentage >= 40 ? 'lms-status-warning' :
                              'lms-status-closed'
                            }`} style={{ padding: '4px 10px', fontSize: 12, borderRadius: 'var(--radius-full)' }}>
                              {result.percentage.toFixed(1)}%
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {format(new Date(result.submittedAt), 'MMM dd, yyyy')}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <Link href={`/student/grades`} className="lms-btn lms-btn-sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>
                              Details
                            </Link>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </AnimatedCard>
      </div>
    </LMSLayout>
  );
}
