import { Assignment, AssignmentSubmission, Course, Notification } from '../models/index.js';
import AppError from '../utils/AppError.js';

// Get assignments (filtered)
export const getAssignments = async (req, res, next) => {
  try {
    const { courseId, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (courseId) filter.course = courseId;
    if (status) filter.status = status;

    if (req.user.role === 'student') {
      // Only show published assignments for enrolled courses
      const enrolledCourses = await Course.find({ enrolledStudents: req.user._id }).select('_id');
      filter.course = { $in: enrolledCourses.map(c => c._id) };
      filter.status = 'published';
    } else if (req.user.role === 'teacher' || req.user.role === 'teaching-assistant') {
      if (!courseId) filter.createdBy = req.user._id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const assignments = await Assignment.find(filter)
      .populate('course', 'title code')
      .populate('createdBy', 'firstName lastName')
      .sort({ dueDate: 1 })
      .skip(skip).limit(parseInt(limit));

    const total = await Assignment.countDocuments(filter);
    res.json({ success: true, data: { assignments, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { next(error); }
};

// Get single assignment
export const getAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'title code instructor')
      .populate('createdBy', 'firstName lastName email');
    if (!assignment) throw new AppError('Assignment not found', 404);

    let submission = null;
    if (req.user.role === 'student') {
      submission = await AssignmentSubmission.findOne({ assignment: assignment._id, student: req.user._id }).sort({ createdAt: -1 });
    }
    res.json({ success: true, data: { assignment, submission } });
  } catch (error) { next(error); }
};

// Create assignment
export const createAssignment = async (req, res, next) => {
  try {
    const assignmentData = { ...req.body, createdBy: req.user._id };
    const assignment = await Assignment.create(assignmentData);
    res.status(201).json({ success: true, data: { assignment } });
  } catch (error) { next(error); }
};

// Update assignment
export const updateAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) throw new AppError('Assignment not found', 404);
    if (req.user.role !== 'admin' && req.user.role !== 'super-admin' && assignment.createdBy.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized', 403);
    }
    Object.assign(assignment, req.body);
    await assignment.save();
    res.json({ success: true, data: { assignment } });
  } catch (error) { next(error); }
};

// Delete assignment
export const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) throw new AppError('Assignment not found', 404);
    await Assignment.findByIdAndDelete(req.params.id);
    await AssignmentSubmission.deleteMany({ assignment: req.params.id });
    res.json({ success: true, message: 'Assignment deleted' });
  } catch (error) { next(error); }
};

// Submit assignment (student)
export const submitAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) throw new AppError('Assignment not found', 404);
    if (assignment.status !== 'published') throw new AppError('Assignment not accepting submissions', 400);

    const now = new Date();
    const isLate = now > assignment.dueDate;
    if (isLate && !assignment.lateSubmissionAllowed) throw new AppError('Late submission not allowed', 400);

    let lateDays = 0;
    if (isLate) {
      lateDays = Math.ceil((now - assignment.dueDate) / (1000 * 60 * 60 * 24));
      if (lateDays > assignment.maxLatedays) throw new AppError('Maximum late days exceeded', 400);
    }

    const submissionData = {
      assignment: assignment._id,
      student: req.user._id,
      files: req.body.files || [],
      textContent: req.body.textContent,
      codeContent: req.body.codeContent,
      codeLanguage: req.body.codeLanguage,
      isLate,
      lateDays,
      totalMarks: assignment.totalMarks
    };

    // Check for resubmission
    const existing = await AssignmentSubmission.findOne({ assignment: assignment._id, student: req.user._id });
    if (existing && existing.status !== 'resubmit') {
      throw new AppError('Already submitted. Wait for resubmit request.', 400);
    }
    if (existing) {
      submissionData.attemptNumber = existing.attemptNumber + 1;
      submissionData.version = existing.version + 1;
    }

    const submission = await AssignmentSubmission.create(submissionData);
    res.status(201).json({ success: true, data: { submission } });
  } catch (error) { next(error); }
};

// Get submissions for assignment (teacher)
export const getSubmissions = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = { assignment: req.params.id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const submissions = await AssignmentSubmission.find(filter)
      .populate('student', 'firstName lastName email studentId rollNumber')
      .populate('gradedBy', 'firstName lastName')
      .sort({ submittedAt: -1 })
      .skip(skip).limit(parseInt(limit));

    const total = await AssignmentSubmission.countDocuments(filter);
    res.json({ success: true, data: { submissions, total } });
  } catch (error) { next(error); }
};

// Grade submission
export const gradeSubmission = async (req, res, next) => {
  try {
    const submission = await AssignmentSubmission.findById(req.params.submissionId);
    if (!submission) throw new AppError('Submission not found', 404);

    submission.marks = req.body.marks;
    submission.feedback = req.body.feedback;
    submission.rubricScores = req.body.rubricScores || [];
    submission.gradedBy = req.user._id;
    submission.gradedAt = new Date();
    submission.status = 'graded';
    await submission.save();

    // Create notification for student
    await Notification.create({
      recipient: submission.student,
      type: 'grade',
      title: 'Assignment Graded',
      message: `Your assignment has been graded. Score: ${req.body.marks}`,
      referenceId: submission._id,
      referenceModel: 'AssignmentSubmission'
    });

    res.json({ success: true, data: { submission } });
  } catch (error) { next(error); }
};

// Request resubmission
export const requestResubmission = async (req, res, next) => {
  try {
    const submission = await AssignmentSubmission.findById(req.params.submissionId);
    if (!submission) throw new AppError('Submission not found', 404);
    submission.status = 'resubmit';
    submission.feedback = req.body.feedback || 'Please resubmit your assignment.';
    await submission.save();
    res.json({ success: true, message: 'Resubmission requested' });
  } catch (error) { next(error); }
};

export default {
  getAssignments, getAssignment, createAssignment, updateAssignment, deleteAssignment,
  submitAssignment, getSubmissions, gradeSubmission, requestResubmission
};
