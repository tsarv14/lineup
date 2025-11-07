const express = require('express');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const Storefront = require('../models/Storefront');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/subscriptions
// @desc    Get user's subscriptions
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ subscriber: req.user._id })
      .populate('plan', 'name description')
      .populate({
        path: 'creator',
        select: 'username firstName lastName',
        populate: {
          path: 'storefront',
          select: 'handle displayName'
        }
      })
      .sort({ createdAt: -1 });

    res.json(subscriptions);
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/subscriptions
// @desc    Subscribe to a plan
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { planId, billingInterval } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Check if user already has an active subscription to this plan
    const existingSubscription = await Subscription.findOne({
      subscriber: req.user._id,
      plan: planId,
      status: 'active'
    });

    if (existingSubscription) {
      return res.status(400).json({ message: 'You already have an active subscription to this plan' });
    }

    // Calculate period end date (based on free trial or billing interval)
    const periodEnd = new Date();
    if (plan.freeTrialDays > 0) {
      periodEnd.setDate(periodEnd.getDate() + plan.freeTrialDays);
    } else {
      const intervalDaysMap = {
        'daily': 1,
        'weekly': 7,
        'two_weeks': 14,
        'monthly': 30,
        'yearly': 365
      };
      const intervalDays = intervalDaysMap[billingInterval] || 30;
      periodEnd.setDate(periodEnd.getDate() + intervalDays);
    }

    // Create subscription
    const subscription = new Subscription({
      subscriber: req.user._id,
      creator: plan.creator,
      plan: planId,
      status: 'active',
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false
    });

    await subscription.save();

    res.status(201).json(subscription);
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/subscriptions/:id/cancel
// @desc    Cancel a subscription
// @access  Private
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.subscriber.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    subscription.status = 'canceled';
    subscription.cancelAtPeriodEnd = true;
    await subscription.save();

    // TODO: Cancel Stripe subscription when integrated

    res.json(subscription);
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

