import mongoose from 'mongoose';

const semesterSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Semester name is required'], trim: true },
  code: { type: String, required: [true, 'Semester code is required'], trim: true, uppercase: true },
  academicYear: { type: String, required: [true, 'Academic year is required'] },

  startDate: { type: Date },
  endDate: { type: Date },
  enrollmentStart: { type: Date },
  enrollmentEnd: { type: Date },

  status: {
    type: String,
    enum: ['upcoming', 'enrollment-open', 'active', 'completed', 'archived'],
    default: 'upcoming',
  },

  isActive: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },

  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  campusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Soft delete
  deletedAt: { type: Date, sparse: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
semesterSchema.index({ code: 1 }, { unique: true });
semesterSchema.index({ status: 1 });
semesterSchema.index({ academicYear: 1 });
semesterSchema.index({ isActive: 1 });

// Virtuals for counts (populated via aggregation)
semesterSchema.virtual('courseCount').get(function () {
  return this._courseCount ?? 0;
});
semesterSchema.virtual('studentCount').get(function () {
  return this._studentCount ?? 0;
});

// Before saving: ensure only one active semester
semesterSchema.pre('save', async function (next) {
  if (this.isModified('isActive') && this.isActive) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isActive: true },
      { isActive: false }
    );
    this.status = 'active';
  }
  next();
});

const Semester = mongoose.model('Semester', semesterSchema);
export default Semester;
