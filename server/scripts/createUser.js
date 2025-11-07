const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const createUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vibely');
    console.log('✅ Connected to MongoDB');

    // Check if user exists
    const existingUser = await User.findOne({ username: 'testuser' });
    if (existingUser) {
      console.log('⚠️  User already exists. Deleting and recreating...');
      await User.deleteOne({ username: 'testuser' });
    }

    // Create test user
    const user = new User({
      username: 'testuser',
      email: 'test@lineup.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      roles: ['subscriber', 'creator'],
    });

    await user.save();
    console.log('✅ Test user created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Email: test@lineup.com');
    console.log('   Password: password123');
    console.log('\n✨ You can now login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    process.exit(1);
  }
};

createUser();

