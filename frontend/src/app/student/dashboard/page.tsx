'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { format } from 'date-fns';
import LMSLayout from '@/components/layouts/LMSLayout';
import { BookOpen, FileText, CalendarCheck, BarChart2, Bell, User, MessageSquare, ClipboardList, GraduationCap, MonitorPlay } from 'lucide-react';

interface DashboardData {
  enrolledCourses: number;
  pendingAssignments: number;
  upcomingExams: number;
  attendancePercent: number;
  cgpa: number;
  recentCourses: any[];
  recentGrades: any[];
  announcements: any[];
  upcomingExamsList: any[];
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData>({
    enrolledCourses: 0,
    pendingAssignments: 0,
    upcomingExams: 0,
    attendancePercent: 0,
    cgpa: 0,
    recentCourses: [],
    recentGrades: [],
    announcements: [],
    upcomingExamsList: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [coursesRes, assignmentsRes, attendanceRes, gradesRes, announcementsRes] = await Promise.allSettled([
        api.get('/courses', { params: { enrolled: true, limit: 6 } }),
        api.get('/assignments', { params: { pending: true, limit: 5 } }),
        api.get('/attendance/summary'),
        api.get('/gradebook/my', { params: { limit: 5 } }),
        api.get('/communication/announcements', { params: { limit: 5 } }),
      ]);

      const courses = coursesRes.status === 'fulfilled' ? (coursesRes.value.data?.data?.courses || coursesRes.value.data?.data || []) : [];
      const assignments = assignmentsRes.status === 'fulfilled' ? (assignmentsRes.value.data?.data || []) : [];
      const attendance = attendanceRes.status === 'fulfilled' ? (attendanceRes.value.data?.data || {}) : {};
      const grades = gradesRes.status === 'fulfilled' ? (gradesRes.value.data?.data || []) : [];
      const announcements = announcementsRes.status === 'fulfilled' ? (announcementsRes.value.data?.data || []) : [];

      setData({
        enrolledCourses: Array.isArray(courses) ? courses.length : 0,
        pendingAssignments: Array.isArray(assignments) ? assignments.filter((a: any) => a.status === 'pending' || !a.submitted).length : 0,
        upcomingExams: 0,
        attendancePercent: attendance.overallPercentage || attendance.percentage || 0,
        cgpa: grades.cgpa || 0,
        recentCourses: Array.isArray(courses) ? courses.slice(0, 6) : [],
        recentGrades: Array.isArray(grades) ? grades.slice(0, 5) : (grades.grades ? grades.grades.slice(0, 5) : []),
        announcements: Array.isArray(announcements) ? announcements.slice(0, 5) : [],
        upcomingExamsList: [],
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const statCards = [
    { label: 'Enrolled Courses', value: data.enrolledCourses, icon: <BookOpen size={24} />, color: 'blue', href: '/student/courses' },
    { label: 'Pending Assignments', value: data.pendingAssignments, icon: <FileText size={24} />, color: 'orange', href: '/student/assignment' },
    { label: 'Attendance', value: `${Math.round(data.attendancePercent)}%`, icon: <CalendarCheck size={24} />, color: (data.attendancePercent >= 75) ? 'green' : 'red', href: '/student/attendance' },
    { label: 'Current CGPA', value: data.cgpa ? data.cgpa.toFixed(2) : 'N/A', icon: <BarChart2 size={24} />, color: 'green', href: '/student/grades' },
  ];

  if (loading) {
    return (
      <LMSLayout pageTitle="Student Dashboard">
        <div className="lms-spinner"><div className="spinner" /><span>Loading your dashboard...</span></div>
      </LMSLayout>
    );
  }

  return (
    <LMSLayout pageTitle="Student Dashboard" breadcrumbs={[{ label: 'Student Portal' }, { label: 'Dashboard' }]}>
      {/* Welcome Banner */}
      <div style={{
        background: 'var(--grad-hero)', color: '#fff', borderRadius: 'var(--radius-lg)',
        padding: '24px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }} className="animate-fadeInDown">
        <div>
          <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 6 }}>Welcome back,</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
            {user?.firstName} {user?.lastName} 
          </div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>
            {format(new Date(), 'EEEE, dd MMMM yyyy')} · {user?.studentId && `ID: ${user.studentId}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/student/courses" className="lms-btn" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
             My Courses
          </Link>
          <Link href="/my" className="lms-btn" style={{ background: 'var(--primary)', color: '#fff', border: 'none' }}>
             Exam Portal
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="lms-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
        {statCards.map((s, i) => (
          <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}
            className={`lms-stat-card ${s.color} animate-fadeInUp stagger-${i + 1}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <span className="lms-status lms-status-active" style={{ fontSize: 10 }}>View</span>
            </div>
            <div className="lms-stat-value">{s.value}</div>
            <div className="lms-stat-label">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="admin-grid" style={{ marginTop: 4 }}>
        {/* Recent Courses */}
        <div>
          <div className="lms-section animate-fadeIn stagger-2">
            <div className="lms-section-title">
               My Enrolled Courses
              <Link href="/student/courses" className="lms-btn lms-btn-sm" style={{ marginLeft: 'auto' }}>View All →</Link>
            </div>
            <div style={{ padding: 16 }}>
              {data.recentCourses.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.recentCourses.map((course: any) => (
                    <Link key={course._id} href={`/student/course/${course._id}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                        border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                        textDecoration: 'none', background: 'var(--bg)', transition: 'all .15s',
                      }}
                      className="lms-card-hover"
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 'var(--radius)',
                        background: 'var(--grad-primary)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
                      }}>
                        {(course.title || course.name || 'C')[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                          {course.title || course.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {course.instructor || course.faculty || 'Faculty'} · {course.credits || 3} Credits
                        </div>
                        {typeof course.progress === 'number' && (
                          <div className="lms-progress" style={{ marginTop: 6 }}>
                            <div className="lms-progress-bar" style={{ width: `${course.progress}%` }} />
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>→</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="lms-table-empty">
                  <div style={{ fontSize: 32, marginBottom: 8 }}></div>
                  <div>No courses enrolled yet.</div>
                  <Link href="/courses" className="lms-btn lms-btn-primary" style={{ marginTop: 12 }}>Browse Courses</Link>
                </div>
              )}
            </div>
          </div>

          {/* Announcements */}
          <div className="lms-section animate-fadeIn stagger-3">
            <div className="lms-section-title"> Recent Announcements</div>
            <div style={{ padding: '0 16px' }}>
              {data.announcements.length > 0 ? data.announcements.map((ann: any) => (
                <div key={ann._id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{ann.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>{ann.content?.slice(0, 100)}...</div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4 }}>
                    {ann.createdAt ? format(new Date(ann.createdAt), 'dd MMM yyyy') : ''}
                  </div>
                </div>
              )) : (
                <div className="lms-table-empty" style={{ padding: 24 }}>No announcements.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div>
          {/* Quick Actions */}
          <div className="lms-section animate-fadeIn stagger-1">
            <div className="lms-section-title"> Quick Actions</div>
            <div style={{ padding: 14 }}>
              <div className="quick-action-grid">
                {[
                  { href: '/student/attendance', icon: <CalendarCheck size={20} />, label: 'View Attendance' },
                  { href: '/student/assignment', icon: <FileText size={20} />, label: 'My Assignments' },
                  { href: '/student/grades', icon: <BarChart2 size={20} />, label: 'View Grades' },
                  { href: '/student/transcript', icon: <GraduationCap size={20} />, label: 'Transcript' },
                  { href: '/my', icon: <MonitorPlay size={20} />, label: 'Exam Portal' },
                  { href: '/student/notifications', icon: <Bell size={20} />, label: 'Notifications' },
                  { href: '/student/profile', icon: <User size={20} />, label: 'My Profile' },
                  { href: '/communication', icon: <MessageSquare size={20} />, label: 'Messages' },
                ].map(a => (
                  <Link key={a.href} href={a.href} className="quick-action">
                    <div className="quick-action-icon">{a.icon}</div>
                    <span>{a.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Grades */}
          <div className="lms-section animate-fadeIn stagger-4">
            <div className="lms-section-title">
               Recent Grades
              <Link href="/student/grades" className="lms-btn lms-btn-sm" style={{ marginLeft: 'auto' }}>View All →</Link>
            </div>
            <div className="lms-table-container">
              {data.recentGrades.length > 0 ? (
                <table className="lms-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Marks</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentGrades.map((g: any, i: number) => (
                      <tr key={g._id || i}>
                        <td style={{ fontWeight: 500 }}>{g.courseName || g.subject || g.courseId?.title || 'N/A'}</td>
                        <td>{g.marksObtained ?? g.totalMarks ?? '-'}/{g.maxMarks ?? 100}</td>
                        <td>
                          <span className={`lms-status ${g.grade === 'A' || g.grade === 'A+' ? 'lms-status-active' : g.grade === 'F' ? 'lms-status-closed' : 'lms-status-pending'}`}>
                            {g.grade || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="lms-table-empty">No grades yet.</div>
              )}
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="lms-section animate-fadeIn stagger-5">
            <div className="lms-section-title"> Attendance Summary</div>
            <div style={{ padding: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%', margin: '0 auto 12px',
                  background: `conic-gradient(${data.attendancePercent >= 75 ? 'var(--success)' : 'var(--danger)'} ${data.attendancePercent * 3.6}deg, var(--bg-secondary) 0deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 800,
                  boxShadow: 'inset 0 0 0 14px var(--white)',
                }}>
                  {Math.round(data.attendancePercent)}%
                </div>
                <div style={{ fontSize: 13, color: data.attendancePercent >= 75 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  {data.attendancePercent >= 75 ? ' Good Standing' : ' Below Required (75%)'}
                </div>
              </div>
              <Link href="/student/attendance" className="lms-btn lms-btn-default" style={{ width: '100%', justifyContent: 'center' }}>
                View Detailed Attendance →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </LMSLayout>
  );
}
