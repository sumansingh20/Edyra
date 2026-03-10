import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  conversationId: { type: String, required: true },
  content: { type: String, required: true, maxlength: 5000 },
  attachments: [{ name: { type: String }, url: { type: String }, type: { type: String } }],
  type: { type: String, enum: ['direct', 'group', 'course'], default: 'direct' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  groupName: { type: String },
  groupMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  readBy: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, readAt: { type: Date, default: Date.now } }],
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ recipient: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
