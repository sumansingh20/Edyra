import mongoose from 'mongoose';

const libraryBookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true },
  isbn: { type: String, unique: true, sparse: true },
  publisher: { type: String },
  edition: { type: String },
  year: { type: Number },
  category: { type: String },
  department: { type: String },
  copies: { type: Number, default: 1 },
  availableCopies: { type: Number, default: 1 },
  location: { shelf: String, row: String, section: String },
  coverImage: { type: String },
  description: { type: String },
  issuedTo: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    issuedAt: { type: Date, default: Date.now },
    dueDate: { type: Date },
    returnedAt: { type: Date },
    fine: { type: Number, default: 0 },
    status: { type: String, enum: ['issued', 'returned', 'overdue', 'lost'], default: 'issued' }
  }],
  reservedBy: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, reservedAt: { type: Date, default: Date.now } }],
  digitalCopy: { type: String },
  tags: [{ type: String }],
}, { timestamps: true });

libraryBookSchema.index({ title: 'text', author: 'text' });
libraryBookSchema.index({ category: 1 });

const LibraryBook = mongoose.model('LibraryBook', libraryBookSchema);
export default LibraryBook;
