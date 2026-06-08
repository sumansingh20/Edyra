import Semester from '../models/Semester.js';
import AuditLog from '../models/AuditLog.js';
import AppError from '../utils/AppError.js';

// GET /api/admin/semesters
export const getSemesters = async (req, res, next) => {
  try {
    const semesters = await Semester.find({ deletedAt: null })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { semesters, total: semesters.length } });
  } catch (error) { next(error); }
};

// POST /api/admin/semesters
export const createSemester = async (req, res, next) => {
  try {
    const { name, code, academicYear, startDate, endDate, enrollmentStart, enrollmentEnd, status } = req.body;

    if (!name || !code || !academicYear) {
      throw new AppError('name, code, and academicYear are required', 400);
    }

    const existing = await Semester.findOne({ code: code.toUpperCase() });
    if (existing) throw new AppError('A semester with this code already exists', 409);

    const semester = await Semester.create({
      name, code, academicYear, startDate, endDate, enrollmentStart, enrollmentEnd,
      status: status || 'upcoming',
      createdBy: req.user._id,
    });

    await AuditLog.log({
      user: req.user._id, userEmail: req.user.email, userRole: req.user.role,
      action: 'semester-create', targetType: 'semester', targetId: semester._id,
      ipAddress: req.ip, status: 'success',
    });

    res.status(201).json({ success: true, data: { semester } });
  } catch (error) { next(error); }
};

// PUT /api/admin/semesters/:id
export const updateSemester = async (req, res, next) => {
  try {
    const semester = await Semester.findById(req.params.id);
    if (!semester) throw new AppError('Semester not found', 404);
    if (semester.isArchived) throw new AppError('Cannot modify an archived semester', 400);

    Object.assign(semester, req.body);
    await semester.save();

    await AuditLog.log({
      user: req.user._id, userEmail: req.user.email, userRole: req.user.role,
      action: 'semester-update', targetType: 'semester', targetId: semester._id,
      ipAddress: req.ip, status: 'success',
    });

    res.json({ success: true, data: { semester } });
  } catch (error) { next(error); }
};

// POST /api/admin/semesters/:id/activate
export const activateSemester = async (req, res, next) => {
  try {
    const semester = await Semester.findById(req.params.id);
    if (!semester) throw new AppError('Semester not found', 404);

    semester.isActive = true;
    semester.status = 'active';
    await semester.save(); // pre-hook deactivates others

    await AuditLog.log({
      user: req.user._id, userEmail: req.user.email, userRole: req.user.role,
      action: 'semester-activate', targetType: 'semester', targetId: semester._id,
      ipAddress: req.ip, status: 'success',
    });

    res.json({ success: true, message: 'Semester activated', data: { semester } });
  } catch (error) { next(error); }
};

// POST /api/admin/semesters/:id/archive
export const archiveSemester = async (req, res, next) => {
  try {
    const semester = await Semester.findById(req.params.id);
    if (!semester) throw new AppError('Semester not found', 404);

    semester.status = 'archived';
    semester.isActive = false;
    semester.isArchived = true;
    await semester.save();

    await AuditLog.log({
      user: req.user._id, userEmail: req.user.email, userRole: req.user.role,
      action: 'semester-archive', targetType: 'semester', targetId: semester._id,
      ipAddress: req.ip, status: 'success',
    });

    res.json({ success: true, message: 'Semester archived' });
  } catch (error) { next(error); }
};

// DELETE /api/admin/semesters/:id
export const deleteSemester = async (req, res, next) => {
  try {
    const semester = await Semester.findById(req.params.id);
    if (!semester) throw new AppError('Semester not found', 404);
    if (semester.isActive) throw new AppError('Cannot delete an active semester', 400);

    semester.deletedAt = new Date();
    await semester.save();

    await AuditLog.log({
      user: req.user._id, userEmail: req.user.email, userRole: req.user.role,
      action: 'semester-delete', targetType: 'semester', targetId: semester._id,
      ipAddress: req.ip, status: 'success',
    });

    res.json({ success: true, message: 'Semester deleted' });
  } catch (error) { next(error); }
};
