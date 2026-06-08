import mongoose from 'mongoose';

const courseModuleSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  description: { type: String },
  order: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  unlockAt: { type: Date }, // Timeline / Drip content
  prerequisiteModules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CourseModule' }],
}, { timestamps: true });

courseModuleSchema.index({ courseId: 1, order: 1 });

export const CourseModule = mongoose.model('CourseModule', courseModuleSchema);

const courseLessonSchema = new mongoose.Schema({
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'CourseModule', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['video', 'pdf', 'markdown', 'code_editor', 'quiz', 'scorm', 'interactive_whiteboard'], 
    default: 'markdown' 
  },
  content: { type: String }, // Markdown or HTML
  videoUrl: { type: String }, // For video streaming (S3/CDN/MUX)
  fileUrl: { type: String }, // For PDF
  resources: [{
    title: { type: String },
    url: { type: String },
    type: { type: String }
  }],
  duration: { type: Number, default: 0 }, // in minutes
  order: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  isRequired: { type: Boolean, default: true },
  interactiveConfig: { type: mongoose.Schema.Types.Mixed }, // Configuration for code editor or interactive elements
}, { timestamps: true });

courseLessonSchema.index({ moduleId: 1, order: 1 });
courseLessonSchema.index({ courseId: 1 });

export const CourseLesson = mongoose.model('CourseLesson', courseLessonSchema);
