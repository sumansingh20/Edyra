import mongoose from 'mongoose';

const forumThreadSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 300 },
  content: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  category: { type: String, enum: ['general', 'academic', 'doubt', 'announcement', 'resource', 'discussion'], default: 'general' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPinned: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  isAnonymous: { type: Boolean, default: false },
  tags: [{ type: String }],
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 },
  replyCount: { type: Number, default: 0 },
  lastReplyAt: { type: Date },
  lastReplyBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  replies: [{
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isAnonymous: { type: Boolean, default: false },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isAnswer: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date }
  }],
  status: { type: String, enum: ['open', 'resolved', 'closed'], default: 'open' },
}, { timestamps: true });

forumThreadSchema.index({ course: 1 });
forumThreadSchema.index({ author: 1 });
forumThreadSchema.index({ category: 1 });
forumThreadSchema.index({ isPinned: -1, lastReplyAt: -1 });

const ForumThread = mongoose.model('ForumThread', forumThreadSchema);
export default ForumThread;
