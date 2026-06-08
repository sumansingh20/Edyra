'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import LMSLayout from '@/components/layouts/LMSLayout';
import { format } from 'date-fns';

type ReportType = 'attendance' | 'grades' | 'exams' | 'students' | 'faculty';

export default function AdminReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('attendance');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    startDate: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    department: '',
    courseId: '',
    role: '',
  });

  const generateReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/analytics/${activeReport === 'attendance' ? 'institution' : activeReport === 'grades' ? 'institution' : 'dashboard'}`, {
        params: { ...filters },
      });
      const d = res.data?.data || {};
      // Flatten based on report type
      if (activeReport === 'attendance') {
        setReportData(d.attendanceReport || d.departments || []);
      } else if (activeReport === 'grades') {
        setReportData(d.gradeReport || d.grades || []);
      } else if (activeReport === 'students') {
        setReportData(d.students || d.recentStudents || []);
      } else {
        setReportData([]);
      }
    } catch { setReportData([]); } finally { setLoading(false); }
  }, [activeReport, filters]);

  useEffect(() => { generateReport(); }, [generateReport]);

  const exportCSV = async (type: 'csv' | 'excel' = 'csv') => {
    setGenerating(true);
    try {
      const endpoint = `/admin/reports/${activeReport}/export`;
      const res = await api.get(endpoint, {
        params: { ...filters, format: type },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `edyra_${activeReport}_report_${format(new Date(), 'yyyy-MM-dd')}.${type === 'csv' ? 'csv' : 'xlsx'}`;
      link.click();
    } catch {
      alert('Export failed. The export endpoint may not be fully configured yet.');
    } finally { setGenerating(false); }
  };

  const exportPDF = () => {
    window.print();
  };

  const REPORT_TABS: { key: ReportType; label: string; icon: string }[] = [
    { key: 'attendance', label: 'Attendance', icon: '' },
    { key: 'grades', label: 'Grades', icon: '' },
    { key: 'exams', label: 'Exams', icon: '' },
    { key: 'students', label: 'Students', icon: '' },
    { key: 'faculty', label: 'Faculty', icon: '‍' },
  ];

  return (
    <LMSLayout pageTitle="Reports & Export" breadcrumbs={[{ label: 'Admin' }, { label: 'Reports' }]}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #1d2d3e 100%)',
        color: '#fff', borderRadius: 'var(--radius-lg)', padding: '20px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }} className="animate-fadeInDown">
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}> Reporting Engine</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>Generate, analyze, and export academic reports</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => exportCSV('csv')} disabled={generating} className="lms-btn" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
             CSV
          </button>
          <button onClick={() => exportCSV('excel')} disabled={generating} className="lms-btn" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
             Excel
          </button>
          <button onClick={exportPDF} className="lms-btn" style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}>
            ️ PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="lms-section animate-fadeIn" style={{ marginBottom: 20 }}>
        <div className="lms-section-title"> Report Filters</div>
        <div style={{ padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="lms-form-group" style={{ margin: 0 }}>
            <label className="lms-label">From Date</label>
            <input type="date" className="lms-input" value={filters.startDate}
              onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
          </div>
          <div className="lms-form-group" style={{ margin: 0 }}>
            <label className="lms-label">To Date</label>
            <input type="date" className="lms-input" value={filters.endDate}
              onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
          </div>
          <div className="lms-form-group" style={{ margin: 0, flex: 1, minWidth: 150 }}>
            <label className="lms-label">Department</label>
            <input className="lms-input" placeholder="All departments..." value={filters.department}
              onChange={e => setFilters(f => ({ ...f, department: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={generateReport} className="lms-btn lms-btn-primary">
               Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="lms-tabs">
        {REPORT_TABS.map(t => (
          <button key={t.key} className={`lms-tab-btn ${activeReport === t.key ? 'active' : ''}`}
            onClick={() => setActiveReport(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Report Table */}
      <div className="lms-section">
        <div className="lms-section-title">
          {REPORT_TABS.find(t => t.key === activeReport)?.label} Report
          {reportData.length > 0 && (
            <span style={{ marginLeft: 8, fontWeight: 400, fontSize: 12, color: 'var(--text-muted)' }}>
              {reportData.length} records
            </span>
          )}
        </div>
        {loading ? (
          <div className="lms-spinner" style={{ padding: 40 }}><div className="spinner" /><span>Generating report...</span></div>
        ) : (
          <div className="lms-table-container">
            {reportData.length === 0 ? (
              <div className="lms-table-empty" style={{ padding: 48 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}></div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>No data for selected filters</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  Try adjusting the date range or department filter.
                </div>
              </div>
            ) : (
              <>
                {activeReport === 'attendance' && (
                  <table className="lms-table">
                    <thead>
                      <tr><th>Name/Dept</th><th>Total Classes</th><th>Present</th><th>Absent</th><th>%</th></tr>
                    </thead>
                    <tbody>
                      {reportData.map((r: any, i: number) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 500 }}>{r.name || r.department || '-'}</td>
                          <td>{r.total || r.totalClasses || 0}</td>
                          <td style={{ color: 'var(--success)' }}>{r.present || r.attendedClasses || 0}</td>
                          <td style={{ color: 'var(--danger)' }}>{r.absent || 0}</td>
                          <td>
                            <span className={`lms-status ${(r.percentage || 0) >= 75 ? 'lms-status-active' : 'lms-status-closed'}`}>
                              {Math.round(r.percentage || r.attendanceRate || 0)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {activeReport === 'grades' && (
                  <table className="lms-table">
                    <thead>
                      <tr><th>Student/Course</th><th>Marks</th><th>Grade</th><th>GPA</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {reportData.map((r: any, i: number) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 500 }}>{r.name || r.course || '-'}</td>
                          <td>{r.marks || r.marksObtained || 0}/{r.maxMarks || 100}</td>
                          <td style={{ fontWeight: 700, color: r.grade === 'F' ? 'var(--danger)' : 'var(--success)' }}>{r.grade || '-'}</td>
                          <td>{r.gpa?.toFixed(2) || r.cgpa?.toFixed(2) || '-'}</td>
                          <td>
                            <span className={`lms-status ${r.grade === 'F' ? 'lms-status-closed' : 'lms-status-active'}`}>
                              {r.grade === 'F' ? 'Failed' : 'Passed'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {(activeReport === 'students' || activeReport === 'faculty' || activeReport === 'exams') && (
                  <table className="lms-table">
                    <thead>
                      <tr>
                        {Object.keys(reportData[0] || {}).slice(0, 6).map(k => (
                          <th key={k}>{k.replace(/([A-Z])/g, ' $1').trim()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((r: any, i: number) => (
                        <tr key={i}>
                          {Object.values(r).slice(0, 6).map((v: any, j: number) => (
                            <td key={j}>{String(v ?? '—').slice(0, 50)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </LMSLayout>
  );
}
