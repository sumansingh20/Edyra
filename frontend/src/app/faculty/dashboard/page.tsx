'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import LMSLayout from '@/components/layouts/LMSLayout';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';

interface FacultyDashData {
  totalCourses: number;
  totalStudents: number;
  pendingGrading: number;
  attendanceToday: number;
  myCourses: any[];
  pendingSubmissions: any[];
  recentAnnouncements: any[];
  upcomingClasses: any[];
}

export default function FacultyDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<FacultyDashData>({
    totalCourses: 0, totalStudents: 0, pendingGrading: 0,
    attendanceToday: 0, myCourses: [], pendingSubmissions: [], recentAnnouncements: [], upcomingClasses: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [coursesRes, assignmentsRes] = await Promise.allSettled([
        api.get('/courses', { params: { faculty: true, limit: 20 } }),
        api.get('/assignments', { params: { faculty: true, pendingGrading: true, limit: 10 } }),
      ]);

      const courses = coursesRes.status === 'fulfilled' ? (coursesRes.value.data?.data?.courses || coursesRes.value.data?.data || []) : [];
      const submissions = assignmentsRes.status === 'fulfilled' ? (assignmentsRes.value.data?.data || []) : [];

      setData(prev => ({
        ...prev,
        totalCourses: Array.isArray(courses) ? courses.length : 0,
        myCourses: Array.isArray(courses) ? courses.slice(0, 6) : [],
        pendingSubmissions: Array.isArray(submissions) ? submissions.slice(0, 5) : [],
        pendingGrading: Array.isArray(submissions) ? submissions.length : 0,
      }));
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stats = [
    { label: 'My Courses', value: data.totalCourses, icon: '', color: 'blue', href: '/faculty/courses' },
    { label: 'Students', value: data.totalStudents || '—', icon: '', color: 'green', href: '/faculty/courses' },
    { label: 'Pending Grading', value: data.pendingGrading, icon: '', color: data.pendingGrading > 0 ? 'orange' : 'green', href: '/faculty/assignment/manage' },
    { label: 'Today\'s Classes', value: data.attendanceToday || '—', icon: '', color: '', href: '/faculty/attendance' },
  ];

  return (
    <LMSLayout pageTitle="Faculty Dashboard" breadcrumbs={[{ label: 'Faculty' }, { label: 'Dashboard' }]}>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1d2d3e 0%, #0f6cbf 100%)',
        color: '#fff', borderRadius: 'var(--radius-lg)', padding: '24px 28px',
        marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }} className="animate-fadeInDown">
        <div>
          <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 6 }}>Welcome,</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
            {user?.firstName} {user?.lastName} ‍
          </div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>
            {format(new Date(), 'EEEE, dd MMMM yyyy')} · Faculty Panel
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/faculty/courses" className="lms-btn" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
             My Courses
          </Link>
          <Link href="/faculty/attendance" className="lms-btn" style={{ background: 'var(--primary)', color: '#fff', border: 'none' }}>
             Mark Attendance
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="lms-stats-grid">
        {stats.map((s, i) => (
          <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}
            className={`lms-stat-card ${s.color} animate-fadeInUp stagger-${i + 1}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
            </div>
            <div className="lms-stat-value">{s.value}</div>
            <div className="lms-stat-label">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="admin-grid" style={{ marginTop: 4 }}>
        {/* Left Column */}
        <div>
          {/* Quick Actions */}
          <div className="lms-section animate-fadeIn stagger-1">
            <div className="lms-section-title"> Quick Actions</div>
            <div style={{ padding: 14 }}>
              <div className="quick-action-grid">
                {[
                  { href: '/faculty/courses', icon: '', label: 'My Courses' },
                  { href: '/faculty/attendance', icon: '', label: 'Mark Attendance' },
                  { href: '/faculty/assignments', icon: '', label: 'Assignments' },
                  { href: '/faculty/grades/manage', icon: '', label: 'Gradebook' },
                  { href: '/teacher/exams/create', icon: '', label: 'Create Exam' },
                  { href: '/teacher/monitor', icon: '️', label: 'Live Monitor' },
                  { href: '/teacher/questions', icon: '', label: 'Question Bank' },
                  { href: '/faculty/analytics', icon: '', label: 'Analytics' },
                ].map(a => (
                  <Link key={a.href} href={a.href} className="quick-action">
                    <div className="quick-action-icon">{a.icon}</div>
                    <span>{a.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* My Courses */}
          <div className="lms-section animate-fadeIn stagger-2">
            <div className="lms-section-title">
               My Courses
              <Link href="/faculty/courses" className="lms-btn lms-btn-sm" style={{ marginLeft: 'auto' }}>View All →</Link>
            </div>
            <div style={{ padding: 16 }}>
              {loading ? (
                <div className="lms-spinner"><div className="spinner" /></div>
              ) : data.myCourses.length > 0 ? (
                data.myCourses.map((c: any) => (
                  <div key={c._id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--radius)', background: 'var(--grad-blue)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
                    }}>
                      {(c.title || 'C')[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--nav-bg)' }}>{c.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {c.enrolledCount || 0} students · {c.credits || 3} credits
                      </div>
                    </div>
                    <Link href={`/faculty/courses/${c._id}`} className="lms-btn lms-btn-sm lms-btn-secondary">
                      Manage
                    </Link>
                  </div>
                ))
              ) : (
                <div className="lms-table-empty" style={{ padding: 32 }}>
                  No courses assigned. Contact your department coordinator.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div>
          {/* Pending Grading */}
          <div className="lms-section animate-fadeIn stagger-3">
            <div className="lms-section-title">
               Pending Grading
              {data.pendingGrading > 0 && (
                <span className="lms-num-badge" style={{ marginLeft: 8 }}>{data.pendingGrading}</span>
              )}
              <Link href="/faculty/assignment/manage" className="lms-btn lms-btn-sm" style={{ marginLeft: 'auto' }}>View All</Link>
            </div>
            <div style={{ padding: '0 16px' }}>
              {data.pendingSubmissions.length > 0 ? data.pendingSubmissions.map((s: any) => (
                <div key={s._id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {s.submissionCount || 0} submissions pending
                    </div>
                  </div>
                  <Link href={`/faculty/assignments/${s._id}`} className="lms-btn lms-btn-sm lms-btn-primary">
                    Grade
                  </Link>
                </div>
              )) : (
                <div className="lms-table-empty" style={{ padding: 24 }}>
                  <span style={{ color: 'var(--success)' }}> All caught up!</span>
                </div>
              )}
            </div>
          </div>

          {/* Exam Actions */}
          <div className="lms-section animate-fadeIn stagger-4">
            <div className="lms-section-title"> Exam Management</div>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/teacher/exams/create" className="lms-btn lms-btn-primary" style={{ justifyContent: 'center' }}>
                 Create New Exam
              </Link>
              <Link href="/teacher/exams" className="lms-btn lms-btn-default" style={{ justifyContent: 'center' }}>
                 Manage Exams
              </Link>
              <Link href="/teacher/monitor" className="lms-btn lms-btn-default" style={{ justifyContent: 'center' }}>
                ️ Live Monitor
              </Link>
              <Link href="/teacher/results" className="lms-btn lms-btn-default" style={{ justifyContent: 'center' }}>
                 Results & Reports
              </Link>
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="lms-section animate-fadeIn stagger-5">
            <div className="lms-section-title"> Today's Schedule</div>
            <div style={{ padding: '0 16px' }}>
              <div className="lms-table-empty" style={{ padding: 24, fontSize: 12 }}>
                Connect your timetable to see today's classes.
                <br />
                <Link href="/erp/timetable" style={{ color: 'var(--secondary)', fontSize: 11 }}>View Timetable →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LMSLayout>
  );
}
