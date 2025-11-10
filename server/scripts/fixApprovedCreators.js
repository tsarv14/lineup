const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const CreatorApplication = require('../models/CreatorApplication');
const Storefront = require('../models/Storefront');

dotenv.config();

const fixApprovedCreators = async () => {
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

    // Find all approved applications
    const approvedApplications = await CreatorApplication.find({ status: 'approved' });
    console.log(`\n📋 Found ${approvedApplications.length} approved application(s)`);

    let fixedCount = 0;

    for (const application of approvedApplications) {
      if (!application.user) {
        console.log(`⚠️  Application ${application._id} has no user associated`);
        continue;
      }

      const user = await User.findById(application.user);
      if (!user) {
        console.log(`⚠️  User not found for application ${application._id}`);
        continue;
      }

      // Check if user has creator role
      const hasCreatorRole = user.roles && Array.isArray(user.roles) && user.roles.includes('creator');
      
      if (!hasCreatorRole) {
        // Initialize roles array if it doesn't exist
        if (!user.roles || !Array.isArray(user.roles)) {
          user.roles = ['subscriber'];
        }
        
        // Add creator role
        if (!user.roles.includes('creator')) {
          user.roles.push('creator');
          await user.save();
          fixedCount++;
          console.log(`✅ Added creator role to user: ${user.email}`);
        }
      } else {
        console.log(`✓ User ${user.email} already has creator role`);
      }

      // Check if user has a storefront
      if (!user.storefront) {
        // Try to find storefront by handle
        const storefront = await Storefront.findOne({ handle: application.handle });
        if (storefront) {
          user.storefront = storefront._id;
          await user.save();
          console.log(`✅ Linked storefront to user: ${user.email}`);
        } else {
          console.log(`⚠️  No storefront found for handle: ${application.handle}`);
        }
      }
    }

    console.log(`\n✨ Fixed ${fixedCount} user(s)`);
    console.log('\n📋 Summary:');
    console.log(`   Total approved applications: ${approvedApplications.length}`);
    console.log(`   Users fixed: ${fixedCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing approved creators:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

fixApprovedCreators();

