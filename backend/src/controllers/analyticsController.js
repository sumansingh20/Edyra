import { User, Course, Exam, Assignment, AssignmentSubmission, Grade, Attendance, Submission, Fee, Admission } from '../models/index.js';
import AppError from '../utils/AppError.js';

// Dashboard overview stats
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalStudents, totalTeachers, totalCourses, totalExams,
      activeCourses, activeExams, totalAdmissions, pendingFees
    ] = await Promise.all([
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'teacher', isActive: true }),
      Course.countDocuments(),
      Exam.countDocuments(),
      Course.countDocuments({ status: { $in: ['published', 'active'] } }),
      Exam.countDocuments({ status: { $in: ['published', 'ongoing'] } }),
      Admission.countDocuments({ status: 'applied' }),
      Fee.countDocuments({ status: { $in: ['pending', 'overdue'] } })
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalStudents, totalTeachers, totalCourses, totalExams,
          activeCourses, activeExams, totalAdmissions, pendingFees
        }
      }
    });
  } catch (error) { next(error); }
};

// Course analytics
export const getCourseAnalytics = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) throw new AppError('Course not found', 404);

    const enrollmentCount = course.enrolledStudents.length;

    // Module completion stats
    let totalLectures = 0;
    let totalCompletions = 0;
    course.modules.forEach(mod => {
      mod.lectures.forEach(lecture => {
        if (lecture.isPublished) {
          totalLectures++;
          totalCompletions += lecture.completedBy.length;
        }
      });
    });
    const avgCompletion = enrollmentCount > 0 && totalLectures > 0
      ? Math.round((totalCompletions / (enrollmentCount * totalLectures)) * 100) : 0;

    // Assignment stats
    const assignments = await Assignment.find({ course: req.params.courseId });
    const assignmentIds = assignments.map(a => a._id);
    const submissions = await AssignmentSubmission.find({ assignment: { $in: assignmentIds } });
    const gradedSubmissions = submissions.filter(s => s.status === 'graded');
    const avgScore = gradedSubmissions.length > 0
      ? Math.round(gradedSubmissions.reduce((sum, s) => sum + (s.marks || 0), 0) / gradedSubmissions.length) : 0;

    // Attendance stats
    const attendances = await Attendance.find({ course: req.params.courseId });
    let totalAttSessions = attendances.length;
    let avgAttendance = 0;
    if (totalAttSessions > 0) {
      const totalPresent = attendances.reduce((sum, a) => sum + a.totalPresent, 0);
      const totalRecords = attendances.reduce((sum, a) => sum + a.records.length, 0);
      avgAttendance = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;
    }

    // Grade distribution
    const grades = await Grade.find({ course: req.params.courseId });
    const gradeDistribution = {};
    grades.forEach(g => { gradeDistribution[g.grade || 'N/A'] = (gradeDistribution[g.grade || 'N/A'] || 0) + 1; });

    res.json({
      success: true,
      data: {
        courseId: req.params.courseId,
        courseTitle: course.title,
        enrollmentCount,
        avgCompletion,
        totalAssignments: assignments.length,
        totalSubmissions: submissions.length,
        avgAssignmentScore: avgScore,
        totalAttendanceSessions: totalAttSessions,
        avgAttendance,
        gradeDistribution,
        totalGraded: grades.length
      }
    });
  } catch (error) { next(error); }
};

// Student performance analytics
export const getStudentAnalytics = async (req, res, next) => {
  try {
    const studentId = req.params.studentId || req.user._id;
    const student = await User.findById(studentId).select('firstName lastName studentId email department semester');
    if (!student) throw new AppError('Student not found', 404);

    // Courses enrolled
    const courses = await Course.find({ enrolledStudents: studentId }).select('title code');

    // Grades
    const grades = await Grade.find({ student: studentId }).populate('course', 'title code credits');
    let totalCredits = 0, totalGradePoints = 0;
    grades.forEach(g => {
      if (g.course?.credits && g.gradePoint !== undefined) {
        totalCredits += g.course.credits;
        totalGradePoints += g.gradePoint * g.course.credits;
      }
    });
    const cgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;

    // Attendance
    const attendances = await Attendance.find({ 'records.student': studentId });
    let attTotal = 0, attPresent = 0;
    attendances.forEach(a => {
      const record = a.records.find(r => r.student.toString() === studentId.toString());
      if (record) {
        attTotal++;
        if (record.status === 'present' || record.status === 'late') attPresent++;
      }
    });

    // Exam performance
    const examSubmissions = await Submission.find({ student: studentId }).populate('exam', 'title subject');

    res.json({
      success: true,
      data: {
        student,
        coursesEnrolled: courses.length,
        courses,
        cgpa: parseFloat(cgpa),
        totalCredits,
        grades: grades.map(g => ({ course: g.course?.title, grade: g.grade, percentage: g.percentage, gradePoint: g.gradePoint })),
        attendance: { total: attTotal, present: attPresent, percentage: attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0 },
        exams: examSubmissions.map(s => ({ exam: s.exam?.title, score: s.marksObtained, total: s.totalMarks, percentage: s.percentage }))
      }
    });
  } catch (error) { next(error); }
};

// Institution-wide analytics
export const getInstitutionAnalytics = async (req, res, next) => {
  try {
    // Enrollment trends (by month)
    const enrollmentTrend = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]);

    // Department-wise student count
    const departmentStats = await User.aggregate([
      { $match: { role: 'student', department: { $ne: null } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Fee collection stats
    const feeStats = await Fee.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' }, collectedAmount: { $sum: '$paidAmount' } } }
    ]);

    // Admission stats
    const admissionStats = await Admission.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        enrollmentTrend,
        departmentStats,
        feeStats,
        admissionStats
      }
    });
  } catch (error) { next(error); }
};

// Teacher analytics
export const getTeacherAnalytics = async (req, res, next) => {
  try {
    const teacherId = req.params.teacherId || req.user._id;

    const courses = await Course.find({ instructor: teacherId }).select('title code enrolledStudents status');
    const courseIds = courses.map(c => c._id);

    const totalStudents = new Set();
    courses.forEach(c => c.enrolledStudents.forEach(s => totalStudents.add(s.toString())));

    const assignments = await Assignment.countDocuments({ createdBy: teacherId });
    const exams = await Exam.countDocuments({ createdBy: teacherId });

    res.json({
      success: true,
      data: {
        totalCourses: courses.length,
        totalStudents: totalStudents.size,
        totalAssignments: assignments,
        totalExams: exams,
        courses: courses.map(c => ({ title: c.title, code: c.code, students: c.enrolledStudents.length, status: c.status }))
      }
    });
  } catch (error) { next(error); }
};

export default {
  getDashboardStats, getCourseAnalytics, getStudentAnalytics,
  getInstitutionAnalytics, getTeacherAnalytics
};
