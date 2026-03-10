import mongoose from 'mongoose';

const assignmentSubmissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  files: [{ name: { type: String }, url: { type: String }, type: { type: String }, size: { type: Number } }],
  textContent: { type: String },
  codeContent: { type: String },
  codeLanguage: { type: String },
  submittedAt: { type: Date, default: Date.now },
  isLate: { type: Boolean, default: false },
  lateDays: { type: Number, default: 0 },
  status: { type: String, enum: ['submitted', 'grading', 'graded', 'returned', 'resubmit'], default: 'submitted' },
  marks: { type: Number, default: null },
  totalMarks: { type: Number },
  rubricScores: [{
    criterion: { type: String },
    score: { type: Number },
    feedback: { type: String }
  }],
  feedback: { type: String },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt: { type: Date },
  plagiarismScore: { type: Number, default: null },
  plagiarismReport: { type: String },
  aiGradingResult: {
    suggestedScore: { type: Number },
    reasoning: { type: String },
    confidence: { type: Number }
  },
  attemptNumber: { type: Number, default: 1 },
  version: { type: Number, default: 1 },
}, { timestamps: true });

assignmentSubmissionSchema.index({ assignment: 1, student: 1 });
assignmentSubmissionSchema.index({ student: 1 });
assignmentSubmissionSchema.index({ status: 1 });

const AssignmentSubmission = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
export default AssignmentSubmission;
