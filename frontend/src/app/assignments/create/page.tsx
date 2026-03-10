'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SidebarLayout from '@/components/layouts/SidebarLayout';
import { assignmentApi } from '@/lib/edyraApi';
import toast from 'react-hot-toast';

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    course: '', title: '', description: '', type: 'homework',
    totalMarks: '100', passingMarks: '40', dueDate: '',
    lateSubmissionAllowed: false, latePenaltyPercent: '10',
    maxFileSize: '10', allowedFileTypes: 'pdf,docx,zip,py,js',
  });
  const [rubric, setRubric] = useState<{ name: string; maxMarks: string; description: string }[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const addRubricItem = () => setRubric(prev => [...prev, { name: '', maxMarks: '', description: '' }]);
  const removeRubricItem = (idx: number) => setRubric(prev => prev.filter((_, i) => i !== idx));
  const updateRubricItem = (idx: number, field: string, value: string) => {
    setRubric(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.course || !form.dueDate) {
      toast.error('Title, Course, and Due Date are required');
      return;
    }
    try {
      setLoading(true);
      const data = {
        ...form,
        totalMarks: parseInt(form.totalMarks),
        passingMarks: parseInt(form.passingMarks),
        maxFileSize: parseInt(form.maxFileSize) * 1024 * 1024,
        allowedFileTypes: form.allowedFileTypes.split(',').map(t => t.trim()),
        rubric: rubric.map(r => ({ ...r, maxMarks: parseInt(r.maxMarks) || 0 })),
      };
      await assignmentApi.create(data);
      toast.success('Assignment created');
      router.push('/assignments');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout pageTitle="Create Assignment" breadcrumbs={[{ label: 'EDYRA' }, { label: 'Assignments', href: '/assignments' }, { label: 'Create' }]}>
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Assignment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course ID *</label>
              <input name="course" value={form.course} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm" placeholder="Course ObjectId" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select name="type" value={form.type} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm">
                <option value="homework">Homework</option>
                <option value="project">Project</option>
                <option value="lab-report">Lab Report</option>
                <option value="research">Research</option>
                <option value="presentation">Presentation</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Marks</label>
              <input name="totalMarks" type="number" value={form.totalMarks} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Passing Marks</label>
              <input name="passingMarks" type="number" value={form.passingMarks} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date *</label>
              <input name="dueDate" type="datetime-local" value={form.dueDate} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <input name="lateSubmissionAllowed" type="checkbox" checked={form.lateSubmissionAllowed} onChange={handleChange} className="rounded" />
              <label className="text-sm text-gray-700 dark:text-gray-300">Allow Late Submission</label>
            </div>
            {form.lateSubmissionAllowed && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Late Penalty %</label>
                <input name="latePenaltyPercent" type="number" value={form.latePenaltyPercent} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max File Size (MB)</label>
              <input name="maxFileSize" type="number" value={form.maxFileSize} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Allowed File Types (comma separated)</label>
            <input name="allowedFileTypes" value={form.allowedFileTypes} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm" />
          </div>
        </div>

        {/* Rubric */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Grading Rubric</h2>
            <button type="button" onClick={addRubricItem} className="px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg">+ Add Criteria</button>
          </div>
          {rubric.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                <input value={item.name} onChange={e => updateRubricItem(idx, 'name', e.target.value)} placeholder="Criteria name" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm" />
                <input value={item.maxMarks} onChange={e => updateRubricItem(idx, 'maxMarks', e.target.value)} type="number" placeholder="Max marks" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm" />
                <input value={item.description} onChange={e => updateRubricItem(idx, 'description', e.target.value)} placeholder="Description" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm" />
              </div>
              <button type="button" onClick={() => removeRubricItem(idx)} className="text-red-500 hover:text-red-700 text-sm mt-2">Remove</button>
            </div>
          ))}
          {rubric.length === 0 && <p className="text-sm text-gray-400">No rubric criteria added. Click &quot;Add Criteria&quot; to define grading rubric.</p>}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300">Cancel</button>
          <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Assignment'}
          </button>
        </div>
      </form>
    </SidebarLayout>
  );
}
