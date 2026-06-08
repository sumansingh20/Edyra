'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function FacultyCourseManagePage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await api.get(`/courses/${courseId}`);
        setCourse(response.data.data.course);
      } catch (err) {
        console.error('Failed to fetch course:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  if (loading) return <LMSLayout pageTitle="Loading Course..."><div className="lms-loading">Loading...</div></LMSLayout>;
  if (!course) return <LMSLayout pageTitle="Error"><div className="lms-alert lms-alert-error">Course not found.</div></LMSLayout>;

  return (
    <LMSLayout pageTitle={`Manage: ${course.code}`} breadcrumbs={[{ label: 'Dashboard', href: '/faculty/dashboard' }, { label: 'Courses', href: '/faculty/courses' }, { label: course.code }]}>
      <div className="lms-section" style={{ marginBottom: 24 }}>
        <div style={{ padding: '24px 32px', background: 'var(--nav-bg)', color: '#fff', borderRadius: 'var(--radius)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 14, opacity: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>{course.department}</div>
              <h1 style={{ margin: '8px 0', fontSize: 28 }}>{course.title}</h1>
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 4, fontSize: 13 }}>
                  {course.enrolledStudents?.length || 0} Students Enrolled
                </div>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 4, fontSize: 13 }}>
                  {course.status.toUpperCase()}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="lms-btn" style={{ background: '#fff', color: 'var(--nav-bg)' }}>Edit Settings</button>
              <button className="lms-btn lms-btn-primary">Go Live</button>
            </div>
          </div>
        </div>
      </div>

      <div className="lms-tabs" style={{ marginBottom: 24, borderBottom: '1px solid var(--border)', display: 'flex', gap: 32 }}>
        {['Overview', 'Curriculum', 'Students', 'Announcements', 'Assignments'].map(tab => (
          <button 
            key={tab} 
            className={`lms-tab-btn ${activeTab === tab.toLowerCase() ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.toLowerCase())}
            style={{ 
              padding: '12px 0', 
              background: 'none', 
              border: 'none', 
              fontWeight: 600, 
              color: activeTab === tab.toLowerCase() ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.toLowerCase() ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="lms-tab-content">
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
            <div className="lms-section">
              <div className="lms-section-title">Course Description</div>
              <div style={{ padding: 24, fontSize: 15, lineHeight: 1.6 }}>{course.description || 'No description provided.'}</div>
            </div>
            <div className="lms-section">
              <div className="lms-section-title">Faculty Information</div>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {course.instructor?.firstName?.[0]}{course.instructor?.lastName?.[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{course.instructor?.firstName} {course.instructor?.lastName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lead Instructor</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{course.instructor?.email}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="lms-section">
            <div className="lms-section-title">Enrolled Students</div>
            <div className="lms-table-container">
              <table className="lms-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>ID / Roll No</th>
                    <th>Joined At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {course.enrolledStudents?.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center' }}>No students enrolled yet.</td></tr>
                  ) : course.enrolledStudents?.map((student: any) => (
                    <tr key={student._id}>
                      <td style={{ fontWeight: 600 }}>{student.firstName} {student.lastName}</td>
                      <td>{student.email}</td>
                      <td>{student.studentId || student.rollNumber || 'N/A'}</td>
                      <td>{format(new Date(student.createdAt || Date.now()), 'dd/MM/yyyy')}</td>
                      <td>
                        <button className="lms-btn lms-btn-sm">Profile</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'curriculum' && (
          <div className="lms-section">
            <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Course Modules</span>
              <button className="lms-btn lms-btn-sm lms-btn-primary">+ Add Module</button>
            </div>
            <div style={{ padding: 24 }}>
              {course.modules?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, border: '2px dashed var(--border)', borderRadius: 8, color: 'var(--text-muted)' }}>
                  No modules created yet. Start by adding a module.
                </div>
              ) : course.modules?.map((mod: any, i: number) => (
                <div key={mod._id} style={{ marginBottom: 20, border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div style={{ padding: '12px 20px', background: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700 }}>Module {i + 1}: {mod.title}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="lms-btn lms-btn-sm">Add Lecture</button>
                      <button className="lms-btn lms-btn-sm">Edit</button>
                    </div>
                  </div>
                  <div style={{ padding: 20 }}>
                    {mod.lectures?.length === 0 ? <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No lectures in this module.</div> : (
                      mod.lectures.map((lec: any, j: number) => (
                        <div key={lec._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: j < mod.lectures.length - 1 ? '1px solid #eee' : 'none' }}>
                          <div style={{ fontSize: 14 }}>{j + 1}. {lec.title} ({lec.type})</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lec.duration} mins</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="lms-section">
            <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Class Announcements</span>
              <button className="lms-btn lms-btn-sm lms-btn-primary">+ New Announcement</button>
            </div>
            <div style={{ padding: 24 }}>
              {course.announcements?.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No announcements yet.</div>
              ) : course.announcements?.slice().reverse().map((ann: any, i: number) => (
                <div key={i} style={{ padding: 20, border: '1px solid var(--border)', borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h4 style={{ margin: 0, color: 'var(--primary)' }}>{ann.title}</h4>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(ann.createdAt), 'dd MMM yyyy HH:mm')}</span>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6 }}>{ann.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="lms-section">
            <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Course Assignments</span>
              <Link href={`/faculty/assignment/create?courseId=${courseId}`} className="lms-btn lms-btn-sm lms-btn-primary">+ Create Assignment</Link>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Manage assignments, due dates, and student submissions for this course.</p>
              <Link href={`/faculty/assignment/manage?courseId=${courseId}`} className="lms-btn" style={{ marginTop: 12 }}>Go to Assignment Manager</Link>
            </div>
          </div>
        )}
      </div>
    </LMSLayout>
  );
}
