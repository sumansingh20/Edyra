// File: backend/src/scripts/seed.js
// Run with: node src/scripts/seed.js
// This creates a Super Admin if not already present

import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import { User } from '../models/index.js';

// ─── Seed data definitions ────────────────────────────────────────────────────

const seedUsers = [
  {
    label: 'Super Admin',
    data: {
      email: 'admin@edyra.com',
      password: 'Suman@123',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'admin',
      isActive: true,
      isVerified: true,
    },
    credentials: {
      Email: 'admin@edyra.com',
      Password: 'Suman@123',
      Role: 'admin',
    },
  },
  {
    label: 'Teacher',
    data: {
      email: 'teacher@edyra.com',
      password: 'Suman@123',
      firstName: 'John',
      lastName: 'Smith',
      role: 'teacher',
      employeeId: 'T001',
      department: 'Computer Science',
      isActive: true,
      isVerified: true,
    },
    credentials: {
      Email: 'teacher@edyra.com',
      Password: 'Suman@123',
      Role: 'teacher',
      EmployeeId: 'T001',
      Department: 'Computer Science',
    },
  },
  {
    label: 'Student',
    data: {
      email: 'student@edyra.com',
      password: 'Suman@123',
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'student',
      studentId: 'STU001',
      rollNumber: 'CS2024001',
      department: 'Computer Science',
      batch: '2024',
      isActive: true,
      isVerified: true,
    },
    credentials: {
      Email: 'student@edyra.com',
      Password: 'Suman@123',
      Role: 'student',
      StudentId: 'STU001',
      RollNumber: 'CS2024001',
      Department: 'Computer Science',
      Batch: '2024',
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const printBanner = () => {
  console.log('\n' + '═'.repeat(60));
  console.log('  EDYRA — Database Seed Script');
  console.log('═'.repeat(60));
};

const printCredentials = (label, credentials) => {
  console.log(`\n  ✅  ${label} created successfully`);
  for (const [key, value] of Object.entries(credentials)) {
    console.log(`       ${key.padEnd(14)}: ${value}`);
  }
};

const printSkipped = (label, email) => {
  console.log(`\n  ⏭️   ${label} already exists (${email}) — skipped`);
};

// ─── Main seed function ───────────────────────────────────────────────────────

const seed = async () => {
  printBanner();

  try {
    // 1. Connect to MongoDB
    console.log('\n[Seed] Connecting to MongoDB…');
    await connectDB();
    console.log('[Seed] Connected.\n');

    const results = { created: 0, skipped: 0 };

    // 2. Process each user
    for (const { label, data, credentials } of seedUsers) {
      const existing = await User.findOne({ email: data.email });

      if (existing) {
        printSkipped(label, data.email);
        results.skipped += 1;
        continue;
      }

      // Create new user — password hashing handled by User pre-save hook
      const user = new User(data);
      await user.save();

      printCredentials(label, credentials);
      results.created += 1;
    }

    // 3. Summary
    console.log('\n' + '─'.repeat(60));
    console.log(
      `[Seed] Done — ${results.created} user(s) created, ${results.skipped} skipped.`
    );
    console.log('─'.repeat(60) + '\n');

  } catch (err) {
    console.error('\n[Seed] ❌ Error during seeding:');
    console.error('  ' + (err?.message || err));
    if (err?.stack) console.error(err.stack);
    process.exitCode = 1;
  } finally {
    // 4. Close DB connection and exit
    await mongoose.disconnect();
    console.log('[Seed] MongoDB disconnected. Exiting…\n');
    process.exit(process.exitCode ?? 0);
  }
};

// ─── Entry point ──────────────────────────────────────────────────────────────

seed();
