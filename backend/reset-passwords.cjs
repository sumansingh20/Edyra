const mongoose = require('mongoose');
const { User } = require('./src/models/index.js');
require('dotenv').config();

// The database.js connection logic handles DNS SRV bugs in Windows
// But since this is a CJS script running against ES modules, we can't require it directly.
// We configure mongoose to force IPv4 and add the DNS fix for Windows SRV queries.
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
mongoose.set('strictQuery', false);

mongoose.connect(process.env.MONGODB_URI, { family: 4 }).then(async () => {
  await User.updateMany({}, { "$set": { loginAttempts: 0, lockUntil: null } });
  
  const admin = await User.findOne({email: 'admin@edyra.com'});
  if(admin){ admin.password = 'Admin@123'; await admin.save(); }
  
  const teacher = await User.findOne({email: 'teacher@edyra.com'});
  if(teacher){ teacher.password = 'Teacher@123'; await teacher.save(); }
  
  const student = await User.findOne({email: 'student@edyra.com'});
  if(student){ 
    student.password = 'Student@123'; 
    student.dateOfBirth = new Date('2000-01-01'); // Format: 01012000
    await student.save(); 
  }
  
  console.log('Passwords and lockouts reset!');
  process.exit(0);
});
