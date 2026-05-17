import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  issueCertificate,
  bulkIssueCertificates,
  getMyCertificates,
  getAllCertificates,
  getCertificate,
  verifyCertificate,
  revokeCertificate,
  generateCertificatePDF,
} from '../controllers/certificateController.js';

const router = express.Router();

// Public verification endpoint (no auth required)
router.get('/verify/:hash', verifyCertificate);

// Authenticated routes
router.use(authenticate);

// Student: view own certificates
router.get('/my', getMyCertificates);

// Single certificate
router.get('/:id', getCertificate);

// Generate/download certificate HTML (for PDF conversion client-side)
router.get('/:id/pdf', generateCertificatePDF);

// Admin/Teacher: manage certificates
router.get('/', authorize('admin', 'super-admin', 'institute-admin', 'teacher'), getAllCertificates);
router.post('/', authorize('admin', 'super-admin', 'institute-admin', 'teacher'), issueCertificate);
router.post('/bulk', authorize('admin', 'super-admin', 'institute-admin'), bulkIssueCertificates);
router.patch('/:id/revoke', authorize('admin', 'super-admin', 'institute-admin'), revokeCertificate);

export default router;
