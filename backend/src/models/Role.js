import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: String,
  isSystem: {
    type: Boolean,
    default: false, // System roles cannot be deleted
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission',
  }],
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null, // Null means global role
  },
}, {
  timestamps: true,
});

roleSchema.index({ name: 1, organizationId: 1 }, { unique: true });

const Role = mongoose.model('Role', roleSchema);

export default Role;
