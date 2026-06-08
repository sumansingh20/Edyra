import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getStudentGrades, getGradeDetails, upsertGrade, addGradeComponent,
  finalizeGrades, publishGrades, getCourseGradebook, getTranscript
} from '../controllers/gradebookController.js';

const router = express.Router();
router.use(authenticate);

router.get('/my', getStudentGrades);
router.get('/transcript', getTranscript);
router.get('/transcript/:studentId', authorize('admin', 'super-admin', 'institute-admin', 'teacher'), getTranscript);
router.get('/course/:courseId', authorize('admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant'), getCourseGradebook);
router.get('/:id', getGradeDetails);
router.post('/', authorize('admin', 'super-admin', 'institute-admin', 'teacher'), upsertGrade);
router.post('/:id/component', authorize('admin', 'super-admin', 'institute-admin', 'teacher'), addGradeComponent);
router.post('/finalize', authorize('admin', 'super-admin', 'institute-admin', 'teacher'), finalizeGrades);
router.post('/publish', authorize('admin', 'super-admin', 'institute-admin'), publishGrades);

export default router;
