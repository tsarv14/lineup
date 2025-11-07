const express = require('express');
const Storefront = require('../models/Storefront');
const Plan = require('../models/Plan');
const Pick = require('../models/Pick');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/creators
// @desc    Get all creators (public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const creators = await User.find({ roles: { $in: ['creator'] } })
      .select('-password')
      .populate('storefront')
      .sort({ createdAt: -1 });

    res.json(creators);
  } catch (error) {
    console.error('Get creators error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/creators/:handle
// @desc    Get creator storefront by handle (public)
// @access  Public
router.get('/:handle', async (req, res) => {
  try {
    const storefront = await Storefront.findOne({ handle: req.params.handle })
      .populate('owner', 'username firstName lastName avatar');

    if (!storefront) {
      return res.status(404).json({ message: 'Creator not found' });
    }

    res.json(storefront);
  } catch (error) {
    console.error('Get storefront error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/creators/:handle/plans
// @desc    Get creator's plans (public)
// @access  Public
router.get('/:handle/plans', async (req, res) => {
  try {
    const storefront = await Storefront.findOne({ handle: req.params.handle });
    if (!storefront) {
      return res.status(404).json({ message: 'Creator not found' });
    }

    const plans = await Plan.find({
      storefront: storefront._id,
      archived: false
    }).sort({ createdAt: -1 });

    res.json(plans);
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/creators/:handle/picks
// @desc    Get creator's picks (filtered by user access)
// @access  Private (optional - shows free picks if not authenticated)
router.get('/:handle/picks', async (req, res) => {
  try {
    const storefront = await Storefront.findOne({ handle: req.params.handle });
    if (!storefront) {
      return res.status(404).json({ message: 'Creator not found' });
    }

    // Check if user is authenticated
    let subscribedPlanIds = [];
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace('Bearer ', '');
        const jwt = require('jsonwebtoken');
        const User = require('../models/User');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId);

        if (user) {
          // Get user's active subscriptions to this creator
          const subscriptions = await Subscription.find({
            subscriber: user._id,
            creator: storefront.owner,
            status: 'active'
          }).populate('plan');

          subscribedPlanIds = subscriptions.map(sub => sub.plan._id);
        }
      } catch (error) {
        // If token is invalid, just show free picks
      }
    }

    // Get picks - show free picks and picks from subscribed plans
    const queryConditions = [{ isFree: true }];
    if (subscribedPlanIds.length > 0) {
      queryConditions.push({ plans: { $in: subscribedPlanIds } });
    }

    const picks = await Pick.find({
      storefront: storefront._id,
      $or: queryConditions
    })
    .populate('creator', 'username firstName lastName')
    .sort({ createdAt: -1 });

    res.json(picks);
  } catch (error) {
    console.error('Get picks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/creators/:handle/picks (public - free picks only)
// @desc    Get creator's free picks (public)
// @access  Public
router.get('/:handle/picks/public', async (req, res) => {
  try {
    const storefront = await Storefront.findOne({ handle: req.params.handle });
    if (!storefront) {
      return res.status(404).json({ message: 'Creator not found' });
    }

    const picks = await Pick.find({
      storefront: storefront._id,
      isFree: true
    })
    .populate('creator', 'username firstName lastName')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json(picks);
  } catch (error) {
    console.error('Get public picks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

