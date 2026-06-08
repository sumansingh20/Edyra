import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import { User } from '../models/index.js';

const updateAllPasswords = async () => {
  try {
    console.log('[Updater] Connecting to MongoDB...');
    await connectDB();
    console.log('[Updater] Connected to DB.');

    const users = await User.find({});
    console.log(`[Updater] Found ${users.length} users. Updating passwords...`);

    let updated = 0;
    for (const user of users) {
      user.password = 'Suman@123';
      await user.save();
      updated++;
    }

    console.log(`[Updater] Successfully updated ${updated} users to Suman@123.`);
  } catch (err) {
    console.error('[Updater] Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('[Updater] Disconnected from DB.');
    process.exit(0);
  }
};

updateAllPasswords();
