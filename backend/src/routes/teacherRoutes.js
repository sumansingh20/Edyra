import express from 'express';
import adminController from '../controllers/adminController.js';
import questionController from '../controllers/questionController.js';
import violationController from '../controllers/violationController.js';
import categoryController from '../controllers/categoryController.js';
import batchController from '../controllers/batchController.js';
import examLifecycleController from '../controllers/examLifecycleController.js';
import courseController from '../controllers/courseController.js';
import assignmentController from '../controllers/assignmentController.js';
import attendanceController from '../controllers/attendanceController.js';
import gradebookController from '../controllers/gradebookController.js';
import communicationController from '../controllers/communicationController.js';
import analyticsController from '../controllers/analyticsController.js';
import { getMe } from '../controllers/authController.js';
import { authenticate, authorize, validateSession } from '../middleware/auth.js';
import { validate, examSchemas, questionSchemas } from '../middleware/validation.js';
import { apiRateLimiter } from '../middleware/security.js';

const router = express.Router();

// Apply authentication, teacher/admin authorization, and rate limiting to all routes
router.use(authenticate, validateSession, authorize('admin', 'teacher'), apiRateLimiter);

// ─────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────

/**
 * GET /teacher/profile
 * Returns the authenticated teacher's profile.
 */
router.get('/profile', getMe);

// ─────────────────────────────────────────────
// Server / Utility
// ─────────────────────────────────────────────

router.get('/server-time', batchController.getServerTime);

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────

router.get('/dashboard', adminController.getDashboardStats);

// ─────────────────────────────────────────────
// Courses (LMS)
// ─────────────────────────────────────────────

/**
 * GET  /teacher/courses     – list all courses owned by the teacher
 * POST /teacher/courses     – create a new course
 */
router.route('/courses')
  .get(courseController.getCourses)
  .post(courseController.createCourse);

/**
 * GET /teacher/courses/:id  – get full course detail
 * PUT /teacher/courses/:id  – update course metadata
 */
router.route('/courses/:id')
  .get(courseController.getCourse)
  .put(courseController.updateCourse);

/**
 * POST /teacher/courses/:id/modules
 * Add a new module (unit/chapter) to a course.
 */
router.post('/courses/:id/modules', courseController.addModule);

/**
 * POST /teacher/courses/:id/modules/:moduleId/lectures
 * Add a lecture (video / resource) inside a module.
 */
router.post('/courses/:id/modules/:moduleId/lectures', courseController.addLecture);

/**
 * POST /teacher/courses/:id/enroll
 * Enroll a student into the course.
 * Body: { studentId: String }
 */
router.post('/courses/:id/enroll', courseController.enrollStudent);

/**
 * POST /teacher/courses/:id/announcement
 * Publish a course-level announcement.
 */
router.post('/courses/:id/announcement', courseController.addCourseAnnouncement);

// ─────────────────────────────────────────────
// Attendance (LMS)
// ─────────────────────────────────────────────

/**
 * GET  /teacher/attendance  – retrieve attendance records for teacher's courses
 * POST /teacher/attendance  – manually mark attendance for a session
 */
router.route('/attendance')
  .get(attendanceController.getAttendance)
  .post(attendanceController.markAttendance);

/**
 * POST /teacher/attendance/qr
 * Generate a time-limited QR token for a class session.
 */
router.post('/attendance/qr', attendanceController.generateQR);

// ─────────────────────────────────────────────
// Assignments (LMS)
// ─────────────────────────────────────────────

/**
 * GET  /teacher/assignments  – list all assignments created by the teacher
 * POST /teacher/assignments  – create a new assignment
 */
router.route('/assignments')
  .get(assignmentController.getAssignments)
  .post(assignmentController.createAssignment);

/**
 * GET /teacher/assignments/:id  – get a single assignment's detail
 * PUT /teacher/assignments/:id  – update an existing assignment
 */
router.route('/assignments/:id')
  .get(assignmentController.getAssignment)
  .put(assignmentController.updateAssignment);

/**
 * GET /teacher/assignments/:id/submissions
 * List all student submissions for an assignment.
 */
router.get('/assignments/:id/submissions', assignmentController.getSubmissions);

/**
 * POST /teacher/assignments/submissions/:submissionId/grade
 * Grade a specific student submission.
 * Body: { score: Number, feedback: String }
 */
router.post('/assignments/submissions/:submissionId/grade', assignmentController.gradeSubmission);

// ─────────────────────────────────────────────
// Gradebook (LMS)
// ─────────────────────────────────────────────

/**
 * GET /teacher/gradebook/:courseId
 * Retrieve the full gradebook for a specific course.
 */
router.get('/gradebook/:courseId', gradebookController.getCourseGradebook);

/**
 * POST /teacher/gradebook
 * Create or update a grade entry (upsert).
 * Body: { studentId, courseId, component, score, ... }
 */
router.post('/gradebook', gradebookController.upsertGrade);

/**
 * POST /teacher/gradebook/finalize
 * Lock grade entries so they can no longer be edited.
 * Body: { courseId: String }
 */
router.post('/gradebook/finalize', gradebookController.finalizeGrades);

