import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  enrolledAt: { type: Date, default: Date.now },
  enrolledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  status: {
    type: String,
    enum: ['active', 'completed', 'dropped', 'suspended', 'pending-approval'],
    default: 'active',
  },

  // Progress tracking
  progress: { type: Number, default: 0, min: 0, max: 100 },
  completedModules: [{ type: String }],
  completedLectures: [{ type: String }],
  lastAccessedAt: { type: Date },
  lastModuleId: { type: String },
  lastLectureId: { type: String },
  totalTimeSpent: { type: Number, default: 0 }, // in minutes

  // Completion
  completedAt: { type: Date },
  certificateIssued: { type: Boolean, default: false },
  certificateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' },

  // Grading
  finalGrade: { type: String },
  finalPercentage: { type: Number },
  gpa: { type: Number },

  // Notes
  notes: { type: String },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Compound index: student + course must be unique
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ course: 1, status: 1 });
enrollmentSchema.index({ student: 1, status: 1 });
enrollmentSchema.index({ enrolledAt: -1 });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;
