import express from 'express';
import authRoutes from './authRoutes.js';
import adminRoutes from './adminRoutes.js';
import teacherRoutes from './teacherRoutes.js';
import studentRoutes from './studentRoutes.js';
import examSessionRoutes from './examSessionRoutes.js';

// EDYRA LMS Routes
import courseRoutes from './courseRoutes.js';
import assignmentRoutes from './assignmentRoutes.js';
import gradebookRoutes from './gradebookRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import communicationRoutes from './communicationRoutes.js';
import aiRoutes from './aiRoutes.js';
import erpRoutes from './erpRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'EDYRA Academic LMS API is running',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ===== Secure Exam Portal Routes =====
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/teacher', teacherRoutes);
router.use('/student', studentRoutes);
router.use('/exam-engine', examSessionRoutes);

// ===== EDYRA LMS Routes =====
router.use('/courses', courseRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/gradebook', gradebookRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/communication', communicationRoutes);
router.use('/ai', aiRoutes);
router.use('/erp', erpRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
