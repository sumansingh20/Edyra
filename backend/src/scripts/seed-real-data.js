import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  User, Course, CourseModule, CourseLesson, UserProgress,
  Assignment, AssignmentSubmission, Exam, Question, Submission,
  Violation, Grade, Attendance, Timetable, Fee, Admission,
  LibraryBook, HostelRoom, TransportRoute, Announcement, Notification, Message
} from '../models/index.js';

import connectDB from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env.production') });

async function seedData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB.');

    // 1. Clear Existing Data (Pruning any demo or legacy artifacts)
    console.log('🗑️ Clearing collections...');
    const collectionsToClear = [
      User, Course, CourseModule, CourseLesson, UserProgress,
      Assignment, AssignmentSubmission, Exam, Question, Submission,
      Violation, Grade, Attendance, Timetable, Fee, Admission,
      LibraryBook, HostelRoom, TransportRoute, Announcement, Notification, Message
    ];

    for (const model of collectionsToClear) {
      await model.deleteMany({});
    }
    console.log('✅ Collections cleared.');

    // 2. Create Users
    console.log('👤 Creating users...');
    
    // Administrator
    const adminUser = await User.create({
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@edyra.com',
      password: 'Suman@123',
      role: 'admin',
      isVerified: true,
      isActive: true,
    });

    // Teacher
    const teacherUser = await User.create({
      firstName: 'Dr. Richard',
      lastName: 'Feynman',
      email: 'teacher@edyra.com',
      password: 'Suman@123',
      role: 'teacher',
      employeeId: 'EMP001',
      department: 'Computer Science',
      isVerified: true,
      isActive: true,
    });

    // Student 1 (Suman Singh) - STU001
    const studentAlex = await User.create({
      firstName: 'Suman',
      lastName: 'Singh',
      email: 'student@edyra.com',
      password: 'Suman@123',
      role: 'student',
      studentId: 'STU001',
      rollNumber: 'CS2024001',
      department: 'Computer Science',
      batch: '2024-2028',
      section: 'A',
      semester: 4,
      dateOfBirth: new Date('2000-01-01'), // formats to 01012000
      isVerified: true,
      isActive: true,
    });

    // Student 2 (Priya Patel) - EDY002
    const studentPriya = await User.create({
      firstName: 'Priya',
      lastName: 'Patel',
      email: 'priya.patel@edyra.com',
      password: 'Student@123',
      role: 'student',
      studentId: 'EDY002',
      rollNumber: '26CSE002',
      department: 'Computer Science',
      batch: '2024-2028',
      section: 'A',
      semester: 4,
      dateOfBirth: new Date('2001-05-15'),
      isVerified: true,
      isActive: true,
    });

    // Student 3 (Marcus Brown) - EDY003
    const studentMarcus = await User.create({
      firstName: 'Marcus',
      lastName: 'Brown',
      email: 'marcus.brown@edyra.com',
      password: 'Student@123',
      role: 'student',
      studentId: 'EDY003',
      rollNumber: '26CSE003',
      department: 'Computer Science',
      batch: '2024-2028',
      section: 'B',
      semester: 4,
      dateOfBirth: new Date('1999-11-20'),
      isVerified: true,
      isActive: true,
    });

    console.log('✅ Users created.');

    // 3. Create Courses
    console.log('📚 Creating courses...');
    
    const courseDSA = await Course.create({
      title: 'Data Structures and Algorithms',
      code: 'CS201',
      description: 'An in-depth study of algorithms and data structures, including lists, trees, graphs, sorting, searching, and complexity analysis.',
      category: 'Computer Science',
      department: 'Computer Science',
      semester: 4,
      credits: 4,
      instructor: teacherUser._id,
      enrolledStudents: [studentAlex._id, studentPriya._id, studentMarcus._id],
      status: 'active',
      visibility: 'public',
      schedule: {
        startDate: new Date('2026-01-05'),
        endDate: new Date('2026-05-25'),
        classDays: ['monday', 'wednesday'],
        classTime: '10:00 - 11:30'
      }
    });

    const coursePhysics = await Course.create({
      title: 'Classical Mechanics',
      code: 'PHY101',
      description: 'Newtonian mechanics, planetary motion, conservation laws, oscillations, and rigid body dynamics.',
      category: 'Physics',
      department: 'Physics',
      semester: 1,
      credits: 3,
      instructor: teacherUser._id,
      enrolledStudents: [studentAlex._id, studentPriya._id],
      status: 'active',
      visibility: 'public',
      schedule: {
        startDate: new Date('2026-01-05'),
        endDate: new Date('2026-05-25'),
        classDays: ['tuesday', 'thursday'],
        classTime: '09:00 - 10:30'
      }
    });

    console.log('✅ Courses created.');

    // 4. Create Modules and Lessons
    console.log('📂 Creating course modules and lessons...');
    
    // DSA Modules
    const module1DSA = await CourseModule.create({
      courseId: courseDSA._id,
      title: 'Introduction to Data Structures & Complexity',
      description: 'Foundations of data organization and time/space complexity analysis.',
      order: 0,
      isPublished: true,
    });

    const lesson1DSA = await CourseLesson.create({
      moduleId: module1DSA._id,
      courseId: courseDSA._id,
      title: 'Algorithm Complexity & Big O Notation',
      type: 'markdown',
      content: `# Big O Notation\n\nBig O notation is used in Computer Science to describe the performance or complexity of an algorithm. Specifically, it describes the worst-case scenario, and can be used to describe the execution time required or the space used by an algorithm.\n\n### Common Time Complexities:\n- **O(1)**: Constant Time\n- **O(log n)**: Logarithmic Time (e.g., Binary Search)\n- **O(n)**: Linear Time\n- **O(n log n)**: Linearithmic Time (e.g., Merge Sort)\n- **O(n^2)**: Quadratic Time (e.g., Bubble Sort)\n`,
      duration: 30,
      order: 0,
      isPublished: true,
    });

    const lesson2DSA = await CourseLesson.create({
      moduleId: module1DSA._id,
      courseId: courseDSA._id,
      title: 'Arrays & Linked Lists',
      type: 'markdown',
      content: `# Arrays & Linked Lists\n\nAn **Array** is a contiguous block of memory containing items of the same type. Access is O(1) by index, but insertions/deletions are O(n).\n\nA **Linked List** is a linear collection of data elements called nodes, where each node points to the next. Access is O(n), but insertion/deletion is O(1) if the pointer is known.\n`,
      duration: 45,
      order: 1,
      isPublished: true,
    });

    const module2DSA = await CourseModule.create({
      courseId: courseDSA._id,
      title: 'Linear Data Structures',
      description: 'Stacks, Queues, and their applications.',
      order: 1,
      isPublished: true,
    });

    await CourseLesson.create({
      moduleId: module2DSA._id,
      courseId: courseDSA._id,
      title: 'Stacks and Queues Operations',
      type: 'markdown',
      content: `# Stacks & Queues\n\n- **Stack**: LIFO (Last In First Out) structure. Operations: push, pop, peek.\n- **Queue**: FIFO (First In First Out) structure. Operations: enqueue, dequeue.\n`,
      duration: 40,
      order: 0,
      isPublished: true,
    });

    console.log('✅ Modules and Lessons created.');

    // 5. User Progress
    console.log('📈 Seeding user progress...');
    await UserProgress.create({
      userId: studentAlex._id,
      currentStreak: 5,
      longestStreak: 12,
      lastActivityDate: new Date(),
      totalLearningMinutes: 120,
      engagementScore: 85,
      activeCoursesCount: 2,
      completedCoursesCount: 0,
      courseProgress: [
        {
          courseId: courseDSA._id,
          completedLessons: [lesson1DSA._id],
          progressPercentage: 33,
          lastAccessedAt: new Date(),
          attendanceScore: 100,
        }
      ]
    });

    // 6. Create Assignments and Submissions
    console.log('📝 Creating assignments and submissions...');
    
    const assignment1 = await Assignment.create({
      title: 'Singly Linked List Implementation',
      description: 'Implement a Singly Linked List in Java or Python with append, insert, delete, and reverse operations.',
      course: courseDSA._id,
      createdBy: teacherUser._id,
      totalMarks: 100,
      weightage: 10,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Due in 5 days
      status: 'published',
      publishedAt: new Date(),
    });

    const assignment2 = await Assignment.create({
      title: 'Binary Search Tree Traversals',
      description: 'Implement Pre-order, In-order, and Post-order tree traversals recursively.',
      course: courseDSA._id,
      createdBy: teacherUser._id,
      totalMarks: 100,
      weightage: 10,
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // Due in 12 days
      status: 'published',
      publishedAt: new Date(),
    });

    // Submissions
    await AssignmentSubmission.create({
      assignment: assignment1._id,
      student: studentAlex._id,
      textContent: 'I have implemented the Linked List reverse operation iteratively and recursively.',
      codeContent: 'class Node:\n    def __init__(self, val):\n        self.val = val\n        self.next = None\n\ndef reverse(head):\n    prev = None\n    curr = head\n    while curr:\n        nxt = curr.next\n        curr.next = prev\n        prev = curr\n        curr = nxt\n    return prev',
      codeLanguage: 'python',
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'graded',
      marks: 95,
      totalMarks: 100,
      feedback: 'Excellent work, clean variable naming and both implementations work perfectly!',
      gradedBy: teacherUser._id,
      gradedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    });

    await AssignmentSubmission.create({
      assignment: assignment1._id,
      student: studentPriya._id,
      textContent: 'Attached is my implementation of Singly Linked List operations.',
      codeContent: 'class Node {\n  constructor(val) {\n    this.val = val;\n    this.next = null;\n  }\n}',
      codeLanguage: 'javascript',
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'graded',
      marks: 85,
      totalMarks: 100,
      feedback: 'Good implementation, but you forgot to handle empty list edge cases in delete operation.',
      gradedBy: teacherUser._id,
      gradedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    });

    await AssignmentSubmission.create({
      assignment: assignment2._id,
      student: studentAlex._id,
      textContent: 'Completed traversals coding block.',
      codeContent: 'def inorder(root):\n    return inorder(root.left) + [root.val] + inorder(root.right) if root else []',
      codeLanguage: 'python',
      submittedAt: new Date(),
      status: 'submitted',
    });

    console.log('✅ Assignments and Submissions created.');

    // 7. Create Exams
    console.log('🏁 Creating exams...');
    
    // Exam 1: Midterm Exam (Completed 2 days ago)
    const examMidterm = await Exam.create({
      title: 'Midterm Examination - Data Structures',
      description: 'Midterm theory and conceptual quiz covering complexity, arrays, linked lists, stacks, and queues.',
      subject: 'Data Structures',
      instructions: 'Please answer all questions. Fullscreen lockdown is enabled.',
      duration: 60,
      startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // lasted 4 hours
      totalMarks: 100,
      passingMarks: 40,
      allowReview: true,
      showCorrectAnswers: true,
      showExplanations: true,
      enableProctoring: true,
      detectTabSwitch: true,
      detectCopyPaste: true,
      blockRightClick: true,
      allowAllStudents: true,
      status: 'completed',
      createdBy: teacherUser._id,
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      publishedBy: teacherUser._id,
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
    });

    // Exam 2: Classical Mechanics quiz (Upcoming tomorrow)
    const examPhysics = await Exam.create({
      title: 'Final Theory Quiz - Classical Mechanics',
      description: 'Comprehensive quiz covering Newtonian mechanics, energy conservation, and central force motion.',
      subject: 'Classical Mechanics',
      instructions: 'Ensure your web camera is active. Double check browser integrity.',
      duration: 90,
      startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      totalMarks: 100,
      passingMarks: 40,
      allowReview: false,
      enableProctoring: true,
      detectTabSwitch: true,
      detectCopyPaste: true,
      blockRightClick: true,
      allowAllStudents: true,
      status: 'published',
      createdBy: teacherUser._id,
      publishedAt: new Date(),
      publishedBy: teacherUser._id,
    });

    console.log('✅ Exams created.');

    // 8. Create Exam Questions
    console.log('❓ Creating exam questions...');
    
    // MCQ helper
    const saveQuestionWithCorrectOptions = async (examId, num, text, marks, optionsData, explanation) => {
      const q = new Question({
        exam: examId,
        questionNumber: num,
        questionText: text,
        questionType: optionsData.filter(o => o.isCorrect).length > 1 ? 'mcq-multiple' : 'mcq-single',
        options: optionsData.map(o => ({ text: o.text, isCorrect: o.isCorrect })),
        marks,
        explanation,
        createdBy: adminUser._id,
      });

      // Save question so options get _id
      await q.save();

      // Update correctOptions with matches
      const correctOptionIds = q.options
        .filter((opt, i) => optionsData[i].isCorrect)
        .map(opt => opt._id);
      
      q.correctOptions = correctOptionIds;
      await q.save();
      return q;
    };

    const q1 = await saveQuestionWithCorrectOptions(
      examMidterm._id, 1,
      'What is the time complexity of searching for an element in a Balanced Binary Search Tree?',
      20,
      [
        { text: 'O(1)', isCorrect: false },
        { text: 'O(log n)', isCorrect: true },
        { text: 'O(n)', isCorrect: false },
        { text: 'O(n log n)', isCorrect: false },
      ],
      'A balanced binary search tree has a height of log n. In the worst-case, search operation takes time proportional to height, i.e., O(log n).'
    );

    const q2 = await saveQuestionWithCorrectOptions(
      examMidterm._id, 2,
      'Which of the following data structures operates on the Last In First Out (LIFO) principle?',
      20,
      [
        { text: 'Queue', isCorrect: false },
        { text: 'Stack', isCorrect: true },
        { text: 'Singly Linked List', isCorrect: false },
        { text: 'Heap', isCorrect: false },
      ],
      'A Stack stores items in a LIFO manner: the last item pushed is the first one popped.'
    );

    const q3 = await saveQuestionWithCorrectOptions(
      examMidterm._id, 3,
      'What is the worst-case time complexity of the Quick Sort algorithm?',
      20,
      [
        { text: 'O(n log n)', isCorrect: false },
        { text: 'O(n)', isCorrect: false },
        { text: 'O(n^2)', isCorrect: true },
        { text: 'O(log n)', isCorrect: false },
      ],
      'Worst case for quicksort occurs when pivot always divides the array into empty and n-1 elements, leading to O(n^2) complexity.'
    );

    const q4 = await saveQuestionWithCorrectOptions(
      examMidterm._id, 4,
      'Which of the following sorting algorithms is NOT stable?',
      20,
      [
        { text: 'Merge Sort', isCorrect: false },
        { text: 'Insertion Sort', isCorrect: false },
        { text: 'Quick Sort', isCorrect: true },
        { text: 'Bubble Sort', isCorrect: false },
      ],
      'Quick Sort is unstable as it changes the relative order of equal keys during partitioning.'
    );

    const q5 = await saveQuestionWithCorrectOptions(
      examMidterm._id, 5,
      'What is the auxiliary space complexity of Merge Sort?',
      20,
      [
        { text: 'O(1)', isCorrect: false },
        { text: 'O(log n)', isCorrect: false },
        { text: 'O(n)', isCorrect: true },
        { text: 'O(n log n)', isCorrect: false },
      ],
      'Merge Sort requires an auxiliary array of size n to merge the subarrays.'
    );

    console.log('✅ Exam questions created.');

    // 9. Seeding Student Submissions & Violations (for completed exam)
    console.log('📥 Seeding student exam submissions...');
    
    // Alex's Submission
    const submissionAlex = await Submission.create({
      exam: examMidterm._id,
      student: studentAlex._id,
      attemptNumber: 1,
      startedAt: new Date(examMidterm.startTime),
      submittedAt: new Date(examMidterm.startTime.getTime() + 35 * 60 * 1000), // 35 minutes later
      serverEndTime: new Date(examMidterm.startTime.getTime() + 60 * 60 * 1000),
      sessionId: 'sess_alex_midterm_123',
      totalMarks: 100,
      marksObtained: 80,
      percentage: 80,
      questionsAttempted: 5,
      correctAnswers: 4,
      wrongAnswers: 1,
      unattempted: 0,
      status: 'evaluated',
      submissionType: 'manual',
      totalViolations: 2,
      answers: [
        { question: q1._id, questionNumber: 1, selectedOptions: [q1.options[1]._id], visited: true, isCorrect: true, marksObtained: 20, timeTaken: 120 },
        { question: q2._id, questionNumber: 2, selectedOptions: [q2.options[1]._id], visited: true, isCorrect: true, marksObtained: 20, timeTaken: 90 },
        { question: q3._id, questionNumber: 3, selectedOptions: [q3.options[2]._id], visited: true, isCorrect: true, marksObtained: 20, timeTaken: 250 },
        { question: q4._id, questionNumber: 4, selectedOptions: [q4.options[1]._id], visited: true, isCorrect: false, marksObtained: 0, timeTaken: 180 }, // wrong choice
        { question: q5._id, questionNumber: 5, selectedOptions: [q5.options[2]._id], visited: true, isCorrect: true, marksObtained: 20, timeTaken: 140 },
      ]
    });

    // Seed Violations for Alex
    await Violation.create({
      submission: submissionAlex._id,
      exam: examMidterm._id,
      student: studentAlex._id,
      type: 'tab-switch',
      severity: 'medium',
      description: 'Candidate switched tab to external browser page.',
      ipAddress: '192.168.1.15',
      userAgent: 'Mozilla/5.0 Chrome/120.0',
      timestamp: new Date(examMidterm.startTime.getTime() + 15 * 60 * 1000),
    });

    await Violation.create({
      submission: submissionAlex._id,
      exam: examMidterm._id,
      student: studentAlex._id,
      type: 'fullscreen-exit',
      severity: 'medium',
      description: 'Candidate exited fullscreen lockdown window.',
      ipAddress: '192.168.1.15',
      userAgent: 'Mozilla/5.0 Chrome/120.0',
      timestamp: new Date(examMidterm.startTime.getTime() + 25 * 60 * 1000),
    });

    console.log('✅ Exam submissions and violations seeded.');

    // 10. Gradebook Grades
    console.log('📊 Seeding student grades...');
    const gradeDSA = new Grade({
      student: studentAlex._id,
      course: courseDSA._id,
      academicYear: '2025-2026',
      semester: 4,
      components: [
        { name: 'Midterm Exam', type: 'midterm', referenceId: examMidterm._id, marksObtained: 80, totalMarks: 100, weightage: 30 },
        { name: 'Linked List Assignment', type: 'assignment', referenceId: assignment1._id, marksObtained: 95, totalMarks: 100, weightage: 20 },
      ],
      status: 'finalized',
      remarks: 'Excellent progress, high aptitude in algorithms.',
      finalizedBy: teacherUser._id,
      finalizedAt: new Date(),
    });
    gradeDSA.calculateTotal();
    await gradeDSA.save();

    console.log('✅ Grades seeded.');

    // 11. Attendance
    console.log('📅 Seeding attendance logs...');
    
    // Day 1 Attendance
    const attendanceDay1 = new Attendance({
      course: courseDSA._id,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      session: 'morning',
      type: 'manual',
      markedBy: teacherUser._id,
      records: [
        { student: studentAlex._id, status: 'present', markedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000), method: 'manual' },
        { student: studentPriya._id, status: 'present', markedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000), method: 'manual' },
        { student: studentMarcus._id, status: 'present', markedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 1000), method: 'manual' },
      ],
    });
    attendanceDay1.calculateTotals();
    await attendanceDay1.save();

    // Day 2 Attendance
    const attendanceDay2 = new Attendance({
      course: courseDSA._id,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      session: 'morning',
      type: 'gps',
      markedBy: teacherUser._id,
      records: [
        { student: studentAlex._id, status: 'present', markedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000), method: 'gps', location: { latitude: 28.6139, longitude: 77.2090 } },
        { student: studentPriya._id, status: 'absent', method: 'manual' }, // absent
        { student: studentMarcus._id, status: 'present', markedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000), method: 'gps', location: { latitude: 28.6140, longitude: 77.2091 } },
      ],
    });
    attendanceDay2.calculateTotals();
    await attendanceDay2.save();

    console.log('✅ Attendance logs seeded.');

    // 12. Timetable
    console.log('📅 Seeding timetable...');
    await Timetable.create({
      name: 'B.Tech CSE - Semester 4 Timetable',
      department: 'Computer Science',
      semester: 4,
      academicYear: '2025-2026',
      effectiveFrom: new Date('2026-01-05'),
      createdBy: adminUser._id,
      isActive: true,
      slots: [
        { day: 'monday', startTime: '10:00', endTime: '11:30', course: courseDSA._id, instructor: teacherUser._id, room: 'LH-101', type: 'lecture' },
        { day: 'wednesday', startTime: '10:00', endTime: '11:30', course: courseDSA._id, instructor: teacherUser._id, room: 'LH-101', type: 'lecture' },
        { day: 'tuesday', startTime: '09:00', endTime: '10:30', course: coursePhysics._id, instructor: teacherUser._id, room: 'PH-302', type: 'lecture' },
        { day: 'thursday', startTime: '09:00', endTime: '10:30', course: coursePhysics._id, instructor: teacherUser._id, room: 'PH-302', type: 'lecture' },
      ]
    });
    console.log('✅ Timetable seeded.');

    // 13. ERP - Admissions
    console.log('🏛️ Seeding admissions data...');
    await Admission.create({
      applicantName: 'Rohan Sharma',
      email: 'rohan.sharma@gmail.com',
      phone: '+919876543210',
      dateOfBirth: new Date('2004-08-12'),
      gender: 'male',
      address: { street: '12 Park Ave', city: 'Delhi', state: 'Delhi', zip: '110001', country: 'India' },
      appliedFor: { department: 'Computer Science', program: 'B.Tech Computer Science', semester: 1 },
      academicYear: '2026-2027',
      status: 'applied',
    });

    await Admission.create({
      applicantName: 'Sara Khan',
      email: 'sara.khan@gmail.com',
      phone: '+919988776655',
      dateOfBirth: new Date('2004-03-24'),
      gender: 'female',
      address: { street: '45 Garden Lane', city: 'Mumbai', state: 'Maharashtra', zip: '400001', country: 'India' },
      appliedFor: { department: 'Physics', program: 'B.Sc Physics', semester: 1 },
      academicYear: '2026-2027',
      status: 'accepted',
      reviewedBy: adminUser._id,
    });

    console.log('✅ Admissions seeded.');

    // 14. ERP - Fees
    console.log('💰 Seeding fees...');
    await Fee.create({
      student: studentAlex._id,
      academicYear: '2025-2026',
      semester: 4,
      feeType: 'tuition',
      description: 'B.Tech CSE Semester 4 Tuition Fee',
      amount: 4500,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      paidAmount: 4500,
      status: 'paid',
      payments: [
        { amount: 4500, method: 'online', transactionId: 'TXN-982183210', paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), receivedBy: adminUser._id }
      ],
      createdBy: adminUser._id,
    });

    await Fee.create({
      student: studentPriya._id,
      academicYear: '2025-2026',
      semester: 4,
      feeType: 'tuition',
      description: 'B.Tech CSE Semester 4 Tuition Fee',
      amount: 4500,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // due in 15 days
      paidAmount: 0,
      status: 'pending',
      createdBy: adminUser._id,
    });

    console.log('✅ Fees seeded.');

    // 15. ERP - Library Books
    console.log('📖 Seeding library catalog...');
    await LibraryBook.create({
      title: 'Introduction to Algorithms',
      author: 'Cormen, Leiserson, Rivest, Stein',
      isbn: '978-0262033848',
      publisher: 'MIT Press',
      edition: '3rd',
      year: 2009,
      category: 'Computer Science',
      department: 'Computer Science',
      copies: 5,
      availableCopies: 4,
      location: { shelf: 'C-4', row: '3', section: 'Textbooks' },
      issuedTo: [
        { user: studentAlex._id, issuedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), status: 'issued' }
      ]
    });

    await LibraryBook.create({
      title: 'The Feynman Lectures on Physics',
      author: 'Richard Feynman',
      isbn: '978-0465023820',
      publisher: 'Basic Books',
      edition: 'New Millenium',
      year: 2011,
      category: 'Physics',
      department: 'Physics',
      copies: 2,
      availableCopies: 2,
      location: { shelf: 'P-1', row: '1', section: 'Reference' }
    });

    console.log('✅ Library catalog seeded.');

    // 16. ERP - Hostel Rooms
    console.log('🏠 Seeding hostels...');
    await HostelRoom.create({
      hostelName: 'Ramanujan Boys Hostel',
      roomNumber: '101',
      floor: 1,
      type: 'double',
      capacity: 2,
      monthlyRent: 800,
      status: 'occupied',
      block: 'A',
      occupants: [
        { student: studentAlex._id, allottedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), status: 'active' },
        { student: studentMarcus._id, allottedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), status: 'active' },
      ]
    });

    await HostelRoom.create({
      hostelName: 'Kalpana Chawla Girls Hostel',
      roomNumber: '202',
      floor: 2,
      type: 'double',
      capacity: 2,
      monthlyRent: 800,
      status: 'available',
      block: 'B',
      occupants: [
        { student: studentPriya._id, allottedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), status: 'active' }
      ]
    });

    console.log('✅ Hostel rooms seeded.');

    // 17. ERP - Transport Routes
    console.log('🚌 Seeding transport routes...');
    await TransportRoute.create({
      routeName: 'Route 4 - North Delhi Sector 15 Line',
      routeNumber: 'R-4',
      vehicleNumber: 'DL-1PB-4321',
      vehicleType: 'bus',
      driver: { name: 'Jagdish Singh', phone: '+919812345678', license: 'DL-LIC-98218' },
      capacity: 40,
      stops: [
        { name: 'Sector 12 Metro Station', arrivalTime: '08:00', departureTime: '08:05', order: 1 },
        { name: 'Sector 15 Community Center', arrivalTime: '08:15', departureTime: '08:20', order: 2 },
        { name: 'Campus Gate 1', arrivalTime: '08:45', departureTime: '08:50', order: 3 },
      ],
      assignedStudents: [studentAlex._id],
      monthlyFee: 120,
      schedule: 'both',
      isActive: true,
    });
    console.log('✅ Transport routes seeded.');

    // 18. Communications - Announcements, Notifications, Messages
    console.log('📢 Seeding communications...');
    
    // Global announcement
    await Announcement.create({
      title: 'Scheduled System Maintenance',
      content: 'The Edyra academic platform will undergo scheduled hardware maintenance this coming Sunday between 00:00 AM and 03:00 AM. Access may be temporarily interrupted.',
      type: 'maintenance',
      author: adminUser._id,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Course announcement
    await Announcement.create({
      title: 'Midterm Exam Discussion Session',
      content: 'We will hold a feedback session to review common mistakes in the midterm examination during our next lecture on Wednesday. Please review your graded submissions before class.',
      type: 'academic',
      targetAudience: 'course',
      targetCourse: courseDSA._id,
      author: teacherUser._id,
      isPublished: true,
      publishedAt: new Date(),
    });

    // Student Notifications
    await Notification.create({
      recipient: studentAlex._id,
      title: 'Assignment Graded',
      message: 'Your submission for Singly Linked List Implementation has been graded. Score: 95/100.',
      type: 'grade',
      isRead: false,
    });

    await Notification.create({
      recipient: studentAlex._id,
      title: 'New Course Announcement',
      message: 'Dr. Feynman posted a new announcement in Data Structures and Algorithms.',
      type: 'announcement',
      isRead: true,
    });

    const chatConvId = [studentAlex._id.toString(), teacherUser._id.toString()].sort().join('_');

    // Chat Message Thread (Feynman <-> Alex)
    await Message.create({
      sender: studentAlex._id,
      recipient: teacherUser._id,
      conversationId: chatConvId,
      content: 'Hello Dr. Feynman, I had a doubt regarding the Linked List reverse operation. Is it better to implement it iteratively or recursively in production systems?',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000), // 3 hours ago
    });

    await Message.create({
      sender: teacherUser._id,
      recipient: studentAlex._id,
      conversationId: chatConvId,
      content: 'Hello Alex! In production systems, an iterative implementation is generally preferred because recursive solutions consume call stack space and can cause stack overflow errors for extremely long lists (e.g. O(n) call stack size vs O(1) auxiliary space). Keep up the great analytical thinking!',
      createdAt: new Date(Date.now() - 2.5 * 3600 * 1000), // 2.5 hours ago
    });

    console.log('✅ Communications seeded.');
    console.log('\n🌟 Seeding process completed successfully! All collections populated with real academic records.');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
    process.exit(0);
  }
}

seedData();
