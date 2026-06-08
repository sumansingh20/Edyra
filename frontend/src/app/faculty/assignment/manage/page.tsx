'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import { format } from 'date-fns';

import { Suspense } from 'react';

function FacultyAssignmentListContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const url = courseId ? `/assignments?courseId=${courseId}` : '/assignments';
        const response = await api.get(url);
        setAssignments(response.data.data.assignments || []);
      } catch (err) {
        console.error('Failed to fetch assignments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [courseId]);

  return (
    <LMSLayout pageTitle="Manage Assignments" breadcrumbs={[{ label: 'Dashboard', href: '/faculty/dashboard' }, { label: 'Assignments' }]}>
      <div className="lms-section">
        <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Assignments Console</span>
          <Link href={`/faculty/assignment/create${courseId ? '?courseId=' + courseId : ''}`} className="lms-btn lms-btn-sm lms-btn-primary">+ Create New</Link>
        </div>
        
        {loading ? (
          <div className="lms-loading">Loading assignments...</div>
        ) : (
          <div className="lms-table-container">
            <table className="lms-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Course</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center' }}>No assignments found.</td></tr>
                ) : assignments.map(asn => (
                  <tr key={asn._id}>
                    <td style={{ fontWeight: 600 }}>{asn.title}</td>
                    <td>{asn.course?.code}</td>
                    <td>{format(new Date(asn.dueDate), 'dd/MM/yyyy HH:mm')}</td>
                    <td>
                      <span className={`lms-status ${asn.status === 'published' ? 'lms-status-active' : 'lms-status-pending'}`}>
                        {asn.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <Link href={`/faculty/assignment/manage/${asn._id}`} className="lms-btn lms-btn-sm">View Submissions</Link>
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

export default function FacultyAssignmentListPage() {
  return (
    <Suspense fallback={<div className="lms-loading">Loading...</div>}>
      <FacultyAssignmentListContent />
    </Suspense>
  );
}
