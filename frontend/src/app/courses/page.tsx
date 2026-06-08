'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import LMSLayout from '@/components/layouts/LMSLayout';

export default function CourseBrowserPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/courses', { params: { search, category, limit: 100 } });
      const c = res.data?.data?.courses || res.data?.data || [];
      setCourses(Array.isArray(c) ? c : []);
    } catch { } finally { setLoading(false); }
  }, [search, category]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const enroll = async (courseId: string) => {
    setEnrolling(courseId);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      setSuccess('Successfully enrolled!');
      fetchCourses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Enrollment failed');
    } finally { setEnrolling(null); }
  };

  const COLORS = ['var(--grad-primary)', 'var(--grad-blue)', 'var(--grad-success)', 'var(--grad-purple)', 'linear-gradient(135deg,#0891b2,#0e7490)', 'linear-gradient(135deg,#7c3aed,#5b21b6)'];

  return (
    <LMSLayout pageTitle="Course Catalog" breadcrumbs={[{ label: 'Courses' }]}>
      {success && <div className="lms-alert lms-alert-success animate-fadeIn" style={{ marginBottom: 16 }}><div>{success}</div></div>}

      {/* Header */}
      <div style={{
        background: 'var(--grad-hero)', color: '#fff', borderRadius: 'var(--radius-lg)',
        padding: '24px 28px', marginBottom: 24,
      }} className="animate-fadeInDown">
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}> Course Catalog</div>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 20 }}>Browse and enroll in available courses</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            className="lms-input"
            placeholder=" Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.9)', color: '#333' }}
          />
          <select
            className="lms-select"
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{ minWidth: 160, background: 'rgba(255,255,255,0.9)', color: '#333' }}
          >
            <option value="">All Categories</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Engineering">Engineering</option>
            <option value="Business">Business</option>
            <option value="Arts">Arts</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, fontSize: 13, color: 'var(--text-muted)' }}>
        <span><strong>{courses.length}</strong> courses found</span>
        <span><strong>{courses.filter(c => c.isEnrolled).length}</strong> enrolled</span>
      </div>

      {loading ? (
        <div className="lms-spinner"><div className="spinner" /><span>Loading courses...</span></div>
      ) : courses.length === 0 ? (
        <div className="lms-section">
          <div className="lms-table-empty" style={{ padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}></div>
            <div>No courses found matching your search.</div>
          </div>
        </div>
      ) : (
        <div className="lms-course-grid">
          {courses.map((c: any, i: number) => (
            <div key={c._id} className="lms-course-card animate-scaleIn" style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}>
              <div style={{ height: 130, background: COLORS[i % COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <span style={{ fontSize: 40, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}></span>
                {c.code && (
                  <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.4)', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontFamily: 'monospace' }}>
                    {c.code}
                  </div>
                )}
                {c.isEnrolled && (
                  <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--success)', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
                     Enrolled
                  </div>
                )}
                {c.category && (
                  <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.4)', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 10 }}>
                    {c.category}
                  </div>
                )}
              </div>
              <div className="lms-course-card-body">
                <div className="lms-course-card-title">{c.title}</div>
                <div className="lms-course-card-meta">
                  <span>‍ {typeof c.faculty === 'object' ? `${c.faculty?.firstName} ${c.faculty?.lastName}` : c.instructor || 'Faculty'}</span>
                  <span> {c.credits || 3} Credits</span>
                  <span> {c.enrolledCount || 0} enrolled</span>
                </div>
                {c.description && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {c.description}
                  </p>
                )}
              </div>
              <div className="lms-course-card-footer">
                <Link href={`/courses/${c._id}`} className="lms-btn lms-btn-sm lms-btn-secondary">
                  View Details
                </Link>
                {c.isEnrolled ? (
                  <Link href={`/student/course/${c._id}`} className="lms-btn lms-btn-sm lms-btn-primary">
                    Continue →
                  </Link>
                ) : (
                  <button
                    onClick={() => enroll(c._id)}
                    disabled={enrolling === c._id}
                    className="lms-btn lms-btn-sm lms-btn-primary"
                  >
                    {enrolling === c._id ? 'Enrolling...' : '+ Enroll'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </LMSLayout>
  );
}
