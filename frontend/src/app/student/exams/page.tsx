'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Exam {
  _id: string;
  title: string;
  subject: string;
  duration: number;
  totalMarks: number;
  startTime: string;
  endTime: string;
  status: string;
  attempted: boolean;
}

export default function StudentExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'available' | 'upcoming' | 'completed'>('available');

  useEffect(() => {
    const fetchExams = async () => {
      try {
        // Assume API returns all exams student has access to
        const res = await api.get('/student/exams');
        setExams(res.data.data?.exams || []);
      } catch (err) {
        console.error('Failed to fetch exams:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const now = new Date();

  const filtered = exams.filter(e => {
    if (e.attempted) return filter === 'completed';
    const start = new Date(e.startTime);
    const end = new Date(e.endTime);
    if (filter === 'available') return now >= start && now <= end;
    if (filter === 'upcoming') return now < start;
    if (filter === 'completed') return now > end || e.attempted;
    return true;
  });

  return (
    <LMSLayout pageTitle="My Examinations" breadcrumbs={[{ label: 'Dashboard', href: '/student/dashboard' }, { label: 'Exams' }]}>
      
      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid var(--border)' }}>
        {(['available', 'upcoming', 'completed'] as const).map(t => (
          <button key={t} onClick={() => setFilter(t)}
            style={{ padding: '8px 20px', border: 'none', borderBottom: filter === t ? '2px solid var(--primary)' : '2px solid transparent', background: 'none', cursor: 'pointer', fontWeight: filter === t ? 700 : 400, fontSize: 14, color: filter === t ? 'var(--primary)' : 'var(--text-muted)', marginBottom: -2, textTransform: 'capitalize' }}>
            {t} Exams
          </button>
        ))}
      </div>

      {loading ? (
        <div className="lms-loading">Loading exams...</div>
      ) : filtered.length === 0 ? (
        <div className="lms-table-empty">
          No {filter} exams found.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {filtered.map(exam => {
            const isAvailable = now >= new Date(exam.startTime) && now <= new Date(exam.endTime) && !exam.attempted;
            
            return (
              <div key={exam._id} className="lms-section" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
                <div style={{ padding: '20px 24px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ background: '#f0f4f8', color: 'var(--primary)', padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                      {exam.subject}
                    </div>
                    {exam.attempted ? (
                      <span className="lms-status lms-status-active">ATTEMPTED</span>
                    ) : (
                      <span className={`lms-status ${isAvailable ? 'lms-status-info' : 'lms-status-pending'}`}>
                        {isAvailable ? 'OPEN NOW' : filter === 'upcoming' ? 'UPCOMING' : 'CLOSED'}
                      </span>
                    )}
                  </div>
                  <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>{exam.title}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span>⏱️</span> {exam.duration} minutes
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span>🎯</span> {exam.totalMarks} Marks
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span>📅</span> Starts: {format(new Date(exam.startTime), 'dd MMM yyyy, HH:mm')}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span>⏳</span> Ends: {format(new Date(exam.endTime), 'dd MMM yyyy, HH:mm')}
                    </div>
                  </div>
                </div>
                <div style={{ padding: '16px 24px', background: '#f8f9fa', borderTop: '1px solid var(--border)', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                  {exam.attempted ? (
                    <Link href={`/student/results`} className="lms-btn lms-btn-sm" style={{ width: '100%', textAlign: 'center' }}>
                      View Results
                    </Link>
                  ) : isAvailable ? (
                    <Link href={`/student/exam/${exam._id}`} className="lms-btn lms-btn-primary lms-btn-sm" style={{ width: '100%', textAlign: 'center' }}>
                      Take Exam
                    </Link>
                  ) : (
                    <button className="lms-btn lms-btn-sm" disabled style={{ width: '100%' }}>
                      {filter === 'upcoming' ? 'Not Started Yet' : 'Exam Closed'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </LMSLayout>
  );
}
