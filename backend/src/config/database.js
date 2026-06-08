import mongoose from 'mongoose';
import dns from 'dns';

// Force IPv4 for DNS resolution — fixes ECONNREFUSED on Windows with IPv6
dns.setDefaultResultOrder('ipv4first');
// Force Google DNS to bypass ISP SRV query blocks
dns.setServers(['8.8.8.8', '8.8.4.4']);

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URI_STANDARD;

  if (!mongoUri) {
    throw new Error('MONGODB_URI or MONGODB_URI_STANDARD environment variable is required.');
  }

  if (mongoUri.startsWith('mongodb+srv://')) {
    console.log('[DB] Using SRV connection string (IPv4 forced)');
  }

  if (process.env.NODE_ENV === 'production' && mongoUri.includes('localhost')) {
    throw new Error('Cannot use localhost MongoDB in production. Use MongoDB Atlas.');
  }

  if (!cached.promise) {
    const options = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 30000,  // increased from 5s → 30s
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      family: 4,                        // force IPv4 — fixes ECONNREFUSED on Windows
    };

    cached.promise = mongoose
      .connect(mongoUri, options)
      .then((mongooseInstance) => {
        console.log('[DB] MongoDB connected successfully');
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null;
        console.error('[DB] MongoDB connection failed:', err?.message || err);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
};

export default connectDB;
