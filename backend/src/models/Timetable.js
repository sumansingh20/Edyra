import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  section: { type: String },
  academicYear: { type: String, required: true },
  effectiveFrom: { type: Date, required: true },
  effectiveTo: { type: Date },
  slots: [{
    day: { type: String, enum: ['monday','tuesday','wednesday','thursday','friday','saturday'], required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    room: { type: String },
    type: { type: String, enum: ['lecture', 'lab', 'tutorial', 'seminar', 'break'], default: 'lecture' }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

timetableSchema.index({ department: 1, semester: 1, academicYear: 1 });

const Timetable = mongoose.model('Timetable', timetableSchema);
export default Timetable;
