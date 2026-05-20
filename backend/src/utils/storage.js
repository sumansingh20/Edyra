import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import AppError from './AppError.js';

/* ========== STORAGE CONFIG ========== */

// Allowed MIME types per category
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5MB
const MAX_DOC_SIZE   = 20 * 1024 * 1024;  // 20MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB

/* ========== LOCAL DISK STORAGE ========== */
const getUploadDir = (category = 'general') => {
  const base = process.env.UPLOAD_DIR || './uploads';
  const dir = path.join(base, category);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const diskStorage = (category) => multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getUploadDir(category));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(12).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

/* ========== FILE FILTERS ========== */
const imageFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`, 400), false);
  }
};

const documentFilter = (req, file, cb) => {
  if ([...ALLOWED_DOC_TYPES, ...ALLOWED_IMAGE_TYPES].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid file type for document upload.`, 400), false);
  }
};

const videoFilter = (req, file, cb) => {
  if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid video format. Allowed: mp4, webm, ogg, mov`, 400), false);
  }
};

/* ========== MULTER INSTANCES ========== */

// Profile images
export const uploadProfileImage = multer({
  storage: diskStorage('avatars'),
  fileFilter: imageFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
}).single('avatar');

// Course thumbnail / resource images
export const uploadCourseImage = multer({
  storage: diskStorage('courses'),
  fileFilter: imageFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
}).single('thumbnail');

// Assignment submissions (docs + images)
export const uploadAssignment = multer({
  storage: diskStorage('assignments'),
  fileFilter: documentFilter,
  limits: { fileSize: MAX_DOC_SIZE },
}).array('files', 5);

// Course resources (PDF, docs)
export const uploadResource = multer({
  storage: diskStorage('resources'),
  fileFilter: documentFilter,
  limits: { fileSize: MAX_DOC_SIZE },
}).single('file');

// Video uploads (lessons)
export const uploadVideo = multer({
  storage: diskStorage('videos'),
  fileFilter: videoFilter,
  limits: { fileSize: MAX_VIDEO_SIZE },
}).single('video');

/* ========== URL HELPER ========== */
/**
 * Generates public URL for uploaded file.
 * In production, prepend CDN/S3 URL.
 */
export const getFileUrl = (filePath, category = '') => {
  if (!filePath) return null;
  const cdnUrl = process.env.CDN_URL;
  const filename = path.basename(filePath);
  if (cdnUrl) {
    return `${cdnUrl}/${category ? category + '/' : ''}${filename}`;
  }
  // Local dev: return relative path
  const apiBase = process.env.BACKEND_URL || 'http://localhost:5000';
  return `${apiBase}/uploads/${category ? category + '/' : ''}${filename}`;
};

/* ========== MULTER ERROR HANDLER ========== */
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'File too large. Check the size limit for this upload type.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, error: 'Too many files. Maximum 5 files allowed.' });
    }
    return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }
  next(err);
};

/* ========== STATIC FILE SERVING HELPER ========== */
/**
 * Use this in app.js:
 * app.use('/uploads', express.static(getUploadDir('')));
 */
export const getUploadsBaseDir = () => {
  return process.env.UPLOAD_DIR || './uploads';
};

export default {
  uploadProfileImage,
  uploadCourseImage,
  uploadAssignment,
  uploadResource,
  uploadVideo,
  getFileUrl,
  handleMulterError,
  getUploadsBaseDir,
};
