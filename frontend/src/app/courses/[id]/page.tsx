'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SidebarLayout from '@/components/layouts/SidebarLayout';
import { useAuthStore } from '@/store/authStore';
import { courseApi } from '@/lib/edyraApi';
import toast from 'react-hot-toast';

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'students' | 'announcements'>('content');
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchCourse();
      fetchProgress();
    }
  }, [id]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const res = await courseApi.get(id as string);
      setCourse(res.data.data.course);
    } catch (err: any) {
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const res = await courseApi.getProgress(id as string);
      setProgress(res.data.data);
    } catch {}
  };

  const handleEnroll = async () => {
    try {
      await courseApi.enroll(id as string);
      toast.success('Enrolled successfully!');
      fetchCourse();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Enrollment failed');
    }
  };

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;
    try {
      await courseApi.addModule(id as string, { title: newModuleTitle });
      toast.success('Module added');
      setNewModuleTitle('');
      setShowAddModule(false);
      fetchCourse();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add module');
    }
  };

  const handleCompleteLecture = async (moduleId: string, lectureId: string) => {
    try {
      await courseApi.completeLecture(id as string, moduleId, lectureId);
      toast.success('Lecture completed!');
      fetchCourse();
      fetchProgress();
    } catch {}
  };

  const isStaff = ['admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant'].includes(user?.role || '');
  const isEnrolled = course?.enrolledStudents?.some((s: any) => s._id === user?.id || s === user?.id);

  if (loading) return <SidebarLayout><div className="text-center py-12 text-gray-500">Loading...</div></SidebarLayout>;
  if (!course) return <SidebarLayout><div className="text-center py-12 text-gray-500">Course not found</div></SidebarLayout>;

  return (
    <SidebarLayout breadcrumbs={[{ label: 'EDYRA' }, { label: 'Courses', href: '/courses' }, { label: course.code }]}>
      <div className="space-y-6">
        {/* Course Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-mono rounded">{course.code}</span>
                <span className={`px-2 py-1 text-xs rounded ${course.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{course.status}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
              <p className="mt-2 text-gray-500 dark:text-gray-400">{course.description}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                <span>Instructor: {course.instructor?.firstName} {course.instructor?.lastName}</span>
                <span>{course.credits} Credits</span>
                <span>{course.department}</span>
                <span>{course.enrolledStudents?.length || 0}/{course.maxStudents} Students</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {user?.role === 'student' && !isEnrolled && (
                <button onClick={handleEnroll} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">Enroll Now</button>
              )}
              {isStaff && (
                <button onClick={() => router.push(`/courses/${id}/edit`)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Edit Course</button>
              )}
            </div>
          </div>
          {progress && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                <span className="font-medium">{progress.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 rounded-full h-2 transition-all" style={{ width: `${progress.progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {(['content', 'students', 'announcements'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            {isStaff && (
              <div>
                {showAddModule ? (
                  <div className="flex gap-2">
                    <input value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)} placeholder="Module title..." className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900" />
                    <button onClick={handleAddModule} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Add</button>
                    <button onClick={() => setShowAddModule(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setShowAddModule(true)} className="px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 w-full">+ Add Module</button>
                )}
              </div>
            )}
            {course.modules?.map((mod: any, idx: number) => (
              <div key={mod._id || idx} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Module {idx + 1}: {mod.title}</h3>
                  {mod.description && <p className="text-sm text-gray-500 mt-1">{mod.description}</p>}
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {mod.lectures?.map((lecture: any, lIdx: number) => {
                    const isCompleted = lecture.completedBy?.includes(user?.id);
                    return (
                      <div key={lecture._id || lIdx} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                            {isCompleted ? '\u2713' : lIdx + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{lecture.title}</p>
                            <p className="text-xs text-gray-500">{lecture.type}{lecture.duration ? ` \u00B7 ${lecture.duration} min` : ''}</p>
                          </div>
                        </div>
                        {user?.role === 'student' && !isCompleted && (
                          <button onClick={() => handleCompleteLecture(mod._id, lecture._id)} className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">Mark Complete</button>
                        )}
                      </div>
                    );
                  })}
                  {(!mod.lectures || mod.lectures.length === 0) && (
                    <div className="p-4 text-sm text-gray-400 text-center">No lectures yet</div>
                  )}
                </div>
              </div>
            ))}
            {(!course.modules || course.modules.length === 0) && (
              <div className="text-center py-8 text-gray-400">No modules yet. {isStaff ? 'Add your first module above.' : ''}</div>
            )}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {course.enrolledStudents?.map((student: any, idx: number) => (
                    <tr key={student._id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{student.firstName} {student.lastName}</td>
                      <td className="px-4 py-3 text-gray-500">{student.studentId || '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{student.email}</td>
                      <td className="px-4 py-3 text-gray-500">{student.rollNumber || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!course.enrolledStudents || course.enrolledStudents.length === 0) && (
                <div className="text-center py-8 text-gray-400">No students enrolled yet</div>
              )}
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            {course.announcements?.map((ann: any, idx: number) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">{ann.title}</h4>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{ann.content}</p>
                <p className="mt-2 text-xs text-gray-400">{new Date(ann.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
            {(!course.announcements || course.announcements.length === 0) && (
              <div className="text-center py-8 text-gray-400">No announcements yet</div>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
