import express from 'express';
import * as departmentController from '../controllers/departmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All department routes require authentication
router.use(authenticate);

// ── Read routes (any authenticated role) ────────────────────────────────────

// GET /api/departments               – list all departments with counts
router.get('/', departmentController.getDepartments);

// GET /api/departments/programs      – list every program across all depts
// NOTE: must be declared BEFORE /:id so Express doesn't treat "programs" as an id
router.get('/programs', departmentController.getPrograms);

// GET /api/departments/:id           – single department with student & faculty lists
router.get('/:id', departmentController.getDepartment);

// GET /api/departments/:id/students  – paginated student list for a department
router.get('/:id/students', departmentController.getStudentsByDepartment);

// GET /api/departments/:id/faculty   – paginated faculty list for a department
router.get('/:id/faculty', departmentController.getFacultyByDepartment);

// ── Write routes (admin / super-admin only) ──────────────────────────────────

// POST /api/departments
router.post('/', authorize('admin', 'super-admin'), departmentController.createDepartment);

// PUT /api/departments/:id
router.put('/:id', authorize('admin', 'super-admin'), departmentController.updateDepartment);

// DELETE /api/departments/:id
router.delete('/:id', authorize('admin', 'super-admin'), departmentController.deleteDepartment);

export default router;
