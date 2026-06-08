'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import LMSLayout from '@/components/layouts/LMSLayout';
import { useAuthStore } from '@/store/authStore';

interface Grade {
  _id: string;
  courseId: any;
  semester?: string;
  marksObtained?: number;
  maxMarks?: number;
  grade: string;
  gradePoints: number;
  credits: number;
  components?: { name: string; marks: number; maxMarks: number }[];
}

interface Semester {
  name: string;
  gpa: number;
  credits: number;
  grades: Grade[];
}

export default function StudentGradesPage() {
  const { user } = useAuthStore();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [allGrades, setAllGrades] = useState<Grade[]>([]);
  const [cgpa, setCgpa] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed'>('summary');
  const [expandedSem, setExpandedSem] = useState<string | null>(null);

  const fetchGrades = useCallback(async () => {
    try {
      setLoading(true);
      const [myRes, transcriptRes] = await Promise.allSettled([
        api.get('/gradebook/my'),
        api.get('/gradebook/transcript'),
      ]);

      if (transcriptRes.status === 'fulfilled') {
        const t = transcriptRes.value.data?.data || {};
        setCgpa(t.cgpa || 0);
        setTotalCredits(t.totalCredits || 0);
        setSemesters(t.semesters || []);
        if (t.semesters?.length > 0) setExpandedSem(t.semesters[0].name);
      }

      if (myRes.status === 'fulfilled') {
        const g = myRes.value.data?.data || [];
        setAllGrades(Array.isArray(g) ? g : (g.grades || []));
      }
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGrades(); }, [fetchGrades]);

  const getGradeColor = (grade: string) => {
    if (['A+', 'A', 'A-'].includes(grade)) return 'var(--success)';
    if (['B+', 'B', 'B-'].includes(grade)) return 'var(--secondary)';
    if (['C+', 'C'].includes(grade)) return 'var(--warning)';
    if (grade === 'F') return 'var(--danger)';
    return 'var(--text)';
  };

  const getGradeStatusClass = (grade: string) => {
    if (['A+', 'A', 'A-'].includes(grade)) return 'lms-status-active';
    if (['B+', 'B', 'B-'].includes(grade)) return 'lms-status-info';
    if (grade === 'F') return 'lms-status-closed';
    return 'lms-status-pending';
  };

  const downloadTranscript = () => {
    window.open('/student/transcript', '_blank');
  };

  if (loading) {
    return (
      <LMSLayout pageTitle="My Grades">
        <div className="lms-spinner"><div className="spinner" /><span>Loading grades...</span></div>
      </LMSLayout>
    );
  }

  return (
    <LMSLayout pageTitle="My Grades & GPA" breadcrumbs={[{ label: 'Student' }, { label: 'Grades' }]}>
      {/* CGPA Hero */}
      <div style={{
        background: 'var(--grad-hero)', color: '#fff', borderRadius: 'var(--radius-lg)',
        padding: '28px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
      }} className="animate-fadeInDown">
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{cgpa > 0 ? cgpa.toFixed(2) : 'N/A'}</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>CGPA</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 4 }}>{user?.firstName} {user?.lastName}</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Academic Performance</div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{totalCredits}</div>
              <div style={{ fontSize: 11, opacity: 0.75 }}>Total Credits</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{semesters.length}</div>
              <div style={{ fontSize: 11, opacity: 0.75 }}>Semesters</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{allGrades.length}</div>
              <div style={{ fontSize: 11, opacity: 0.75 }}>Subjects</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={downloadTranscript} className="lms-btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
             View Transcript
          </button>
          <Link href="/student/transcript" className="lms-btn" style={{ background: 'var(--primary)', color: '#fff', border: 'none' }}>
             Download PDF
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="lms-tabs">
        <button className={`lms-tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
           Semester Summary
        </button>
        <button className={`lms-tab-btn ${activeTab === 'detailed' ? 'active' : ''}`} onClick={() => setActiveTab('detailed')}>
           Detailed Grades
        </button>
      </div>

      {/* Semester Summary */}
      {activeTab === 'summary' && (
        <div>
          {semesters.length === 0 ? (
            <div className="lms-section">
              <div className="lms-table-empty" style={{ padding: 48 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}></div>
                <div>No grades published yet.</div>
              </div>
            </div>
          ) : (
            semesters.map((sem, i) => (
              <div key={sem.name} className="lms-section animate-fadeIn" style={{ animationDelay: `${i * 0.05}s`, marginBottom: 12 }}>
                <button
                  style={{
                    width: '100%', textAlign: 'left', padding: '14px 16px',
                    background: expandedSem === sem.name ? 'var(--primary-light)' : '#f8f9fa',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: expandedSem === sem.name ? '1px solid var(--border)' : 'none',
                  }}
                  onClick={() => setExpandedSem(expandedSem === sem.name ? null : sem.name)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--radius)', background: 'var(--grad-primary)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 14,
                    }}>
                      {sem.gpa.toFixed(1)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--nav-bg)' }}>{sem.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {sem.credits} Credits · {sem.grades.length} Subjects
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>GPA: {sem.gpa.toFixed(2)}</div>
                    </div>
                    <span style={{ color: 'var(--text-muted)' }}>{expandedSem === sem.name ? '▲' : '▼'}</span>
                  </div>
                </button>

                {expandedSem === sem.name && (
                  <div className="lms-table-container">
                    <table className="lms-table">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Credits</th>
                          <th>Marks</th>
                          <th>Grade</th>
                          <th>Grade Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sem.grades.map((g) => (
                          <tr key={g._id}>
                            <td style={{ fontWeight: 500 }}>
                              {typeof g.courseId === 'object' ? g.courseId?.title : g.courseId || 'Subject'}
                            </td>
                            <td>{g.credits}</td>
                            <td>
                              {g.marksObtained !== undefined ? `${g.marksObtained}/${g.maxMarks || 100}` : '-'}
                            </td>
                            <td>
                              <span style={{
                                fontWeight: 700, fontSize: 14,
                                color: getGradeColor(g.grade),
                              }}>
                                {g.grade || '-'}
                              </span>
                            </td>
                            <td>{g.gradePoints?.toFixed(1) || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Detailed All Grades */}
      {activeTab === 'detailed' && (
        <div className="lms-section">
          <div className="lms-table-container">
            {allGrades.length > 0 ? (
              <table className="lms-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Subject</th>
                    <th>Semester</th>
                    <th>Credits</th>
                    <th>Marks</th>
                    <th>Grade</th>
                    <th>Grade Points</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allGrades.map((g, i) => (
                    <tr key={g._id}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>
                        {typeof g.courseId === 'object' ? g.courseId?.title : g.courseId || 'Subject'}
                      </td>
                      <td>{g.semester || '-'}</td>
                      <td>{g.credits}</td>
                      <td>{g.marksObtained !== undefined ? `${g.marksObtained}/${g.maxMarks || 100}` : '-'}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: getGradeColor(g.grade), fontSize: 15 }}>
                          {g.grade || '-'}
                        </span>
                      </td>
                      <td>{g.gradePoints?.toFixed(2) || '-'}</td>
                      <td>
                        <span className={`lms-status ${getGradeStatusClass(g.grade)}`} style={{ fontSize: 10 }}>
                          {g.grade === 'F' ? 'Failed' : 'Passed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="lms-table-empty" style={{ padding: 40 }}>No grade records available.</div>
            )}
          </div>
        </div>
      )}
    </LMSLayout>
  );
}
