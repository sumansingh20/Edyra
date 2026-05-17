import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  deviceId: { type: String, required: true },
  deviceName: { type: String, default: 'Unknown Device' },
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown',
  },
  browser: { type: String },
  os: { type: String },
  ipAddress: { type: String },
  fingerprint: { type: String },

  // Trust status
  isTrusted: { type: Boolean, default: false },
  trustedAt: { type: Date },

  // Activity
  lastActiveAt: { type: Date, default: Date.now },
  loginCount: { type: Number, default: 1 },
  firstSeenAt: { type: Date, default: Date.now },

  // Session
  currentSessionToken: { type: String },
  isCurrentlyActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

deviceSchema.index({ user: 1, deviceId: 1 }, { unique: true });
deviceSchema.index({ user: 1, isCurrentlyActive: 1 });
deviceSchema.index({ lastActiveAt: -1 });

const Device = mongoose.model('Device', deviceSchema);
export default Device;
