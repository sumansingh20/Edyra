import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getDashboardStats, getCourseAnalytics, getStudentAnalytics,
  getInstitutionAnalytics, getTeacherAnalytics, getOverview
} from '../controllers/analyticsController.js';

const router = express.Router();
router.use(authenticate);

const ADMIN = ['admin', 'super-admin', 'organization-admin', 'campus-admin'];
const STAFF = [...ADMIN, 'teacher', 'assistant-teacher', 'invigilator'];

router.get('/overview', authorize(...ADMIN), getOverview);
router.get('/dashboard', authorize(...STAFF), getDashboardStats);
router.get('/course/:courseId', authorize(...STAFF), getCourseAnalytics);
router.get('/student', getStudentAnalytics);
router.get('/student/:studentId', authorize(...STAFF, 'parent'), getStudentAnalytics);
router.get('/institution', authorize(...ADMIN), getInstitutionAnalytics);
router.get('/teacher', authorize(...STAFF), getTeacherAnalytics);
router.get('/teacher/:teacherId', authorize(...ADMIN), getTeacherAnalytics);

export default router;
