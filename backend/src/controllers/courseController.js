import { Course, User } from '../models/index.js';
import AppError from '../utils/AppError.js';

// Get all courses (with filters)
export const getCourses = async (req, res, next) => {
  try {
    const { status, department, semester, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (department) filter.department = department;
    if (semester) filter.semester = parseInt(semester);
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    // Role-based filtering
    if (req.user.role === 'student') {
      filter.$or = [
        { enrolledStudents: req.user._id },
        { status: 'published', enrollmentType: 'open' }
      ];
    } else if (req.user.role === 'teacher' || req.user.role === 'teaching-assistant') {
      filter.$or = [
        { instructor: req.user._id },
        { coInstructors: req.user._id },
        { teachingAssistants: req.user._id }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const courses = await Course.find(filter)
      .populate('instructor', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Course.countDocuments(filter);

    res.json({
      success: true,
      data: { courses, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) { next(error); }
};

// Get single course
export const getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'firstName lastName email department')
      .populate('coInstructors', 'firstName lastName email')
      .populate('teachingAssistants', 'firstName lastName email')
      .populate('enrolledStudents', 'firstName lastName email studentId rollNumber');

    if (!course) throw new AppError('Course not found', 404);
    res.json({ success: true, data: { course } });
  } catch (error) { next(error); }
};

// Create course
export const createCourse = async (req, res, next) => {
  try {
    const courseData = { ...req.body, instructor: req.user._id };
    const course = await Course.create(courseData);
    res.status(201).json({ success: true, data: { course } });
  } catch (error) { next(error); }
};

// Update course
export const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw new AppError('Course not found', 404);

    // Check ownership
    if (req.user.role !== 'admin' && req.user.role !== 'super-admin' && req.user.role !== 'institute-admin') {
      if (course.instructor.toString() !== req.user._id.toString()) {
        throw new AppError('Not authorized to update this course', 403);
      }
    }

    Object.assign(course, req.body);
    await course.save();
    res.json({ success: true, data: { course } });
  } catch (error) { next(error); }
};

// Delete course
export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw new AppError('Course not found', 404);
    await Course.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) { next(error); }
};

// Enroll student
export const enrollStudent = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw new AppError('Course not found', 404);

    const studentId = req.body.studentId || req.user._id;

    if (course.enrolledStudents.includes(studentId)) {
      throw new AppError('Student already enrolled', 400);
    }
    if (course.enrolledStudents.length >= course.maxStudents) {
      throw new AppError('Course is full', 400);
    }

    course.enrolledStudents.push(studentId);
    await course.save();
    res.json({ success: true, message: 'Enrolled successfully', data: { course } });
  } catch (error) { next(error); }
};

// Unenroll student
export const unenrollStudent = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw new AppError('Course not found', 404);

    const studentId = req.body.studentId || req.user._id;
    course.enrolledStudents = course.enrolledStudents.filter(
      s => s.toString() !== studentId.toString()
    );
    await course.save();
    res.json({ success: true, message: 'Unenrolled successfully' });
  } catch (error) { next(error); }
};

// Add module to course
export const addModule = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw new AppError('Course not found', 404);

    const newModule = {
      title: req.body.title,
      description: req.body.description,
      order: course.modules.length,
      isPublished: req.body.isPublished || false,
      lectures: []
    };
    course.modules.push(newModule);
    await course.save();
    res.status(201).json({ success: true, data: { module: course.modules[course.modules.length - 1] } });
  } catch (error) { next(error); }
};

// Update module
export const updateModule = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw new AppError('Course not found', 404);

    const mod = course.modules.id(req.params.moduleId);
    if (!mod) throw new AppError('Module not found', 404);

    if (req.body.title) mod.title = req.body.title;
    if (req.body.description !== undefined) mod.description = req.body.description;
    if (req.body.order !== undefined) mod.order = req.body.order;
    if (req.body.isPublished !== undefined) mod.isPublished = req.body.isPublished;

    await course.save();
    res.json({ success: true, data: { module: mod } });
  } catch (error) { next(error); }
};

// Delete module
export const deleteModule = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw new AppError('Course not found', 404);

    course.modules = course.modules.filter(m => m._id.toString() !== req.params.moduleId);
    await course.save();
    res.json({ success: true, message: 'Module deleted' });
  } catch (error) { next(error); }
};

// Add lecture to module
export const addLecture = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw new AppError('Course not found', 404);

    const mod = course.modules.id(req.params.moduleId);
    if (!mod) throw new AppError('Module not found', 404);

    const lecture = {
      title: req.body.title,
      type: req.body.type || 'text',
      content: req.body.content,
      fileUrl: req.body.fileUrl,
      duration: req.body.duration || 0,
      order: mod.lectures.length,
      isPublished: req.body.isPublished || false
    };
    mod.lectures.push(lecture);
    await course.save();
    res.status(201).json({ success: true, data: { lecture: mod.lectures[mod.lectures.length - 1] } });
  } catch (error) { next(error); }
};

// Mark lecture complete
export const markLectureComplete = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw new AppError('Course not found', 404);

    const mod = course.modules.id(req.params.moduleId);
    if (!mod) throw new AppError('Module not found', 404);

    const lecture = mod.lectures.id(req.params.lectureId);
    if (!lecture) throw new AppError('Lecture not found', 404);

    if (!lecture.completedBy.includes(req.user._id)) {
      lecture.completedBy.push(req.user._id);
      await course.save();
    }
    res.json({ success: true, message: 'Lecture marked complete' });
  } catch (error) { next(error); }
};

// Get student progress for a course
export const getCourseProgress = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw new AppError('Course not found', 404);

    const studentId = req.params.studentId || req.user._id;
    let totalLectures = 0;
    let completedLectures = 0;

    course.modules.forEach(mod => {
      mod.lectures.forEach(lecture => {
        if (lecture.isPublished) {
          totalLectures++;
          if (lecture.completedBy.some(id => id.toString() === studentId.toString())) {
            completedLectures++;
          }
        }
      });
    });

    const progress = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;
    res.json({ success: true, data: { totalLectures, completedLectures, progress } });
  } catch (error) { next(error); }
};

// Add announcement to course
export const addCourseAnnouncement = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw new AppError('Course not found', 404);

    course.announcements.push({
      title: req.body.title,
      content: req.body.content,
      postedBy: req.user._id
    });
    await course.save();
    res.status(201).json({ success: true, message: 'Announcement added' });
  } catch (error) { next(error); }
};

export default {
  getCourses, getCourse, createCourse, updateCourse, deleteCourse,
  enrollStudent, unenrollStudent, addModule, updateModule, deleteModule,
  addLecture, markLectureComplete, getCourseProgress, addCourseAnnouncement
};
