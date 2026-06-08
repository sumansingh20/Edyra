import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAttendance, markAttendance, generateQR, markViaQR, markViaGPS, getStudentAttendanceSummary
} from '../controllers/attendanceController.js';

const router = express.Router();
router.use(authenticate);

router.get('/', getAttendance);
router.post('/mark', authorize('admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant'), markAttendance);
router.post('/qr/generate', authorize('admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant'), generateQR);
router.post('/qr/mark', authorize('student'), markViaQR);
router.post('/gps/mark', authorize('student'), markViaGPS);
router.get('/summary', getStudentAttendanceSummary);
router.get('/summary/:studentId', authorize('admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant', 'parent'), getStudentAttendanceSummary);

export default router;
