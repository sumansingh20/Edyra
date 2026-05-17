import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  date: { type: Date, required: true },
  session: { type: String, enum: ['morning', 'afternoon', 'evening', 'full-day'], default: 'morning' },
  type: { type: String, enum: ['manual', 'qr-code', 'face-recognition', 'gps', 'auto'], default: 'manual' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  records: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['present', 'absent', 'late', 'excused', 'half-day'], default: 'absent' },
    markedAt: { type: Date, default: Date.now },
    method: { type: String, enum: ['manual', 'qr-code', 'face-recognition', 'gps'], default: 'manual' },
    location: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    remarks: { type: String }
  }],
  qrCode: { type: String },
  qrExpiresAt: { type: Date },
  gpsCenter: {
    latitude: { type: Number },
    longitude: { type: Number },
    radius: { type: Number, default: 100 }
  },
  totalPresent: { type: Number, default: 0 },
  totalAbsent: { type: Number, default: 0 },
  totalLate: { type: Number, default: 0 },
}, { timestamps: true });

attendanceSchema.index({ course: 1, date: 1 });
attendanceSchema.index({ 'records.student': 1 });

attendanceSchema.methods.calculateTotals = function() {
  this.totalPresent = this.records.filter(r => r.status === 'present' || r.status === 'late').length;
  this.totalAbsent = this.records.filter(r => r.status === 'absent').length;
  this.totalLate = this.records.filter(r => r.status === 'late').length;
  return this;
};

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
