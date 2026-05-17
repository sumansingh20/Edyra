'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Submission {
  _id: string;
  assignment: { _id: string; title: string; course: { title: string; code: string } };
  status: string;
  submittedAt: string;
  marks?: number;
  totalMarks?: number;
  feedback?: string;
}

export default function StudentSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await api.get('/student/submissions');
        setSubmissions(res.data.data?.submissions || []);
      } catch (err) {
        console.error('Failed to fetch submissions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  return (
    <LMSLayout pageTitle="My Submissions" breadcrumbs={[{ label: 'Dashboard', href: '/student/dashboard' }, { label: 'Submissions' }]}>
      
      <div className="lms-section">
        <div className="lms-section-title">Recent Submissions</div>
        
        {loading ? (
          <div className="lms-loading">Loading submissions...</div>
        ) : submissions.length === 0 ? (
          <div className="lms-table-empty">
            You haven't submitted any assignments yet.
          </div>
        ) : (
          <div className="lms-table-container">
            <table className="lms-table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Course</th>
                  <th>Submitted At</th>
                  <th>Status</th>
                  <th>Marks</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => (
                  <tr key={sub._id}>
                    <td style={{ fontWeight: 600 }}>{sub.assignment?.title || 'Unknown Assignment'}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>{sub.assignment?.course?.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub.assignment?.course?.code}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {sub.submittedAt ? format(new Date(sub.submittedAt), 'dd/MM/yyyy HH:mm') : '—'}
                    </td>
                    <td>
                      <span className={`lms-status ${sub.status === 'graded' ? 'lms-status-active' : 'lms-status-pending'}`}>
                        {sub.status?.toUpperCase() || 'SUBMITTED'}
                      </span>
                    </td>
                    <td>
                      {sub.marks !== undefined ? (
                        <span style={{ fontWeight: 700 }}>{sub.marks} / {sub.totalMarks || '-'}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Pending Review</span>
                      )}
                    </td>
                    <td>
                      <Link href={`/student/assignment/${sub.assignment?._id}`} className="lms-btn lms-btn-sm">
                        View Details
                      </Link>
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
