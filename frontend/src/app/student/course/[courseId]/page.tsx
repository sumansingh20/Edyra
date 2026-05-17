'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import { format } from 'date-fns';

interface CourseDetail {
  _id: string;
  title: string;
  code: string;
  description: string;
  department: string;
  instructor: any;
  announcements: any[];
  schedule: any;
}

export default function StudentCourseDetailPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, assignmentsRes, progressRes] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get(`/assignments?course=${courseId}`),
          api.get(`/courses/${courseId}/progress`)
        ]);
        setCourse(courseRes.data.data.course);
        setAssignments(assignmentsRes.data.data.assignments || []);
        setProgress(progressRes.data.data);
      } catch (err) {
        console.error('Failed to fetch course details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId]);

  if (loading) {
    return (
      <LMSLayout pageTitle="Course Details">
        <div className="lms-loading">Loading course information...</div>
      </LMSLayout>
    );
  }

  if (!course) {
    return (
      <LMSLayout pageTitle="Course Not Found">
        <div className="lms-alert lms-alert-error">The requested course could not be found.</div>
      </LMSLayout>
    );
  }

  return (
    <LMSLayout pageTitle={course.title} breadcrumbs={[{ label: 'Dashboard', href: '/student/dashboard' }, { label: 'Courses', href: '/student/courses' }, { label: course.code }]}>
      <div className="lms-course-header" style={{ background: 'var(--nav-bg)', padding: '32px', color: '#fff', borderRadius: 'var(--radius)', marginBottom: 24 }}>
        <div style={{ fontSize: 14, textTransform: 'uppercase', opacity: 0.8, fontWeight: 700 }}>{course.department} • {course.code}</div>
        <h1 style={{ margin: '8px 0', fontSize: 32 }}>{course.title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {course.instructor?.firstName?.[0]}{course.instructor?.lastName?.[0]}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{course.instructor?.firstName} {course.instructor?.lastName}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Instructor</div>
            </div>
          </div>
          <div style={{ height: 30, width: 1, background: 'rgba(255,255,255,0.2)' }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Progress</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="lms-progress-bar" style={{ width: 100, height: 6, background: 'rgba(255,255,255,0.2)' }}>
                <div className="lms-progress-fill" style={{ width: `${progress?.progress || 0}%`, background: 'var(--secondary)' }} />
              </div>
              <span style={{ fontSize: 12 }}>{progress?.progress || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div className="lms-main-col">
          {/* Announcements */}
          <div className="lms-section">
            <div className="lms-section-title">Latest Announcements</div>
            <div style={{ padding: 20 }}>
              {course.announcements.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No announcements yet.</div>
              ) : course.announcements.slice(-3).reverse().map((ann, i) => (
                <div key={i} style={{ paddingBottom: 16, borderBottom: i < 2 ? '1px solid var(--border)' : 'none', marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>{ann.title}</div>
                  <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{ann.content}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Posted on {format(new Date(ann.createdAt), 'MMM dd, yyyy')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Assignments */}
          <div className="lms-section" style={{ marginTop: 24 }}>
            <div className="lms-section-title">Assignments & Submissions</div>
            <div className="lms-table-container">
              <table className="lms-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Due Date</th>
                    <th>Marks</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center' }}>No assignments posted for this course.</td></tr>
                  ) : assignments.map(asn => (
                    <tr key={asn._id}>
                      <td style={{ fontWeight: 600 }}>{asn.title}</td>
                      <td>{format(new Date(asn.dueDate), 'dd/MM/yyyy HH:mm')}</td>
                      <td>{asn.totalMarks}</td>
                      <td>
                        <span className={`lms-status ${asn.status === 'published' ? 'lms-status-active' : 'lms-status-closed'}`}>
                          {asn.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <Link href={`/student/assignment/${asn._id}`} className="lms-btn lms-btn-sm lms-btn-primary">Open</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lms-sidebar-col">
          <div className="lms-section">
            <div className="lms-section-title">Course Information</div>
            <div style={{ padding: 20 }}>
              <div className="lms-info-row" style={{ marginBottom: 16 }}>
                <div className="lms-info-label" style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Description</div>
                <div className="lms-info-value" style={{ fontSize: 14, lineHeight: 1.6, marginTop: 4 }}>{course.description || 'No description provided.'}</div>
              </div>
              <div className="lms-info-row" style={{ marginBottom: 16 }}>
                <div className="lms-info-label" style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Schedule</div>
                <div className="lms-info-value" style={{ fontSize: 14, marginTop: 4 }}>
                  {course.schedule?.classDays?.join(', ') || 'N/A'} at {course.schedule?.classTime || 'N/A'}
                </div>
              </div>
              <button className="lms-btn" style={{ width: '100%', marginTop: 8 }}>View Syllabus (PDF)</button>
            </div>
          </div>

          <div className="lms-section" style={{ marginTop: 24 }}>
            <div className="lms-section-title">Quick Actions</div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/communication" className="lms-btn" style={{ textAlign: 'center' }}>Discussion Forum</Link>
              <Link href="/attendance" className="lms-btn" style={{ textAlign: 'center' }}>My Attendance</Link>
              <Link href="/gradebook" className="lms-btn" style={{ textAlign: 'center' }}>Grades for this Course</Link>
            </div>
          </div>
        </div>
      </div>
    </LMSLayout>
  );
}
