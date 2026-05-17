import { ForumThread, Message, Announcement, Notification } from '../models/index.js';
import AppError from '../utils/AppError.js';

// ===== FORUM =====
export const getThreads = async (req, res, next) => {
  try {
    const { courseId, category, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (courseId) filter.course = courseId;
    if (category) filter.category = category;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const threads = await ForumThread.find(filter)
      .populate('author', 'firstName lastName role')
      .populate('course', 'title code')
      .sort({ isPinned: -1, lastReplyAt: -1, createdAt: -1 })
      .skip(skip).limit(parseInt(limit));

    const total = await ForumThread.countDocuments(filter);
    res.json({ success: true, data: { threads, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { next(error); }
};

export const getThread = async (req, res, next) => {
  try {
    const thread = await ForumThread.findById(req.params.id)
      .populate('author', 'firstName lastName role profileImage')
      .populate('replies.author', 'firstName lastName role profileImage')
      .populate('course', 'title code');
    if (!thread) throw new AppError('Thread not found', 404);

    thread.views++;
    await thread.save();
    res.json({ success: true, data: { thread } });
  } catch (error) { next(error); }
};

export const createThread = async (req, res, next) => {
  try {
    const threadData = { ...req.body, author: req.user._id };
    const thread = await ForumThread.create(threadData);
    res.status(201).json({ success: true, data: { thread } });
  } catch (error) { next(error); }
};

export const replyToThread = async (req, res, next) => {
  try {
    const thread = await ForumThread.findById(req.params.id);
    if (!thread) throw new AppError('Thread not found', 404);
    if (thread.isLocked) throw new AppError('Thread is locked', 400);

    thread.replies.push({
      content: req.body.content,
      author: req.user._id,
      isAnonymous: req.body.isAnonymous || false
    });
    thread.replyCount = thread.replies.length;
    thread.lastReplyAt = new Date();
    thread.lastReplyBy = req.user._id;
    await thread.save();

    // Notify thread author
    if (thread.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: thread.author,
        type: 'message',
        title: 'New Reply',
        message: `Someone replied to your thread: "${thread.title}"`,
        referenceId: thread._id,
        referenceModel: 'ForumThread'
      });
    }

    res.status(201).json({ success: true, data: { reply: thread.replies[thread.replies.length - 1] } });
  } catch (error) { next(error); }
};

export const upvoteThread = async (req, res, next) => {
  try {
    const thread = await ForumThread.findById(req.params.id);
    if (!thread) throw new AppError('Thread not found', 404);

    const idx = thread.upvotes.indexOf(req.user._id);
    if (idx > -1) thread.upvotes.splice(idx, 1);
    else thread.upvotes.push(req.user._id);
    await thread.save();
    res.json({ success: true, data: { upvotes: thread.upvotes.length } });
  } catch (error) { next(error); }
};

// ===== MESSAGING =====
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Message.aggregate([
      { $match: { $or: [{ sender: req.user._id }, { recipient: req.user._id }, { groupMembers: req.user._id }] } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$conversationId', lastMessage: { $first: '$$ROOT' }, unreadCount: { $sum: { $cond: [{ $and: [{ $ne: ['$sender', req.user._id] }, { $not: { $in: [req.user._id, '$readBy.user'] } }] }, 1, 0] } } } },
      { $sort: { 'lastMessage.createdAt': -1 } },
      { $limit: 50 }
    ]);

    // Populate sender info
    await Message.populate(conversations, { path: 'lastMessage.sender', select: 'firstName lastName profileImage', model: 'User' });
    await Message.populate(conversations, { path: 'lastMessage.recipient', select: 'firstName lastName profileImage', model: 'User' });

    res.json({ success: true, data: { conversations } });
  } catch (error) { next(error); }
};

export const getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ conversationId: req.params.conversationId })
      .populate('sender', 'firstName lastName profileImage')
      .sort({ createdAt: -1 })
      .skip(skip).limit(parseInt(limit));

    // Mark as read
    await Message.updateMany(
      { conversationId: req.params.conversationId, sender: { $ne: req.user._id }, 'readBy.user': { $ne: req.user._id } },
      { $push: { readBy: { user: req.user._id, readAt: new Date() } } }
    );

    res.json({ success: true, data: { messages: messages.reverse() } });
  } catch (error) { next(error); }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { recipientId, content, attachments, type, courseId, groupName, groupMembers } = req.body;

    let conversationId;
    if (type === 'direct') {
      const ids = [req.user._id.toString(), recipientId].sort();
      conversationId = `dm_${ids[0]}_${ids[1]}`;
    } else if (type === 'group') {
      conversationId = req.body.conversationId || `grp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } else if (type === 'course') {
      conversationId = `course_${courseId}`;
    }

    const message = await Message.create({
      sender: req.user._id,
      recipient: recipientId,
      conversationId,
      content,
      attachments: attachments || [],
      type: type || 'direct',
      courseId,
      groupName,
      groupMembers
    });

    await message.populate('sender', 'firstName lastName profileImage');

    // Notify recipient
    if (recipientId) {
      await Notification.create({
        recipient: recipientId,
        type: 'message',
        title: 'New Message',
        message: `${req.user.firstName} sent you a message`,
        referenceId: message._id,
        referenceModel: 'Message'
      });
    }

    res.status(201).json({ success: true, data: { message } });
  } catch (error) { next(error); }
};

// ===== ANNOUNCEMENTS =====
export const getAnnouncements = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const filter = { isPublished: true };
    if (type) filter.type = type;

    // Filter by target audience
    const targetFilters = [{ targetAudience: 'all' }];
    if (req.user.role === 'student') targetFilters.push({ targetAudience: 'students' });
    if (req.user.role === 'teacher') targetFilters.push({ targetAudience: 'teachers' });
    if (req.user.department) targetFilters.push({ targetAudience: 'department', targetDepartment: req.user.department });
    if (req.user.batch) targetFilters.push({ targetAudience: 'batch', targetBatch: req.user.batch });
    filter.$or = targetFilters;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const announcements = await Announcement.find(filter)
      .populate('author', 'firstName lastName role')
      .sort({ isPinned: -1, publishedAt: -1 })
      .skip(skip).limit(parseInt(limit));

    const total = await Announcement.countDocuments(filter);
    res.json({ success: true, data: { announcements, total } });
  } catch (error) { next(error); }
};

export const createAnnouncement = async (req, res, next) => {
  try {
    const data = { ...req.body, author: req.user._id };
    if (req.body.isPublished) data.publishedAt = new Date();
    const announcement = await Announcement.create(data);
    res.status(201).json({ success: true, data: { announcement } });
  } catch (error) { next(error); }
};

export const updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) throw new AppError('Announcement not found', 404);
    Object.assign(announcement, req.body);
    if (req.body.isPublished && !announcement.publishedAt) announcement.publishedAt = new Date();
    await announcement.save();
    res.json({ success: true, data: { announcement } });
  } catch (error) { next(error); }
};

export const deleteAnnouncement = async (req, res, next) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) { next(error); }
};

// ===== NOTIFICATIONS =====
export const getNotifications = async (req, res, next) => {
  try {
    const { unreadOnly, page = 1, limit = 30 } = req.query;
    const filter = { recipient: req.user._id };
    if (unreadOnly === 'true') filter.isRead = false;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip).limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) { next(error); }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true, readAt: new Date() });
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) { next(error); }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) { next(error); }
};

export default {
  getThreads, getThread, createThread, replyToThread, upvoteThread,
  getConversations, getMessages, sendMessage,
  getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  getNotifications, markNotificationRead, markAllNotificationsRead
};
