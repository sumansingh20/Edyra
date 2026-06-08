import { Grade, Course, Assignment, AssignmentSubmission, Submission } from '../models/index.js';
import AppError from '../utils/AppError.js';

// Get grades for a student in a course
export const getStudentGrades = async (req, res, next) => {
  try {
    const { courseId, studentId, academicYear } = req.query;
    const filter = {};
    if (courseId) filter.course = courseId;
    if (academicYear) filter.academicYear = academicYear;
    filter.student = studentId || req.user._id;

    const grades = await Grade.find(filter)
      .populate('course', 'title code credits')
      .populate('student', 'firstName lastName studentId rollNumber')
      .sort({ academicYear: -1 });

    res.json({ success: true, data: { grades } });
  } catch (error) { next(error); }
};

// Get grade details
export const getGradeDetails = async (req, res, next) => {
  try {
    const grade = await Grade.findById(req.params.id)
      .populate('course', 'title code credits instructor')
      .populate('student', 'firstName lastName studentId rollNumber email')
      .populate('finalizedBy', 'firstName lastName');
    if (!grade) throw new AppError('Grade record not found', 404);
    res.json({ success: true, data: { grade } });
  } catch (error) { next(error); }
};

// Create/update grade record
export const upsertGrade = async (req, res, next) => {
  try {
    const { studentId, courseId, academicYear, semester, components } = req.body;
    let grade = await Grade.findOne({ student: studentId, course: courseId, academicYear });

    if (grade) {
      grade.components = components || grade.components;
      grade.semester = semester || grade.semester;
    } else {
      grade = new Grade({
        student: studentId,
        course: courseId,
        academicYear,
        semester,
        components: components || []
      });
    }
    grade.calculateTotal();
    await grade.save();
    res.json({ success: true, data: { grade } });
  } catch (error) { next(error); }
};

// Add grade component
export const addGradeComponent = async (req, res, next) => {
  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) throw new AppError('Grade record not found', 404);

    grade.components.push(req.body);
    grade.calculateTotal();
    await grade.save();
    res.json({ success: true, data: { grade } });
  } catch (error) { next(error); }
};

// Finalize grades
export const finalizeGrades = async (req, res, next) => {
  try {
    const { courseId, academicYear } = req.body;
    const result = await Grade.updateMany(
      { course: courseId, academicYear, status: 'in-progress' },
      { $set: { status: 'finalized', finalizedBy: req.user._id, finalizedAt: new Date() } }
    );
    res.json({ success: true, message: `${result.modifiedCount} grade records finalized` });
  } catch (error) { next(error); }
};

// Publish grades
export const publishGrades = async (req, res, next) => {
  try {
    const { courseId, academicYear } = req.body;
    await Grade.updateMany(
      { course: courseId, academicYear, status: 'finalized' },
      { $set: { status: 'published' } }
    );
    res.json({ success: true, message: 'Grades published' });
  } catch (error) { next(error); }
};

// Get course gradebook (all students' grades for a course)
export const getCourseGradebook = async (req, res, next) => {
  try {
    const { academicYear } = req.query;
    const filter = { course: req.params.courseId };
    if (academicYear) filter.academicYear = academicYear;

    const grades = await Grade.find(filter)
      .populate('student', 'firstName lastName studentId rollNumber email')
      .sort({ 'student.rollNumber': 1 });

    res.json({ success: true, data: { grades } });
  } catch (error) { next(error); }
};

// Get student transcript (all courses)
export const getTranscript = async (req, res, next) => {
  try {
    const studentId = req.params.studentId || req.user._id;
    const grades = await Grade.find({ student: studentId, status: 'published' })
      .populate('course', 'title code credits department semester')
      .sort({ academicYear: 1, semester: 1 });

    // Calculate CGPA
    let totalCredits = 0;
    let totalGradePoints = 0;
    for (const g of grades) {
      if (g.course && g.course.credits && g.gradePoint !== undefined) {
        totalCredits += g.course.credits;
        totalGradePoints += g.gradePoint * g.course.credits;
      }
    }
    const cgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;

    res.json({ success: true, data: { grades, cgpa: parseFloat(cgpa), totalCredits } });
  } catch (error) { next(error); }
};

export default {
  getStudentGrades, getGradeDetails, upsertGrade, addGradeComponent,
  finalizeGrades, publishGrades, getCourseGradebook, getTranscript
};
