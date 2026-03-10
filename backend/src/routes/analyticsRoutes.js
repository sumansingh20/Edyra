import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getDashboardStats, getCourseAnalytics, getStudentAnalytics,
  getInstitutionAnalytics, getTeacherAnalytics
} from '../controllers/analyticsController.js';

const router = express.Router();
router.use(authenticate);

router.get('/dashboard', authorize('admin', 'super-admin', 'institute-admin', 'teacher'), getDashboardStats);
router.get('/course/:courseId', authorize('admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant'), getCourseAnalytics);
router.get('/student', getStudentAnalytics);
router.get('/student/:studentId', authorize('admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant', 'parent'), getStudentAnalytics);
router.get('/institution', authorize('admin', 'super-admin', 'institute-admin'), getInstitutionAnalytics);
router.get('/teacher', authorize('admin', 'super-admin', 'institute-admin', 'teacher'), getTeacherAnalytics);
router.get('/teacher/:teacherId', authorize('admin', 'super-admin', 'institute-admin'), getTeacherAnalytics);

export default router;
