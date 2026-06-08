import { User, Course, Enrollment } from '../models/index.js';
import AppError from '../utils/AppError.js';

// ---------------------------------------------------------------------------
// In-memory department store (persists for the lifetime of the process).
// Can be replaced with a Mongoose model later without changing the API contract.
// ---------------------------------------------------------------------------
let departments = [
  {
    id: '1',
    name: 'Computer Science',
    code: 'CS',
    description: 'Computing and Information Technology programs',
    head: null,
    programs: ['B.Sc CS', 'M.Sc CS', 'BCA', 'MCA'],
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Mathematics',
    code: 'MATH',
    description: 'Pure and Applied Mathematics',
    head: null,
    programs: ['B.Sc Math', 'M.Sc Math'],
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Physics',
    code: 'PHY',
    description: 'Physics and Applied Sciences',
    head: null,
    programs: ['B.Sc Physics', 'M.Sc Physics'],
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Business Administration',
    code: 'MBA',
    description: 'Business and Management',
    head: null,
    programs: ['BBA', 'MBA'],
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'English Literature',
    code: 'ENG',
    description: 'Language and Literature',
    head: null,
    programs: ['B.A English', 'M.A English'],
    active: true,
    createdAt: new Date().toISOString(),
  },
];

let nextId = 6;

// ---------------------------------------------------------------------------
// Helper: attach live student/faculty counts to a single department object
// ---------------------------------------------------------------------------
async function withCounts(dept) {
  // Match on User.department using the department name or code
  const matchField = { $in: [dept.name, dept.code] };
  const [studentCount, facultyCount] = await Promise.all([
    User.countDocuments({ role: 'student', isActive: true, department: matchField }),
    User.countDocuments({
      role: { $in: ['teacher', 'teaching-assistant'] },
      isActive: true,
      department: matchField,
    }),
  ]);

  return {
    ...dept,
    studentCount,
    facultyCount,
    programCount: (dept.programs || []).length,
  };
}

// ---------------------------------------------------------------------------
// GET /departments  —  list all departments with counts
// ---------------------------------------------------------------------------
export const getDepartments = async (req, res, next) => {
  try {
    const { active } = req.query;

    let filtered = departments;
    if (active !== undefined) {
      const isActive = active === 'true';
      filtered = departments.filter((d) => d.active === isActive);
    }

    const result = await Promise.all(filtered.map(withCounts));

    res.json({
      success: true,
      data: {
        departments: result,
        total: result.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /departments/:id  —  single department with details
// ---------------------------------------------------------------------------
export const getDepartment = async (req, res, next) => {
  try {
    const dept = departments.find((d) => d.id === req.params.id);
    if (!dept) throw new AppError('Department not found', 404);

    const enriched = await withCounts(dept);

    // Also return a list of students and faculty in this department
    const [students, faculty] = await Promise.all([
      User.find({ role: 'student', isActive: true, department: { $in: [dept.name, dept.code] } })
        .select('firstName lastName email studentId rollNumber program semester')
        .limit(50),
      User.find({
        role: { $in: ['teacher', 'teaching-assistant'] },
        isActive: true,
        department: { $in: [dept.name, dept.code] },
      })
        .select('firstName lastName email employeeId designation')
        .limit(50),
    ]);

    res.json({
      success: true,
      data: {
        department: enriched,
        students,
        faculty,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /departments  —  create a new department
// ---------------------------------------------------------------------------
export const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, head, programs } = req.body;

    if (!name || !code) {
      throw new AppError('Department name and code are required', 400);
    }

    // Prevent duplicate code
    const duplicate = departments.find(
      (d) => d.code.toUpperCase() === code.toUpperCase()
    );
    if (duplicate) {
      throw new AppError(`Department with code "${code}" already exists`, 409);
    }

    const newDept = {
      id: String(nextId++),
      name: name.trim(),
      code: code.toUpperCase().trim(),
      description: description || '',
      head: head || null,
      programs: Array.isArray(programs) ? programs : [],
      active: true,
      createdAt: new Date().toISOString(),
    };

    departments.push(newDept);

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: { department: newDept },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// PUT /departments/:id  —  update department
// ---------------------------------------------------------------------------
export const updateDepartment = async (req, res, next) => {
  try {
    const idx = departments.findIndex((d) => d.id === req.params.id);
    if (idx === -1) throw new AppError('Department not found', 404);

    const allowedFields = ['name', 'code', 'description', 'head', 'programs', 'active'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        departments[idx][field] = req.body[field];
      }
    });

    // Normalise code to uppercase if updated
    if (req.body.code) {
      departments[idx].code = departments[idx].code.toUpperCase().trim();
    }

    const enriched = await withCounts(departments[idx]);

    res.json({
      success: true,
      message: 'Department updated successfully',
      data: { department: enriched },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// DELETE /departments/:id  —  delete department (blocks if students are enrolled)
// ---------------------------------------------------------------------------
export const deleteDepartment = async (req, res, next) => {
  try {
    const idx = departments.findIndex((d) => d.id === req.params.id);
    if (idx === -1) throw new AppError('Department not found', 404);

    const dept = departments[idx];

    // Safety check: no enrolled students
    const studentCount = await User.countDocuments({
      role: 'student',
      isActive: true,
      department: { $in: [dept.name, dept.code] },
    });

    if (studentCount > 0) {
      throw new AppError(
        `Cannot delete department "${dept.name}" — ${studentCount} student(s) are currently enrolled. Re-assign them first.`,
        409
      );
    }

    departments.splice(idx, 1);

    res.json({
      success: true,
      message: `Department "${dept.name}" deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /departments/programs  —  list ALL programs across all departments
// ---------------------------------------------------------------------------
export const getPrograms = async (req, res, next) => {
  try {
    const programs = departments
      .filter((d) => d.active)
      .flatMap((d) =>
        (d.programs || []).map((p) => ({
          name: p,
          department: d.name,
          departmentId: d.id,
          departmentCode: d.code,
        }))
      );

    res.json({
      success: true,
      data: {
        programs,
        total: programs.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /departments/:id/students  —  all students in a department (aggregate)
// ---------------------------------------------------------------------------
export const getStudentsByDepartment = async (req, res, next) => {
  try {
    const dept = departments.find((d) => d.id === req.params.id);
    if (!dept) throw new AppError('Department not found', 404);

    const { page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {
      role: 'student',
      isActive: true,
      department: { $in: [dept.name, dept.code] },
    };

    const [students, total] = await Promise.all([
      User.find(filter)
        .select('firstName lastName email studentId rollNumber program semester batch')
        .sort({ rollNumber: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        department: { id: dept.id, name: dept.name, code: dept.code },
        students,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /departments/:id/faculty  —  all faculty in a department (aggregate)
// ---------------------------------------------------------------------------
export const getFacultyByDepartment = async (req, res, next) => {
  try {
    const dept = departments.find((d) => d.id === req.params.id);
    if (!dept) throw new AppError('Department not found', 404);

    const { page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {
      role: { $in: ['teacher', 'teaching-assistant'] },
      isActive: true,
      department: { $in: [dept.name, dept.code] },
    };

    const [faculty, total] = await Promise.all([
      User.find(filter)
        .select('firstName lastName email employeeId designation role profileImage')
        .sort({ lastName: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        department: { id: dept.id, name: dept.name, code: dept.code },
        faculty,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// Named default export (also used when imported with * as departmentController)
// ---------------------------------------------------------------------------
export default {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getPrograms,
  getStudentsByDepartment,
  getFacultyByDepartment,
};
