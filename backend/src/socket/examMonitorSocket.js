import ExamSession from '../models/ExamSession.js';
import ExamBatch from '../models/ExamBatch.js';
import Exam from '../models/Exam.js';
import Violation from '../models/Violation.js';
import Submission from '../models/Submission.js';
import { autoSubmitExam } from '../controllers/studentController.js';

// Map violation types to severity levels
const getViolationSeverity = (type) => {
  const severityMap = {
    // Browser / tab switching
    'tab-switch': 'medium',
    'tab_switch': 'medium',
    'window-blur': 'medium',
    'window_blur': 'medium',
    'multiple-tabs': 'high',
    'multiple_tabs': 'high',
    'fullscreen-exit': 'medium',
    'fullscreen_exit': 'medium',

    // Copy/paste / devtools
    'copy-attempt': 'high',
    'copy_attempt': 'high',
    'paste-attempt': 'high',
    'paste_attempt': 'high',
    'right-click': 'low',
    'right_click': 'low',
    'keyboard-shortcut': 'medium',
    'blocked_shortcut': 'medium',
    'devtools-open': 'critical',
    'dev_tools': 'critical',
    'screenshot-attempt': 'high',
    'print-attempt': 'high',
    'suspicious-shortcut': 'medium',

    // Identity/device
    'failed_login': 'high',
    'ip_change': 'critical',
    'browser_change': 'critical',
    'fingerprint_mismatch': 'critical',
    'multiple_login': 'critical',

    // Connection / activity
    'connection_lost': 'low',
    'inactivity': 'low',
    'navigation': 'medium',
    'navigation_attempt': 'medium',

    // Multi-angle proctoring
    'primary-camera-off': 'critical',
    'secondary-camera-off': 'high',
    'camera-disconnected': 'high',
    'microphone-disabled': 'high',
    'audio-activity-lost': 'medium',
    'face-not-visible': 'high',
    'multiple-faces': 'critical',
    'unauthorized-person-detected': 'critical',
    'desk-violation': 'high',
    'desk-unauthorized-person': 'critical',
    'device-detected': 'high',
    'suspicious-device-detected': 'critical',
    'head-movement-suspicious': 'medium',
    'eye-gaze-mismatch': 'medium',
    'room-environment-violation': 'high',

    // Defaults
    'other': 'low',
  };
  return severityMap[type] || 'medium';
};

const findSubmissionForSession = (session) => {
  return Submission.findOne({
    sessionId: session.sessionToken,
    exam: session.exam,
    student: session.student,
  });
};

const finalizeLinkedSubmission = async (session, type, reason, ipAddress) => {
  const submission = await findSubmissionForSession(session);
  if (!submission || submission.status !== 'in-progress') {
    return null;
  }

  submission.totalViolations = Math.max(
    submission.totalViolations || 0,
    session.violationCount || 0
  );

  return autoSubmitExam(submission, type, {
    reason,
    ipAddress,
    totalViolations: submission.totalViolations,
  });
};

