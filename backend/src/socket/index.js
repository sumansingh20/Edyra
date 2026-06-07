import { setupExamSocket } from './examMonitorSocket.js';
import { setupCollaborationSocket } from './collaborationSocket.js';
import { pushNotification } from '../config/redis.js';

/* ========== CONNECTED USERS MAP ========== */
// userId -> Set of socket IDs
const connectedUsers = new Map();

const addUserSocket = (userId, socketId) => {
  if (!connectedUsers.has(userId)) connectedUsers.set(userId, new Set());
  connectedUsers.get(userId).add(socketId);
};

const removeUserSocket = (userId, socketId) => {
  const sockets = connectedUsers.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) connectedUsers.delete(userId);
  }
};

export const getOnlineUserCount = () => connectedUsers.size;
export const isUserOnline = (userId) => connectedUsers.has(userId?.toString());

/* ========== EMIT NOTIFICATION TO USER ========== */
export let globalIo = null;

export const emitToUser = (io, userId, event, data) => {
  const uid = userId?.toString();
  if (!uid || !io) return;
  io.to(`user:${uid}`).emit(event, data);
};

export const emitToRole = (io, role, event, data) => {
  if (!role || !io) return;
  io.to(`role:${role}`).emit(event, data);
};

export const emitToAll = (io, event, data) => {
  if (!io) return;
  io.emit(event, data);
};

/* ========== NOTIFICATION BROADCASTER ========== */
export const broadcastNotification = async (io, { userIds, roles, data, saveToRedis = true }) => {
  if (!io) return;
  
  const notification = {
    ...data,
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };

  // Emit to specific users
  if (userIds && userIds.length > 0) {
    for (const userId of userIds) {
      io.to(`user:${userId}`).emit('notification:new', notification);
      if (saveToRedis) {
        await pushNotification(userId, notification).catch(() => {});
      }
    }
  }

  // Emit to role rooms
  if (roles && roles.length > 0) {
    for (const role of roles) {
      io.to(`role:${role}`).emit('notification:new', notification);
    }
  }
};

/* ========== MAIN SOCKET SETUP ========== */
export const setupSockets = (io) => {
  globalIo = io;

  /* ── MAIN NAMESPACE ── */
  io.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;
    const userRole = socket.handshake.auth?.role || socket.handshake.query?.role;

    if (userId) {
      // Join user-specific room
      socket.join(`user:${userId}`);
      addUserSocket(userId, socket.id);

      // Join role room
      if (userRole) {
        socket.join(`role:${userRole}`);
      }

      console.log(`[SOCKET] User ${userId} connected (${socket.id}). Online: ${connectedUsers.size}`);

      // Broadcast updated online count to admins
      io.to('role:admin').to('role:super-admin').emit('system:online-count', {
        count: connectedUsers.size,
        timestamp: new Date().toISOString(),
      });
    }

    /* ── NOTIFICATION EVENTS ── */
    socket.on('notification:read', (data) => {
      // Client marks notification as read
      socket.emit('notification:read:ack', { id: data.id, read: true });
    });

    socket.on('notification:read-all', () => {
      socket.emit('notification:read-all:ack', { success: true });
    });

    /* ── ANNOUNCEMENT BROADCAST ── */
    // Teacher/Admin broadcasts an announcement to all students
    socket.on('announcement:broadcast', (data) => {
      const { message, targetRole, targetCourse } = data;
      if (targetRole) {
        io.to(`role:${targetRole}`).emit('announcement:new', {
          message,
          from: userId,
          targetCourse,
          timestamp: new Date().toISOString(),
        });
      } else {
        io.emit('announcement:new', {
          message,
          from: userId,
          timestamp: new Date().toISOString(),
        });
      }
    });

    /* ── LIVE CLASSROOM ── */
    socket.on('classroom:join', ({ courseId }) => {
      socket.join(`classroom:${courseId}`);
      socket.to(`classroom:${courseId}`).emit('classroom:participant-joined', {
        userId,
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('classroom:leave', ({ courseId }) => {
      socket.leave(`classroom:${courseId}`);
      socket.to(`classroom:${courseId}`).emit('classroom:participant-left', {
        userId,
        socketId: socket.id,
      });
    });

    socket.on('classroom:message', ({ courseId, message }) => {
      io.to(`classroom:${courseId}`).emit('classroom:message', {
        userId,
        message,
        timestamp: new Date().toISOString(),
      });
    });

    /* ── TYPING INDICATOR ── */
    socket.on('typing:start', ({ roomId }) => {
      socket.to(roomId).emit('typing:user', { userId, typing: true });
    });
    socket.on('typing:stop', ({ roomId }) => {
      socket.to(roomId).emit('typing:user', { userId, typing: false });
    });

    /* ── DISCONNECT ── */
    socket.on('disconnect', () => {
      if (userId) {
        removeUserSocket(userId, socket.id);
        console.log(`[SOCKET] User ${userId} disconnected. Online: ${connectedUsers.size}`);
        io.to('role:admin').to('role:super-admin').emit('system:online-count', {
          count: connectedUsers.size,
          timestamp: new Date().toISOString(),
        });
      }
    });
  });

  /* ── EXAM MONITOR NAMESPACE ── */
  try {
    setupExamSocket(io);
  } catch (e) {
    console.warn('[SOCKET] Exam socket setup failed:', e.message);
  }

  /* ── COLLABORATION NAMESPACE ── */
  try {
    setupCollaborationSocket(io);
  } catch (e) {
    console.warn('[SOCKET] Collaboration socket setup failed:', e.message);
  }

  console.log('[SOCKET.IO] All namespaces initialized');
  return io;
};

export default setupSockets;
