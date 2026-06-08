'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import LMSLayout from '@/components/layouts/LMSLayout';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';

export default function TranscriptPage() {
  const { user } = useAuthStore();
  const [transcript, setTranscript] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchTranscript = useCallback(async () => {
    try {
      const res = await api.get('/gradebook/transcript');
      setTranscript(res.data?.data || res.data);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTranscript(); }, [fetchTranscript]);

  const handlePrint = () => window.print();

  const getGradePoints = (grade: string) => {
    const map: Record<string, number> = {
      'A+': 10, 'A': 9, 'A-': 8, 'B+': 7, 'B': 6, 'B-': 5,
      'C+': 4, 'C': 3, 'D': 2, 'F': 0,
    };
    return map[grade] || 0;
  };

  if (loading) {
    return (
      <LMSLayout pageTitle="Academic Transcript">
        <div className="lms-spinner"><div className="spinner" /><span>Loading transcript...</span></div>
      </LMSLayout>
    );
  }

  const semesters = transcript?.semesters || [];
  const cgpa = transcript?.cgpa || 0;
  const totalCredits = transcript?.totalCredits || 0;

  return (
    <LMSLayout pageTitle="Academic Transcript" breadcrumbs={[{ label: 'Student' }, { label: 'Transcript' }]}>
      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={handlePrint} className="lms-btn lms-btn-primary">
          ️ Print Transcript
        </button>
        <Link href="/student/grades" className="lms-btn lms-btn-default">
          ← Back to Grades
        </Link>
      </div>

      {/* Transcript Document */}
      <div ref={printRef} className="transcript-card lms-section" style={{
        maxWidth: 800, margin: '0 auto', padding: 0, overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--grad-nav)', color: '#fff',
          padding: '32px 40px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>EDYRA</div>
          <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 16 }}>
            Educational Development & Resource Administration
          </div>
          <div style={{
            display: 'inline-block', border: '2px solid rgba(255,255,255,0.4)',
            borderRadius: 4, padding: '6px 24px', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em',
          }}>
            OFFICIAL ACADEMIC TRANSCRIPT
          </div>
        </div>

        {/* Student Info */}
        <div style={{
          background: 'var(--bg-secondary)', padding: '20px 40px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
          borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <div className="lms-info-row" style={{ borderBottom: 'none', paddingBottom: 8 }}>
              <div className="lms-info-label">Full Name:</div>
              <div className="lms-info-value" style={{ fontWeight: 700 }}>
                {user?.firstName} {user?.lastName}
              </div>
            </div>
            <div className="lms-info-row" style={{ borderBottom: 'none', paddingBottom: 8 }}>
              <div className="lms-info-label">Student ID:</div>
              <div className="lms-info-value" style={{ fontFamily: 'monospace' }}>
                {user?.studentId || 'N/A'}
              </div>
            </div>
            <div className="lms-info-row" style={{ borderBottom: 'none' }}>
              <div className="lms-info-label">Email:</div>
              <div className="lms-info-value">{user?.email}</div>
            </div>
          </div>
          <div>
            <div className="lms-info-row" style={{ borderBottom: 'none', paddingBottom: 8 }}>
              <div className="lms-info-label">Department:</div>
              <div className="lms-info-value">{user?.department || 'N/A'}</div>
            </div>
            <div className="lms-info-row" style={{ borderBottom: 'none', paddingBottom: 8 }}>
              <div className="lms-info-label">Date Issued:</div>
              <div className="lms-info-value">{format(new Date(), 'dd MMMM yyyy')}</div>
            </div>
            <div className="lms-info-row" style={{ borderBottom: 'none' }}>
              <div className="lms-info-label">CGPA:</div>
              <div className="lms-info-value" style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>
                {cgpa > 0 ? cgpa.toFixed(2) : 'N/A'} / 10.00
              </div>
            </div>
          </div>
        </div>

        {/* Semester Records */}
        <div style={{ padding: '0 40px 40px' }}>
          {semesters.length === 0 ? (
            <div className="lms-table-empty" style={{ padding: 40 }}>
              No academic records available yet.
            </div>
          ) : (
            semesters.map((sem: any, i: number) => (
              <div key={sem.name || i} style={{ marginTop: 28 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 10, paddingBottom: 8, borderBottom: '2px solid var(--nav-bg)',
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--nav-bg)' }}>
                    {sem.name}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                    Semester GPA: {(sem.gpa || 0).toFixed(2)}
                  </div>
                </div>

                <table className="lms-table" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Course Title</th>
                      <th>Code</th>
                      <th>Credits</th>
                      <th>Marks</th>
                      <th>Grade</th>
                      <th>Grade Points</th>
                      <th>Earned Credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sem.grades || []).map((g: any) => {
                      const gp = g.gradePoints || getGradePoints(g.grade);
                      return (
                        <tr key={g._id}>
                          <td style={{ fontWeight: 500 }}>
                            {typeof g.courseId === 'object' ? g.courseId?.title : g.courseId || '-'}
                          </td>
                          <td className="font-mono" style={{ fontSize: 11 }}>
                            {typeof g.courseId === 'object' ? g.courseId?.code : '-'}
                          </td>
                          <td style={{ textAlign: 'center' }}>{g.credits}</td>
                          <td style={{ textAlign: 'center' }}>
                            {g.marksObtained !== undefined ? `${g.marksObtained}/${g.maxMarks || 100}` : '-'}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: g.grade === 'F' ? 'var(--danger)' : 'var(--nav-bg)' }}>
                            {g.grade || '-'}
                          </td>
                          <td style={{ textAlign: 'center' }}>{gp.toFixed(2)}</td>
                          <td style={{ textAlign: 'center' }}>
                            {g.grade !== 'F' ? g.credits : 0}
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                      <td colSpan={2}>Semester Total</td>
                      <td style={{ textAlign: 'center' }}>{sem.credits}</td>
                      <td></td>
                      <td></td>
                      <td style={{ textAlign: 'center', color: 'var(--primary)' }}>GPA: {(sem.gpa || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>{sem.earnedCredits || sem.credits}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))
          )}

          {/* Final Summary */}
          {semesters.length > 0 && (
            <div style={{
              marginTop: 32, padding: '16px 20px',
              background: 'var(--nav-bg)', color: '#fff', borderRadius: 'var(--radius)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
            }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Cumulative Grade Point Average</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{cgpa > 0 ? cgpa.toFixed(2) : 'N/A'} / 10.00</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Total Credits Earned</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{totalCredits}</div>
              </div>
            </div>
          )}

          {/* Certification */}
          <div style={{
            marginTop: 32, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)',
            borderTop: '1px solid var(--border)', paddingTop: 20,
          }}>
            <p>This is an official academic transcript issued by EDYRA Academic Management System.</p>
            <p>Date: {format(new Date(), 'dd MMMM yyyy')} · Generated electronically — verify at edyra.edu</p>
          </div>
        </div>
      </div>
    </LMSLayout>
  );
}
