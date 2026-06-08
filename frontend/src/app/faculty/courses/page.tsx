'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import LMSLayout from '@/components/layouts/LMSLayout';

export default function FacultyCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await api.get('/courses', { params: { faculty: true, limit: 50 } });
      const c = res.data?.data?.courses || res.data?.data || [];
      setCourses(Array.isArray(c) ? c : []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const COLORS = ['var(--grad-blue)', 'var(--grad-success)', 'var(--grad-purple)', 'var(--grad-primary)'];

  return (
    <LMSLayout pageTitle="My Courses" breadcrumbs={[{ label: 'Faculty' }, { label: 'My Courses' }]}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{courses.length} courses assigned</div>
        <Link href="/admin/courses" className="lms-btn lms-btn-default lms-btn-sm">Browse All Courses</Link>
      </div>

      {loading ? (
        <div className="lms-spinner"><div className="spinner" /><span>Loading...</span></div>
      ) : courses.length === 0 ? (
        <div className="lms-section">
          <div className="lms-table-empty" style={{ padding: 48 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}></div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>No courses assigned</div>
            <div style={{ color: 'var(--text-muted)' }}>Contact your department to get courses assigned.</div>
          </div>
        </div>
      ) : (
        <div className="lms-course-grid">
          {courses.map((c: any, i: number) => (
            <div key={c._id} className="lms-course-card animate-scaleIn" style={{ animationDelay: `${i * 0.05}s` }}>
              <div style={{ height: 110, background: COLORS[i % COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <span style={{ fontSize: 32 }}></span>
                {c.code && (
                  <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.4)', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontFamily: 'monospace' }}>
                    {c.code}
                  </div>
                )}
                <div style={{ position: 'absolute', top: 8, right: 8 }}>
                  <span className="lms-status lms-status-active" style={{ fontSize: 9 }}>{c.status || 'Active'}</span>
                </div>
              </div>
              <div className="lms-course-card-body">
                <div className="lms-course-card-title">{c.title}</div>
                <div className="lms-course-card-meta">
                  <span> {c.enrolledCount || 0} students</span>
                  <span> {c.credits || 3} credits</span>
                </div>
                {c.description && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {c.description}
                  </p>
                )}
              </div>
              <div className="lms-course-card-footer">
                <Link href={`/faculty/courses/${c._id}`} className="lms-btn lms-btn-secondary lms-btn-sm">
                  Manage Course →
                </Link>
                <Link href={`/faculty/courses/${c._id}/attendance`} className="lms-btn lms-btn-sm lms-btn-default">
                   Attendance
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </LMSLayout>
  );
}
