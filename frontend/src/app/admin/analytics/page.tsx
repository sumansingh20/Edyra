'use client';

import { useEffect, useState } from 'react';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';

interface InstitutionData {
  enrollmentTrend: { _id: string; count: number }[];
  departmentStats: { _id: string; count: number }[];
  feeStats: { _id: string; count: number; totalAmount: number; collectedAmount: number }[];
  admissionStats: { _id: string; count: number }[];
}

interface OverviewData {
  totalStudents: number;
  totalTeachers: number;
  totalExams: number;
  totalSubmissions: number;
}

export default function AdminAnalyticsPage() {
  const [institution, setInstitution] = useState<InstitutionData | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [instRes, overRes] = await Promise.allSettled([
          api.get('/analytics/institution'),
          api.get('/analytics/overview'),
        ]);
        if (instRes.status === 'fulfilled') setInstitution(instRes.value.data.data);
        if (overRes.status === 'fulfilled') setOverview(overRes.value.data.data);
      } catch (err) {
        console.error('Failed to fetch admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const deptData = institution?.departmentStats?.slice(0, 6) || [];
  const maxDeptCount = Math.max(...deptData.map(d => d.count), 1);

  const enrollData = institution?.enrollmentTrend?.slice(-8) || [];
  const maxEnroll = Math.max(...enrollData.map(e => e.count), 1);

  return (
    <LMSLayout pageTitle="Institutional Intelligence" breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Analytics' }]}>
      {/* Stats Row */}
      <div className="lms-stats-row" style={{ marginBottom: 24 }}>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--primary)' }}>{overview?.totalStudents || 0}</div>
          <div className="lms-stat-label">Total Students</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--success)' }}>{overview?.totalExams || 0}</div>
          <div className="lms-stat-label">Total Exams</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--secondary)' }}>{overview?.totalTeachers || 0}</div>
          <div className="lms-stat-label">Faculty Members</div>
        </div>
        <div className="lms-stat">
          <div className="lms-stat-value" style={{ color: 'var(--warning)' }}>{overview?.totalSubmissions || 0}</div>
          <div className="lms-stat-label">Total Submissions</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>

        {/* Department-wise student distribution */}
        <div className="lms-section">
          <div className="lms-section-title">Departmental Student Distribution</div>
          <div style={{ padding: 24 }}>
            {loading ? (
              <div className="lms-loading">Loading department data...</div>
            ) : deptData.length === 0 ? (
              <div className="lms-table-empty">No department data available. Assign departments to students to see analytics.</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 200, marginBottom: 12 }}>
                  {deptData.map(d => {
                    const pct = Math.round((d.count / maxDeptCount) * 100);
                    return (
                      <div key={d._id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontSize: 11, fontWeight: 700 }}>{d.count}</div>
                        <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                          <div style={{ width: '100%', background: 'var(--secondary)', height: `${pct}%`, minHeight: 4, borderRadius: '4px 4px 0 0', transition: 'height 0.5s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 10, fontWeight: 600, textAlign: 'center' }}>
                  {deptData.map(d => (
                    <div key={d._id} style={{ flex: 1, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d._id || 'Unassigned'}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Enrollment trend */}
        <div className="lms-section">
          <div className="lms-section-title">Student Enrollment Trend</div>
          <div style={{ padding: 24 }}>
            {loading ? (
              <div className="lms-loading">Loading trend data...</div>
            ) : enrollData.length === 0 ? (
              <div className="lms-table-empty">No enrollment trend data available yet.</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 200, marginBottom: 12 }}>
                  {enrollData.map((e, i) => {
                    const pct = Math.round((e.count / maxEnroll) * 100);
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontSize: 11, fontWeight: 700 }}>{e.count}</div>
                        <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                          <div style={{ width: '100%', background: 'var(--primary)', height: `${pct}%`, minHeight: 4, borderRadius: '4px 4px 0 0' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 10, fontWeight: 600, textAlign: 'center' }}>
                  {enrollData.map((e, i) => (
                    <div key={i} style={{ flex: 1, color: 'var(--text-muted)' }}>{e._id}</div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Admission stats */}
        <div className="lms-section">
          <div className="lms-section-title">Admission Status Breakdown</div>
          <div style={{ padding: 24 }}>
            {loading ? (
              <div className="lms-loading">Loading admissions...</div>
            ) : (institution?.admissionStats?.length || 0) === 0 ? (
              <div className="lms-table-empty">No admission records found.</div>
            ) : (
              <div className="lms-table-container">
                <table className="lms-table">
                  <thead><tr><th>Status</th><th>Count</th></tr></thead>
                  <tbody>
                    {institution?.admissionStats?.map(s => (
                      <tr key={s._id}>
                        <td style={{ textTransform: 'capitalize', fontWeight: 500 }}>{s._id || 'Unknown'}</td>
                        <td><span className="lms-status lms-status-info">{s.count}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Fee collection */}
        <div className="lms-section">
          <div className="lms-section-title">Fee Collection Summary</div>
          <div style={{ padding: 24 }}>
            {loading ? (
              <div className="lms-loading">Loading fee data...</div>
            ) : (institution?.feeStats?.length || 0) === 0 ? (
              <div className="lms-table-empty">No fee records found.</div>
            ) : (
              <div className="lms-table-container">
                <table className="lms-table">
                  <thead><tr><th>Status</th><th>Count</th><th>Total</th><th>Collected</th></tr></thead>
                  <tbody>
                    {institution?.feeStats?.map(f => (
                      <tr key={f._id}>
                        <td style={{ textTransform: 'capitalize', fontWeight: 500 }}>{f._id || 'Unknown'}</td>
                        <td>{f.count}</td>
                        <td>₹{(f.totalAmount || 0).toLocaleString()}</td>
                        <td>₹{(f.collectedAmount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </LMSLayout>
  );
}
