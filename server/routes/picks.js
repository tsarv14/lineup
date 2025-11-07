const express = require('express');
const Pick = require('../models/Pick');
const Subscription = require('../models/Subscription');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/picks/my-picks
// @desc    Get user's accessible picks (from subscriptions and purchases)
// @access  Private
router.get('/my-picks', auth, async (req, res) => {
  try {
    // Get user's active subscriptions
    const subscriptions = await Subscription.find({
      subscriber: req.user._id,
      status: 'active'
    }).populate('plan');

    const subscribedPlanIds = subscriptions.map(sub => sub.plan._id);

    // Get picks from subscribed plans
    const picks = await Pick.find({
      $or: [
        { isFree: true },
        { plans: { $in: subscribedPlanIds } }
      ]
    })
    .populate({
      path: 'creator',
      select: 'username firstName lastName',
      populate: {
        path: 'storefront',
        select: 'handle displayName'
      }
    })
    .populate('storefront', 'handle displayName')
    .sort({ createdAt: -1 });

    res.json(picks);
  } catch (error) {
    console.error('Get my picks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/picks/:id
// @desc    Get a specific pick (check access - public for free picks)
// @access  Public (free picks) / Private (paid picks)
router.get('/:id', async (req, res) => {
  try {
    const pick = await Pick.findById(req.params.id)
      .populate('creator', 'username firstName lastName')
      .populate('storefront', 'handle displayName')
      .populate('plans', 'name');

    if (!pick) {
      return res.status(404).json({ message: 'Pick not found' });
    }

    // If pick is free, allow access
    if (pick.isFree) {
      return res.json(pick);
    }

    // For paid picks, check authentication
    if (!req.headers.authorization) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token and get user
    try {
      const token = req.headers.authorization.replace('Bearer ', '');
      const jwt = require('jsonwebtoken');
      const User = require('../models/User');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      // Check if user has active subscription to any of the pick's plans
      const subscriptions = await Subscription.find({
        subscriber: user._id,
        plan: { $in: pick.plans.map(p => p._id) },
        status: 'active'
      });

      if (subscriptions.length === 0) {
        return res.status(403).json({ message: 'You need to subscribe to access this pick' });
      }
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    res.json(pick);
  } catch (error) {
    console.error('Get pick error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

