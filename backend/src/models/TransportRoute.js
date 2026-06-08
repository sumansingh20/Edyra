import mongoose from 'mongoose';

const transportRouteSchema = new mongoose.Schema({
  routeName: { type: String, required: true },
  routeNumber: { type: String, required: true, unique: true },
  vehicleNumber: { type: String },
  vehicleType: { type: String, enum: ['bus', 'van', 'car'], default: 'bus' },
  driver: { name: String, phone: String, license: String },
  capacity: { type: Number, required: true },
  stops: [{
    name: { type: String, required: true },
    arrivalTime: { type: String },
    departureTime: { type: String },
    location: { latitude: Number, longitude: Number },
    order: { type: Number }
  }],
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  monthlyFee: { type: Number, default: 0 },
  schedule: { type: String, enum: ['morning', 'evening', 'both'], default: 'both' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

transportRouteSchema.index({ isActive: 1 });

const TransportRoute = mongoose.model('TransportRoute', transportRouteSchema);
export default TransportRoute;
