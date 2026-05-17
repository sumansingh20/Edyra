'use client';

import { useEffect, useState } from 'react';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

export default function StudentGradesPage() {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await api.get('/gradebook/my');
        setGrades(response.data.data.grades);
      } catch (err) {
        console.error('Failed to fetch grades:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, []);

  return (
    <LMSLayout pageTitle="My Grades" breadcrumbs={[{ label: 'Dashboard', href: '/student/dashboard' }, { label: 'Grades' }]}>
      <div className="lms-section">
        <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Academic Performance</span>
          <Link href="/student/transcript" className="lms-btn lms-btn-sm lms-btn-primary">View Full Transcript</Link>
        </div>
        
        {loading ? (
          <div className="lms-loading">Loading grade records...</div>
        ) : (
          <div className="lms-table-container">
            <table className="lms-table">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Academic Year</th>
                  <th>Semester</th>
                  <th>Total Marks</th>
                  <th>Grade</th>
                  <th>Point</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {grades.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center' }}>No grade records found.</td></tr>
                ) : grades.map(g => (
                  <tr key={g._id}>
                    <td className="font-mono" style={{ fontWeight: 600 }}>{g.course?.code}</td>
                    <td>{g.course?.title}</td>
                    <td>{g.academicYear}</td>
                    <td>{g.semester}</td>
                    <td style={{ fontWeight: 600 }}>{g.totalMarks}%</td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>{g.grade || '-'}</span>
                    </td>
                    <td>{g.gradePoint || '-'}</td>
                    <td>
                      <span className={`lms-status ${g.status === 'published' ? 'lms-status-active' : 'lms-status-pending'}`}>
                        {g.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="lms-info-box" style={{ marginTop: 24 }}>
        <div className="lms-info-box-header">Note on Grading</div>
        <div className="lms-info-box-body">
          <p>Grades are finalized by respective course instructors. If you see "In-Progress", it means the final evaluation is pending. For any discrepancies, please contact the faculty member or the registrar's office.</p>
        </div>
      </div>
    </LMSLayout>
  );
}
