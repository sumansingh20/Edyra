import { User } from '../models/index.js';
import crypto from 'crypto';

export const setupCollaborationSocket = (io, socket) => {
  const userId = socket.user?._id?.toString() || 'anonymous';
  const role = socket.user?.role || 'student';

  // Join a live classroom
  socket.on('classroom:join', async (data) => {
    try {
      const { classroomId } = data;
      socket.join(`classroom_${classroomId}`);
      
      // Notify others in room
      socket.to(`classroom_${classroomId}`).emit('classroom:user_joined', {
        userId,
        socketId: socket.id,
        role
      });
      
      // Send current state (polls, whiteboard) from Redis/DB in a real app
      // Mocking empty state for now
      socket.emit('classroom:state', {
        activePoll: null,
        whiteboardState: []
      });
    } catch (err) {
      socket.emit('error', { message: 'Failed to join classroom' });
    }
  });

  // Leave a classroom
  socket.on('classroom:leave', (data) => {
    const { classroomId } = data;
    socket.leave(`classroom_${classroomId}`);
    socket.to(`classroom_${classroomId}`).emit('classroom:user_left', { userId, socketId: socket.id });
  });

  /* ========== WebRTC Signaling ========== */
  socket.on('webrtc:offer', (data) => {
    socket.to(data.targetSocketId).emit('webrtc:offer', {
      offer: data.offer,
      senderSocketId: socket.id,
      senderUserId: userId
    });
  });

  socket.on('webrtc:answer', (data) => {
    socket.to(data.targetSocketId).emit('webrtc:answer', {
      answer: data.answer,
      senderSocketId: socket.id
    });
  });

  socket.on('webrtc:ice_candidate', (data) => {
    socket.to(data.targetSocketId).emit('webrtc:ice_candidate', {
      candidate: data.candidate,
      senderSocketId: socket.id
    });
  });

  /* ========== Live Chat ========== */
  socket.on('chat:message', (data) => {
    const { classroomId, text } = data;
    const message = {
      id: crypto.randomUUID(),
      senderId: userId,
      role,
      text,
      timestamp: new Date().toISOString()
    };
    
    // Broadcast to room
    io.to(`classroom_${classroomId}`).emit('chat:message_received', message);
  });

  /* ========== Teacher Broadcasts ========== */
  socket.on('teacher:broadcast', (data) => {
    if (role !== 'teacher' && role !== 'admin') {
      return socket.emit('error', { message: 'Unauthorized' });
    }
    const { classroomId, command, payload } = data;
    socket.to(`classroom_${classroomId}`).emit('teacher:broadcast_received', { command, payload });
  });

  /* ========== Real-time Polls ========== */
  socket.on('poll:start', (data) => {
    if (role !== 'teacher' && role !== 'admin') return;
    const { classroomId, question, options } = data;
    const pollId = crypto.randomUUID();
    
    io.to(`classroom_${classroomId}`).emit('poll:started', {
      pollId, question, options
    });
  });

  socket.on('poll:vote', (data) => {
    const { classroomId, pollId, optionIndex } = data;
    // Broadcast vote to teacher (or aggregate in Redis)
    socket.to(`classroom_${classroomId}`).emit('poll:vote_received', {
      pollId, optionIndex, userId
    });
  });

  /* ========== Collaborative Whiteboard ========== */
  socket.on('whiteboard:draw', (data) => {
    const { classroomId, drawingData } = data;
    // Broadcast drawing action to all other users in room
    socket.to(`classroom_${classroomId}`).emit('whiteboard:drawn', {
      drawingData,
      userId
    });
  });
  
  socket.on('whiteboard:clear', (data) => {
    if (role !== 'teacher' && role !== 'admin') return;
    const { classroomId } = data;
    io.to(`classroom_${classroomId}`).emit('whiteboard:cleared', { userId });
  });

  /* ========== Q&A System ========== */
  socket.on('qa:ask', (data) => {
    const { classroomId, question } = data;
    io.to(`classroom_${classroomId}`).emit('qa:question_added', {
      id: crypto.randomUUID(),
      userId,
      question,
      status: 'pending',
      timestamp: new Date().toISOString()
    });
  });

  socket.on('qa:answer', (data) => {
    if (role !== 'teacher' && role !== 'admin') return;
    const { classroomId, questionId, answer } = data;
    io.to(`classroom_${classroomId}`).emit('qa:question_answered', {
      questionId,
      answer,
      answeredBy: userId,
      timestamp: new Date().toISOString()
    });
  });
};
