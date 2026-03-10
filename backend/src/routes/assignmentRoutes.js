import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAssignments, getAssignment, createAssignment, updateAssignment, deleteAssignment,
  submitAssignment, getSubmissions, gradeSubmission, requestResubmission
} from '../controllers/assignmentController.js';

const router = express.Router();
router.use(authenticate);

router.get('/', getAssignments);
router.get('/:id', getAssignment);
router.post('/', authorize('admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant'), createAssignment);
router.put('/:id', authorize('admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant'), updateAssignment);
router.delete('/:id', authorize('admin', 'super-admin', 'institute-admin', 'teacher'), deleteAssignment);

// Student submissions
router.post('/:id/submit', authorize('student'), submitAssignment);

// Teacher: view submissions and grade
router.get('/:id/submissions', authorize('admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant'), getSubmissions);
router.put('/submissions/:submissionId/grade', authorize('admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant', 'external-evaluator'), gradeSubmission);
router.post('/submissions/:submissionId/resubmit', authorize('admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant'), requestResubmission);

export default router;
