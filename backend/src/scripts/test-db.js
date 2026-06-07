import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const testDb = async () => {
  try {
    console.log('Connecting to:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');
    
    // Get collections and counts
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('\n--- Collections and Document Counts ---');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`- ${col.name}: ${count}`);
    }
    
    // Print user details (roles)
    const users = await db.collection('users').find({}).toArray();
    console.log('\n--- Users Registered ---');
    users.forEach(u => {
      console.log(`- Name: ${u.firstName} ${u.lastName}, Email: ${u.email}, Role: ${u.role}, studentId: ${u.studentId || 'N/A'}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

testDb();
