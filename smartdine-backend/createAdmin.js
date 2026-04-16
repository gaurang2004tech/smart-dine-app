const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Make sure this matches your User model file name!
require('dotenv').config();

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB...");

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("admin123", salt);

  const admin = new User({
    username: "admin",
    password: hashedPassword,
    role: "admin"
  });

  await admin.save();
  console.log("✅ Master Admin Created! Username: admin | Password: admin123");
  process.exit();
}

createAdmin();