'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import LMSLayout from '@/components/layouts/LMSLayout';
import { format } from 'date-fns';

interface Module {
  _id: string;
  title: string;
  description?: string;
  order: number;
  lectures: Lecture[];
}

interface Lecture {
  _id: string;
  title: string;
  type: 'video' | 'pdf' | 'text' | 'link';
  url?: string;
  content?: string;
  duration?: number;
  isCompleted?: boolean;
}

interface Course {
  _id: string;
  title: string;
  code: string;
  description: string;
  instructor?: any;
  credits: number;
  modules?: Module[];
  announcements?: any[];
  progress?: number;
}

type Tab = 'content' | 'announcements' | 'assignments' | 'forum';

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params?.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('content');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [assignments, setAssignments] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);

  const fetchCourse = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const [res, progressRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/courses/${courseId}/progress`).catch(() => ({ data: { data: { progress: undefined } } }))
      ]);
      const c = res.data?.data?.course || res.data?.data || res.data;
      const progress = progressRes.data?.data?.progress;
      
      setCourse({ ...c, progress });
      if (c.modules?.length > 0) {
        setExpandedModules(new Set([c.modules[0]._id]));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await api.get('/assignments', { params: { courseId, limit: 20 } });
      setAssignments(res.data?.data || []);
    } catch { }
  }, [courseId]);

  const fetchForums = useCallback(async () => {
    try {
      const res = await api.get('/communication/forum/threads', { params: { courseId, limit: 20 } });
      setThreads(res.data?.data || []);
    } catch { }
  }, [courseId]);

  useEffect(() => {
    fetchCourse();
    fetchAssignments();
    fetchForums();
  }, [fetchCourse, fetchAssignments, fetchForums]);

  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const markComplete = async (moduleId: string, lectureId: string) => {
    try {
      await api.post(`/courses/${courseId}/modules/${moduleId}/lectures/${lectureId}/complete`);
      fetchCourse();
    } catch { }
  };

  const getLectureIcon = (type: string) => {
    switch (type) {
      case 'video': return '';
      case 'pdf': return '';
      case 'link': return '';
      default: return '';
    }
  };

  if (loading) {
    return (
      <LMSLayout pageTitle="Course">
        <div className="lms-spinner"><div className="spinner" /><span>Loading course...</span></div>
      </LMSLayout>
    );
  }

  if (error || !course) {
    return (
      <LMSLayout pageTitle="Course Not Found">
        <div className="lms-alert lms-alert-error">
          <div><div className="lms-alert-title">Error</div><div>{error || 'Course not found'}</div></div>
        </div>
        <Link href="/student/courses" className="lms-btn lms-btn-default">← Back to Courses</Link>
      </LMSLayout>
    );
  }

  return (
    <LMSLayout
      pageTitle={course.title}
      breadcrumbs={[{ label: 'My Courses', href: '/student/courses' }, { label: course.title }]}
    >
      {/* Course Hero */}
      <div style={{
        background: 'var(--grad-nav)', color: '#fff', borderRadius: 'var(--radius-lg)',
        padding: '24px 28px', marginBottom: 24,
      }} className="animate-fadeInDown">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 'var(--radius)',
            background: 'var(--primary)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 24, flexShrink: 0,
          }}></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4, fontFamily: 'monospace' }}>{course.code}</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{course.title}</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 12 }}>{course.description}</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, opacity: 0.85 }}>
              <span>‍ {typeof course.instructor === 'object' ? `${course.instructor?.firstName} ${course.instructor?.lastName}` : 'Faculty'}</span>
              <span> {course.credits} Credits</span>
              {typeof course.progress === 'number' && <span> {course.progress}% Complete</span>}
            </div>
          </div>
        </div>
        {typeof course.progress === 'number' && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.75, marginBottom: 6 }}>
              <span>Course Progress</span><span>{course.progress}%</span>
            </div>
            <div className="lms-progress" style={{ height: 6 }}>
              <div className="lms-progress-bar" style={{ width: `${course.progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="lms-tabs" style={{ marginBottom: 20 }}>
        {(['content', 'assignments', 'announcements', 'forum'] as Tab[]).map(tab => (
          <button
            key={tab}
            className={`lms-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'content' && ' Course Content'}
            {tab === 'assignments' && ` Assignments${assignments.length > 0 ? ` (${assignments.length})` : ''}`}
            {tab === 'announcements' && ` Announcements${(course.announcements?.length || 0) > 0 ? ` (${course.announcements?.length})` : ''}`}
            {tab === 'forum' && ' Discussion'}
          </button>
        ))}
      </div>

      {/* Course Content Tab */}
      {activeTab === 'content' && (
        <div>
          {!course.modules || course.modules.length === 0 ? (
            <div className="lms-section">
              <div className="lms-table-empty" style={{ padding: 48 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}></div>
                <div>No course content available yet.</div>
              </div>
            </div>
          ) : (
            course.modules.map((module, mi) => (
              <div key={module._id} className="lms-section animate-fadeIn" style={{ animationDelay: `${mi * 0.05}s` }}>
                <button
                  onClick={() => toggleModule(module._id)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '12px 16px',
                    background: '#f8f9fa', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: expandedModules.has(module._id) ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, color: 'var(--nav-bg)', fontSize: 13 }}>
                      Week {mi + 1}: {module.title}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      ({module.lectures?.length || 0} lectures)
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {expandedModules.has(module._id) ? '▲' : '▼'}
                  </span>
                </button>

                {expandedModules.has(module._id) && (
                  <div>
                    {module.description && (
                      <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                        {module.description}
                      </div>
                    )}
                    {module.lectures?.map((lecture, li) => (
                      <div
                        key={lecture._id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 16px', borderBottom: '1px solid #f0f2f4',
                          background: lecture.isCompleted ? 'var(--success-bg)' : 'var(--white)',
                        }}
                      >
                        <span style={{ fontSize: 18, width: 28, flexShrink: 0 }}>{getLectureIcon(lecture.type)}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>
                            {li + 1}. {lecture.title}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {lecture.type.toUpperCase()}{lecture.duration ? ` · ${lecture.duration} min` : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {lecture.isCompleted && (
                            <span className="lms-status lms-status-active" style={{ fontSize: 10 }}> Done</span>
                          )}
                          {lecture.url && (
                            <a href={lecture.url} target="_blank" rel="noreferrer" className="lms-btn lms-btn-sm lms-btn-secondary">
                              {lecture.type === 'video' ? ' Watch' : lecture.type === 'pdf' ? ' Open' : ' Open'}
                            </a>
                          )}
                          {!lecture.isCompleted && (
                            <button
                              onClick={() => markComplete(module._id, lecture._id)}
                              className="lms-btn lms-btn-sm lms-btn-default"
                            >
                              Mark Done
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="lms-section">
          <div className="lms-table-container">
            {assignments.length > 0 ? (
              <table className="lms-table">
                <thead>
                  <tr>
                    <th>Assignment</th>
                    <th>Due Date</th>
                    <th>Max Marks</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a: any) => (
                    <tr key={a._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{a.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.description?.slice(0, 60)}...</div>
                      </td>
                      <td className="font-mono">
                        <span style={{ color: new Date(a.dueDate) < new Date() ? 'var(--danger)' : 'var(--text)' }}>
                          {a.dueDate ? format(new Date(a.dueDate), 'dd MMM yyyy') : '-'}
                        </span>
                      </td>
                      <td>{a.maxMarks || 100}</td>
                      <td>
                        <span className={`lms-status ${a.submitted ? 'lms-status-active' : new Date(a.dueDate) < new Date() ? 'lms-status-closed' : 'lms-status-pending'}`}>
                          {a.submitted ? 'Submitted' : new Date(a.dueDate) < new Date() ? 'Overdue' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <Link href={`/student/assignment/${a._id}`} className="lms-btn lms-btn-sm lms-btn-primary">
                          {a.submitted ? 'View' : 'Submit'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="lms-table-empty" style={{ padding: 40 }}>No assignments for this course.</div>
            )}
          </div>
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div>
          {(course.announcements?.length || 0) > 0 ? (
            course.announcements!.map((ann: any) => (
              <div key={ann._id} className="lms-section animate-fadeIn" style={{ marginBottom: 12 }}>
                <div style={{ padding: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--nav-bg)', marginBottom: 6 }}>{ann.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                    {ann.createdAt ? format(new Date(ann.createdAt), 'dd MMM yyyy, HH:mm') : ''}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.7 }}>{ann.content}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="lms-section">
              <div className="lms-table-empty" style={{ padding: 40 }}>No announcements yet.</div>
            </div>
          )}
        </div>
      )}

      {/* Forum Tab */}
      {activeTab === 'forum' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Link href={`/communication/forum?courseId=${courseId}`} className="lms-btn lms-btn-primary">
              + Start New Discussion
            </Link>
          </div>
          {threads.length > 0 ? (
            threads.map((thread: any) => (
              <div key={thread._id} className="lms-section animate-fadeIn" style={{ marginBottom: 10 }}>
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 13, flexShrink: 0,
                    }}>
                      {(thread.author?.firstName || '?')[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Link href={`/communication/forum/${thread._id}`} style={{ fontWeight: 600, fontSize: 14, color: 'var(--nav-bg)' }}>
                        {thread.title}
                      </Link>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        By {thread.author?.firstName} {thread.author?.lastName} · {thread.replies?.length || 0} replies
                        {thread.createdAt && ` · ${format(new Date(thread.createdAt), 'dd MMM')}`}
                      </div>
                    </div>
                    {thread.isAnswered && (
                      <span className="lms-status lms-status-active" style={{ fontSize: 10 }}> Answered</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="lms-section">
              <div className="lms-table-empty" style={{ padding: 40 }}>
                No discussions yet. Start a conversation!
              </div>
            </div>
          )}
        </div>
      )}
    </LMSLayout>
  );
}