export const setupExamSocket = (io) => {
  // Namespace for exam monitoring (teachers/admins)
  const monitorNamespace = io.of('/exam-monitor');
  
  // Namespace for student exam sessions
  const examNamespace = io.of('/exam-session');
  
  // ==========================================
  // TEACHER/ADMIN MONITORING NAMESPACE
  // ==========================================
  monitorNamespace.on('connection', async (socket) => {
    // console.log('[Monitor] Connected:', socket.id);
    
    // Join exam monitoring room
    socket.on('join-exam-monitor', async ({ examId, token }) => {
      try {
        // Verify teacher/admin token
        // In production, decode JWT and verify role
        socket.examId = examId;
        socket.join(`exam-${examId}`);
        
        // Send initial stats
        const stats = await getExamStats(examId);
        socket.emit('exam-stats', stats);
        


        // console.log(`[Monitor] Joined exam ${examId}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to join monitor' });
      }
    });
    
    // Request live stats refresh
    socket.on('request-stats', async () => {
      if (socket.examId) {
        const stats = await getExamStats(socket.examId);
        socket.emit('exam-stats', stats);
      }
    });
    
    // Force submit specific student
    socket.on('force-submit-student', async ({ sessionToken, sessionId, reason }) => {
      try {
        const query = sessionId ? { _id: sessionId } : { sessionToken };
        const session = await ExamSession.findOne(query);
        if (session && session.status === 'active') {
          const finalized = await finalizeLinkedSubmission(
            session,
            'admin-force',
            reason || 'admin_action',
            socket.handshake.address
          );
          if (!finalized) {
            await session.forceSubmit(reason || 'admin_action', socket.handshake.address);
          }
          
          // Notify all monitors
          monitorNamespace.to(`exam-${session.exam}`).emit('student-force-submitted', {
            studentId: session.student,
            reason,
          });
          
          // Notify student
          examNamespace.to(`session-${session.sessionToken}`).emit('force-submit', {
            reason: 'Your exam has been submitted by the administrator.',
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Force submit failed' });
      }
    });
    
    // Terminate session (violation override)
    socket.on('terminate-session', async ({ sessionToken, sessionId, reason }) => {
      try {
        const query = sessionId ? { _id: sessionId } : { sessionToken };
        const session = await ExamSession.findOne(query);
        if (session) {
          const finalized = await finalizeLinkedSubmission(
            session,
            'auto-violation',
            reason || 'Session terminated by administrator.',
            socket.handshake.address
          );
          if (!finalized) {
            session.status = 'violation_terminated';
            session.terminatedBy = 'admin';
            session.terminationReason = reason;
            session.submittedAt = new Date();
            session.auditLog.push({
              action: 'admin_terminated',
              details: { reason },
              timestamp: new Date(),
            });
            await session.save();
          }
          
          // Notify student
          examNamespace.to(`session-${session.sessionToken}`).emit('session-terminated', {
            reason: reason || 'Session terminated by administrator.',
          });
          
          // Notify monitors
          monitorNamespace.to(`exam-${session.exam}`).emit('session-terminated-alert', {
            studentId: session.student,
            reason,
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Termination failed' });
      }
    });
    
    // Broadcast message to all students
    socket.on('broadcast-message', async ({ message }) => {
      if (socket.examId) {
        examNamespace.to(`exam-students-${socket.examId}`).emit('admin-message', {
          message,
          timestamp: new Date(),
        });
      }
    });
    
    socket.on('disconnect', () => {
      // console.log('[Monitor] Disconnected:', socket.id);
    });
  });
  
  // ==========================================
  // STUDENT EXAM SESSION NAMESPACE
  // ==========================================
  examNamespace.on('connection', async (socket) => {
    // console.log('[Exam] Student connected:', socket.id);
    
    // Join exam session room
    socket.on('join-exam', async ({ sessionToken, fingerprint }) => {
      try {
        const session = await ExamSession.findOne({ sessionToken }).populate('exam');
        
        if (!session) {
          socket.emit('error', { message: 'Invalid session', code: 'INVALID_SESSION' });
          return;
        }
        
        // Validate fingerprint
        if (session.browserFingerprint !== fingerprint) {
          await session.addViolation(
            'fingerprint_mismatch',
            'Browser fingerprint mismatch detected',
            socket.handshake.address
          );
          socket.emit('error', { message: 'Invalid device', code: 'DEVICE_MISMATCH' });
          return;
        }
        
        // Store session info
        socket.sessionToken = sessionToken;
        socket.examId = session.exam._id.toString();
        socket.studentId = session.student.toString();
        
        // Join rooms
        socket.join(`session-${sessionToken}`);
        socket.join(`exam-students-${socket.examId}`);
        
        // Update session socket
        session.socketId = socket.id;
        session.lastActivityAt = new Date();
        await session.save();
        
        // Send initial state
        socket.emit('session-joined', {
          remainingTime: session.getRemainingTime(),
          serverTime: new Date().toISOString(),
          status: session.status,
          violationCount: session.violationCount,
          maxViolations: session.maxViolationsAllowed,
        });
        
        // Notify monitors
        monitorNamespace.to(`exam-${socket.examId}`).emit('student-joined', {
          studentId: session.student,
          socketId: socket.id,
        });
        
        // console.log(`[Exam] Student joined session: ${sessionToken}`);
        
      } catch (error) {
        // console.error('[Exam] Join error:', error);
        socket.emit('error', { message: 'Failed to join exam' });
      }
    });
    
    // Report violation from client (supports multi-angle proctoring)
    socket.on('violation', async ({ type, details, angle }) => {
      if (!socket.sessionToken) return;
      
      try {
        const session = await ExamSession.findOne({ sessionToken: socket.sessionToken });
        if (!session || session.status !== 'active') return;
        
        const terminated = await session.addViolation(
          type,
          details,
          socket.handshake.address
        );
        
        // Log to Violation model
        // Note: current Violation schema does not include `angle` field.
        // We embed it into description so UI can display it.
        const description = angle ? `[${angle}] ${details || ''}`.trim() : details;
        const linkedSubmission = await findSubmissionForSession(session);
        
        await Violation.create({
          exam: session.exam,
          student: session.student,
          submission: linkedSubmission?._id || null,
          type,
          severity: getViolationSeverity(type),
          description,
          ipAddress: socket.handshake.address,
          timestamp: new Date(),
        });

        if (linkedSubmission && linkedSubmission.status === 'in-progress') {
          linkedSubmission.totalViolations = session.violationCount;
          if (terminated) {
            await autoSubmitExam(linkedSubmission, 'auto-violation', {
              reason: 'Maximum violations exceeded',
              ipAddress: socket.handshake.address,
              totalViolations: session.violationCount,
            });
          } else {
            await linkedSubmission.save();
          }
        }
        
        // Acknowledge violation
        socket.emit('violation-recorded', {
          type,
          angle: angle || null,
          violationCount: session.violationCount,
          maxViolations: session.maxViolationsAllowed,
          terminated,
        });
        
        // Notify monitors
        monitorNamespace.to(`exam-${session.exam}`).emit('violation-alert', {
          studentId: session.student,
          type,
          angle: angle || null,
          details,
          violationCount: session.violationCount,
          terminated,
        });
        
        if (terminated) {
          socket.emit('session-terminated', {
            reason: 'Maximum violations exceeded. Your exam has been automatically submitted.',
          });
        }
        
      } catch (error) {
        // console.error('[Exam] Violation error:', error);
      }
    });
    
    // Save answer (real-time)
    socket.on('save-answer', async ({ questionId, answer }) => {
      if (!socket.sessionToken) return;
      
      try {
        const session = await ExamSession.findOne({ sessionToken: socket.sessionToken });
        if (!session || session.status !== 'active') {
          socket.emit('save-failed', { reason: 'Session not active' });
          return;
        }
        
        if (session.isExpired()) {
          await session.forceSubmit('time_expired', socket.handshake.address);
          socket.emit('time-expired');
          return;
        }
        
        await session.saveAnswer(questionId, answer, socket.handshake.address);
        
        socket.emit('answer-saved', {
          questionId,
          autoSaveCount: session.autoSaveCount,
          remainingTime: session.getRemainingTime(),
        });
        
      } catch (error) {
        // console.error('[Exam] Save answer error:', error);
        socket.emit('save-failed', { reason: 'Save failed' });
      }
    });
    
    // Submit exam
    socket.on('submit-exam', async () => {
      if (!socket.sessionToken) return;
      
      try {
        const session = await ExamSession.findOne({ sessionToken: socket.sessionToken });
        if (!session) return;
        
        if (session.status === 'submitted' || session.status === 'force_submitted') {
          socket.emit('already-submitted');
          return;
        }
        
        await session.submit(socket.handshake.address);
        
        // Update batch stats
        const batch = await ExamBatch.findOne({
          exam: session.exam,
          batchNumber: session.batch,
        });
        if (batch) {
          batch.totalSubmitted += 1;
          batch.totalViolations += session.violationCount;
          await batch.save();
        }
        
        socket.emit('exam-submitted', {
          submittedAt: session.submittedAt,
          answeredQuestions: session.answers.length,
        });
        
        // Notify monitors
        monitorNamespace.to(`exam-${session.exam}`).emit('student-submitted', {
          studentId: session.student,
          answeredQuestions: session.answers.length,
        });
        
      } catch (error) {
        // console.error('[Exam] Submit error:', error);
        socket.emit('submit-failed', { reason: 'Submission failed' });
      }
    });
    
    // Heartbeat/sync
    socket.on('heartbeat', async () => {
      if (!socket.sessionToken) return;
      
      try {
        const session = await ExamSession.findOne({ sessionToken: socket.sessionToken });
        if (!session) return;
        
        session.lastActivityAt = new Date();
        await session.save();
        
        if (session.isExpired()) {
          await session.forceSubmit('time_expired', socket.handshake.address);
          socket.emit('time-expired');
          return;
        }
        
        socket.emit('heartbeat-response', {
          remainingTime: session.getRemainingTime(),
          serverTime: new Date().toISOString(),
          status: session.status,
        });
        
      } catch (error) {
        // console.error('[Exam] Heartbeat error:', error);
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', async (reason) => {
      // console.log(`[Exam] Student disconnected: ${socket.id}, reason: ${reason}`);
      
      if (socket.sessionToken) {
        try {
          const session = await ExamSession.findOne({ sessionToken: socket.sessionToken });
          if (session && session.status === 'active') {
            // Log disconnection as potential violation
            await session.addViolation(
              'connection_lost',
              `Socket disconnected: ${reason}`,
              socket.handshake.address
            );
            
            // Notify monitors
            monitorNamespace.to(`exam-${session.exam}`).emit('student-disconnected', {
              studentId: session.student,
              reason,
              lastActivity: session.lastActivityAt,
            });
          }
        } catch (error) {
          // console.error('[Exam] Disconnect handling error:', error);
        }
      }
    });
  });
  
  // ==========================================
  // PERIODIC TASKS
  // ==========================================
  
  // Check for expired sessions every 30 seconds
  setInterval(async () => {
    try {
      const expiredSessions = await ExamSession.find({
        status: 'active',
        serverEndTime: { $lte: new Date() },
      });
      
      for (const session of expiredSessions) {
        await session.forceSubmit('time_expired', 'system');
        
        // Notify student
        examNamespace.to(`session-${session.sessionToken}`).emit('time-expired');
        
        // Notify monitors
        monitorNamespace.to(`exam-${session.exam}`).emit('student-time-expired', {
          studentId: session.student,
        });
      }
    } catch (error) {
      // console.error('[System] Expired session check error:', error);
    }
  }, 30000);
  
  // Check for inactive sessions (no activity for 5 minutes)
  setInterval(async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const inactiveSessions = await ExamSession.find({
        status: 'active',
        lastActivityAt: { $lte: fiveMinutesAgo },
      });
      
      for (const session of inactiveSessions) {
        await session.addViolation(
          'inactivity',
          'No activity detected for 5 minutes',
          'system'
        );
        
        // Notify monitors
        monitorNamespace.to(`exam-${session.exam}`).emit('student-inactive-alert', {
          studentId: session.student,
          lastActivity: session.lastActivityAt,
        });
      }
    } catch (error) {
      // console.error('[System] Inactive session check error:', error);
    }
  }, 60000);
  
  // Broadcast stats every 10 seconds
  setInterval(async () => {
    try {
      const activeExams = await Exam.find({ status: { $in: ['published', 'ongoing'] } });
      
      for (const exam of activeExams) {
        const stats = await getExamStats(exam._id);
        monitorNamespace.to(`exam-${exam._id}`).emit('exam-stats', stats);
      }
    } catch (error) {
      // console.error('[System] Stats broadcast error:', error);
    }
  }, 10000);
  
  return { monitorNamespace, examNamespace };
};

// Helper: Get exam statistics
async function getExamStats(examId) {
  const [
    totalSessions,
    activeSessions,
    submittedSessions,
    forceSubmittedSessions,
    terminatedSessions,
    totalViolations,
    batches,
  ] = await Promise.all([
    ExamSession.countDocuments({ exam: examId }),
    ExamSession.countDocuments({ exam: examId, status: 'active' }),
    ExamSession.countDocuments({ exam: examId, status: 'submitted' }),
    ExamSession.countDocuments({ exam: examId, status: 'force_submitted' }),
    ExamSession.countDocuments({ exam: examId, status: { $in: ['terminated', 'violation_terminated'] } }),
    Violation.countDocuments({ exam: examId }),
    ExamBatch.find({ exam: examId }).sort({ batchNumber: 1 }).lean(),
  ]);
  
  const activeBatch = batches.find(b => b.status === 'active');
  const completedBatches = batches.filter(b => b.status === 'completed').length;
  
  // Get recent violations
  const recentViolations = await Violation.find({ exam: examId })
    .sort({ timestamp: -1 })
    .limit(10)
    .populate('student', 'firstName lastName studentId')
    .lean();
  
  // Get active students list
  const activeStudents = await ExamSession.find({ exam: examId, status: 'active' })
    .populate('student', 'firstName lastName studentId')
    .select('student currentQuestionIndex answers violationCount lastActivityAt')
    .lean();
  
  return {
    totalSessions,
    activeSessions,
    submittedSessions,
    forceSubmittedSessions,
    terminatedSessions,
    totalViolations,
    currentBatch: activeBatch?.batchNumber || null,
    totalBatches: batches.length,
    completedBatches,
    recentViolations: recentViolations.map(v => ({
      id: v._id,
      student: v.student ? `${v.student.firstName} ${v.student.lastName}` : 'Unknown',
      studentId: v.student?.studentId,
      type: v.type,
      timestamp: v.timestamp,
    })),
    activeStudents: activeStudents.map(s => ({
      studentId: s.student?._id,
      name: s.student ? `${s.student.firstName} ${s.student.lastName}` : 'Unknown',
      rollNo: s.student?.studentId,
      currentQuestion: s.currentQuestionIndex + 1,
      answeredCount: s.answers?.length || 0,
      violationCount: s.violationCount || 0,
      lastActivity: s.lastActivityAt,
    })),
    updatedAt: new Date(),
  };
}

export default setupExamSocket;
