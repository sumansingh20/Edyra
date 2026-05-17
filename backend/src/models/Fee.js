import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  academicYear: { type: String, required: true },
  semester: { type: Number },
  feeType: { type: String, enum: ['tuition', 'hostel', 'transport', 'library', 'lab', 'exam', 'other'], required: true },
  description: { type: String },
  amount: { type: Number, required: true, min: 0 },
  dueDate: { type: Date, required: true },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'partial', 'paid', 'overdue', 'waived'], default: 'pending' },
  payments: [{
    amount: { type: Number, required: true },
    method: { type: String, enum: ['cash', 'card', 'bank-transfer', 'upi', 'cheque', 'online'], required: true },
    transactionId: { type: String },
    paidAt: { type: Date, default: Date.now },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receipt: { type: String }
  }],
  lateFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  discountReason: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

feeSchema.index({ student: 1, academicYear: 1 });
feeSchema.index({ status: 1 });

feeSchema.pre('save', function(next) {
  this.balanceAmount = this.amount + this.lateFee - this.discount - this.paidAmount;
  if (this.balanceAmount <= 0) this.status = 'paid';
  else if (this.paidAmount > 0) this.status = 'partial';
  next();
});

const Fee = mongoose.model('Fee', feeSchema);
export default Fee;
