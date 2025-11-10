const express = require('express');
const User = require('../models/User');
const Storefront = require('../models/Storefront');
const CreatorApplication = require('../models/CreatorApplication');
const Pick = require('../models/Pick');
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/admin');

const router = express.Router();

// @route   GET /api/admin/storefronts
// @desc    Get all storefronts (including those without creator role)
// @access  Private (admin)
router.get('/storefronts', auth, adminAuth, async (req, res) => {
  try {
    const storefronts = await Storefront.find()
      .populate('owner', 'email username firstName lastName roles')
      .sort({ createdAt: -1 });
    
    res.json(storefronts);
  } catch (error) {
    console.error('Get storefronts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/fix-creator/:handle
// @desc    Fix a specific creator by handle (add role, link storefront)
// @access  Private (admin)
router.post('/fix-creator/:handle', auth, adminAuth, async (req, res) => {
  try {
    const handle = req.params.handle.toLowerCase().trim();
    
    // Find storefront by handle
    const storefront = await Storefront.findOne({ handle });
    if (!storefront) {
      return res.status(404).json({ message: 'Storefront not found for this handle' });
    }

    // Find user by storefront owner
    const user = await User.findById(storefront.owner);
    if (!user) {
      return res.status(404).json({ message: 'User not found for this storefront' });
    }

    let fixed = false;

    // Initialize roles array if it doesn't exist
    if (!user.roles || !Array.isArray(user.roles)) {
      user.roles = ['subscriber'];
      fixed = true;
    }
    
    // Add creator role if not already present
    if (!user.roles.includes('creator')) {
      user.roles.push('creator');
      fixed = true;
    }
    
    // Link storefront if not already linked
    if (!user.storefront || user.storefront.toString() !== storefront._id.toString()) {
      user.storefront = storefront._id;
      fixed = true;
    }

    if (fixed) {
      await user.save();
      return res.json({ 
        message: 'Creator fixed successfully',
        user: {
          email: user.email,
          roles: user.roles,
          hasStorefront: !!user.storefront
        }
      });
    } else {
      return res.json({ 
        message: 'Creator already has correct setup',
        user: {
          email: user.email,
          roles: user.roles,
          hasStorefront: !!user.storefront
        }
      });
    }
  } catch (error) {
    console.error('Fix creator error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/manual-creator
// @desc    Manually create/fix a creator by email or handle
// @access  Private (admin)
router.post('/manual-creator', auth, adminAuth, async (req, res) => {
  try {
    const { email, handle, displayName } = req.body;
    
    if (!email && !handle) {
      return res.status(400).json({ message: 'Email or handle is required' });
    }

    let user = null;
    let storefront = null;

    // Find user by email if provided
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ message: 'User not found with this email' });
      }
    }

    // Find storefront by handle if provided
    if (handle) {
      const normalizedHandle = handle.toLowerCase().trim();
      storefront = await Storefront.findOne({ handle: normalizedHandle });
      
      if (storefront && !user) {
        user = await User.findById(storefront.owner);
      }
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found. Please provide email or handle of existing storefront.' });
    }

    // Initialize roles array if it doesn't exist
    if (!user.roles || !Array.isArray(user.roles)) {
      user.roles = ['subscriber'];
    }
    
    // Add creator role if not already present
    if (!user.roles.includes('creator')) {
      user.roles.push('creator');
    }

    // Create or update storefront
    if (!storefront) {
      if (!handle || !displayName) {
        return res.status(400).json({ message: 'Handle and displayName are required to create a new storefront' });
      }
      
      const normalizedHandle = handle.toLowerCase().trim();
      
      // Check if handle is taken
      const existingStorefront = await Storefront.findOne({ handle: normalizedHandle });
      if (existingStorefront) {
        return res.status(400).json({ message: 'Handle already taken' });
      }

      storefront = new Storefront({
        owner: user._id,
        handle: normalizedHandle,
        displayName: displayName,
        description: '',
        socialLinks: {},
        sports: []
      });
      await storefront.save();
    }

    // Link storefront to user
    user.storefront = storefront._id;
    await user.save();

    res.json({ 
      message: 'Creator created/fixed successfully',
      user: {
        email: user.email,
        roles: user.roles,
        hasStorefront: !!user.storefront
      },
      storefront: {
        handle: storefront.handle,
        displayName: storefront.displayName
      }
    });
  } catch (error) {
    console.error('Manual creator error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/storefront/:handle
// @desc    Update a creator's storefront (admin only)
// @access  Private (admin)
router.put('/storefront/:handle', auth, adminAuth, async (req, res) => {
  try {
    const handle = req.params.handle.toLowerCase().trim();
    const { displayName, description, logoImage, bannerImage, aboutText, aboutImage, socialLinks, sports } = req.body;

    const storefront = await Storefront.findOne({ handle });
    if (!storefront) {
      return res.status(404).json({ message: 'Storefront not found' });
    }

    if (displayName !== undefined && displayName !== null) storefront.displayName = displayName;
    if (description !== undefined) storefront.description = description;
    if (logoImage !== undefined) storefront.logoImage = logoImage;
    if (bannerImage !== undefined) storefront.bannerImage = bannerImage;
    if (aboutText !== undefined) storefront.aboutText = aboutText;
    if (aboutImage !== undefined) storefront.aboutImage = aboutImage;
    if (socialLinks) {
      const updatedSocialLinks = { ...storefront.socialLinks };
      if (socialLinks.twitter !== undefined) updatedSocialLinks.twitter = socialLinks.twitter || '';
      if (socialLinks.instagram !== undefined) updatedSocialLinks.instagram = socialLinks.instagram || '';
      if (socialLinks.website !== undefined) updatedSocialLinks.website = socialLinks.website || '';
      if (socialLinks.tiktok !== undefined) updatedSocialLinks.tiktok = socialLinks.tiktok || '';
      if (socialLinks.youtube !== undefined) updatedSocialLinks.youtube = socialLinks.youtube || '';
      storefront.socialLinks = updatedSocialLinks;
    }
    if (sports !== undefined) storefront.sports = sports || [];
    storefront.updatedAt = new Date();
    await storefront.save();

    res.json(storefront);
  } catch (error) {
    console.error('Admin update storefront error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to get date range (last 30 days)
function getDateRange() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  return { startDate, endDate };
}

// Helper function to generate daily data points
function generateDailyDataPoints(startDate, endDate, dataMap) {
  const days = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    days.push(dataMap[dateKey] || 0);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return days;
}

// Helper function to get creator stats
async function getCreatorStats(userId) {
  const { startDate, endDate } = getDateRange();

  // Get total subscribers
  const totalSubscribers = await Subscription.countDocuments({
    creator: userId,
    status: 'active'
  });

  // Get all subscriptions for breakdown
  const allSubscriptions = await Subscription.find({ creator: userId }).populate('plan');
  const freeSubs = allSubscriptions.filter(s => s.plan && s.plan.isFree).length;
  const payingSubs = allSubscriptions.filter(s => s.plan && !s.plan.isFree && s.status === 'active');
  const renewingPayingSubs = payingSubs.filter(s => !s.cancelAtPeriodEnd).length;
  const expiringPayingSubs = payingSubs.filter(s => s.cancelAtPeriodEnd).length;

  // Get total revenue
  const transactions = await Transaction.find({
    creator: userId,
    type: { $in: ['subscription', 'oneoff'] }
  });
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.amountCents || 0), 0);

  // Get revenue time series
  const revenueTransactions = await Transaction.find({
    creator: userId,
    type: { $in: ['subscription', 'oneoff'] },
    createdAt: { $gte: startDate, $lte: endDate }
  });
  const revenueByDate = {};
  revenueTransactions.forEach(t => {
    const dateKey = new Date(t.createdAt).toISOString().split('T')[0];
    revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + (t.amountCents || 0);
  });
  const revenueData = generateDailyDataPoints(startDate, endDate, revenueByDate);
  const previousPeriodRevenue = transactions
    .filter(t => new Date(t.createdAt) < startDate)
    .reduce((sum, t) => sum + (t.amountCents || 0), 0);

  // Get new customers time series
  const newCustomers = await Subscription.find({
    creator: userId,
    createdAt: { $gte: startDate, $lte: endDate }
  });
  const customersByDate = {};
  newCustomers.forEach(sub => {
    const dateKey = new Date(sub.createdAt).toISOString().split('T')[0];
    customersByDate[dateKey] = (customersByDate[dateKey] || 0) + 1;
  });
  const newCustomersData = generateDailyDataPoints(startDate, endDate, customersByDate);
  const previousPeriodCustomers = await Subscription.countDocuments({
    creator: userId,
    createdAt: { $lt: startDate }
  });

  // Get transactions time series
  const transactionCounts = await Transaction.find({
    creator: userId,
    createdAt: { $gte: startDate, $lte: endDate }
  });
  const transactionsByDate = {};
  transactionCounts.forEach(t => {
    const dateKey = new Date(t.createdAt).toISOString().split('T')[0];
    transactionsByDate[dateKey] = (transactionsByDate[dateKey] || 0) + 1;
  });
  const transactionsData = generateDailyDataPoints(startDate, endDate, transactionsByDate);
  const previousPeriodTransactions = await Transaction.countDocuments({
    creator: userId,
    createdAt: { $lt: startDate }
  });

  // Get spend per customer
  const totalCustomers = await Subscription.countDocuments({ creator: userId });
  const spendPerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
  const spendPerCustomerData = newCustomersData.map((_, idx) => {
    const dayCustomers = newCustomersData[idx] || 0;
    const dayRevenue = revenueData[idx] || 0;
    return dayCustomers > 0 ? dayRevenue / dayCustomers : 0;
  });

  // Get free subscribers time series
  const freeSubscriptions = await Subscription.find({
    creator: userId,
    createdAt: { $gte: startDate, $lte: endDate }
  }).populate('plan');
  const freeSubsByDate = {};
  freeSubscriptions.forEach(sub => {
    if (sub.plan && sub.plan.isFree) {
      const dateKey = new Date(sub.createdAt).toISOString().split('T')[0];
      freeSubsByDate[dateKey] = (freeSubsByDate[dateKey] || 0) + 1;
    }
  });
  const freeSubscribersData = generateDailyDataPoints(startDate, endDate, freeSubsByDate);
  const previousPeriodFreeSubs = await Subscription.countDocuments({
    creator: userId,
    createdAt: { $lt: startDate }
  }).populate('plan').then(subs => subs.filter(s => s.plan && s.plan.isFree).length);

  // Get free trial data
  const freeTrialSubs = await Subscription.find({
    creator: userId,
    createdAt: { $gte: startDate, $lte: endDate }
  }).populate('plan');
  const freeTrialByDate = {};
  freeTrialSubs.forEach(sub => {
    if (sub.plan && sub.plan.freeTrialDays > 0) {
      const dateKey = new Date(sub.createdAt).toISOString().split('T')[0];
      freeTrialByDate[dateKey] = (freeTrialByDate[dateKey] || 0) + 1;
    }
  });
  const freeTrialData = generateDailyDataPoints(startDate, endDate, freeTrialByDate);
  const previousPeriodFreeTrials = await Subscription.countDocuments({
    creator: userId,
    createdAt: { $lt: startDate }
  }).populate('plan').then(subs => subs.filter(s => s.plan && s.plan.freeTrialDays > 0).length);

  // Get conversion rate
  const totalTrials = await Subscription.find({ creator: userId }).populate('plan');
  const activeTrials = totalTrials.filter(s => s.plan && s.plan.freeTrialDays > 0 && s.status === 'active');
  const convertedTrials = totalTrials.filter(s => s.plan && s.plan.freeTrialDays > 0 && s.status === 'active' && new Date(s.createdAt).getTime() + (s.plan.freeTrialDays * 24 * 60 * 60 * 1000) < Date.now());
  const conversionRate = activeTrials.length > 0 ? (convertedTrials.length / activeTrials.length) * 100 : 0;
  const previousPeriodTrials = await Subscription.find({ creator: userId, createdAt: { $lt: startDate } }).populate('plan');
  const previousActiveTrials = previousPeriodTrials.filter(s => s.plan && s.plan.freeTrialDays > 0 && s.status === 'active');
  const previousConvertedTrials = previousPeriodTrials.filter(s => s.plan && s.plan.freeTrialDays > 0 && s.status === 'active' && new Date(s.createdAt).getTime() + (s.plan.freeTrialDays * 24 * 60 * 60 * 1000) < Date.now());
  const previousPeriodConversionRate = previousActiveTrials.length > 0 ? (previousConvertedTrials.length / previousActiveTrials.length) * 100 : 0;

  // Get active plans
  const activePlans = await Plan.countDocuments({ creator: userId });

  // Get total picks
  const totalPicks = await Pick.countDocuments({ creator: userId });

  // Get coupon redemptions (placeholder - implement if you have coupon system)
  const couponRedemptions = [];

  return {
    totalSubscribers,
    totalRevenue,
    activePlans,
    totalPicks,
    revenueData,
    previousPeriodRevenue,
    newCustomersData,
    previousPeriodCustomers,
    transactionsData,
    previousPeriodTransactions,
    spendPerCustomer,
    spendPerCustomerData,
    freeSubscribersData,
    previousPeriodFreeSubs,
    freeTrialData,
    previousPeriodFreeTrials,
    conversionRate,
    previousPeriodConversionRate,
    freeSubs,
    renewingPayingSubs,
    expiringPayingSubs,
    couponRedemptions
  };
}

// @route   GET /api/admin/sales
// @desc    Get platform-wide sales stats and individual creator stats
// @access  Private (admin)
router.get('/sales', auth, adminAuth, async (req, res) => {
  try {
    // Get all creators
    const creators = await User.find({ roles: 'creator' }).populate('storefront');

    // Get platform-wide stats (aggregate all creators)
    const { startDate, endDate } = getDateRange();

    // Platform totals
    const totalSubscribers = await Subscription.countDocuments({ status: 'active' });
    const allTransactions = await Transaction.find({
      type: { $in: ['subscription', 'oneoff'] }
    });
    const totalRevenue = allTransactions.reduce((sum, t) => sum + (t.amountCents || 0), 0);
    const activePlans = await Plan.countDocuments();
    const totalPicks = await Pick.countDocuments();

    // Platform revenue time series
    const revenueTransactions = await Transaction.find({
      type: { $in: ['subscription', 'oneoff'] },
      createdAt: { $gte: startDate, $lte: endDate }
    });
    const revenueByDate = {};
    revenueTransactions.forEach(t => {
      const dateKey = new Date(t.createdAt).toISOString().split('T')[0];
      revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + (t.amountCents || 0);
    });
    const revenueData = generateDailyDataPoints(startDate, endDate, revenueByDate);
    const previousPeriodRevenue = allTransactions
      .filter(t => new Date(t.createdAt) < startDate)
      .reduce((sum, t) => sum + (t.amountCents || 0), 0);

    // Platform new customers
    const newCustomers = await Subscription.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });
    const customersByDate = {};
    newCustomers.forEach(sub => {
      const dateKey = new Date(sub.createdAt).toISOString().split('T')[0];
      customersByDate[dateKey] = (customersByDate[dateKey] || 0) + 1;
    });
    const newCustomersData = generateDailyDataPoints(startDate, endDate, customersByDate);
    const previousPeriodCustomers = await Subscription.countDocuments({
      createdAt: { $lt: startDate }
    });

    // Platform transactions
    const transactionCounts = await Transaction.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });
    const transactionsByDate = {};
    transactionCounts.forEach(t => {
      const dateKey = new Date(t.createdAt).toISOString().split('T')[0];
      transactionsByDate[dateKey] = (transactionsByDate[dateKey] || 0) + 1;
    });
    const transactionsData = generateDailyDataPoints(startDate, endDate, transactionsByDate);
    const previousPeriodTransactions = await Transaction.countDocuments({
      createdAt: { $lt: startDate }
    });

    // Platform spend per customer
    const totalCustomers = await Subscription.countDocuments();
    const spendPerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    const spendPerCustomerData = newCustomersData.map((_, idx) => {
      const dayCustomers = newCustomersData[idx] || 0;
      const dayRevenue = revenueData[idx] || 0;
      return dayCustomers > 0 ? dayRevenue / dayCustomers : 0;
    });

    // Platform free subscribers
    const freeSubscriptions = await Subscription.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('plan');
    const freeSubsByDate = {};
    freeSubscriptions.forEach(sub => {
      if (sub.plan && sub.plan.isFree) {
        const dateKey = new Date(sub.createdAt).toISOString().split('T')[0];
        freeSubsByDate[dateKey] = (freeSubsByDate[dateKey] || 0) + 1;
      }
    });
    const freeSubscribersData = generateDailyDataPoints(startDate, endDate, freeSubsByDate);
    const previousPeriodFreeSubs = await Subscription.find({ createdAt: { $lt: startDate } })
      .populate('plan')
      .then(subs => subs.filter(s => s.plan && s.plan.isFree).length);

    // Platform free trials
    const freeTrialSubs = await Subscription.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('plan');
    const freeTrialByDate = {};
    freeTrialSubs.forEach(sub => {
      if (sub.plan && sub.plan.freeTrialDays > 0) {
        const dateKey = new Date(sub.createdAt).toISOString().split('T')[0];
        freeTrialByDate[dateKey] = (freeTrialByDate[dateKey] || 0) + 1;
      }
    });
    const freeTrialData = generateDailyDataPoints(startDate, endDate, freeTrialByDate);
    const previousPeriodFreeTrials = await Subscription.find({ createdAt: { $lt: startDate } })
      .populate('plan')
      .then(subs => subs.filter(s => s.plan && s.plan.freeTrialDays > 0).length);

    // Platform conversion rate
    const allTrials = await Subscription.find().populate('plan');
    const activeTrials = allTrials.filter(s => s.plan && s.plan.freeTrialDays > 0 && s.status === 'active');
    const convertedTrials = allTrials.filter(s => s.plan && s.plan.freeTrialDays > 0 && s.status === 'active' && new Date(s.createdAt).getTime() + (s.plan.freeTrialDays * 24 * 60 * 60 * 1000) < Date.now());
    const conversionRate = activeTrials.length > 0 ? (convertedTrials.length / activeTrials.length) * 100 : 0;
    const previousPeriodTrials = await Subscription.find({ createdAt: { $lt: startDate } }).populate('plan');
    const previousActiveTrials = previousPeriodTrials.filter(s => s.plan && s.plan.freeTrialDays > 0 && s.status === 'active');
    const previousConvertedTrials = previousPeriodTrials.filter(s => s.plan && s.plan.freeTrialDays > 0 && s.status === 'active' && new Date(s.createdAt).getTime() + (s.plan.freeTrialDays * 24 * 60 * 60 * 1000) < Date.now());
    const previousPeriodConversionRate = previousActiveTrials.length > 0 ? (previousConvertedTrials.length / previousActiveTrials.length) * 100 : 0;

    // Platform free subs breakdown
    const allSubscriptions = await Subscription.find().populate('plan');
    const freeSubs = allSubscriptions.filter(s => s.plan && s.plan.isFree).length;
    const payingSubs = allSubscriptions.filter(s => s.plan && !s.plan.isFree && s.status === 'active');
    const renewingPayingSubs = payingSubs.filter(s => !s.cancelAtPeriodEnd).length;
    const expiringPayingSubs = payingSubs.filter(s => s.cancelAtPeriodEnd).length;

    // Get individual creator stats
    const creatorStats = await Promise.all(
      creators.map(async (creator) => {
        const stats = await getCreatorStats(creator._id);
        return {
          _id: creator._id.toString(),
          email: creator.email,
          username: creator.username,
          firstName: creator.firstName,
          lastName: creator.lastName,
          storefront: creator.storefront ? {
            handle: creator.storefront.handle,
            displayName: creator.storefront.displayName
          } : undefined,
          ...stats
        };
      })
    );

    res.json({
      totalSubscribers,
      totalRevenue,
      activePlans,
      totalPicks,
      revenueData,
      previousPeriodRevenue,
      newCustomersData,
      previousPeriodCustomers,
      transactionsData,
      previousPeriodTransactions,
      spendPerCustomer,
      spendPerCustomerData,
      freeSubscribersData,
      previousPeriodFreeSubs,
      freeTrialData,
      previousPeriodFreeTrials,
      conversionRate,
      previousPeriodConversionRate,
      freeSubs,
      renewingPayingSubs,
      expiringPayingSubs,
      couponRedemptions: [],
      creators: creatorStats
    });
  } catch (error) {
    console.error('Get admin sales error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/picks
// @desc    Get all picks (admin only)
// @access  Private (admin)
router.get('/picks', auth, adminAuth, async (req, res) => {
  try {
    const { filter } = req.query;
    
    let query = {};
    if (filter === 'flagged') {
      query = { flagged: true };
    } else if (filter === 'pending') {
      query = { status: 'pending' };
    } else if (filter === 'locked') {
      query = { status: 'locked' };
    } else if (filter === 'graded') {
      query = { status: 'graded' };
    } else if (filter === 'disputed') {
      query = { status: 'disputed' };
    }
    
    const picks = await Pick.find(query)
      .populate('creator', 'username email')
      .populate('storefront', 'handle displayName')
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json(picks);
  } catch (error) {
    console.error('Get admin picks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/flag
// @desc    Flag a pick (admin only)
// @access  Private (admin)
router.post('/flag', auth, adminAuth, async (req, res) => {
  try {
    const { pickId, reason } = req.body;
    
    if (!pickId || !reason) {
      return res.status(400).json({ message: 'Pick ID and reason are required' });
    }
    
    const pick = await Pick.findById(pickId);
    if (!pick) {
      return res.status(404).json({ message: 'Pick not found' });
    }
    
    pick.flagged = true;
    if (!pick.flags) pick.flags = [];
    pick.flags.push({
      reason,
      flaggedBy: req.user._id,
      flaggedAt: new Date()
    });
    
    await pick.save();
    
    // Create audit log
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      userId: req.user._id,
      action: 'pick.flag',
      resourceType: 'Pick',
      resourceId: pick._id,
      metadata: { reason },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json({ message: 'Pick flagged successfully', pick });
  } catch (error) {
    console.error('Flag pick error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/disputes
// @desc    Get all disputes (admin only)
// @access  Private (admin)
router.get('/disputes', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }
    
    const Dispute = require('../models/Dispute');
    const disputes = await Dispute.find(query)
      .populate('pick', 'selection betType oddsAmerican result status')
      .populate('subscriber', 'username email')
      .populate('creator', 'username email')
      .populate('resolvedBy', 'username email')
      .sort({ createdAt: -1 });
    
    res.json(disputes);
  } catch (error) {
    console.error('Get admin disputes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/disputes/:id
// @desc    Get dispute details with full context (admin only)
// @access  Private (admin)
router.get('/disputes/:id', auth, adminAuth, async (req, res) => {
  try {
    const Dispute = require('../models/Dispute');
    const dispute = await Dispute.findById(req.params.id)
      .populate('pick')
      .populate('subscriber', 'username email')
      .populate('creator', 'username email')
      .populate('resolvedBy', 'username email');
    
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }
    
    // Get pick's audit history
    const AuditLog = require('../models/AuditLog');
    const auditLogs = await AuditLog.find({
      resourceType: 'Pick',
      resourceId: dispute.pick._id
    }).sort({ createdAt: -1 });
    
    // Get pick's edit history
    const editHistory = dispute.pick.editHistory || [];
    
    res.json({
      dispute,
      auditLogs,
      editHistory
    });
  } catch (error) {
    console.error('Get admin dispute error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

