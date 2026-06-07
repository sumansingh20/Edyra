import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const createAdmin = async () => {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let email = null;
  let password = null;
  let firstName = 'System';
  let lastName = 'Administrator';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      email = args[i + 1];
      i++;
    } else if (args[i] === '--password' && args[i + 1]) {
      password = args[i + 1];
      i++;
    } else if (args[i] === '--firstName' && args[i + 1]) {
      firstName = args[i + 1];
      i++;
    } else if (args[i] === '--lastName' && args[i + 1]) {
      lastName = args[i + 1];
      i++;
    }
  }

  if (!email || !password) {
    console.error('\n❌ Error: Email and password are required!\n');
    console.log('Usage:');
    console.log('  npm run create-admin -- --email admin@edyra.com --password Admin@123\n');
    console.log('Options:');
    console.log('  --email       Admin email address (required)');
    console.log('  --password    Admin password (required)');
    console.log('  --firstName   Admin first name (default: System)');
    console.log('  --lastName    Admin last name (default: Administrator)\n');
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error('❌ Error: Invalid email format');
    process.exit(1);
  }

  // Validate password strength
  if (password.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edyra');
    console.log('✅ Connected to MongoDB\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.error(`❌ Error: User with email "${email}" already exists`);
      process.exit(1);
    }

    // Create admin user
    const admin = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: 'admin',
      isVerified: true,
      isActive: true,
    });

    console.log('✅ Admin account created successfully!\n');
    console.log('📧 Email:', admin.email);
    console.log('👤 Name:', `${admin.firstName} ${admin.lastName}`);
    console.log('🔑 Role:', admin.role);
    console.log('\n💡 You can now log in at /login\n');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin();
