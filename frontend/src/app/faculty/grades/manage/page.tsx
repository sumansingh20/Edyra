'use client';

import { useEffect, useState, useCallback } from 'react';
import LMSLayout from '@/components/layouts/LMSLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface GradeRecord {
  _id: string;
  student: { _id: string; firstName: string; lastName: string; email: string; studentId?: string };
  course: { _id: string; title: string; code: string };
  marks?: number;
  totalMarks?: number;
  percentage?: number;
  grade?: string;
  gradePoint?: number;
  credits?: number;
  status: string;
  isPublished?: boolean;
  semester?: string;
}

interface Course { _id: string; title: string; code: string; }

const GRADE_SCALE = [
  { min: 90, grade: 'O', point: 10 },
  { min: 80, grade: 'A+', point: 9 },
  { min: 70, grade: 'A', point: 8 },
  { min: 60, grade: 'B+', point: 7 },
  { min: 50, grade: 'B', point: 6 },
  { min: 40, grade: 'C', point: 5 },
  { min: 35, grade: 'D', point: 4 },
  { min: 0, grade: 'F', point: 0 },
];

function calcGrade(pct: number) {
  return GRADE_SCALE.find(g => pct >= g.min) || GRADE_SCALE[GRADE_SCALE.length - 1];
}

export default function FacultyGradesManagePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editMap, setEditMap] = useState<Record<string, { marks: string; totalMarks: string; credits: string }>>({});

  useEffect(() => {
    api.get('/courses/teaching').then(r => {
      const c = r.data.data?.courses || [];
      setCourses(c);
      if (c.length > 0 && !selectedCourse) setSelectedCourse(c[0]._id);
    }).catch(() => {
      // fallback — get all faculty courses
      api.get('/analytics/teacher').then(r => {
        const cs = (r.data.data?.courses || []).map((c: any) => ({ _id: c._id || c.code, title: c.title, code: c.code }));
        setCourses(cs);
        if (cs.length > 0) setSelectedCourse(cs[0]._id);
      }).catch(() => {});
    });
  }, []);

  const loadGrades = useCallback(async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      const res = await api.get(`/gradebook/course/${selectedCourse}`);
      const g: GradeRecord[] = res.data.data?.grades || [];
      setGrades(g);
      const map: typeof editMap = {};
      g.forEach(gr => {
        map[gr._id] = { marks: gr.marks?.toString() || '', totalMarks: gr.totalMarks?.toString() || '100', credits: gr.credits?.toString() || '3' };
      });
      setEditMap(map);
    } catch {
      setGrades([]);
    } finally { setLoading(false); }
  }, [selectedCourse]);

  useEffect(() => { loadGrades(); }, [loadGrades]);

  const saveGrade = async (gradeId: string) => {
    const e = editMap[gradeId];
    if (!e?.marks || !e.totalMarks) { toast.error('Please enter marks and total marks'); return; }
    const marks = parseFloat(e.marks);
    const totalMarks = parseFloat(e.totalMarks);
    const credits = parseFloat(e.credits) || 3;
    if (isNaN(marks) || marks < 0 || marks > totalMarks) { toast.error('Invalid marks'); return; }

    const pct = (marks / totalMarks) * 100;
    const gradeInfo = calcGrade(pct);

    setSaving(gradeId);
    try {
      await api.put(`/gradebook/${gradeId}`, {
        marks, totalMarks, credits,
        percentage: pct, grade: gradeInfo.grade, gradePoint: gradeInfo.point,
      });
      toast.success('Grade saved');
      loadGrades();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save grade');
    } finally { setSaving(null); }
  };

  const publishGrades = async () => {
    if (!selectedCourse) return;
    const unpublished = grades.filter(g => !g.isPublished && g.marks !== undefined);
    if (unpublished.length === 0) { toast.error('No graded (unpublished) records to publish'); return; }
    try {
      await api.post(`/gradebook/course/${selectedCourse}/publish`);
      toast.success(`${unpublished.length} grade record(s) published to students`);
      loadGrades();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to publish grades');
    }
  };

  const filtered = grades.filter(g =>
    `${g.student?.firstName} ${g.student?.lastName} ${g.student?.email} ${g.student?.studentId}`.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: grades.length,
    graded: grades.filter(g => g.marks !== undefined).length,
    published: grades.filter(g => g.isPublished).length,
    avgPct: grades.filter(g => g.percentage !== undefined).length
      ? (grades.filter(g => g.percentage !== undefined).reduce((a, g) => a + (g.percentage || 0), 0) / grades.filter(g => g.percentage !== undefined).length).toFixed(1)
      : '—',
  };

  return (
    <LMSLayout pageTitle="Gradebook Management" breadcrumbs={[{ label: 'Dashboard', href: '/faculty/dashboard' }, { label: 'Grades' }]}>

      {/* Course selector */}
      <div className="lms-section" style={{ marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <label className="lms-label">Select Course</label>
            <select className="lms-input" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
              <option value="">-- Choose a course --</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.title} ({c.code})</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <button className="lms-btn lms-btn-sm lms-btn-primary" onClick={() => publishGrades()} disabled={!selectedCourse || loading}>
              📣 Publish Grades
            </button>
            <button className="lms-btn lms-btn-sm" onClick={loadGrades} disabled={loading}>
              🔃 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {selectedCourse && (
        <div className="lms-stats-row" style={{ marginBottom: 20 }}>
          <div className="lms-stat"><div className="lms-stat-value">{stats.total}</div><div className="lms-stat-label">Enrolled Students</div></div>
          <div className="lms-stat"><div className="lms-stat-value" style={{ color: 'var(--success)' }}>{stats.graded}</div><div className="lms-stat-label">Graded</div></div>
          <div className="lms-stat"><div className="lms-stat-value" style={{ color: 'var(--primary)' }}>{stats.published}</div><div className="lms-stat-label">Published</div></div>
          <div className="lms-stat"><div className="lms-stat-value" style={{ color: 'var(--secondary)' }}>{stats.avgPct}%</div><div className="lms-stat-label">Class Average</div></div>
        </div>
      )}

      {/* Grade scale reference */}
      <div className="lms-section" style={{ marginBottom: 20 }}>
        <div className="lms-section-title">Grading Scale</div>
        <div style={{ padding: '12px 20px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {GRADE_SCALE.map(g => (
            <div key={g.grade} style={{ padding: '4px 14px', background: '#f0f4f8', borderRadius: 20, fontSize: 12 }}>
              <strong>{g.grade}</strong> (≥{g.min}% = {g.point}GP)
            </div>
          ))}
        </div>
      </div>

      {/* Grade table */}
      <div className="lms-section">
        <div className="lms-section-title" style={{ justifyContent: 'space-between' }}>
          <span>Student Grade Records</span>
          <input className="lms-input" style={{ width: 220, fontSize: 13, padding: '4px 12px' }} placeholder="Search student..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {!selectedCourse ? (
          <div className="lms-table-empty">Please select a course to manage grades.</div>
        ) : loading ? (
          <div className="lms-loading">Loading grade records...</div>
        ) : filtered.length === 0 ? (
          <div className="lms-table-empty">No enrolled students found for this course.</div>
        ) : (
          <div className="lms-table-container">
            <table className="lms-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Marks</th>
                  <th>Total</th>
                  <th>Credits</th>
                  <th>%</th>
                  <th>Grade</th>
                  <th>Grade Point</th>
                  <th>Published</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(g => {
                  const e = editMap[g._id] || { marks: '', totalMarks: '100', credits: '3' };
                  const previewPct = e.marks && e.totalMarks ? (parseFloat(e.marks) / parseFloat(e.totalMarks)) * 100 : null;
                  const previewGrade = previewPct !== null ? calcGrade(previewPct) : null;

                  return (
                    <tr key={g._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{g.student?.firstName} {g.student?.lastName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{g.student?.email}</div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{g.student?.studentId || '—'}</td>
                      <td>
                        <input type="number" className="lms-input" style={{ width: 80, padding: '4px 8px', fontSize: 13 }}
                          min={0} max={parseFloat(e.totalMarks) || 100} value={e.marks}
                          onChange={ev => setEditMap(m => ({ ...m, [g._id]: { ...m[g._id], marks: ev.target.value } }))}
                          placeholder="Marks" />
                      </td>
                      <td>
                        <input type="number" className="lms-input" style={{ width: 70, padding: '4px 8px', fontSize: 13 }}
                          min={1} value={e.totalMarks}
                          onChange={ev => setEditMap(m => ({ ...m, [g._id]: { ...m[g._id], totalMarks: ev.target.value } }))} />
                      </td>
                      <td>
                        <input type="number" className="lms-input" style={{ width: 60, padding: '4px 8px', fontSize: 13 }}
                          min={1} max={10} value={e.credits}
                          onChange={ev => setEditMap(m => ({ ...m, [g._id]: { ...m[g._id], credits: ev.target.value } }))} />
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {previewPct !== null ? `${previewPct.toFixed(1)}%` : g.percentage !== undefined ? `${(g.percentage).toFixed(1)}%` : '—'}
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, fontSize: 14, color: previewGrade?.grade === 'F' ? 'var(--danger)' : 'var(--success)' }}>
                          {previewGrade?.grade || g.grade || '—'}
                        </span>
                      </td>
                      <td>{previewGrade?.point ?? g.gradePoint ?? '—'}</td>
                      <td>
                        <span className={`lms-status ${g.isPublished ? 'lms-status-active' : 'lms-status-pending'}`}>
                          {g.isPublished ? 'YES' : 'NO'}
                        </span>
                      </td>
                      <td>
                        <button className="lms-btn lms-btn-sm lms-btn-primary" disabled={saving === g._id || !e.marks}
                          onClick={() => saveGrade(g._id)}>
                          {saving === g._id ? 'Saving...' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </LMSLayout>
  );
}
