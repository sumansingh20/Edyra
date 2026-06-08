import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAdmissions, getAdmission, createAdmission, updateAdmissionStatus,
  getFees, createFee, recordPayment,
  getTimetables, createTimetable, updateTimetable,
  getBooks, addBook, issueBook, returnBook,
  getHostelRooms, createHostelRoom, allocateRoom, vacateRoom,
  getRoutes, createRoute, updateRoute, assignStudentToRoute
} from '../controllers/erpController.js';

const router = express.Router();
router.use(authenticate);

// Admissions
router.get('/admissions', authorize('admin', 'super-admin', 'institute-admin'), getAdmissions);
router.get('/admissions/:id', authorize('admin', 'super-admin', 'institute-admin'), getAdmission);
router.post('/admissions', createAdmission);
router.put('/admissions/:id/status', authorize('admin', 'super-admin', 'institute-admin'), updateAdmissionStatus);

// Fees
router.get('/fees', getFees);
router.post('/fees', authorize('admin', 'super-admin', 'institute-admin'), createFee);
router.post('/fees/:id/payment', authorize('admin', 'super-admin', 'institute-admin'), recordPayment);

// Timetable
router.get('/timetable', getTimetables);
router.post('/timetable', authorize('admin', 'super-admin', 'institute-admin', 'teacher'), createTimetable);
router.put('/timetable/:id', authorize('admin', 'super-admin', 'institute-admin', 'teacher'), updateTimetable);

// Library
router.get('/library', getBooks);
router.post('/library', authorize('admin', 'super-admin', 'institute-admin'), addBook);
router.post('/library/:id/issue', authorize('admin', 'super-admin', 'institute-admin'), issueBook);
router.post('/library/:id/return', authorize('admin', 'super-admin', 'institute-admin'), returnBook);

// Hostel
router.get('/hostel', getHostelRooms);
router.post('/hostel', authorize('admin', 'super-admin', 'institute-admin'), createHostelRoom);
router.post('/hostel/:id/allocate', authorize('admin', 'super-admin', 'institute-admin'), allocateRoom);
router.post('/hostel/:id/vacate', authorize('admin', 'super-admin', 'institute-admin'), vacateRoom);

// Transport
router.get('/transport', getRoutes);
router.post('/transport', authorize('admin', 'super-admin', 'institute-admin'), createRoute);
router.put('/transport/:id', authorize('admin', 'super-admin', 'institute-admin'), updateRoute);
router.post('/transport/:id/assign', authorize('admin', 'super-admin', 'institute-admin'), assignStudentToRoute);

export default router;
