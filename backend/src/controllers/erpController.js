import { Admission, Fee, Timetable, LibraryBook, HostelRoom, TransportRoute, User } from '../models/index.js';
import AppError from '../utils/AppError.js';

// ===== ADMISSIONS =====
export const getAdmissions = async (req, res, next) => {
  try {
    const { status, department, academicYear, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (department) filter['appliedFor.department'] = department;
    if (academicYear) filter.academicYear = academicYear;
    if (search) {
      filter.$or = [
        { applicantName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { applicationNumber: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const admissions = await Admission.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    const total = await Admission.countDocuments(filter);
    res.json({ success: true, data: { admissions, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { next(error); }
};

export const getAdmission = async (req, res, next) => {
  try {
    const admission = await Admission.findById(req.params.id).populate('reviewedBy', 'firstName lastName').populate('enrolledAs', 'firstName lastName email studentId');
    if (!admission) throw new AppError('Admission not found', 404);
    res.json({ success: true, data: { admission } });
  } catch (error) { next(error); }
};

export const createAdmission = async (req, res, next) => {
  try {
    const admission = await Admission.create(req.body);
    res.status(201).json({ success: true, data: { admission } });
  } catch (error) { next(error); }
};

export const updateAdmissionStatus = async (req, res, next) => {
  try {
    const admission = await Admission.findById(req.params.id);
    if (!admission) throw new AppError('Admission not found', 404);
    admission.status = req.body.status;
    if (req.body.remarks) admission.remarks.push({ text: req.body.remarks, by: req.user._id });
    admission.reviewedBy = req.user._id;
    await admission.save();
    res.json({ success: true, data: { admission } });
  } catch (error) { next(error); }
};

// ===== FEES =====
export const getFees = async (req, res, next) => {
  try {
    const { studentId, status, feeType, academicYear, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (studentId) filter.student = studentId;
    else if (req.user.role === 'student') filter.student = req.user._id;
    if (status) filter.status = status;
    if (feeType) filter.feeType = feeType;
    if (academicYear) filter.academicYear = academicYear;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const fees = await Fee.find(filter).populate('student', 'firstName lastName studentId email').sort({ dueDate: -1 }).skip(skip).limit(parseInt(limit));
    const total = await Fee.countDocuments(filter);
    const totalAmount = await Fee.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: '$amount' }, paid: { $sum: '$paidAmount' }, balance: { $sum: '$balanceAmount' } } }]);
    res.json({ success: true, data: { fees, total, summary: totalAmount[0] || { total: 0, paid: 0, balance: 0 } } });
  } catch (error) { next(error); }
};

export const createFee = async (req, res, next) => {
  try {
    const feeData = { ...req.body, createdBy: req.user._id };
    const fee = await Fee.create(feeData);
    res.status(201).json({ success: true, data: { fee } });
  } catch (error) { next(error); }
};

export const recordPayment = async (req, res, next) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) throw new AppError('Fee record not found', 404);
    fee.payments.push({ ...req.body, receivedBy: req.user._id });
    fee.paidAmount += req.body.amount;
    await fee.save();
    res.json({ success: true, data: { fee } });
  } catch (error) { next(error); }
};

// ===== TIMETABLE =====
export const getTimetables = async (req, res, next) => {
  try {
    const { department, semester, academicYear } = req.query;
    const filter = { isActive: true };
    if (department) filter.department = department;
    if (semester) filter.semester = parseInt(semester);
    if (academicYear) filter.academicYear = academicYear;
    const timetables = await Timetable.find(filter).populate('slots.course', 'title code').populate('slots.instructor', 'firstName lastName').populate('createdBy', 'firstName lastName');
    res.json({ success: true, data: { timetables } });
  } catch (error) { next(error); }
};

export const createTimetable = async (req, res, next) => {
  try {
    const timetableData = { ...req.body, createdBy: req.user._id };
    const timetable = await Timetable.create(timetableData);
    res.status(201).json({ success: true, data: { timetable } });
  } catch (error) { next(error); }
};

export const updateTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!timetable) throw new AppError('Timetable not found', 404);
    res.json({ success: true, data: { timetable } });
  } catch (error) { next(error); }
};

// ===== LIBRARY =====
export const getBooks = async (req, res, next) => {
  try {
    const { search, category, department, available, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (department) filter.department = department;
    if (available === 'true') filter.availableCopies = { $gt: 0 };
    if (search) filter.$text = { $search: search };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const books = await LibraryBook.find(filter).sort({ title: 1 }).skip(skip).limit(parseInt(limit));
    const total = await LibraryBook.countDocuments(filter);
    res.json({ success: true, data: { books, total } });
  } catch (error) { next(error); }
};

export const addBook = async (req, res, next) => {
  try {
    const book = await LibraryBook.create(req.body);
    res.status(201).json({ success: true, data: { book } });
  } catch (error) { next(error); }
};

export const issueBook = async (req, res, next) => {
  try {
    const book = await LibraryBook.findById(req.params.id);
    if (!book) throw new AppError('Book not found', 404);
    if (book.availableCopies <= 0) throw new AppError('No copies available', 400);
    book.issuedTo.push({ user: req.body.userId, dueDate: req.body.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) });
    book.availableCopies--;
    await book.save();
    res.json({ success: true, data: { book } });
  } catch (error) { next(error); }
};

