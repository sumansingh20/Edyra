'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function FacultyCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/courses');
        setCourses(response.data.data.courses);
      } catch (err) {
        console.error('Failed to fetch faculty courses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <LMSLayout pageTitle="My Courses" breadcrumbs={[{ label: 'Dashboard', href: '/faculty/dashboard' }, { label: 'Courses' }]}>
      <div className="lms-section">
        <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Assigned Courses ({courses.length})</span>
        </div>
        
        {loading ? (
          <div className="lms-loading">Loading courses...</div>
        ) : (
          <div className="lms-table-container">
            <table className="lms-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Title</th>
                  <th>Department</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center' }}>No courses assigned to you.</td></tr>
                ) : courses.map(course => (
                  <tr key={course._id}>
                    <td className="font-mono" style={{ fontWeight: 600 }}>{course.code}</td>
                    <td style={{ fontWeight: 600 }}>{course.title}</td>
                    <td>{course.department}</td>
                    <td>{course.enrolledStudents?.length || 0} / {course.maxStudents}</td>
                    <td>
                      <span className={`lms-status ${course.status === 'published' ? 'lms-status-active' : 'lms-status-pending'}`}>
                        {course.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link href={`/faculty/course/${course._id}`} className="lms-btn lms-btn-sm lms-btn-primary">Manage</Link>
                        <Link href={`/faculty/grades/manage?courseId=${course._id}`} className="lms-btn lms-btn-sm">Gradebook</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </LMSLayout>
  );
}
