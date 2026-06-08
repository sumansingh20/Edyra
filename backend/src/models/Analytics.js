import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['student_performance', 'course_engagement', 'exam_integrity', 'system_usage'],
    required: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
  },
  campusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campus',
    default: null,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId, // Could be UserId, CourseId, or ExamId
    required: true,
  },
  metrics: {
    type: mongoose.Schema.Types.Mixed, // Dynamic schema for different types of metrics
    required: true,
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'all_time'],
    default: 'daily',
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

analyticsSchema.index({ type: 1, targetId: 1, period: 1 });
analyticsSchema.index({ organizationId: 1 });

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;
