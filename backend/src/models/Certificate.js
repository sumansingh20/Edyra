import mongoose from 'mongoose';
import crypto from 'crypto';

const certificateSchema = new mongoose.Schema({
  // Certificate identification
  certificateNumber: {
    type: String,
    unique: true,
    required: true,
    default: () => `EDYRA-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
  },
  qrCode: {
    type: String,
    default: null,
  },

  // Recipient
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  studentName: { type: String, required: true },
  studentId: { type: String },

  // Certificate details
  type: {
    type: String,
    enum: ['course-completion', 'exam-achievement', 'merit', 'participation', 'custom'],
    required: true,
  },
  title: { type: String, required: true, trim: true, maxlength: 300 },
  description: { type: String, trim: true, maxlength: 2000 },

  // Related entities
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },

  // Achievement data
  grade: { type: String },
  percentage: { type: Number },
  score: { type: Number },
  totalScore: { type: Number },
  completionDate: { type: Date, required: true },
  duration: { type: String },

  // Issuer
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issuerName: { type: String, required: true },
  issuerTitle: { type: String, default: 'Administrator' },
  institutionName: { type: String, default: 'Edyra Academic Institution' },

  // Status
  status: {
    type: String,
    enum: ['draft', 'issued', 'revoked'],
    default: 'issued',
  },
  revokedAt: { type: Date },
  revokedReason: { type: String },

  // Template
  templateId: { type: String, default: 'default' },
  customFields: { type: Map, of: String },

  // Verification
  verificationHash: {
    type: String,
    unique: true,
    default: function () {
      const data = `${this.certificateNumber}-${this.student}-${Date.now()}`;
      return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
    },
  },
  verifiedCount: { type: Number, default: 0 },
  lastVerifiedAt: { type: Date },

  // PDF
  pdfUrl: { type: String },
  pdfGeneratedAt: { type: Date },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

certificateSchema.index({ student: 1, status: 1 });
// certificateNumber and verificationHash indexed via unique:true
certificateSchema.index({ course: 1 });
certificateSchema.index({ exam: 1 });
certificateSchema.index({ type: 1, createdAt: -1 });

// Virtual for verification URL
certificateSchema.virtual('verificationUrl').get(function () {
  return `/certificates/verify/${this.verificationHash}`;
});

const Certificate = mongoose.model('Certificate', certificateSchema);
export default Certificate;
