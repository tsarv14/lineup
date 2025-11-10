const express = require('express');
const Storefront = require('../models/Storefront');
const Plan = require('../models/Plan');
const Pick = require('../models/Pick');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/admin');

const router = express.Router();

// @route   GET /api/creators
// @desc    Get all creators (public) - returns storefronts with owner info
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Fetch all storefronts directly (they are the source of truth)
    const storefronts = await Storefront.find()
      .populate('owner', 'email username firstName lastName avatar')
      .sort({ createdAt: -1 });

    // Transform to creator format for frontend compatibility
    const creators = storefronts.map(storefront => ({
      _id: storefront.owner?._id || storefront._id,
      email: storefront.owner?.email || '',
      firstName: storefront.owner?.firstName,
      lastName: storefront.owner?.lastName,
      username: storefront.owner?.username || '',
      avatar: storefront.owner?.avatar,
      storefront: {
        _id: storefront._id,
        handle: storefront.handle,
        displayName: storefront.displayName,
        description: storefront.description,
        logoImage: storefront.logoImage,
        bannerImage: storefront.bannerImage,
        createdAt: storefront.createdAt
      },
      createdAt: storefront.createdAt
    }));

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
    // Normalize handle to lowercase for consistent lookup
    const normalizedHandle = req.params.handle.toLowerCase().trim();
    const storefront = await Storefront.findOne({ handle: normalizedHandle })
      .populate('owner', 'username firstName lastName avatar');

    if (!storefront) {
      console.log(`Storefront not found for handle: ${normalizedHandle}`);
      return res.status(404).json({ message: 'Creator not found' });
    }

    // Phase C: Add transparency score
    const storefrontObj = storefront.toObject();
    if (storefront.owner) {
      try {
        const { getTransparencyScore } = require('../services/transparencyScore');
        const transparencyData = await getTransparencyScore(storefront.owner._id);
        storefrontObj.transparencyScore = transparencyData.score || 0;
        storefrontObj.transparencyScoreBreakdown = transparencyData.breakdown || null;
      } catch (err) {
        console.log('Could not fetch transparency score:', err.message);
        storefrontObj.transparencyScore = 0;
      }
    }

    res.json(storefrontObj);
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

