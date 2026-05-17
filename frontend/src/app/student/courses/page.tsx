'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/student/courses');
        setCourses(response.data.data.courses);
      } catch (err) {
        console.error('Failed to fetch student courses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <LMSLayout pageTitle="My Enrolled Courses" breadcrumbs={[{ label: 'Dashboard', href: '/student/dashboard' }, { label: 'Courses' }]}>
      <div className="lms-section">
        <div className="lms-section-title">Enrolled Courses ({courses.length})</div>
        {loading ? (
          <div className="lms-loading">Loading your courses...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, padding: 20 }}>
            {courses.length === 0 ? (
              <div className="lms-table-empty">You are not enrolled in any courses.</div>
            ) : courses.map(course => (
              <div key={course._id} className="lms-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 120, background: 'var(--nav-bg)', color: '#fff', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: 12, opacity: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>{course.code}</div>
                  <h3 style={{ margin: '4px 0 0', fontSize: 18 }}>{course.title}</h3>
                </div>
                <div style={{ padding: 20, flex: 1 }}>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Department: {course.department || 'N/A'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                      {course.instructor?.firstName?.[0]}{course.instructor?.lastName?.[0]}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      {course.instructor?.firstName} {course.instructor?.lastName}
                    </div>
                  </div>
                  <Link href={`/student/course/${course._id}`} className="lms-btn lms-btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                    Access Course
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </LMSLayout>
  );
}
