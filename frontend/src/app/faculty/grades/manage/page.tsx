'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import LMSLayout from '@/components/layouts/LMSLayout';

interface Grade {
  _id?: string;
  studentId: string;
  studentName: string;
  studentRollNo?: string;
  courseId?: string;
  marksObtained?: number;
  maxMarks?: number;
  grade?: string;
  gradePoints?: number;
  credits?: number;
  components?: { name: string; marks: number; maxMarks: number }[];
  isPublished?: boolean;
}

export default function FacultyGradebookPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchCourses = useCallback(async () => {
    try {
      const res = await api.get('/courses', { params: { faculty: true, limit: 50 } });
      const c = res.data?.data?.courses || res.data?.data || [];
      setCourses(Array.isArray(c) ? c : []);
    } catch { }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const fetchGrades = useCallback(async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      const [enrollRes, gradesRes] = await Promise.allSettled([
        api.get(`/courses/${selectedCourse}/students`),
        api.get('/gradebook', { params: { courseId: selectedCourse } }),
      ]);

      const students = enrollRes.status === 'fulfilled'
        ? (enrollRes.value.data?.data?.students || enrollRes.value.data?.data || [])
        : [];

      const existingGrades = gradesRes.status === 'fulfilled'
        ? (gradesRes.value.data?.data || [])
        : [];

      const gradeMap: Record<string, any> = {};
      existingGrades.forEach((g: any) => {
        const sid = typeof g.studentId === 'object' ? g.studentId?._id : g.studentId;
        gradeMap[sid] = g;
      });

      setGrades(students.map((s: any) => ({
        _id: gradeMap[s._id]?._id,
        studentId: s._id,
        studentName: `${s.firstName} ${s.lastName}`,
        studentRollNo: s.studentId || s.rollNumber,
        courseId: selectedCourse,
        marksObtained: gradeMap[s._id]?.marksObtained,
        maxMarks: gradeMap[s._id]?.maxMarks ?? 100,
        grade: gradeMap[s._id]?.grade || '',
        gradePoints: gradeMap[s._id]?.gradePoints,
        credits: gradeMap[s._id]?.credits ?? 3,
        isPublished: gradeMap[s._id]?.isPublished || false,
      })));
    } catch { } finally { setLoading(false); }
  }, [selectedCourse]);

  useEffect(() => { fetchGrades(); }, [fetchGrades]);

  const setMarks = (idx: number, marks: number) => {
    setGrades(prev => {
      const next = [...prev];
      const m = marks;
      const max = next[idx].maxMarks || 100;
      const pct = (m / max) * 100;
      // Auto-calculate grade
      let grade = 'F', gp = 0;
      if (pct >= 90) { grade = 'A+'; gp = 10; }
      else if (pct >= 80) { grade = 'A'; gp = 9; }
      else if (pct >= 75) { grade = 'A-'; gp = 8; }
      else if (pct >= 70) { grade = 'B+'; gp = 7; }
      else if (pct >= 65) { grade = 'B'; gp = 6; }
      else if (pct >= 60) { grade = 'B-'; gp = 5; }
      else if (pct >= 55) { grade = 'C+'; gp = 4; }
      else if (pct >= 50) { grade = 'C'; gp = 3; }
      else if (pct >= 40) { grade = 'D'; gp = 2; }
      next[idx] = { ...next[idx], marksObtained: m, grade, gradePoints: gp };
      return next;
    });
  };

  const saveGrades = async () => {
    setSaving(true);
    setError('');
    try {
      await api.post('/gradebook/batch', {
        courseId: selectedCourse,
        grades: grades.map(g => ({
          studentId: g.studentId,
          marksObtained: g.marksObtained,
          maxMarks: g.maxMarks || 100,
          grade: g.grade,
          gradePoints: g.gradePoints,
          credits: g.credits || 3,
          courseId: selectedCourse,
        })),
      });
      setSuccess('Grades saved successfully!');
      fetchGrades();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save grades');
    } finally { setSaving(false); }
  };

  const publishGrades = async () => {
    if (!confirm('Publish grades? Students will be able to see their results.')) return;
    setPublishing(true);
    try {
      await api.post(`/gradebook/publish/${selectedCourse}`);
      setSuccess('Grades published! Students can now see their results.');
      fetchGrades();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to publish grades');
    } finally { setPublishing(false); }
  };

  const gradeColors: Record<string, string> = {
    'A+': 'var(--success)', 'A': 'var(--success)', 'A-': '#4ade80',
    'B+': 'var(--secondary)', 'B': 'var(--secondary)',
    'C+': 'var(--warning)', 'C': 'var(--warning)',
    'D': '#f87171', 'F': 'var(--danger)',
  };

  const gradedCount = grades.filter(g => g.marksObtained !== undefined && g.marksObtained !== null).length;
  const avgMarks = grades.length > 0 && gradedCount > 0
    ? grades.filter(g => g.marksObtained !== undefined).reduce((sum, g) => sum + (Number(g.marksObtained) || 0), 0) / gradedCount
    : 0;

  return (
    <LMSLayout pageTitle="Gradebook Management" breadcrumbs={[{ label: 'Faculty' }, { label: 'Gradebook' }]}>
      {/* Course Selector */}
      <div className="lms-section animate-fadeInDown">
        <div className="lms-section-title"> Select Course</div>
        <div style={{ padding: 16 }}>
          <select
            className="lms-select"
            style={{ maxWidth: 400 }}
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
          >
            <option value="">— Select a Course —</option>
            {courses.map((c: any) => (
              <option key={c._id} value={c._id}>{c.title} ({c.code || 'N/A'})</option>
            ))}
          </select>
        </div>
      </div>

      {success && <div className="lms-alert lms-alert-success animate-fadeIn" style={{ marginBottom: 16 }}><div>{success}</div></div>}
      {error && <div className="lms-alert lms-alert-error animate-fadeIn" style={{ marginBottom: 16 }}><div>{error}</div></div>}

      {selectedCourse && (
        <>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Students', value: grades.length },
              { label: 'Graded', value: gradedCount },
              { label: 'Ungraded', value: grades.length - gradedCount },
              { label: 'Avg. Marks', value: avgMarks > 0 ? `${avgMarks.toFixed(1)}/${grades[0]?.maxMarks || 100}` : '—' },
            ].map(s => (
              <div key={s.label} className="lms-stat-card" style={{ flex: '1 0 150px', minWidth: 0 }}>
                <div className="lms-stat-value" style={{ fontSize: 22 }}>{s.value}</div>
                <div className="lms-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <button onClick={saveGrades} disabled={saving || grades.length === 0} className="lms-btn lms-btn-primary">
              {saving ? ' Saving...' : ' Save Grades'}
            </button>
            <button onClick={publishGrades} disabled={publishing || gradedCount === 0} className="lms-btn lms-btn-success">
              {publishing ? ' Publishing...' : ' Publish Grades'}
            </button>
          </div>

          {/* Gradebook Table */}
          <div className="lms-section">
            <div className="lms-section-title">
               Gradebook — {grades.length} Students
              <span style={{ marginLeft: 8, fontWeight: 400, fontSize: 11, color: 'var(--text-muted)' }}>
                {gradedCount}/{grades.length} graded
              </span>
            </div>
            {loading ? (
              <div className="lms-spinner" style={{ padding: 40 }}><div className="spinner" /></div>
            ) : grades.length === 0 ? (
              <div className="lms-table-empty" style={{ padding: 48 }}>No students enrolled in this course.</div>
            ) : (
              <div className="lms-table-container">
                <table className="lms-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Roll No.</th>
                      <th>Student Name</th>
                      <th>Max Marks</th>
                      <th>Marks Obtained</th>
                      <th>%</th>
                      <th>Grade</th>
                      <th>Grade Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((g, i) => {
                      const pct = g.marksObtained !== undefined
                        ? Math.round((Number(g.marksObtained) / (g.maxMarks || 100)) * 100)
                        : null;
                      return (
                        <tr key={g.studentId} style={{ background: g.isPublished ? 'var(--success-bg)' : '' }}>
                          <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                          <td className="font-mono" style={{ fontSize: 11 }}>{g.studentRollNo || '—'}</td>
                          <td style={{ fontWeight: 500 }}>{g.studentName}</td>
                          <td>{g.maxMarks || 100}</td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              max={g.maxMarks || 100}
                              value={g.marksObtained ?? ''}
                              onChange={e => setMarks(i, parseFloat(e.target.value))}
                              className="lms-input"
                              style={{ width: 80, padding: '4px 8px', textAlign: 'center', fontFamily: 'monospace' }}
                              placeholder="—"
                            />
                          </td>
                          <td style={{ fontWeight: 600, color: pct !== null ? (pct >= 75 ? 'var(--success)' : pct < 50 ? 'var(--danger)' : 'var(--warning)') : 'var(--text-muted)' }}>
                            {pct !== null ? `${pct}%` : '—'}
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, fontSize: 14, color: gradeColors[g.grade || ''] || 'var(--text-muted)' }}>
                              {g.grade || '—'}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'monospace' }}>{g.gradePoints !== undefined ? g.gradePoints : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </LMSLayout>
  );
}
