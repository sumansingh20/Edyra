import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  academicYear: { type: String, required: true },
  semester: { type: Number },
  components: [{
    name: { type: String, required: true },
    type: { type: String, enum: ['assignment', 'quiz', 'midterm', 'final', 'project', 'attendance', 'participation', 'lab', 'other'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    marksObtained: { type: Number, default: 0 },
    totalMarks: { type: Number, required: true },
    weightage: { type: Number, default: 0 },
    weightedScore: { type: Number, default: 0 },
  }],
  totalScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 100 },
  percentage: { type: Number, default: 0 },
  grade: { type: String },
  gradePoint: { type: Number },
  status: { type: String, enum: ['in-progress', 'finalized', 'published'], default: 'in-progress' },
  remarks: { type: String },
  finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  finalizedAt: { type: Date },
}, { timestamps: true });

gradeSchema.index({ student: 1, course: 1, academicYear: 1 }, { unique: true });
gradeSchema.index({ course: 1 });
gradeSchema.index({ student: 1 });

gradeSchema.methods.calculateTotal = function() {
  let totalWeighted = 0;
  let totalWeight = 0;
  for (const comp of this.components) {
    const pct = comp.totalMarks > 0 ? (comp.marksObtained / comp.totalMarks) * 100 : 0;
    comp.weightedScore = (pct * comp.weightage) / 100;
    totalWeighted += comp.weightedScore;
    totalWeight += comp.weightage;
  }
  this.totalScore = totalWeighted;
  this.percentage = totalWeight > 0 ? (totalWeighted / totalWeight) * 100 : 0;
  if (this.percentage >= 90) { this.grade = 'A+'; this.gradePoint = 10; }
  else if (this.percentage >= 80) { this.grade = 'A'; this.gradePoint = 9; }
  else if (this.percentage >= 70) { this.grade = 'B+'; this.gradePoint = 8; }
  else if (this.percentage >= 60) { this.grade = 'B'; this.gradePoint = 7; }
  else if (this.percentage >= 50) { this.grade = 'C'; this.gradePoint = 6; }
  else if (this.percentage >= 40) { this.grade = 'D'; this.gradePoint = 5; }
  else { this.grade = 'F'; this.gradePoint = 0; }
  return this;
};

const Grade = mongoose.model('Grade', gradeSchema);
export default Grade;
