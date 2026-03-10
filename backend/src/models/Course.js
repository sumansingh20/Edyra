import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  code: { type: String, required: true, unique: true, trim: true, uppercase: true },
  description: { type: String, trim: true, maxlength: 5000 },
  category: { type: String, trim: true },
  department: { type: String, trim: true },
  semester: { type: Number, min: 1, max: 10 },
  credits: { type: Number, default: 3, min: 1, max: 10 },
  thumbnail: { type: String, default: null },
  syllabus: { type: String, default: null },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coInstructors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  teachingAssistants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  maxStudents: { type: Number, default: 100 },
  modules: [{
    title: { type: String, required: true },
    description: { type: String },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    lectures: [{
      title: { type: String, required: true },
      type: { type: String, enum: ['video', 'pdf', 'document', 'link', 'text', 'quiz'], default: 'text' },
      content: { type: String },
      fileUrl: { type: String },
      duration: { type: Number, default: 0 },
      order: { type: Number, default: 0 },
      isPublished: { type: Boolean, default: false },
      completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }]
  }],
  schedule: {
    startDate: { type: Date },
    endDate: { type: Date },
    classDays: [{ type: String, enum: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] }],
    classTime: { type: String }
  },
  status: { type: String, enum: ['draft', 'published', 'archived', 'active'], default: 'draft' },
  enrollmentType: { type: String, enum: ['open', 'approval', 'invite-only'], default: 'open' },
  tags: [{ type: String }],
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  announcements: [{
    title: { type: String, required: true },
    content: { type: String, required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

courseSchema.virtual('enrollmentCount').get(function() {
  return this.enrolledStudents ? this.enrolledStudents.length : 0;
});

courseSchema.index({ instructor: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ department: 1, semester: 1 });

const Course = mongoose.model('Course', courseSchema);
export default Course;
