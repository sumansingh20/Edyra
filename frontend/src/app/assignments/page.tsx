'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SidebarLayout from '@/components/layouts/SidebarLayout';
import { useAuthStore } from '@/store/authStore';
import { assignmentApi } from '@/lib/edyraApi';
import toast from 'react-hot-toast';

interface Assignment {
  _id: string;
  title: string;
  course: {
    _id: string;
    title: string;
    code: string;
  } | string;
  courseTitle?: string;
  courseCode?: string;
  type: string;
  status: string;
  dueDate: string;
  totalMarks: number;
  passingMarks?: number;
  submissionsCount?: number;
  totalStudents?: number;
  mySubmission?: {
    status: string;
    marks?: number;
    submittedAt?: string;
  };
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  graded: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  closed: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

const TYPE_LABELS: Record<string, string> = {
  homework: 'Homework',
  project: 'Project',
  'lab-report': 'Lab Report',
  research: 'Research',
  presentation: 'Presentation',
  other: 'Other',
};

function getCourseName(assignment: Assignment): string {
  if (typeof assignment.course === 'object' && assignment.course?.title) {
    return assignment.course.title;
  }
  return assignment.courseTitle || 'Unknown Course';
}

function getCourseCode(assignment: Assignment): string {
  if (typeof assignment.course === 'object' && assignment.course?.code) {
    return assignment.course.code;
  }
  return assignment.courseCode || '';
}

function getAssignmentDisplayStatus(assignment: Assignment, isStudent: boolean): string {
  if (isStudent && assignment.mySubmission) {
    return assignment.mySubmission.status;
  }
  if (new Date(assignment.dueDate) < new Date() && assignment.status !== 'closed') {
    return 'overdue';
  }
  return assignment.status || 'pending';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}

export default function AssignmentsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseOptions, setCourseOptions] = useState<{ id: string; title: string }[]>([]);

  const isStaff = ['admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant'].includes(user?.role || '');
  const isStudent = user?.role === 'student';

  useEffect(() => {
    fetchAssignments();
  }, [search, courseFilter, statusFilter]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (courseFilter) params.course = courseFilter;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      const res = await assignmentApi.list(params);
      const data = res.data.data;
      const list: Assignment[] = data.assignments || data || [];
      setAssignments(list);

      // Build unique course options from fetched data
      const courseMap = new Map<string, string>();
      list.forEach((a) => {
        const courseId = typeof a.course === 'object' ? a.course?._id : (a.course as string);
        const name = getCourseName(a);
        if (courseId && name) {
          courseMap.set(courseId, name);
        }
      });
      setCourseOptions(Array.from(courseMap.entries()).map(([id, title]) => ({ id, title })));
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout
      pageTitle="Assignments"
      breadcrumbs={[{ label: 'EDYRA' }, { label: 'Assignments' }]}
    >
      <div className="space-y-6">
        {/* Filters and Actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search assignments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              />
            </div>

            {/* Course Filter */}
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 min-w-[160px]"
            >
              <option value="">All Courses</option>
              {courseOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="graded">Graded</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Create Button */}
          {isStaff && (
            <button
              onClick={() => router.push('/assignments/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Assignment
            </button>
          )}
        </div>

        {/* Assignment Cards */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                    <div className="flex gap-4">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                    </div>
                  </div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="mx-auto w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
              No assignments found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {search || courseFilter || statusFilter
                ? 'Try adjusting your filters or search terms.'
                : isStaff
                ? 'Create your first assignment to get started.'
                : 'No assignments have been posted yet.'}
            </p>
            {isStaff && !search && !courseFilter && !statusFilter && (
              <button
                onClick={() => router.push('/assignments/create')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                Create Assignment
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const displayStatus = getAssignmentDisplayStatus(assignment, isStudent);
              const courseName = getCourseName(assignment);
              const courseCode = getCourseCode(assignment);
              const overdue = isOverdue(assignment.dueDate);

              return (
                <div
                  key={assignment._id}
                  onClick={() => router.push(`/assignments/${assignment._id}`)}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    {/* Left content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {/* Type badge */}
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-medium rounded">
                          {TYPE_LABELS[assignment.type] || assignment.type || 'Assignment'}
                        </span>
                        {/* Course badge */}
                        {courseCode && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-mono rounded">
                            {courseCode}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                        {assignment.title}
                      </h3>

                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {courseName}
                      </p>

                      {/* Meta row */}
                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                        {/* Due date */}
                        <span className={`flex items-center gap-1 ${overdue ? 'text-red-500 dark:text-red-400 font-medium' : ''}`}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Due: {formatDate(assignment.dueDate)}
                        </span>

                        {/* Total marks */}
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                          {assignment.totalMarks} marks
                        </span>

                        {/* Submissions count (staff view) */}
                        {isStaff && assignment.submissionsCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {assignment.submissionsCount}
                            {assignment.totalStudents !== undefined
                              ? `/${assignment.totalStudents}`
                              : ''}{' '}
                            submitted
                          </span>
                        )}

                        {/* Student submission status */}
                        {isStudent && assignment.mySubmission && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {assignment.mySubmission.status === 'graded'
                              ? `Graded: ${assignment.mySubmission.marks}/${assignment.totalMarks}`
                              : assignment.mySubmission.status === 'submitted'
                              ? `Submitted on ${formatDate(assignment.mySubmission.submittedAt || '')}`
                              : assignment.mySubmission.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="flex-shrink-0">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full capitalize ${
                          STATUS_BADGE[displayStatus] || STATUS_BADGE.pending
                        }`}
                      >
                        {displayStatus}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
