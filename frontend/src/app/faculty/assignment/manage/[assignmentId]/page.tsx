'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function FacultyAssignmentManagePage() {
  const { assignmentId } = useParams();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (assignmentId) {
          const [asnRes, subRes] = await Promise.all([
            api.get(`/assignments/${assignmentId}`),
            api.get(`/assignments/${assignmentId}/submissions`)
          ]);
          setAssignment(asnRes.data.data.assignment);
          setSubmissions(subRes.data.data.submissions || []);
        } else if (courseId) {
          const asnRes = await api.get(`/assignments?courseId=${courseId}`);
          // If we only have courseId, we show a list of assignments for that course
          setAssignment({ title: 'Course Assignments', isList: true, items: asnRes.data.data.assignments });
        }
      } catch (err) {
        console.error('Failed to fetch assignment data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [assignmentId, courseId]);

  if (loading) return <LMSLayout pageTitle="Loading..."><div className="lms-loading">Loading...</div></LMSLayout>;

  if (assignment?.isList) {
    return (
      <LMSLayout pageTitle={assignment.title} breadcrumbs={[{ label: 'Dashboard', href: '/faculty/dashboard' }, { label: 'Assignments' }]}>
        <div className="lms-section">
          <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Manage Assignments</span>
            <Link href={`/faculty/assignment/create?courseId=${courseId}`} className="lms-btn lms-btn-sm lms-btn-primary">+ Create New</Link>
          </div>
          <div className="lms-table-container">
            <table className="lms-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Submissions</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignment.items.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center' }}>No assignments found for this course.</td></tr>
                ) : assignment.items.map((asn: any) => (
                  <tr key={asn._id}>
                    <td style={{ fontWeight: 600 }}>{asn.title}</td>
                    <td>{format(new Date(asn.dueDate), 'dd/MM/yyyy HH:mm')}</td>
                    <td>
                      <span className={`lms-status ${asn.status === 'published' ? 'lms-status-active' : 'lms-status-pending'}`}>
                        {asn.status.toUpperCase()}
                      </span>
                    </td>
                    <td>-</td>
                    <td>
                      <Link href={`/faculty/assignment/manage/${asn._id}`} className="lms-btn lms-btn-sm">View Submissions</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </LMSLayout>
    );
  }

  return (
    <LMSLayout pageTitle={`Grading: ${assignment?.title}`} breadcrumbs={[{ label: 'Dashboard', href: '/faculty/dashboard' }, { label: 'Assignments', href: '/faculty/assignments' }, { label: 'Manage' }]}>
      <div className="lms-section">
        <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Submissions ({submissions.length})</span>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Due: {format(new Date(assignment.dueDate), 'dd MMM yyyy')}</div>
        </div>
        
        <div className="lms-table-container">
          <table className="lms-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Submission Date</th>
                <th>Lateness</th>
                <th>Status</th>
                <th>Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center' }}>No students have submitted yet.</td></tr>
              ) : submissions.map(sub => (
                <tr key={sub._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{sub.student?.firstName} {sub.student?.lastName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub.student?.studentId}</div>
                  </td>
                  <td>{format(new Date(sub.submittedAt || sub.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                  <td>
                    {sub.isLate ? <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Late ({sub.lateDays} days)</span> : <span style={{ color: 'var(--success)' }}>On-time</span>}
                  </td>
                  <td>
                    <span className={`lms-status ${sub.status === 'graded' ? 'lms-status-active' : 'lms-status-pending'}`}>
                      {sub.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {sub.status === 'graded' ? <span style={{ fontWeight: 700 }}>{sub.marks} / {assignment.totalMarks}</span> : '-'}
                  </td>
                  <td>
                    <Link href={`/faculty/submissions/${sub._id}`} className="lms-btn lms-btn-sm lms-btn-primary">Grade</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </LMSLayout>
  );
}
