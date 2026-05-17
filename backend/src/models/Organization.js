import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    unique: true,
  },
  domain: {
    type: String,
    sparse: true,
    unique: true,
  },
  subdomain: {
    type: String,
    sparse: true,
    unique: true,
  },
  logoUrl: {
    type: String,
  },
  themeSettings: {
    primaryColor: { type: String, default: '#4F46E5' }, // Indigo-600
    secondaryColor: { type: String, default: '#10B981' }, // Emerald-500
    fontFamily: { type: String, default: 'Inter' },
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  contactEmail: String,
  contactPhone: String,
  address: String,
  maxUsers: {
    type: Number,
    default: 1000,
  },
  features: {
    enableSso: { type: Boolean, default: false },
    enableAdvancedProctoring: { type: Boolean, default: false },
    enableAiTutor: { type: Boolean, default: false },
  },
}, {
  timestamps: true,
});

// domain and subdomain indices created automatically via unique:true

const Organization = mongoose.model('Organization', organizationSchema);

export default Organization;
