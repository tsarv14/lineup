const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

dotenv.config();

const grantAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vibely';
    let finalMongoURI = mongoURI;
    
    // Ensure database name is in the URI
    if (mongoURI.includes('mongodb+srv://') && !mongoURI.match(/\/[^?]+(\?|$)/)) {
      finalMongoURI = mongoURI.replace(/\/(\?|$)/, '/vibely$1');
    }

    await mongoose.connect(finalMongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get email from command line argument or use default
    const email = process.argv[2] || process.env.ADMIN_EMAIL;
    
    if (!email) {
      console.error('❌ Error: Please provide an email address');
      console.log('\n📖 Usage:');
      console.log('   node server/scripts/grantAdmin.js your-email@example.com');
      console.log('\n   Or set ADMIN_EMAIL in your .env file');
      process.exit(1);
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.error(`❌ Error: User with email "${email}" not found`);
      console.log('\n💡 Make sure you have registered an account with this email first.');
      process.exit(1);
    }

    // Check if user already has admin role
    if (user.roles && user.roles.includes('admin')) {
      console.log(`⚠️  User "${email}" already has admin access`);
      console.log(`   Current roles: ${user.roles.join(', ')}`);
      process.exit(0);
    }

    // Add admin role
    if (!user.roles) {
      user.roles = ['subscriber'];
    }
    
    if (!user.roles.includes('admin')) {
      user.roles.push('admin');
      await user.save();
      console.log(`✅ Admin access granted to "${email}"`);
      console.log(`   Updated roles: ${user.roles.join(', ')}`);
    }

    console.log('\n✨ You can now access the admin dashboard at /admin');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error granting admin access:', error.message);
    if (error.message.includes('authentication failed')) {
      console.error('💡 Check your MONGODB_URI in .env file - make sure the password is correct');
    }
    process.exit(1);
  }
};

grantAdmin();

