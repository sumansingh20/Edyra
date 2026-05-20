import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  uploadProfileImage,
  uploadCourseImage,
  uploadAssignment,
  uploadResource,
  uploadVideo,
  getFileUrl,
  handleMulterError,
} from '../utils/storage.js';
import AppError from '../utils/AppError.js';

const router = express.Router();

/* ========== PROFILE IMAGE UPLOAD ========== */
// POST /api/upload/profile-image
// Any authenticated user can upload their own avatar
router.post('/profile-image', authenticate, (req, res, next) => {
  uploadProfileImage(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);

    if (!req.file) {
      return next(new AppError('No image file provided', 400));
    }

    const url = getFileUrl(req.file.path, 'avatars');

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        url,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  });
});

/* ========== COURSE THUMBNAIL UPLOAD ========== */
// POST /api/upload/course-thumbnail
// Teacher / Admin only
router.post(
  '/course-thumbnail',
  authenticate,
  authorize('admin', 'super-admin', 'organization-admin', 'campus-admin', 'teacher'),
  (req, res, next) => {
    uploadCourseImage(req, res, (err) => {
      if (err) return handleMulterError(err, req, res, next);
      if (!req.file) return next(new AppError('No image file provided', 400));

      const url = getFileUrl(req.file.path, 'courses');
      res.json({
        success: true,
        message: 'Course thumbnail uploaded successfully',
        data: { url, filename: req.file.filename, size: req.file.size },
      });
    });
  }
);

/* ========== ASSIGNMENT SUBMISSION UPLOAD ========== */
// POST /api/upload/assignment
// Students upload their assignment files
router.post(
  '/assignment',
  authenticate,
  authorize('student'),
  (req, res, next) => {
    uploadAssignment(req, res, (err) => {
      if (err) return handleMulterError(err, req, res, next);
      if (!req.files || req.files.length === 0) return next(new AppError('No files provided', 400));

      const files = req.files.map(file => ({
        url: getFileUrl(file.path, 'assignments'),
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      }));

      res.json({
        success: true,
        message: `${files.length} file(s) uploaded successfully`,
        data: { files },
      });
    });
  }
);

/* ========== COURSE RESOURCE UPLOAD ========== */
// POST /api/upload/resource
// Teacher / Admin uploads PDF, docs for course modules
router.post(
  '/resource',
  authenticate,
  authorize('admin', 'super-admin', 'organization-admin', 'campus-admin', 'teacher', 'content-creator'),
  (req, res, next) => {
    uploadResource(req, res, (err) => {
      if (err) return handleMulterError(err, req, res, next);
      if (!req.file) return next(new AppError('No file provided', 400));

      const url = getFileUrl(req.file.path, 'resources');
      res.json({
        success: true,
        message: 'Resource uploaded successfully',
        data: {
          url,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    });
  }
);

/* ========== VIDEO UPLOAD ========== */
// POST /api/upload/video
// Teacher / Admin uploads lesson videos
router.post(
  '/video',
  authenticate,
  authorize('admin', 'super-admin', 'organization-admin', 'campus-admin', 'teacher', 'content-creator'),
  (req, res, next) => {
    uploadVideo(req, res, (err) => {
      if (err) return handleMulterError(err, req, res, next);
      if (!req.file) return next(new AppError('No video file provided', 400));

      const url = getFileUrl(req.file.path, 'videos');
      res.json({
        success: true,
        message: 'Video uploaded successfully',
        data: {
          url,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          duration: null, // Can be extracted with ffprobe if needed
        },
      });
    });
  }
);

export default router;
