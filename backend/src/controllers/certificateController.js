import { Certificate, Course, Exam, Submission, User, Enrollment } from '../models/index.js';
import AppError from '../utils/AppError.js';
import crypto from 'crypto';

/* ========== ISSUE CERTIFICATE ========== */
export const issueCertificate = async (req, res, next) => {
  try {
    const {
      studentId, type, title, description,
      courseId, examId, grade, percentage,
      score, totalScore, completionDate, duration,
      templateId, customFields,
    } = req.body;

    // Validate student exists
    const student = await User.findById(studentId);
    if (!student) throw new AppError('Student not found', 404);

    // Build certificate data
    const certData = {
      student: student._id,
      studentName: `${student.firstName} ${student.lastName}`,
      studentId: student.studentId,
      type: type || 'course-completion',
      title,
      description,
      grade,
      percentage,
      score,
      totalScore,
      completionDate: completionDate || new Date(),
      duration,
      issuedBy: req.user._id,
      issuerName: `${req.user.firstName} ${req.user.lastName}`,
      issuerTitle: req.user.role === 'admin' || req.user.role === 'super-admin'
        ? 'Administrator' : 'Instructor',
      templateId: templateId || 'default',
      customFields,
    };

    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) throw new AppError('Course not found', 404);
      certData.course = course._id;
      if (!certData.title) certData.title = `Certificate of Completion — ${course.title}`;
    }

    if (examId) {
      const exam = await Exam.findById(examId);
      if (exam) certData.exam = exam._id;
    }

    // Generate verification hash
    const hashData = `${certData.studentName}-${certData.title}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    certData.verificationHash = crypto.createHash('sha256').update(hashData).digest('hex').substring(0, 32);

    // Generate QR code data (verification URL)
    certData.qrCode = `/api/certificates/verify/${certData.verificationHash}`;

    const certificate = await Certificate.create(certData);

    // Update enrollment if course certificate
    if (courseId) {
      await Enrollment.findOneAndUpdate(
        { student: student._id, course: courseId },
        { certificateIssued: true, certificateId: certificate._id }
      );
    }

    const populated = await Certificate.findById(certificate._id)
      .populate('student', 'firstName lastName email studentId')
      .populate('course', 'title code')
      .populate('issuedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Certificate issued successfully',
      data: { certificate: populated },
    });
  } catch (error) {
    next(error);
  }
};

/* ========== BULK ISSUE CERTIFICATES ========== */
export const bulkIssueCertificates = async (req, res, next) => {
  try {
    const { courseId, type, title, studentIds } = req.body;

    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);

    const students = studentIds
      ? await User.find({ _id: { $in: studentIds } })
      : await User.find({ _id: { $in: course.enrolledStudents } });

    const results = [];

    for (const student of students) {
      try {
        // Check for existing certificate
        const existing = await Certificate.findOne({
          student: student._id,
          course: courseId,
          status: 'issued',
        });
        if (existing) {
          results.push({ studentId: student._id, status: 'skipped', reason: 'Already issued' });
          continue;
        }

        const hashData = `${student.firstName}-${course.title}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

        const cert = await Certificate.create({
          student: student._id,
          studentName: `${student.firstName} ${student.lastName}`,
          studentId: student.studentId,
          type: type || 'course-completion',
          title: title || `Certificate of Completion — ${course.title}`,
          course: course._id,
          completionDate: new Date(),
          issuedBy: req.user._id,
          issuerName: `${req.user.firstName} ${req.user.lastName}`,
          verificationHash: crypto.createHash('sha256').update(hashData).digest('hex').substring(0, 32),
          qrCode: `/api/certificates/verify/${crypto.createHash('sha256').update(hashData).digest('hex').substring(0, 32)}`,
        });

        results.push({ studentId: student._id, status: 'issued', certificateId: cert._id });
      } catch (e) {
        results.push({ studentId: student._id, status: 'error', reason: e.message });
      }
    }

    res.json({
      success: true,
      message: `Processed ${results.length} certificates`,
      data: { results, issued: results.filter(r => r.status === 'issued').length },
    });
  } catch (error) {
    next(error);
  }
};

/* ========== GET MY CERTIFICATES (Student) ========== */
export const getMyCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({
      student: req.user._id,
      status: 'issued',
    })
      .populate('course', 'title code')
      .populate('exam', 'title')
      .populate('issuedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { certificates },
    });
  } catch (error) {
    next(error);
  }
};

