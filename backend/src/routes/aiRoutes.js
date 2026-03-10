import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  generateQuiz, generateAssignment, summarizeLecture,
  predictStudentPerformance, getRecommendations, evaluateCode
} from '../controllers/aiController.js';

const router = express.Router();
router.use(authenticate);

// AI Teacher Tools
router.post('/generate-quiz', authorize('admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant'), generateQuiz);
router.post('/generate-assignment', authorize('admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant'), generateAssignment);

// AI Study Tools
router.post('/summarize', summarizeLecture);
router.get('/recommendations', getRecommendations);
router.post('/evaluate-code', evaluateCode);

// AI Analytics
router.get('/predict', authorize('admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant'), predictStudentPerformance);

export default router;
