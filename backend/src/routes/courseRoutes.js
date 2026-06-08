import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getCourses, getCourse, createCourse, updateCourse, deleteCourse,
  enrollStudent, unenrollStudent, addModule, updateModule, deleteModule,
  addLecture, markLectureComplete, getCourseProgress, addCourseAnnouncement
} from '../controllers/courseController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Course CRUD
router.get('/', getCourses);
router.get('/:id', getCourse);
router.post('/', authorize('admin', 'super-admin', 'institute-admin', 'teacher'), createCourse);
router.put('/:id', authorize('admin', 'super-admin', 'institute-admin', 'teacher'), updateCourse);
router.delete('/:id', authorize('admin', 'super-admin', 'institute-admin'), deleteCourse);

// Enrollment
router.post('/:id/enroll', enrollStudent);
router.post('/:id/unenroll', unenrollStudent);

// Modules
router.post('/:id/modules', authorize('admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant'), addModule);
router.put('/:id/modules/:moduleId', authorize('admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant'), updateModule);
router.delete('/:id/modules/:moduleId', authorize('admin', 'super-admin', 'institute-admin', 'teacher'), deleteModule);

// Lectures
router.post('/:id/modules/:moduleId/lectures', authorize('admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant'), addLecture);
router.post('/:id/modules/:moduleId/lectures/:lectureId/complete', markLectureComplete);

// Progress
router.get('/:id/progress', getCourseProgress);
router.get('/:id/progress/:studentId', authorize('admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant'), getCourseProgress);

// Announcements
router.post('/:id/announcements', authorize('admin', 'super-admin', 'institute-admin', 'teacher', 'teaching-assistant'), addCourseAnnouncement);

export default router;
