import express from 'express';
import { authenticate, authorize, validateSession } from '../middleware/auth.js';
import studentController from '../controllers/studentController.js';
import assignmentController from '../controllers/assignmentController.js';
import attendanceController from '../controllers/attendanceController.js';
import gradebookController from '../controllers/gradebookController.js';
import communicationController from '../controllers/communicationController.js';
import { getMe } from '../controllers/authController.js';
import violationController from '../controllers/violationController.js';
import batchController from '../controllers/batchController.js';
import { validate, answerSchemas, violationSchemas } from '../middleware/validation.js';
import { examRateLimiter } from '../middleware/security.js';

const router = express.Router();

// Apply authentication and student authorization to all routes
router.use(authenticate, validateSession, authorize('student'));

// ─────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────

/**
 * GET /student/profile
 * Returns the authenticated student's profile (same as authController.getMe).
 */
router.get('/profile', getMe);

// ─────────────────────────────────────────────
// Server / Utility
// ─────────────────────────────────────────────

router.get('/server-time', batchController.getServerTime);

// ─────────────────────────────────────────────
// Dashboard & Courses
// ─────────────────────────────────────────────

/**
 * GET /student/dashboard
 * Returns aggregated dashboard data for the logged-in student.
 */
router.get('/dashboard', studentController.getDashboardData);

/**
 * GET /student/courses
 * Returns the list of courses the student is enrolled in.
 */
router.get('/courses', studentController.getStudentCourses);

// ─────────────────────────────────────────────
// Assignments
// ─────────────────────────────────────────────

/**
 * GET /student/assignments
 * Returns all assignments visible to the logged-in student.
 */
router.get('/assignments', assignmentController.getAssignments);

/**
 * GET /student/assignments/:id
 * Returns the detail of a single assignment.
 */
router.get('/assignments/:id', assignmentController.getAssignment);

/**
 * POST /student/assignments/:id/submit
 * Submits a student's work for an assignment.
 */
router.post('/assignments/:id/submit', assignmentController.submitAssignment);

// ─────────────────────────────────────────────
// Attendance
// ─────────────────────────────────────────────

/**
 * GET /student/attendance
 * Returns the student's attendance summary across all enrolled courses.
 */
router.get('/attendance', attendanceController.getStudentAttendanceSummary);

/**
 * POST /student/attendance/qr
 * Marks attendance for the student using a scanned QR code.
 * Body: { qrToken: String }
 */
router.post('/attendance/qr', attendanceController.markViaQR);

// ─────────────────────────────────────────────
// Grades & Transcript
// ─────────────────────────────────────────────

/**
 * GET /student/grades
 * Returns all grade entries for the logged-in student.
 */
router.get('/grades', gradebookController.getStudentGrades);

/**
 * GET /student/transcript
 * Returns the official academic transcript for the student.
 */
router.get('/transcript', gradebookController.getTranscript);

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────

/**
 * GET /student/notifications
 * Returns all notifications for the logged-in student.
 */
router.get('/notifications', communicationController.getNotifications);

/**
 * POST /student/notifications/read-all
 * Marks every unread notification as read for the logged-in student.
 * NOTE: must be declared before /:id/read to avoid route shadowing.
 */
router.post('/notifications/read-all', communicationController.markAllNotificationsRead);

/**
 * POST /student/notifications/:id/read
 * Marks a single notification as read.
 */
router.post('/notifications/:id/read', communicationController.markNotificationRead);

// ─────────────────────────────────────────────
// Announcements
// ─────────────────────────────────────────────

/**
 * GET /student/announcements
 * Returns announcements relevant to the student's courses / institution.
 */
router.get('/announcements', communicationController.getAnnouncements);

// ─────────────────────────────────────────────
// Exam – Batch status
// ─────────────────────────────────────────────

router.get('/batch-status/:examId', batchController.checkStudentBatchStatus);

// ─────────────────────────────────────────────
// Exam – Available exams
// ─────────────────────────────────────────────

router.get('/exams', studentController.getAvailableExams);
router.get('/exams/:id', studentController.getExamDetails);
router.post('/exams/:id/start', studentController.startExam);

// ─────────────────────────────────────────────
// Exam – Submissions
// ─────────────────────────────────────────────

router.get('/submissions/:id', studentController.getSubmissionStatus);

router.post(
  '/submissions/:id/answer',
  examRateLimiter,
  validate(answerSchemas.saveAnswer),
  studentController.saveAnswer
);

router.post(
  '/submissions/:id/answers',
  examRateLimiter,
  validate(answerSchemas.bulkSave),
  studentController.bulkSaveAnswers
);

router.post('/submissions/:id/visit', examRateLimiter, studentController.visitQuestion);
router.post('/submissions/:id/submit', studentController.submitExam);
router.get('/submissions/:id/review', studentController.getExamReview);

// ─────────────────────────────────────────────
// Exam – Violations
// ─────────────────────────────────────────────

router.post(
  '/submissions/:id/violation',
  examRateLimiter,
  validate(violationSchemas.report),
  violationController.reportViolation
);

router.get('/submissions/:id/violations', violationController.getViolations);

// ─────────────────────────────────────────────
// Exam – Results
// ─────────────────────────────────────────────

router.get('/results', studentController.getStudentResults);
router.get('/results/:resultId', studentController.getResultDetails);

export default router;
