'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Exam {
  _id: string;
  title: string;
  subject: string;
  status: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalMarks: number;
  createdAt: string;
}

export default function FacultyManageExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = async () => {
    try {
      const res = await api.get('/admin/exams');
      setExams(res.data.data?.exams || []);
    } catch (err) {
      console.error('Failed to fetch exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const deleteExam = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/exams/${id}`);
      toast.success('Exam deleted successfully');
      fetchExams();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete exam');
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'draft') return <span className="lms-status lms-status-pending">DRAFT</span>;
    if (s === 'published') return <span className="lms-status lms-status-info">PUBLISHED</span>;
    if (s === 'ongoing') return <span className="lms-status lms-status-active">ONGOING</span>;
    if (s === 'completed') return <span className="lms-status" style={{ background: '#e2e8f0', color: '#475569' }}>COMPLETED</span>;
    if (s === 'archived') return <span className="lms-status lms-status-closed">ARCHIVED</span>;
    return <span className="lms-status">{status.toUpperCase()}</span>;
  };

  return (
    <LMSLayout pageTitle="Manage Examinations" breadcrumbs={[{ label: 'Dashboard', href: '/faculty/dashboard' }, { label: 'Exams' }]}>
      <div className="lms-section">
        <div className="lms-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Your Examinations</span>
          <Link href="/faculty/exam/create" className="lms-btn lms-btn-sm lms-btn-primary">
            + Create New Exam
          </Link>
        </div>

        {loading ? (
          <div className="lms-loading">Loading exams...</div>
        ) : exams.length === 0 ? (
          <div className="lms-table-empty">
            <p>You haven't created any exams yet.</p>
            <Link href="/faculty/exam/create" className="lms-btn lms-btn-primary" style={{ marginTop: 12 }}>
              Create Your First Exam
            </Link>
          </div>
        ) : (
          <div className="lms-table-container">
            <table className="lms-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Duration / Marks</th>
                  <th>Schedule</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map(exam => (
                  <tr key={exam._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{exam.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Created {format(new Date(exam.createdAt), 'dd MMM yyyy')}</div>
                    </td>
                    <td>{exam.subject}</td>
                    <td>
                      <div style={{ fontSize: 13 }}>{exam.duration} mins</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{exam.totalMarks} marks</div>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {exam.startTime ? (
                        <>
                          <div>S: {format(new Date(exam.startTime), 'dd/MM/yy HH:mm')}</div>
                          <div style={{ color: 'var(--text-muted)' }}>E: {format(new Date(exam.endTime), 'dd/MM/yy HH:mm')}</div>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Not scheduled</span>
                      )}
                    </td>
                    <td>{getStatusBadge(exam.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link href={`/faculty/exam/manage/${exam._id}`} className="lms-btn lms-btn-sm">
                          Manage
                        </Link>
                        {exam.status === 'draft' && (
                          <button onClick={() => deleteExam(exam._id)} className="lms-btn lms-btn-sm lms-btn-danger">
                            Delete
                          </button>
                        )}
                      </div>
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
