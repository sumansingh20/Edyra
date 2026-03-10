import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getThreads, getThread, createThread, replyToThread, upvoteThread,
  getConversations, getMessages, sendMessage,
  getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  getNotifications, markNotificationRead, markAllNotificationsRead
} from '../controllers/communicationController.js';

const router = express.Router();
router.use(authenticate);

// Forum
router.get('/forum/threads', getThreads);
router.get('/forum/threads/:id', getThread);
router.post('/forum/threads', createThread);
router.post('/forum/threads/:id/reply', replyToThread);
router.post('/forum/threads/:id/upvote', upvoteThread);

// Messaging
router.get('/messages/conversations', getConversations);
router.get('/messages/:conversationId', getMessages);
router.post('/messages', sendMessage);

// Announcements
router.get('/announcements', getAnnouncements);
router.post('/announcements', authorize('admin', 'super-admin', 'institute-admin', 'teacher'), createAnnouncement);
router.put('/announcements/:id', authorize('admin', 'super-admin', 'institute-admin', 'teacher'), updateAnnouncement);
router.delete('/announcements/:id', authorize('admin', 'super-admin', 'institute-admin'), deleteAnnouncement);

// Notifications
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.put('/notifications/read-all', markAllNotificationsRead);

export default router;