/**
 * POST /teacher/gradebook/publish
 * Publish final grades so students can view them.
 * Body: { courseId: String }
 */
router.post('/gradebook/publish', gradebookController.publishGrades);

// ─────────────────────────────────────────────
// Announcements & Notifications (LMS)
// ─────────────────────────────────────────────

/**
 * GET  /teacher/announcements  – list announcements authored by the teacher
 * POST /teacher/announcements  – broadcast a new announcement
 */
router.route('/announcements')
  .get(communicationController.getAnnouncements)
  .post(communicationController.createAnnouncement);

/**
 * GET /teacher/notifications
 * Returns all notifications for the logged-in teacher.
 */
router.get('/notifications', communicationController.getNotifications);

// ─────────────────────────────────────────────
// Analytics (LMS)
// ─────────────────────────────────────────────

/**
 * GET /teacher/analytics/course/:courseId
 * Detailed engagement and performance analytics for a specific course.
 */
router.get('/analytics/course/:courseId', analyticsController.getCourseAnalytics);

/**
 * GET /teacher/analytics/me
 * Aggregate analytics for the authenticated teacher across all their courses.
 */
router.get('/analytics/me', analyticsController.getTeacherAnalytics);

// ─────────────────────────────────────────────
// Exams – CRUD
// ─────────────────────────────────────────────

router.route('/exams')
  .get(adminController.getExams)
  .post(validate(examSchemas.create), adminController.createExam);

router.route('/exams/:id')
  .get(adminController.getExamById)
  .put(validate(examSchemas.update), adminController.updateExam);

// ─────────────────────────────────────────────
// Exams – Lifecycle / State management
// ─────────────────────────────────────────────

router.post('/exams/:id/publish', examLifecycleController.publishExam);
router.post('/exams/:id/activate', examLifecycleController.activateExam);
router.post('/exams/:id/complete', examLifecycleController.completeExam);
router.post('/exams/:id/lock', examLifecycleController.lockExam);
router.get('/exams/:id/status', examLifecycleController.getExamStatus);

// ─────────────────────────────────────────────
// Exams – Batch management
// ─────────────────────────────────────────────

router.post('/exams/:examId/batches/generate', batchController.generateBatches);
router.get('/exams/:examId/batches', batchController.getExamBatches);
router.get('/batches/:batchId', batchController.getBatchDetails);
router.post('/batches/:batchId/start', batchController.startBatch);
router.post('/batches/:batchId/complete', batchController.completeBatch);

// ─────────────────────────────────────────────
// Exams – Live monitoring
// ─────────────────────────────────────────────

router.get('/monitor/sessions', batchController.getMonitorSessions);
router.get('/monitor/active-exams', batchController.getActiveExams);
router.post('/monitor/sessions/:sessionId/force-submit', batchController.forceSubmitSession);
router.post('/monitor/sessions/:sessionId/terminate', batchController.terminateSession);

// ─────────────────────────────────────────────
// Exams – Results & Analytics
// ─────────────────────────────────────────────

router.get('/exams/:id/submissions', adminController.getExamSubmissions);
router.get('/exams/:id/analytics', adminController.getExamAnalytics);
router.get('/exams/:id/results', examLifecycleController.getExamResults);
router.get('/exams/:id/results/export', examLifecycleController.exportResults);
router.get('/exams/:id/export', adminController.exportExamResults);

// Individual submission detail
router.get('/submissions/:submissionId', adminController.getSubmissionById);

// ─────────────────────────────────────────────
// Violations
// ─────────────────────────────────────────────

router.get('/exams/:examId/violations', violationController.getExamViolations);
router.get('/exams/:examId/violations/export', violationController.exportExamViolations);
router.get('/students/:studentId/violations', violationController.getStudentViolations);

// ─────────────────────────────────────────────
// Questions
// ─────────────────────────────────────────────

router.route('/exams/:examId/questions')
  .get(questionController.getQuestions)
  .post(validate(questionSchemas.create), questionController.createQuestion);

router.post(
  '/exams/:examId/questions/bulk',
  validate(questionSchemas.bulkCreate),
  questionController.bulkCreateQuestions
);

router.put('/exams/:examId/questions/reorder', questionController.reorderQuestions);

router.route('/questions/:id')
  .get(questionController.getQuestionById)
  .put(validate(questionSchemas.update), questionController.updateQuestion)
  .delete(questionController.deleteQuestion);

// Global question bank listing
router.get('/questions', questionController.getAllQuestions);

// Question generation (AI / template-based)
router.post('/exams/:examId/questions/generate', questionController.generateQuestions);

// ─────────────────────────────────────────────
// Users & Categories
// ─────────────────────────────────────────────

// Student listing (exam enrollment)
router.get('/users', adminController.getUsers);

// Subjects and question categories
router.get('/subjects', categoryController.getSubjects);

router.route('/categories')
  .get(categoryController.getCategories)
  .post(categoryController.createCategory);

router.route('/categories/:id')
  .get(categoryController.getCategoryById)
  .put(categoryController.updateCategory)
  .delete(categoryController.deleteCategory);

router.get('/categories/:id/questions', categoryController.getCategoryQuestions);

export default router;
