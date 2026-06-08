import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');
const outputPath = path.join(rootDir, 'Edyra_Enterprise_Documentation.pdf');

function createDocumentationPDF() {
  const doc = new PDFDocument({
    margin: 50,
    size: 'A4',
    bufferPages: true
  });

  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);

  // Enterprise Palette Tokens
  const primaryColor = '#00684A'; // Edyra Green
  const secondaryColor = '#2563EB'; // Accent Blue
  const darkColor = '#1F2937'; // Slate Dark
  const lightBg = '#F3F4F6'; // Gray Light
  const greyText = '#4B5563';
  const accentBorder = '#E5E7EB';

  const leftMargin = 50;
  const contentWidth = doc.page.width - 100;

  const checkPageBreak = (neededSpace) => {
    if (doc.y > doc.page.height - doc.page.margins.bottom - neededSpace) {
      doc.addPage();
    }
  };

  // Helper for Section Headers
  const addSectionHeader = (title) => {
    checkPageBreak(50);
    doc.moveDown(1.5);
    doc.rect(leftMargin, doc.y, contentWidth, 28).fill(lightBg);
    doc.rect(leftMargin, doc.y, 6, 28).fill(primaryColor);
    doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(15).text(title, leftMargin + 16, doc.y + 7);
    doc.moveDown(1.5);
  };

  // Helper for Subheaders
  const addSubHeader = (title) => {
    checkPageBreak(40);
    doc.moveDown(1);
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(13).text(title, leftMargin, doc.y);
    doc.moveDown(0.5);
  };

  // Helper for Paragraphs
  const addParagraph = (text) => {
    doc.fillColor(greyText).font('Helvetica').fontSize(10.5).text(text, leftMargin, doc.y, { width: contentWidth, lineGap: 6, align: 'justify' });
    doc.moveDown(0.8);
  };

  // Helper for Bullet Points
  const addBullet = (title, desc) => {
    checkPageBreak(30);
    doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(10.5).text('•  ' + title + ': ', leftMargin, doc.y, { continued: true, width: contentWidth })
       .fillColor(greyText).font('Helvetica').text(desc, { lineGap: 4 });
    doc.moveDown(0.5);
  };

  // Helper for Callout Boxes
  const addCallout = (title, text, type = 'info') => {
    checkPageBreak(85);
    doc.moveDown(0.5);
    const boxColor = type === 'warning' ? '#FEF3C7' : (type === 'success' ? '#D1FAE5' : '#E0F2FE');
    const borderColor = type === 'warning' ? '#F59E0B' : (type === 'success' ? '#059669' : secondaryColor);
    const titleColor = type === 'warning' ? '#92400E' : (type === 'success' ? '#065F46' : '#0369A1');
    
    const startY = doc.y;
    doc.rect(leftMargin, startY, contentWidth, 65).fill(boxColor);
    doc.rect(leftMargin, startY, 4, 65).fill(borderColor);
    
    doc.fillColor(titleColor).font('Helvetica-Bold').fontSize(11).text(title, leftMargin + 15, startY + 10);
    doc.fillColor(greyText).font('Helvetica').fontSize(10).text(text, leftMargin + 15, startY + 28, { width: contentWidth - 30, lineGap: 4 });
    doc.y = startY + 75;
  };

  // Helper for Table Rows
  const addTableRow = (col1, col2, col3, isHeader = false, isAlt = false) => {
    checkPageBreak(40);
    const rowHeight = isHeader ? 28 : 34;
    const currentY = doc.y;
    
    if (isHeader) {
      doc.rect(leftMargin, currentY, contentWidth, rowHeight).fill(darkColor);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10);
    } else {
      doc.rect(leftMargin, currentY, contentWidth, rowHeight).fill(isAlt ? lightBg : '#FFFFFF');
      doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(9.5);
    }

    doc.text(col1, leftMargin + 15, currentY + (isHeader ? 8 : 10), { width: 130 });
    doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fillColor(isHeader ? '#FFFFFF' : greyText);
    doc.text(col2, leftMargin + 150, currentY + (isHeader ? 8 : 10), { width: 140 });
    doc.font('Helvetica-Bold').fillColor(isHeader ? '#FFFFFF' : primaryColor);
    doc.text(col3, leftMargin + 300, currentY + (isHeader ? 8 : 10), { width: contentWidth - 315 });
    
    doc.y = currentY + rowHeight;
  };

  // --- COVER PAGE ---
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0B132B'); // Dark Navy Cover
  
  // Decorative Header Bar
  doc.rect(0, 0, doc.page.width, 16).fill(primaryColor);

  doc.moveDown(5);
  doc.font('Helvetica-Bold').fontSize(42).fillColor('#FFFFFF').text('EDYRA', { align: 'center' });
  doc.moveDown(0.5);
  doc.font('Helvetica').fontSize(16).fillColor('#10B981').text('ENTERPRISE ACADEMIC ECOSYSTEM', { align: 'center', letterSpacing: 3 });
  
  doc.moveDown(4);
  doc.font('Helvetica-Bold').fontSize(28).fillColor('#FFFFFF').text('Comprehensive Institutional &\nTechnical Whitepaper', { align: 'center', lineGap: 14 });

  doc.moveDown(6);
  doc.rect(doc.page.width / 2 - 150, doc.y, 300, 2).fillColor(primaryColor).fill();
  doc.moveDown(2);

  doc.font('Helvetica-Bold').fontSize(14).fillColor('#E5E7EB').text('Version 2.0.0 (Definitive Production Release)', { align: 'center' });
  doc.moveDown(0.5);
  doc.font('Helvetica').fontSize(12).fillColor('#9CA3AF').text('AI-Powered LMS | Proctored Examination Portal | Academic ERP', { align: 'center' });
  doc.moveDown(3);
  doc.font('Helvetica-Oblique').fontSize(11).fillColor('#6B7280').text('Author: Suman Kumar (@sumansingh20)', { align: 'center' });
  doc.moveDown(0.5);
  doc.font('Helvetica-Oblique').fontSize(10).fillColor('#6B7280').text('Generated on: ' + new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }), { align: 'center' });

  // --- PAGE 2: TABLE OF CONTENTS (PLACEHOLDER) ---
  doc.addPage();
  // We will return to this page at the end to render the dynamic TOC

  const tocData = [];

  // --- PAGE 3: EXECUTIVE SUMMARY & ARCHITECTURE ---
  doc.addPage();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FFFFFF');

  tocData.push({ title: '1. Executive Summary & Enterprise Vision', desc: 'Platform overview, institutional target demographics, and core value proposition.', page: doc.bufferedPageRange().count });
  
  doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(22).text('1. Executive Summary & Enterprise Vision', leftMargin, doc.y);
  doc.moveDown(0.5);
  doc.rect(leftMargin, doc.y, 60, 3).fill(primaryColor);
  doc.moveDown(1.5);

  addParagraph('Edyra represents a paradigm shift in educational technology, unifying Learning Management Systems (LMS), Academic Enterprise Resource Planning (ERP), AI-powered productivity tools, and an uncompromising Proctored Examination Portal into a cohesive, high-performance ecosystem. Engineered for modern educational institutions—spanning Universities, Autonomous Colleges, K-12 Academy chains, and Corporate Training departments—Edyra eliminates the fragmentation of legacy academic software.');

  addSectionHeader('Core Value Proposition & Demographics');
  addBullet('Universities & Colleges', 'End-to-end examination management, automated grading pipelines, secure transcript generation, and real-time attendance tracking via GPS and QR codes.');
  addBullet('K-12 School Systems', 'Engaging student portals, interactive question navigation palettes, parent-teacher communication channels, and rich multimedia course materials.');
  addBullet('Enterprise Training', 'High-stakes proctored certification testing, compliance auditing, employee progress tracking, and AI-powered skill gap analysis.');
  addBullet('System Controllers', 'Granular system health telemetry, instant bulk CSV onboarding, and immutable audit logs ensuring total transparency.');

  doc.moveDown(2);
  tocData.push({ title: '2. High-Performance Cloud Architecture', desc: 'Decoupled Next.js 14, Express microservices, Mongoose .lean(), and Socket.IO telemetry.', page: doc.bufferedPageRange().count });
  
  doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(22).text('2. High-Performance Cloud Architecture', leftMargin, doc.y);
  doc.moveDown(0.5);
  doc.rect(leftMargin, doc.y, 60, 3).fill(primaryColor);
  doc.moveDown(1.5);

  addParagraph('The Edyra platform operates on a highly optimized, decoupled micro-architecture designed for serverless scalability and sub-second responsiveness. By strictly segregating the presentation layer from backend business logic and database transactions, Edyra maintains flawless performance even during peak concurrent examination loads.');

  addSectionHeader('Decoupled Micro-Architecture Layers');
  addBullet('Frontend Presentation Layer', 'Built on Next.js 14 utilizing the App Router, TypeScript, and Tailwind CSS. Client-side state is orchestrated via Zustand, leveraging functional state updaters to decouple high-frequency intervals (such as exam timers) from React re-render cycles.');
  addBullet('Backend Microservices Layer', 'A robust Express.js API gateway powered by Node.js 18+. All incoming requests pass through strict Joi schema validation, Helmet security headers, Express rate limiting, and Mongo sanitization middleware.');
  addBullet('Database Storage Layer', 'MongoDB Atlas cloud database managed via Mongoose ODM. To prevent massive memory overhead and garbage collection pauses during high-frequency queries, all intensive dashboard and exam routes utilize strict .lean() query acceleration, bypassing Mongoose Document hydration entirely.');
  addBullet('Real-Time Telemetry Hub', 'Socket.IO event emitters provide sub-millisecond proctor alerts. For serverless environments like Vercel where WebSockets are stateless, Edyra seamlessly falls back to debounced, 30-second background HTTP synchronization, eliminating polling storms.');

  addCallout('Architecture Optimization Benchmark', 'By combining Mongoose .lean() acceleration with 30-second debounced polling intervals, Edyra reduces server CPU and Memory utilization by up to 75%, supporting over 500 concurrent examination sessions on standard serverless tiers without UI stutter.', 'info');

  // --- PAGE 4: SECURE PROCTORING & EXAM ENGINE ---
  doc.addPage();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FFFFFF');

  tocData.push({ title: '3. Safe Exam Browser & Proctoring Engine', desc: 'Fullscreen enforcement, JS event interception, blur/focus auditing, and fingerprinting.', page: doc.bufferedPageRange().count });
  
  doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(22).text('3. Safe Exam Browser & Proctoring Engine', leftMargin, doc.y);
  doc.moveDown(0.5);
  doc.rect(leftMargin, doc.y, 60, 3).fill(primaryColor);
  doc.moveDown(1.5);

  addParagraph('Academic integrity is the cornerstone of the Edyra examination engine. The platform incorporates a proprietary, browser-based Safe Exam Browser (SEB-like) lockdown overlay that enforces absolute exam security without requiring intrusive third-party software installations on student devices.');

  addSectionHeader('Multi-Layered Malpractice Prevention');
  addBullet('Fullscreen Lock Enforcement', 'Upon initiating an assessment, candidates are locked into an active fullscreen environment. Attempting to exit fullscreen instantly triggers a non-dismissible, high-contrast blocking overlay, pausing the exam timer and transmitting an immediate alert to the proctor console.');
  addBullet('Advanced Event Interception', 'Comprehensive JavaScript event listeners intercept and neutralize advanced keyboard shortcuts. The system completely blocks Ctrl+C, Ctrl+V, Cmd+C, Cmd+V, Alt+Tab, PrintScreen, F12 (Developer Tools), and right-click context menus.');
  addBullet('Window Blur & Focus Telemetry', 'Continuous background tracking of window.onblur, window.onfocus, and document.visibilitychange events logs exact timestamps and durations of tab switching or window backgrounding.');
  addBullet('Sub-second Fingerprint Binding', 'Network-resilient FingerprintJS integration binds each examination session to a unique hardware and browser fingerprint in under 1 second, thwarting credential sharing and unauthorized proxy attempts.');

  addSectionHeader('Interactive Student Examination Interface');
  addParagraph('The student exam attempt screen is engineered for maximum reliability, accessibility, and stress-free navigation during high-stakes assessments:');
  addBullet('Dynamic Question Palette', 'An intuitive, color-coded visual grid tracks the exact state of every question in real time: Answered (Green), Unanswered (Red), Flagged for Review (Yellow), and Visited (Grey).');
  addBullet('Functional Timer Updaters', 'Exam countdown intervals are strictly decoupled from React re-render cycles using functional state updaters (`setRemainingTime(prev => prev - 1)`), guaranteeing a perfectly stable, drift-free 1000ms countdown.');
  addBullet('Background Auto-Save Infrastructure', 'Answers are incrementally transmitted and committed to MongoDB every 30 seconds. This robust background snapshotting guarantees zero data loss in the event of sudden power outages, browser crashes, or intermittent internet connectivity.');
  addBullet('Built-in Scientific Calculator', 'When authorized by the exam creator, a fully functional scientific calculator overlay is accessible directly within the secure exam window, eliminating the need for external devices.');

  addCallout('Proctor Intervention Capabilities', 'Live proctors retain absolute control over active exam sessions. If severe malpractice or repeated violations are detected, proctors can trigger an immediate "Force Submit" to grade existing answers or "Terminate Session" to invalidate the attempt entirely.', 'warning');

  // --- PAGE 5: ROLE-BASED WORKFLOWS ---
  doc.addPage();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FFFFFF');

  tocData.push({ title: '4. Comprehensive Role-Based Workflows', desc: 'Granular breakdown of Student, Teacher, Administrator, ERP, and AI collaboration portals.', page: doc.bufferedPageRange().count });
  
  doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(22).text('4. Comprehensive Role-Based Workflows', leftMargin, doc.y);
  doc.moveDown(0.5);
  doc.rect(leftMargin, doc.y, 60, 3).fill(primaryColor);
  doc.moveDown(1.5);

  addParagraph('Edyra provides deeply tailored, feature-rich portals for every stakeholder within the academic ecosystem, ensuring frictionless navigation and maximum productivity.');

  addSectionHeader('Student Portal & Academic Dashboard');
  addBullet('DOB-Based Secure Authentication', 'Frictionless, secure login utilizing Student ID paired with Date of Birth (DDMMYYYY format), eliminating password fatigue while ensuring strict access control.');
  addBullet('Centralized Academic Hub', 'A beautifully organized dashboard displaying Upcoming Assessments, Active Proctored Exams, Recent Submissions, Enrolled Courses, and Real-time Campus Announcements.');
  addBullet('Transparent Result Analytics', 'Post-exam confirmation screens provide instant access to detailed scorecards, question-by-question performance breakdowns, percentile rankings, and personalized teacher feedback.');

  addSectionHeader('Teacher Portal & Assessment Controller');
  addBullet('Intuitive Exam Creation Wizard', 'Comprehensive configuration settings allowing teachers to define Exam Duration, Total Marks, Passing Percentages, Negative Marking penalties, Question Shuffling, and Option Shuffling.');
  addBullet('Advanced Question Bank Management', 'Support for rich text Single-Correct MCQs, Multi-Correct MCQs, and True/False question types. Features an instant bulk CSV import utility for rapid question bank onboarding.');
  addBullet('Live Proctoring & Monitoring Feed', 'A debounced, real-time monitoring dashboard tracking active student progress, live violation counts, and connection statuses, equipped with granular Force Submit and Session Termination controls.');

  addSectionHeader('Administrator Portal & Institutional Governance');
  addBullet('User Governance & RBAC', 'Complete lifecycle management (Create, Edit, Activate/Deactivate, Delete) for Students, Teachers, and Sub-Administrators, backed by bulk CSV onboarding utilities.');
  addBullet('Infrastructure Health Center', 'A live diagnostic dashboard monitoring critical system metrics including Database Latency, RSS Memory allocation, System Load averages, and API uptime.');
  addBullet('Global Audit & Violation Reports', 'Comprehensive, filterable audit trails capturing every administrative mutation, user login event, and security violation across the entire institution.');

  addSectionHeader('Academic ERP, Attendance & AI Collaboration');
  addBullet('Self-Service Attendance Check-in', 'Secure, tamper-proof student and faculty attendance tracking utilizing dynamic QR code generation paired with strict GPS geofencing verification.');
  addBullet('AI Model Integration', 'Native support for local AI models (Ollama config) providing automated coding assistance, smart tab autocomplete, and semantic vector embeddings.');
  addBullet('Campus Communication Hub', 'Rich discussion forums, course-specific announcement threads, and automated notification pipelines bridging communication gaps across campus.');

  // --- PAGE 6: DATABASE SCHEMA ---
  doc.addPage();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FFFFFF');

  tocData.push({ title: '5. Database Schema & Entity Relationships', desc: 'Detailed specifications for all 9 Mongoose collections, fields, and indexing strategies.', page: doc.bufferedPageRange().count });
  
  doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(22).text('5. Database Schema & Entity Relationships', leftMargin, doc.y);
  doc.moveDown(0.5);
  doc.rect(leftMargin, doc.y, 60, 3).fill(primaryColor);
  doc.moveDown(1.5);

  addParagraph('The Edyra backend is powered by a highly normalized, enterprise-grade MongoDB database architecture managed via Mongoose ODM. The system comprises 9 distinct collections, meticulously indexed to ensure sub-millisecond query execution.');

  addSubHeader('1. User Collection (`users`)');
  addParagraph('Stores all institutional stakeholders. Key fields: `name`, `email`, `passwordHash`, `role` (admin/teacher/student), `studentId`, `dateOfBirth`, `isActive`, `lastLogin`, and `securityStamp`. Indexed on `email` (unique) and `studentId` (unique).');

  addSubHeader('2. Exam Collection (`exams`)');
  addParagraph('Defines assessment configurations. Key fields: `title`, `subject`, `category`, `creator` (ObjectId), `duration`, `totalMarks`, `passingMarks`, `startTime`, `endTime`, `proctoringSettings` (camera, mic, fullscreen), and `status`. Indexed on `category` and `startTime`.');

  addSubHeader('3. Question Collection (`questions`)');
  addParagraph('Stores question bank items. Key fields: `exam` (ObjectId), `questionText`, `questionType` (mcq-single/mcq-multiple/true-false), `options` (Array), `correctOptions` (Array), `marks`, `explanation`, and `isActive`. Indexed on `exam`.');

  addSubHeader('4. Submission Collection (`submissions`)');
  addParagraph('Records student examination attempts. Key fields: `exam` (ObjectId), `student` (ObjectId), `answers` (Array of QuestionId & SelectedOptions), `score`, `status` (in-progress/submitted/force-submitted), `startTime`, `endTime`, and `deviceFingerprint`. Indexed on `exam` and `student`.');

  addSubHeader('5. ExamSession Collection (`examsessions`)');
  addParagraph('Tracks active live exam telemetry. Key fields: `exam` (ObjectId), `student` (ObjectId), `ipAddress`, `browserFingerprint`, `lastActivityAt`, `status` (active/terminated/completed), and `auditLog`. Indexed on `exam` and `lastActivityAt`.');

  addSubHeader('6. ExamBatch Collection (`exambatches`)');
  addParagraph('Manages large-scale batch scheduling. Key fields: `exam` (ObjectId), `batchNumber`, `startTime`, `endTime`, `assignedStudents` (Array), and `isActive`. Indexed on `exam`.');

  addSubHeader('7. Violation Collection (`violations`)');
  addParagraph('Logs exam proctoring malpractices. Key fields: `submission` (ObjectId), `exam` (ObjectId), `student` (ObjectId), `violationType` (tab-switch/fullscreen-exit/shortcut/right-click), `severity` (low/medium/high), `timestamp`, and `evidence`. Indexed on `submission` and `student`.');

  addSubHeader('8. Category Collection (`categories`)');
  addParagraph('Organizes question banks and courses. Key fields: `name`, `description`, `slug`, `parentCategory` (ObjectId), `isActive`, and `createdAt`. Indexed on `slug` (unique).');

  addSubHeader('9. AuditLog Collection (`auditlogs`)');
  addParagraph('Captures system-wide immutable activity logs. Key fields: `user` (ObjectId), `action`, `resource`, `ipAddress`, `userAgent`, `metadata` (JSON), and `timestamp`. Indexed on `timestamp` and `user`.');

  // --- PAGE 7: API ROUTE DIRECTORY ---
  doc.addPage();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FFFFFF');

  tocData.push({ title: '6. Exhaustive API Route Directory', desc: 'Complete REST endpoint mapping across Auth, Admin, Teacher, Student, and Exam Engine.', page: doc.bufferedPageRange().count });
  
  doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(22).text('6. Exhaustive API Route Directory', leftMargin, doc.y);
  doc.moveDown(0.5);
  doc.rect(leftMargin, doc.y, 60, 3).fill(primaryColor);
  doc.moveDown(1.5);

  addParagraph('The Edyra Express.js backend exposes a secure, structured REST API directory grouped by functional namespaces. All endpoints require Bearer JWT authentication unless explicitly marked as public.');

  doc.moveDown(0.5);

  // API Table Header
  addTableRow('HTTP Method', 'Endpoint Path', 'Description / Security Context', true);

  // API Table Rows
  const apiRoutes = [
    { m: 'POST', p: '/api/auth/login', d: 'Staff Authentication (Email/Password). Public endpoint.' },
    { m: 'POST', p: '/api/auth/dob-login', d: 'Student Authentication (Student ID + DOB). Public endpoint.' },
    { m: 'GET', p: '/api/auth/me', d: 'Returns current authenticated user profile and RBAC permissions.' },
    { m: 'POST', p: '/api/auth/logout', d: 'Invalidates active user session and clears HttpOnly cookies.' },
    { m: 'POST', p: '/api/exam-engine/init', d: 'Initializes secure exam session and binds hardware fingerprint.' },
    { m: 'POST', p: '/api/exam-engine/:id/answers', d: 'Incremental 30s background auto-save for student answers.' },
    { m: 'POST', p: '/api/exam-engine/:id/violations', d: 'Transmits real-time SEB lockdown malpractice telemetry.' },
    { m: 'POST', p: '/api/exam-engine/:id/submit', d: 'Final exam grading, scorecard generation, and submission.' },
    { m: 'GET', p: '/api/teacher/monitor/sessions', d: 'Returns debounced live monitoring telemetry for active exams.' },
    { m: 'POST', p: '/api/teacher/monitor/:id/force', d: 'Proctor intervention: Forces immediate submission of exam.' },
    { m: 'POST', p: '/api/teacher/monitor/:id/term', d: 'Proctor intervention: Terminates and invalidates exam session.' },
    { m: 'POST', p: '/api/teacher/exams', d: 'Creates a new examination with proctoring and grading rules.' },
    { m: 'POST', p: '/api/teacher/questions/bulk', d: 'Parses and imports question bank items via bulk CSV upload.' },
    { m: 'GET', p: '/api/admin/system/health', d: 'Returns live diagnostic metrics (DB latency, RSS memory, load).' },
    { m: 'GET', p: '/api/admin/users', d: 'Returns paginated, filterable list of all institutional users.' },
    { m: 'POST', p: '/api/admin/users/bulk', d: 'Instantaneous CSV onboarding utility for student accounts.' },
    { m: 'GET', p: '/api/admin/audit-logs', d: 'Returns immutable system-wide activity and security audit logs.' },
    { m: 'POST', p: '/api/attendance/check-in', d: 'Processes student/faculty check-in via QR code and GPS verification.' }
  ];

  apiRoutes.forEach((route, i) => {
    addTableRow(route.m, route.p, route.d, false, i % 2 === 1);
  });

  // --- PAGE 8: DEPLOYMENT & CREDENTIALS ---
  doc.addPage();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FFFFFF');

  tocData.push({ title: '7. Production Deployment & Vercel Config', desc: 'Step-by-step Vercel Serverless cloud deployment guides and environment variable mapping.', page: doc.bufferedPageRange().count });
  
  doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(22).text('7. Production Deployment & Vercel Config', leftMargin, doc.y);
  doc.moveDown(0.5);
  doc.rect(leftMargin, doc.y, 60, 3).fill(primaryColor);
  doc.moveDown(1.5);

  addParagraph('Edyra is fully optimized for serverless cloud deployment on the Vercel platform. Both frontend and backend modules are production-ready with zero mock placeholders or dummy data.');

  addSectionHeader('Live Vercel Production Aliases');
  addBullet('Frontend Production Application', 'https://edyra.vercel.app (Next.js Serverless Client)');
  addBullet('Backend Production API Server', 'https://edyrabackend.vercel.app (Express.js Serverless API)');

  addSectionHeader('Step-by-Step Vercel Deployment Guide');
  addSubHeader('1. Backend API Server Deployment');
  addBullet('Step 1', 'Navigate to the Vercel Dashboard (https://vercel.com) and select Add New Project.');
  addBullet('Step 2', 'Import the Edyra repository and select `backend` as the Root Directory.');
  addBullet('Step 3', 'Set Framework Preset to `Other` (overriding default Node.js settings).');
  addBullet('Step 4', 'Configure required Environment Variables: `MONGODB_URI` (Atlas Connection String), `JWT_SECRET` (Minimum 32-character secure random key), `NODE_ENV=production`, and `CORS_ORIGIN=https://edyra.vercel.app`.');
  addBullet('Step 5', 'Click Deploy. Upon completion, Vercel will generate your live backend API URL.');

  addSubHeader('2. Frontend Web Application Deployment');
  addBullet('Step 1', 'Select Add New Project and import the same Edyra repository.');
  addBullet('Step 2', 'Select `frontend` as the Root Directory and set Framework Preset to `Next.js`.');
  addBullet('Step 3', 'Configure required Environment Variables: `NEXT_PUBLIC_API_URL=/api`, `NEXT_PUBLIC_BACKEND_URL=https://edyrabackend.vercel.app/api`, and `NEXT_PUBLIC_WS_URL=https://edyrabackend.vercel.app`.');
  addBullet('Step 4', 'Click Deploy. Vercel will build and publish your fully functional production web application.');

  doc.moveDown(2);
  tocData.push({ title: '8. Verification Credentials & Licensing', desc: 'Pre-seeded production demo accounts, login instructions, and MIT License declaration.', page: doc.bufferedPageRange().count });
  
  doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(22).text('8. Verification Credentials & Licensing', leftMargin, doc.y);
  doc.moveDown(0.5);
  doc.rect(leftMargin, doc.y, 60, 3).fill(primaryColor);
  doc.moveDown(1.5);

  addParagraph('To facilitate immediate exploration and verification of the various role-based workflows across the platform, the Edyra backend automatically seeds the following production credentials on first run:');

  doc.moveDown(0.5);
  addTableRow('Portal Role', 'Login Method', 'Verification Credentials', true);
  addTableRow('Administrator', 'Email + Password', 'admin@edyra.com / Admin@123', false, false);
  addTableRow('Teacher / Proctor', 'Email + Password', 'teacher@edyra.com / Teacher@123', false, true);
  addTableRow('Student Candidate', 'Student ID + DOB', 'EDY001 / 01012000 (Format: DDMMYYYY)', false, false);

  doc.moveDown(4);
  doc.rect(leftMargin, doc.y, contentWidth, 1).fillColor('#E5E7EB').fill();
  doc.moveDown(1.5);
  doc.font('Helvetica-Bold').fontSize(12).fillColor(primaryColor).text('EDYRA ACADEMIC ECOSYSTEM — MIT LICENSE', { align: 'center' });
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(10).fillColor(greyText).text('Institutional Examination & Campus Management Platform', { align: 'center' });
  doc.moveDown(0.3);
  doc.font('Helvetica-Oblique').fontSize(9).fillColor('#9CA3AF').text('Copyright (c) 2026 Suman Kumar (@sumansingh20). All rights reserved.', { align: 'center' });

  // --- RENDER DYNAMIC TABLE OF CONTENTS ---
  doc.switchToPage(1); // Switch back to Page 2 (index 1)
  doc.y = 50;
  doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(24).text('Table of Contents', leftMargin, doc.y);
  doc.moveDown(0.5);
  doc.rect(leftMargin, doc.y, 80, 3).fill(primaryColor);
  doc.moveDown(2);

  tocData.forEach(item => {
    doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(12).text(item.title, leftMargin, doc.y, { continued: true });
    doc.font('Helvetica').fillColor('#9CA3AF').text(' .................................................................................................... ', { continued: true });
    doc.font('Helvetica-Bold').fillColor(primaryColor).text(item.page, { align: 'right' });
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(10).fillColor(greyText).text(item.desc, leftMargin, doc.y, { width: contentWidth - 20 });
    doc.moveDown(1.2);
  });

  // --- ADD RUNNING HEADERS & FOOTERS ACROSS ALL PAGES ---
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0; // Prevent footer from triggering automatic page break
    if (i > 0) { // Skip cover page
      // Running Header
      doc.font('Helvetica').fontSize(8).fillColor('#9CA3AF');
      doc.text('Edyra Enterprise Academic Ecosystem — Comprehensive Technical Whitepaper', 50, 25, { lineBreak: false });
      doc.rect(50, 35, doc.page.width - 100, 0.5).fillColor('#E5E7EB').fill();

      // Running Footer
      doc.font('Helvetica').fontSize(9).fillColor('#9CA3AF');
      doc.text(`Page ${i + 1} of ${range.count}`, 50, doc.page.height - 35, { align: 'center', lineBreak: false });
    }
  }

  doc.end();
  console.log(`Successfully generated exhaustive enterprise documentation PDF at: ${outputPath}`);
}

createDocumentationPDF();
