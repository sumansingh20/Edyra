'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import LMSLayout from '@/components/layouts/LMSLayout';
import { format } from 'date-fns';

interface Course {
  _id: string;
  title: string;
  code: string;
  description: string;
  instructor?: string;
  faculty?: any;
  credits: number;
  category?: string;
  thumbnail?: string;
  progress?: number;
  enrolledCount?: number;
  status?: string;
  isEnrolled?: boolean;
}

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/courses', { params: { enrolled: true, search, category, limit: 50 } });
      const raw = res.data?.data?.courses || res.data?.data || res.data?.courses || [];
      setCourses(Array.isArray(raw) ? raw : []);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const filtered = courses.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.code?.toLowerCase().includes(search.toLowerCase())
  );

  const COLORS = ['var(--grad-primary)', 'var(--grad-blue)', 'var(--grad-success)', 'var(--grad-purple)'];

  return (
    <LMSLayout pageTitle="My Courses" breadcrumbs={[{ label: 'Student' }, { label: 'My Courses' }]}>
      {/* Filter Bar */}
      <div className="lms-filter-bar">
        <div className="lms-form-group">
          <input
            className="lms-input"
            placeholder=" Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="lms-form-group">
          <select className="lms-select" value={category} onChange={e => setCategory(e.target.value)} style={{ minWidth: 160 }}>
            <option value="">All Categories</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Engineering">Engineering</option>
            <option value="Business">Business</option>
          </select>
        </div>
        <Link href="/courses" className="lms-btn lms-btn-default">Browse More Courses</Link>
      </div>

      {/* Stats Row */}
      <div className="lms-stats-row" style={{ marginBottom: 20 }}>
        <div className="lms-stat">
          <div className="lms-stat-value">{courses.length}</div>
          <div className="lms-stat-label">Enrolled</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value">{courses.filter(c => (c.progress || 0) === 100).length}</div>
          <div className="lms-stat-label">Completed</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value">{courses.filter(c => (c.progress || 0) > 0 && (c.progress || 0) < 100).length}</div>
          <div className="lms-stat-label">In Progress</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value">{courses.reduce((s, c) => s + (c.credits || 0), 0)}</div>
          <div className="lms-stat-label">Total Credits</div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="lms-alert lms-alert-error animate-fadeIn" style={{ marginBottom: 16 }}>
          <div><div className="lms-alert-title">Error</div><div>{error}</div></div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="lms-spinner"><div className="spinner" /><span>Loading courses...</span></div>
      ) : filtered.length === 0 ? (
        <div className="lms-section">
          <div className="lms-table-empty" style={{ padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}></div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>No courses found</div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
              {search ? 'No courses match your search.' : 'You are not enrolled in any courses yet.'}
            </div>
            <Link href="/courses" className="lms-btn lms-btn-primary">Browse Available Courses</Link>
          </div>
        </div>
      ) : (
        <div className="lms-course-grid">
          {filtered.map((course, i) => (
            <div key={course._id} className="lms-course-card animate-scaleIn" style={{ animationDelay: `${i * 0.05}s` }}>
              {/* Course Header */}
              <div style={{
                height: 120, background: COLORS[i % COLORS.length],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
              }}>
                <span style={{ fontSize: 36, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}></span>
                {typeof course.progress === 'number' && course.progress === 100 && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'var(--success)', color: '#fff',
                    borderRadius: 'var(--radius-full)', padding: '2px 8px', fontSize: 10, fontWeight: 700,
                  }}> COMPLETED</div>
                )}
                {course.code && (
                  <div style={{
                    position: 'absolute', bottom: 8, left: 8,
                    background: 'rgba(0,0,0,0.4)', color: '#fff',
                    borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 600, fontFamily: 'monospace',
                  }}>{course.code}</div>
                )}
              </div>

              {/* Course Body */}
              <div className="lms-course-card-body">
                <div className="lms-course-card-title">{course.title}</div>
                <div className="lms-course-card-meta">
                  <span>‍ {typeof course.instructor === 'object' ? `${(course.instructor as any)?.firstName} ${(course.instructor as any)?.lastName}` : course.instructor || 'Faculty'}</span>
                  <span> {course.credits || 3} Credits</span>
                  {course.category && <span>️ {course.category}</span>}
                </div>
                {course.description && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {course.description}
                  </p>
                )}
                {typeof course.progress === 'number' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                      <span>Progress</span><span>{course.progress}%</span>
                    </div>
                    <div className="lms-progress">
                      <div className="lms-progress-bar" style={{ width: `${course.progress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Course Footer */}
              <div className="lms-course-card-footer">
                <span className={`lms-status ${course.status === 'active' ? 'lms-status-active' : 'lms-status-pending'}`}>
                  {course.status || 'Active'}
                </span>
                <Link href={`/student/course/${course._id}`} className="lms-btn lms-btn-primary lms-btn-sm">
                  Enter Course →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </LMSLayout>
  );
}