/* ========== GET ALL CERTIFICATES (Admin) ========== */
export const getAllCertificates = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, status, search } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { certificateNumber: { $regex: search, $options: 'i' } },
        { studentName: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const certificates = await Certificate.find(filter)
      .populate('student', 'firstName lastName email studentId')
      .populate('course', 'title code')
      .populate('issuedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Certificate.countDocuments(filter);

    res.json({
      success: true,
      data: {
        certificates,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ========== GET SINGLE CERTIFICATE ========== */
export const getCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('student', 'firstName lastName email studentId department batch')
      .populate('course', 'title code department credits')
      .populate('exam', 'title subject')
      .populate('issuedBy', 'firstName lastName email');

    if (!certificate) throw new AppError('Certificate not found', 404);

    // Students can only view their own certificates
    if (req.user.role === 'student' && certificate.student._id.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized', 403);
    }

    res.json({ success: true, data: { certificate } });
  } catch (error) {
    next(error);
  }
};

/* ========== VERIFY CERTIFICATE (Public) ========== */
export const verifyCertificate = async (req, res, next) => {
  try {
    const { hash } = req.params;

    const certificate = await Certificate.findOne({ verificationHash: hash })
      .populate('student', 'firstName lastName studentId')
      .populate('course', 'title code')
      .populate('issuedBy', 'firstName lastName');

    if (!certificate) {
      return res.json({
        success: false,
        message: 'Certificate not found or invalid verification code',
        data: { valid: false },
      });
    }

    // Update verification count
    certificate.verifiedCount += 1;
    certificate.lastVerifiedAt = new Date();
    await certificate.save();

    res.json({
      success: true,
      data: {
        valid: certificate.status === 'issued',
        certificate: {
          certificateNumber: certificate.certificateNumber,
          title: certificate.title,
          studentName: certificate.studentName,
          studentId: certificate.studentId,
          type: certificate.type,
          grade: certificate.grade,
          percentage: certificate.percentage,
          completionDate: certificate.completionDate,
          issuedAt: certificate.createdAt,
          issuerName: certificate.issuerName,
          institutionName: certificate.institutionName,
          courseName: certificate.course?.title,
          courseCode: certificate.course?.code,
          status: certificate.status,
          revokedAt: certificate.revokedAt,
          revokedReason: certificate.revokedReason,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ========== REVOKE CERTIFICATE ========== */
export const revokeCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) throw new AppError('Certificate not found', 404);

    certificate.status = 'revoked';
    certificate.revokedAt = new Date();
    certificate.revokedReason = req.body.reason || 'Revoked by administrator';
    await certificate.save();

    res.json({
      success: true,
      message: 'Certificate revoked',
      data: { certificate },
    });
  } catch (error) {
    next(error);
  }
};

/* ========== GENERATE CERTIFICATE PDF (HTML-based) ========== */
export const generateCertificatePDF = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('student', 'firstName lastName studentId department')
      .populate('course', 'title code credits')
      .populate('issuedBy', 'firstName lastName');

    if (!certificate) throw new AppError('Certificate not found', 404);

    // Students can only download their own
    if (req.user.role === 'student' && certificate.student._id.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized', 403);
    }

    // Generate HTML certificate (can be converted to PDF client-side or via puppeteer)
    const completionDate = new Date(certificate.completionDate).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${certificate.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #f8f9fa; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
    .certificate { width: 1000px; min-height: 700px; background: #fff; border: 3px solid #1d4f91; position: relative; padding: 60px 80px; text-align: center; }
    .certificate::before { content: ''; position: absolute; top: 8px; left: 8px; right: 8px; bottom: 8px; border: 1px solid #c7d2fe; pointer-events: none; }
    .header { margin-bottom: 30px; }
    .institution { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #1d4f91; letter-spacing: 2px; }
    .cert-type { font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 4px; margin-top: 8px; }
    .title { font-family: 'Playfair Display', serif; font-size: 36px; color: #1e3a5f; margin: 20px 0; }
    .presented { font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 3px; }
    .name { font-family: 'Playfair Display', serif; font-size: 32px; color: #1d4f91; margin: 10px 0; border-bottom: 2px solid #c7d2fe; display: inline-block; padding-bottom: 5px; }
    .description { font-size: 15px; color: #374151; line-height: 1.8; margin: 20px auto; max-width: 700px; }
    .details { display: flex; justify-content: center; gap: 40px; margin: 25px 0; }
    .detail { text-align: center; }
    .detail-label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; }
    .detail-value { font-size: 16px; font-weight: 600; color: #1f2937; margin-top: 3px; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; }
    .signature { text-align: center; }
    .sig-line { width: 200px; border-top: 1px solid #d1d5db; margin-bottom: 5px; }
    .sig-name { font-weight: 600; font-size: 14px; color: #1f2937; }
    .sig-title { font-size: 12px; color: #6b7280; }
    .cert-number { position: absolute; bottom: 20px; left: 40px; font-size: 10px; color: #9ca3af; }
    .qr-placeholder { position: absolute; bottom: 20px; right: 40px; width: 80px; height: 80px; border: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #9ca3af; }
    @media print { body { background: white; padding: 0; } .certificate { border-width: 2px; } }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="institution">${certificate.institutionName}</div>
      <div class="cert-type">${certificate.type.replace(/-/g, ' ')}</div>
    </div>
    <div class="title">${certificate.title}</div>
    <div class="presented">This is to certify that</div>
    <div class="name">${certificate.studentName}</div>
    ${certificate.description ? `<div class="description">${certificate.description}</div>` : ''}
    <div class="details">
      ${certificate.course ? `<div class="detail"><div class="detail-label">Course</div><div class="detail-value">${certificate.course.title}</div></div>` : ''}
      ${certificate.grade ? `<div class="detail"><div class="detail-label">Grade</div><div class="detail-value">${certificate.grade}</div></div>` : ''}
      ${certificate.percentage ? `<div class="detail"><div class="detail-label">Score</div><div class="detail-value">${certificate.percentage}%</div></div>` : ''}
      <div class="detail"><div class="detail-label">Date</div><div class="detail-value">${completionDate}</div></div>
    </div>
    <div class="footer">
      <div class="signature">
        <div class="sig-line"></div>
        <div class="sig-name">${certificate.issuerName}</div>
        <div class="sig-title">${certificate.issuerTitle}</div>
      </div>
      <div class="signature">
        <div class="sig-line"></div>
        <div class="sig-name">Registrar</div>
        <div class="sig-title">${certificate.institutionName}</div>
      </div>
    </div>
    <div class="cert-number">Certificate No: ${certificate.certificateNumber}</div>
    <div class="qr-placeholder">Verify at<br/>${certificate.verificationHash.substring(0, 12)}...</div>
  </div>
</body>
</html>`;

    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    next(error);
  }
};

export default {
  issueCertificate,
  bulkIssueCertificates,
  getMyCertificates,
  getAllCertificates,
  getCertificate,
  verifyCertificate,
  revokeCertificate,
  generateCertificatePDF,
};
