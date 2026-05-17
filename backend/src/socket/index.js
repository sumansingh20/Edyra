import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { User, Notification, ExamSession } from '../models/index.js';
import { setupCollaborationSocket } from './collaborationSocket.js';

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }
      
      const decoded = jwt.verify(token, config.jwt.accessSecret);
      const user = await User.findById(decoded.id || decoded.userId).select('role firstName lastName isActive');
      
      if (!user || !user.isActive) {
        return next(new Error('Authentication error: User invalid'));
      }
      
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid Token'));
    }
  });

  // Room tracking
  const userSockets = new Map(); // userId -> Set of socketIds

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`[Socket.io] User connected: ${userId} (${socket.user.role})`);

    // Track user's sockets
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Join common rooms based on role
    socket.join(`role:${socket.user.role}`);
    socket.join(`user:${userId}`);

    // EXAM EVENTS
    socket.on('exam:join_session', async (data) => {
      const { sessionId, examId } = data;
      socket.join(`exam:${examId}`);
      socket.join(`session:${sessionId}`);
      
      // Notify proctors
      if (socket.user.role === 'student') {
        io.to(`exam_proctor:${examId}`).emit('proctor:student_joined', {
          userId,
          sessionId,
          name: `${socket.user.firstName} ${socket.user.lastName}`,
          timestamp: new Date()
        });
      }
    });

    socket.on('exam:violation', async (data) => {
      const { sessionId, examId, violationType, description } = data;
      // Emit to exam proctors
      io.to(`exam_proctor:${examId}`).emit('proctor:violation_alert', {
        userId,
        sessionId,
        name: `${socket.user.firstName} ${socket.user.lastName}`,
        violationType,
        description,
        timestamp: new Date()
      });
    });

    socket.on('exam:join_proctor', (data) => {
      if (['admin', 'super-admin', 'teacher', 'invigilator'].includes(socket.user.role)) {
        socket.join(`exam_proctor:${data.examId}`);
      }
    });
    
    // CHAT & CLASSROOM EVENTS
    socket.on('chat:join_room', (data) => {
      socket.join(`chat:${data.roomId}`);
    });

    socket.on('chat:send_message', (data) => {
      const { roomId, message, type } = data;
      io.to(`chat:${roomId}`).emit('chat:receive_message', {
        sender: {
          id: userId,
          name: `${socket.user.firstName} ${socket.user.lastName}`,
          role: socket.user.role
        },
        message,
        type: type || 'text',
        timestamp: new Date()
      });
    });

    // Setup enterprise collaboration and WebRTC handlers
    setupCollaborationSocket(io, socket);

    // Handle Disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket.io] User disconnected: ${userId}`);
      if (userSockets.has(userId)) {
        userSockets.get(userId).delete(socket.id);
        if (userSockets.get(userId).size === 0) {
          userSockets.delete(userId);
          // Can emit offline status here if needed
        }
      }
    });
  });

  return io;
};

export default initializeSocket;
