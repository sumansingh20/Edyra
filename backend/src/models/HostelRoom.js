import mongoose from 'mongoose';

const hostelRoomSchema = new mongoose.Schema({
  hostelName: { type: String, required: true },
  roomNumber: { type: String, required: true },
  floor: { type: Number, default: 0 },
  type: { type: String, enum: ['single', 'double', 'triple', 'dormitory'], default: 'double' },
  capacity: { type: Number, required: true },
  occupants: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    allottedAt: { type: Date, default: Date.now },
    vacatedAt: { type: Date },
    status: { type: String, enum: ['active', 'vacated'], default: 'active' }
  }],
  amenities: [{ type: String }],
  monthlyRent: { type: Number, default: 0 },
  status: { type: String, enum: ['available', 'occupied', 'maintenance', 'reserved'], default: 'available' },
  block: { type: String },
  warden: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

hostelRoomSchema.index({ hostelName: 1, roomNumber: 1 }, { unique: true });
hostelRoomSchema.index({ status: 1 });

const HostelRoom = mongoose.model('HostelRoom', hostelRoomSchema);
export default HostelRoom;
