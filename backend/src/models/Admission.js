import mongoose from 'mongoose';

const admissionSchema = new mongoose.Schema({
  applicantName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  address: { street: String, city: String, state: String, zip: String, country: String },
  guardianName: { type: String },
  guardianPhone: { type: String },
  previousEducation: [{
    institution: String, board: String, percentage: Number, yearOfPassing: Number, degree: String
  }],
  appliedFor: { department: { type: String, required: true }, program: { type: String, required: true }, semester: { type: Number, default: 1 } },
  documents: [{ name: String, url: String, verified: { type: Boolean, default: false } }],
  applicationNumber: { type: String, unique: true },
  status: { type: String, enum: ['applied', 'under-review', 'shortlisted', 'accepted', 'rejected', 'enrolled', 'withdrawn'], default: 'applied' },
  remarks: [{ text: String, by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, date: { type: Date, default: Date.now } }],
  entranceScore: { type: Number },
  interviewScore: { type: Number },
  meritRank: { type: Number },
  academicYear: { type: String, required: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enrolledAs: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

admissionSchema.index({ status: 1 });
admissionSchema.index({ 'appliedFor.department': 1 });

admissionSchema.pre('save', function(next) {
  if (!this.applicationNumber) {
    this.applicationNumber = 'EDYRA-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  }
  next();
});

const Admission = mongoose.model('Admission', admissionSchema);
export default Admission;
