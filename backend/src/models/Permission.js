import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true, // e.g., 'create_users', 'view_exams', 'grade_submissions'
  },
  module: {
    type: String,
    required: true, // e.g., 'users', 'exams', 'courses'
  },
  description: String,
}, {
  timestamps: true,
});

permissionSchema.index({ module: 1 });

const Permission = mongoose.model('Permission', permissionSchema);

export default Permission;
