import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 300 },
  content: { type: String, required: true },
  type: { type: String, enum: ['general', 'academic', 'exam', 'event', 'emergency', 'maintenance'], default: 'general' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetAudience: { type: String, enum: ['all', 'students', 'teachers', 'department', 'course', 'batch'], default: 'all' },
  targetCourse: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  targetDepartment: { type: String },
  targetBatch: { type: String },
  attachments: [{ name: { type: String }, url: { type: String } }],
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
  expiresAt: { type: Date },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPinned: { type: Boolean, default: false },
}, { timestamps: true });

announcementSchema.index({ isPublished: 1, publishedAt: -1 });
announcementSchema.index({ targetAudience: 1 });
announcementSchema.index({ author: 1 });

const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;
