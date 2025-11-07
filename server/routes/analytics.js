const express = require('express');
const auth = require('../middleware/auth');
const Storefront = require('../models/Storefront');
const Pick = require('../models/Pick');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const router = express.Router();

// Analytics routes for tracking creator page views and engagement

// @route   POST /api/analytics/track
// @desc    Track page view or event
// @access  Public (for page views) or Private (for authenticated events)
router.post('/track', async (req, res) => {
  try {
    const { event, creatorHandle, metadata } = req.body;

    // In production, you would:
    // 1. Store analytics events in a database
    // 2. Use a service like Google Analytics, Mixpanel, or Amplitude
    // 3. Track events like: page_view, subscription_start, pick_view, etc.

    // For now, we'll just log the event
    console.log('Analytics Event:', {
      event,
      creatorHandle,
      metadata,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    // In production, save to analytics database:
    // const AnalyticsEvent = require('../models/AnalyticsEvent');
    // const analyticsEvent = new AnalyticsEvent({
    //   event,
    //   creatorHandle,
    //   metadata,
    //   timestamp: new Date(),
    //   userAgent: req.headers['user-agent'],
    //   ip: req.ip
    // });
    // await analyticsEvent.save();

    res.json({ success: true, message: 'Event tracked' });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/creator/:handle
// @desc    Get analytics for a creator
// @access  Private (creator only)
router.get('/creator/:handle', auth, async (req, res) => {
  try {
    const { handle } = req.params;

    // Verify user owns this storefront
    const storefront = await Storefront.findOne({ handle });
    if (!storefront) {
      return res.status(404).json({ message: 'Storefront not found' });
    }

    if (storefront.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get analytics data
    const totalPicks = await Pick.countDocuments({ storefront: storefront._id });
    const totalSubscriptions = await Subscription.countDocuments({ creator: req.user._id, status: 'active' });
    const totalRevenue = await Transaction.aggregate([
      { $match: { creator: req.user._id } },
      { $group: { _id: null, total: { $sum: '$amountCents' } } }
    ]);

    // In production, get more detailed analytics:
    // - Page views over time
    // - Conversion rates
    // - Traffic sources
    // - Geographic data
    // - Device/browser breakdown

    res.json({
      handle,
      totalPicks,
      totalSubscriptions,
      totalRevenue: totalRevenue[0]?.total || 0,
      message: 'Analytics data retrieved. In production, this would include detailed metrics.'
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