export const returnBook = async (req, res, next) => {
  try {
    const book = await LibraryBook.findById(req.params.id);
    if (!book) throw new AppError('Book not found', 404);
    const issue = book.issuedTo.find(i => i.user.toString() === req.body.userId && i.status === 'issued');
    if (!issue) throw new AppError('No active issue found', 400);
    issue.returnedAt = new Date();
    issue.status = 'returned';
    if (issue.returnedAt > issue.dueDate) {
      const overdueDays = Math.ceil((issue.returnedAt - issue.dueDate) / (1000 * 60 * 60 * 24));
      issue.fine = overdueDays * 5; // 5 per day
    }
    book.availableCopies++;
    await book.save();
    res.json({ success: true, data: { book, fine: issue.fine } });
  } catch (error) { next(error); }
};

// ===== HOSTEL =====
export const getHostelRooms = async (req, res, next) => {
  try {
    const { hostelName, status, type, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (hostelName) filter.hostelName = hostelName;
    if (status) filter.status = status;
    if (type) filter.type = type;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const rooms = await HostelRoom.find(filter).populate('occupants.student', 'firstName lastName studentId').populate('warden', 'firstName lastName').sort({ hostelName: 1, roomNumber: 1 }).skip(skip).limit(parseInt(limit));
    const total = await HostelRoom.countDocuments(filter);
    res.json({ success: true, data: { rooms, total } });
  } catch (error) { next(error); }
};

export const createHostelRoom = async (req, res, next) => {
  try {
    const room = await HostelRoom.create(req.body);
    res.status(201).json({ success: true, data: { room } });
  } catch (error) { next(error); }
};

export const allocateRoom = async (req, res, next) => {
  try {
    const room = await HostelRoom.findById(req.params.id);
    if (!room) throw new AppError('Room not found', 404);
    const activeOccupants = room.occupants.filter(o => o.status === 'active');
    if (activeOccupants.length >= room.capacity) throw new AppError('Room is full', 400);
    room.occupants.push({ student: req.body.studentId });
    if (activeOccupants.length + 1 >= room.capacity) room.status = 'occupied';
    await room.save();
    res.json({ success: true, data: { room } });
  } catch (error) { next(error); }
};

export const vacateRoom = async (req, res, next) => {
  try {
    const room = await HostelRoom.findById(req.params.id);
    if (!room) throw new AppError('Room not found', 404);
    const occupant = room.occupants.find(o => o.student.toString() === req.body.studentId && o.status === 'active');
    if (!occupant) throw new AppError('Student not in this room', 400);
    occupant.status = 'vacated';
    occupant.vacatedAt = new Date();
    room.status = 'available';
    await room.save();
    res.json({ success: true, data: { room } });
  } catch (error) { next(error); }
};

// ===== TRANSPORT =====
export const getRoutes = async (req, res, next) => {
  try {
    const { active } = req.query;
    const filter = {};
    if (active === 'true') filter.isActive = true;
    const routes = await TransportRoute.find(filter).populate('assignedStudents', 'firstName lastName studentId').sort({ routeNumber: 1 });
    res.json({ success: true, data: { routes } });
  } catch (error) { next(error); }
};

export const createRoute = async (req, res, next) => {
  try {
    const route = await TransportRoute.create(req.body);
    res.status(201).json({ success: true, data: { route } });
  } catch (error) { next(error); }
};

export const updateRoute = async (req, res, next) => {
  try {
    const route = await TransportRoute.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!route) throw new AppError('Route not found', 404);
    res.json({ success: true, data: { route } });
  } catch (error) { next(error); }
};

export const assignStudentToRoute = async (req, res, next) => {
  try {
    const route = await TransportRoute.findById(req.params.id);
    if (!route) throw new AppError('Route not found', 404);
    if (route.assignedStudents.length >= route.capacity) throw new AppError('Route is full', 400);
    if (!route.assignedStudents.includes(req.body.studentId)) {
      route.assignedStudents.push(req.body.studentId);
      await route.save();
    }
    res.json({ success: true, data: { route } });
  } catch (error) { next(error); }
};

export default {
  getAdmissions, getAdmission, createAdmission, updateAdmissionStatus,
  getFees, createFee, recordPayment,
  getTimetables, createTimetable, updateTimetable,
  getBooks, addBook, issueBook, returnBook,
  getHostelRooms, createHostelRoom, allocateRoom, vacateRoom,
  getRoutes, createRoute, updateRoute, assignStudentToRoute
};
