import { Attendance, Course } from '../models/index.js';
import AppError from '../utils/AppError.js';
import crypto from 'crypto';

// Get attendance records
export const getAttendance = async (req, res, next) => {
  try {
    const { courseId, date, startDate, endDate, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (courseId) filter.course = courseId;
    if (date) filter.date = new Date(date);
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const records = await Attendance.find(filter)
      .populate('course', 'title code')
      .populate('markedBy', 'firstName lastName')
      .populate('records.student', 'firstName lastName studentId rollNumber')
      .sort({ date: -1 })
      .skip(skip).limit(parseInt(limit));

    const total = await Attendance.countDocuments(filter);
    res.json({ success: true, data: { records, total, page: parseInt(page) } });
  } catch (error) { next(error); }
};

// Mark attendance (manual)
export const markAttendance = async (req, res, next) => {
  try {
    const { courseId, date, session, records, type } = req.body;

    // Check if already marked
    let attendance = await Attendance.findOne({ course: courseId, date: new Date(date), session: session || 'morning' });

    if (attendance) {
      attendance.records = records;
      attendance.type = type || 'manual';
    } else {
      attendance = new Attendance({
        course: courseId,
        date: new Date(date),
        session: session || 'morning',
        type: type || 'manual',
        markedBy: req.user._id,
        records
      });
    }
    attendance.calculateTotals();
    await attendance.save();
    res.json({ success: true, data: { attendance } });
  } catch (error) { next(error); }
};

// Generate QR code for attendance
export const generateQR = async (req, res, next) => {
  try {
    const { courseId, date, session, expiryMinutes = 10 } = req.body;
    const qrCode = crypto.randomBytes(32).toString('hex');
    const qrExpiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    let attendance = await Attendance.findOne({ course: courseId, date: new Date(date), session: session || 'morning' });
    if (!attendance) {
      attendance = new Attendance({
        course: courseId,
        date: new Date(date),
        session: session || 'morning',
        type: 'qr-code',
        markedBy: req.user._id,
        records: []
      });
    }
    attendance.qrCode = qrCode;
    attendance.qrExpiresAt = qrExpiresAt;
    await attendance.save();

    res.json({ success: true, data: { qrCode, expiresAt: qrExpiresAt, attendanceId: attendance._id } });
  } catch (error) { next(error); }
};

// Mark attendance via QR code (student)
export const markViaQR = async (req, res, next) => {
  try {
    const { qrCode } = req.body;
    const attendance = await Attendance.findOne({ qrCode, qrExpiresAt: { $gt: new Date() } });
    if (!attendance) throw new AppError('Invalid or expired QR code', 400);

    const existingRecord = attendance.records.find(r => r.student.toString() === req.user._id.toString());
    if (existingRecord) throw new AppError('Attendance already marked', 400);

    attendance.records.push({
      student: req.user._id,
      status: 'present',
      method: 'qr-code',
      markedAt: new Date()
    });
    attendance.calculateTotals();
    await attendance.save();
    res.json({ success: true, message: 'Attendance marked successfully' });
  } catch (error) { next(error); }
};

// Mark attendance via GPS (student)
export const markViaGPS = async (req, res, next) => {
  try {
    const { attendanceId, latitude, longitude } = req.body;
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) throw new AppError('Attendance session not found', 404);

    if (attendance.gpsCenter && attendance.gpsCenter.latitude) {
      const distance = getDistanceMeters(
        attendance.gpsCenter.latitude, attendance.gpsCenter.longitude,
        latitude, longitude
      );
      if (distance > (attendance.gpsCenter.radius || 100)) {
        throw new AppError('You are too far from the class location', 400);
      }
    }

    const existingRecord = attendance.records.find(r => r.student.toString() === req.user._id.toString());
    if (existingRecord) throw new AppError('Attendance already marked', 400);

    attendance.records.push({
      student: req.user._id,
      status: 'present',
      method: 'gps',
      location: { latitude, longitude },
      markedAt: new Date()
    });
    attendance.calculateTotals();
    await attendance.save();
    res.json({ success: true, message: 'Attendance marked via GPS' });
  } catch (error) { next(error); }
};

// Get student attendance summary
export const getStudentAttendanceSummary = async (req, res, next) => {
  try {
    const studentId = req.params.studentId || req.user._id;
    const { courseId } = req.query;
    const filter = { 'records.student': studentId };
    if (courseId) filter.course = courseId;

    const attendances = await Attendance.find(filter).populate('course', 'title code');

    const summary = {};
    attendances.forEach(att => {
      const courseKey = att.course._id.toString();
      if (!summary[courseKey]) {
        summary[courseKey] = { course: att.course, total: 0, present: 0, absent: 0, late: 0, excused: 0, percentage: 0 };
      }
      summary[courseKey].total++;
      const record = att.records.find(r => r.student.toString() === studentId.toString());
      if (record) {
        if (record.status === 'present' || record.status === 'late') summary[courseKey].present++;
        if (record.status === 'absent') summary[courseKey].absent++;
        if (record.status === 'late') summary[courseKey].late++;
        if (record.status === 'excused') { summary[courseKey].excused++; summary[courseKey].present++; }
      }
    });

    Object.values(summary).forEach(s => {
      s.percentage = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
    });

    res.json({ success: true, data: { summary: Object.values(summary) } });
  } catch (error) { next(error); }
};

// Helper: distance calculation
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default {
  getAttendance, markAttendance, generateQR, markViaQR, markViaGPS, getStudentAttendanceSummary
};
