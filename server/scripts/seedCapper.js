const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Storefront = require('../models/Storefront');
const Plan = require('../models/Plan');

dotenv.config();

const seedCapper = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vibely', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if capper already exists
    const existingCapper = await User.findOne({ username: 'testcapper' });
    if (existingCapper) {
      console.log('⚠️  Test capper already exists. Deleting and recreating...');
      await User.deleteOne({ username: 'testcapper' });
      await Storefront.deleteOne({ owner: existingCapper._id });
      await Plan.deleteMany({ creator: existingCapper._id });
    }

    // Create test capper user
    const capper = new User({
      username: 'testcapper',
      email: 'capper@lineup.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Capper',
      roles: ['subscriber', 'creator'],
    });

    await capper.save();
    console.log('✅ Created test capper user');

    // Create storefront
    const storefront = new Storefront({
      owner: capper._id,
      handle: 'testcapper',
      displayName: 'Test Capper',
      description: 'Expert sports picks with proven track record. Specializing in NFL, NBA, and MLB.',
    });

    await storefront.save();
    console.log('✅ Created storefront');

    // Update user with storefront reference
    capper.storefront = storefront._id;
    await capper.save();

    // Create free plan
    const freePlan = new Plan({
      creator: capper._id,
      storefront: storefront._id,
      name: 'Free Plan',
      description: 'Get 10% of picks for free',
      isFree: true,
    });

    await freePlan.save();
    console.log('✅ Created free plan');

    // Create paid plan
    const paidPlan = new Plan({
      creator: capper._id,
      storefront: storefront._id,
      name: 'Premium Plan',
      description: 'Access to all premium picks',
      isFree: false,
      billingVariants: [
        { interval: 'monthly', priceCents: 2900 }, // $29/month
        { interval: 'quarterly', priceCents: 7500 }, // $75/quarter (save $12)
        { interval: 'yearly', priceCents: 29000 }, // $290/year (save $58)
      ],
      freeTrialDays: 7,
    });

    await paidPlan.save();
    console.log('✅ Created paid plan');

    console.log('\n🎉 Test capper account created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Username: testcapper');
    console.log('   Email: capper@lineup.com');
    console.log('   Password: password123');
    console.log('\n✨ You can now login as a creator/capper!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding capper:', error);
    process.exit(1);
  }
};

seedCapper();

