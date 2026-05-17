import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 300 },
  description: { type: String, trim: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['assignment', 'project', 'lab', 'homework', 'coding'], default: 'assignment' },
  instructions: { type: String },
  attachments: [{ name: { type: String }, url: { type: String }, type: { type: String } }],
  totalMarks: { type: Number, required: true, min: 0 },
  weightage: { type: Number, default: 0, min: 0, max: 100 },
  dueDate: { type: Date, required: true },
  lateSubmissionAllowed: { type: Boolean, default: false },
  latePenaltyPerDay: { type: Number, default: 10, min: 0, max: 100 },
  maxLatedays: { type: Number, default: 3 },
  allowedFileTypes: [{ type: String }],
  maxFileSize: { type: Number, default: 10 },
  rubric: [{
    criterion: { type: String, required: true },
    maxScore: { type: Number, required: true },
    description: { type: String }
  }],
  enablePlagiarismCheck: { type: Boolean, default: false },
  enableAIGrading: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'published', 'closed', 'graded'], default: 'draft' },
  publishedAt: { type: Date },
  visibility: { type: String, enum: ['all', 'specific'], default: 'all' },
  visibleTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

assignmentSchema.index({ course: 1 });
assignmentSchema.index({ createdBy: 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ status: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;
