const express = require('express');
const Review = require('../models/Review');
const auth = require('../middleware/auth');
const auditLog = require('../middleware/auditLog');

const router = express.Router();

// @route   GET /api/reviews/capper/:capperId
// @desc    Get reviews for a capper
// @access  Public
router.get('/capper/:capperId', async (req, res) => {
  try {
    const reviews = await Review.find({ capper: req.params.capperId, moderated: true })
      .populate('user', 'username firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({
      reviews,
      averageRating: avgRating,
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reviews
// @desc    Create a review
// @access  Private
router.post('/', auth, auditLog('review.create', 'Review'), async (req, res) => {
  try {
    const { capperId, rating, comment } = req.body;

    if (!capperId || !rating) {
      return res.status(400).json({ message: 'Capper ID and rating are required' });
    }

    // Check if user already reviewed this capper
    const existingReview = await Review.findOne({ user: req.user._id, capper: capperId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this capper' });
    }

    const review = new Review({
      user: req.user._id,
      capper: capperId,
      rating,
      comment: comment || ''
    });

    await review.save();
    await review.populate('user', 'username firstName lastName avatar');

    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private
router.put('/:id', auth, auditLog('review.update', 'Review'), async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.body.rating) review.rating = req.body.rating;
    if (req.body.comment !== undefined) review.comment = req.body.comment;
    review.updatedAt = new Date();

    await review.save();
    res.json(review);
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reviews/:id/flag
// @desc    Flag a review
// @access  Private
router.post('/:id/flag', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.flaggedCount += 1;
    if (review.flaggedCount >= 3) {
      review.moderated = false; // Hide until moderation
    }

    await review.save();
    res.json({ message: 'Review flagged' });
  } catch (error) {
    console.error('Flag review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

