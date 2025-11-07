const express = require('express');
const Subscription = require('../models/Subscription');
const Pick = require('../models/Pick');
const Plan = require('../models/Plan');
const Storefront = require('../models/Storefront');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

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

// @route   GET /api/creator/dashboard/overview
// @desc    Get creator dashboard overview stats
// @access  Private (creator only)
router.get('/overview', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if user is a creator
    if (!req.user.roles || !req.user.roles.includes('creator')) {
      return res.status(403).json({ message: 'Access denied. Creator role required.' });
    }

    // Get storefront
    const storefront = await Storefront.findOne({ owner: userId });
    if (!storefront) {
      return res.json({
        totalSubscribers: 0,
        totalRevenue: 0,
        activePlans: 0,
        totalPicks: 0,
        recentSubscriptions: [],
        recentPicks: [],
        revenueData: [],
        previousPeriodRevenue: 0,
        newCustomersData: [],
        previousPeriodCustomers: 0,
        transactionsData: [],
        previousPeriodTransactions: 0,
        spendPerCustomer: 0,
        spendPerCustomerData: [],
        freeSubscribersData: [],
        previousPeriodFreeSubs: 0,
        freeTrialData: [],
        previousPeriodFreeTrials: 0,
        conversionRate: 0,
        previousPeriodConversionRate: 0,
        freeSubs: 0,
        renewingPayingSubs: 0,
        expiringPayingSubs: 0,
        couponRedemptions: []
      });
    }

    const { startDate, endDate } = getDateRange();

    // Get total subscribers (active subscriptions)
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

    // Get total revenue from transactions
    const transactions = await Transaction.find({
      creator: userId,
      type: { $in: ['subscription', 'oneoff'] }
    });
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.amountCents || 0), 0);

    // Get revenue time series (last 30 days)
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

    // Get new customers time series (last 30 days)
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

    // Calculate spend per customer
    const totalCustomers = await Subscription.countDocuments({ creator: userId });
    const spendPerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    const spendPerCustomerData = revenueData.map((rev, idx) => {
      const customersOnDate = newCustomersData.slice(0, idx + 1).reduce((sum, val) => sum + val, 0);
      return customersOnDate > 0 ? rev / customersOnDate : 0;
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
    const previousPeriodFreeSubsList = await Subscription.find({
      creator: userId,
      createdAt: { $lt: startDate }
    }).populate('plan');
    const previousPeriodFreeSubs = previousPeriodFreeSubsList.filter(s => s.plan && s.plan.isFree).length;

    // Get free trial customers
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
    const previousPeriodFreeTrialsList = await Subscription.find({
      creator: userId,
      createdAt: { $lt: startDate }
    }).populate('plan');
    const previousPeriodFreeTrials = previousPeriodFreeTrialsList.filter(s => s.plan && s.plan.freeTrialDays > 0).length;

    // Calculate free trial conversions
    const allFreeTrialSubs = await Subscription.find({ creator: userId }).populate('plan');
    const freeTrialSubsList = allFreeTrialSubs.filter(s => s.plan && s.plan.freeTrialDays > 0);
    const convertedTrials = freeTrialSubsList.filter(s => {
      const trialEndDate = new Date(s.createdAt);
      trialEndDate.setDate(trialEndDate.getDate() + (s.plan.freeTrialDays || 0));
      return s.status === 'active' && new Date() > trialEndDate;
    }).length;
    const conversionRate = freeTrialSubsList.length > 0 
      ? (convertedTrials / freeTrialSubsList.length) * 100 
      : 0;
    const previousPeriodTrialsList = await Subscription.find({
      creator: userId,
      createdAt: { $lt: startDate }
    }).populate('plan');
    const previousPeriodTrials = previousPeriodTrialsList.filter(s => s.plan && s.plan.freeTrialDays > 0);
    const previousPeriodConverted = previousPeriodTrials.filter(s => {
      const trialEndDate = new Date(s.createdAt);
      trialEndDate.setDate(trialEndDate.getDate() + (s.plan.freeTrialDays || 0));
      return s.status === 'active' && new Date(s.createdAt) < startDate && new Date() > trialEndDate;
    }).length;
    const previousPeriodConversionRate = previousPeriodTrials.length > 0 
      ? (previousPeriodConverted / previousPeriodTrials.length) * 100 
      : 0;

    // Get coupon redemptions (from plans with promoCodes)
    const plansWithPromos = await Plan.find({
      creator: userId,
      'promoCodes.0': { $exists: true }
    });
    const couponRedemptions = [];
    plansWithPromos.forEach(plan => {
      if (plan.promoCodes && plan.promoCodes.length > 0) {
        plan.promoCodes.forEach(promo => {
          couponRedemptions.push({
            code: promo.code,
            uses: 0, // TODO: Track actual usage in transactions
            amount: 0 // TODO: Calculate from transactions
          });
        });
      }
    });

    // Get active plans count
    const activePlans = await Plan.countDocuments({
      creator: userId,
      archived: false
    });

    // Get total picks count
    const totalPicks = await Pick.countDocuments({
      creator: userId
    });

    // Get recent subscriptions (last 5)
    const recentSubscriptions = await Subscription.find({
      creator: userId
    })
      .populate('subscriber', 'username email firstName lastName')
      .populate('plan', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent picks (last 5)
    const recentPicks = await Pick.find({
      creator: userId
    })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalSubscribers,
      totalRevenue,
      activePlans,
      totalPicks,
      // Time series data
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
      // Subscriber breakdown
      freeSubs,
      renewingPayingSubs,
      expiringPayingSubs,
      // Coupon redemptions
      couponRedemptions,
      recentSubscriptions: recentSubscriptions.map(sub => ({
        _id: sub._id,
        subscriber: {
          username: sub.subscriber?.username,
          email: sub.subscriber?.email,
          firstName: sub.subscriber?.firstName,
          lastName: sub.subscriber?.lastName
        },
        plan: {
          name: sub.plan?.name
        },
        status: sub.status,
        createdAt: sub.createdAt,
        currentPeriodEnd: sub.currentPeriodEnd
      })),
      recentPicks: recentPicks.map(pick => ({
        _id: pick._id,
        title: pick.title,
        sport: pick.sport,
        isFree: pick.isFree,
        createdAt: pick.createdAt
      }))
    });
  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
