import mongoose from 'mongoose';

const userProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  
  // Learning Streaks
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActivityDate: { type: Date }, // To calculate streaks
  
  // Engagement Scoring
  totalLearningMinutes: { type: Number, default: 0 },
  engagementScore: { type: Number, default: 0 }, // Custom algorithm score
  
  // Overall course metrics
  completedCoursesCount: { type: Number, default: 0 },
  activeCoursesCount: { type: Number, default: 0 },
  
  // Detailed Course Progress
  courseProgress: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CourseLesson' }],
    progressPercentage: { type: Number, default: 0 },
    lastAccessedAt: { type: Date },
    completedAt: { type: Date },
    attendanceScore: { type: Number, default: 100 }, // Attendance %
  }],
}, { timestamps: true });

// userId index created automatically via unique:true
userProgressSchema.index({ 'courseProgress.courseId': 1 });

export const UserProgress = mongoose.model('UserProgress', userProgressSchema);
