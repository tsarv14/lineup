const express = require('express');
const Dispute = require('../models/Dispute');
const Pick = require('../models/Pick');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/admin');

const router = express.Router();

// @route   POST /api/disputes
// @desc    File a dispute for a pick (subscriber only)
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { pickId, reason, description } = req.body;
    
    if (!pickId || !reason) {
      return res.status(400).json({ message: 'Pick ID and reason are required' });
    }
    
    // Find pick
    const pick = await Pick.findById(pickId).populate('creator');
    if (!pick) {
      return res.status(404).json({ message: 'Pick not found' });
    }
    
    // Check if user has subscription to this creator
    const Subscription = require('../models/Subscription');
    const subscription = await Subscription.findOne({
      subscriber: req.user._id,
      creator: pick.creator._id,
      status: 'active'
    });
    
    if (!subscription) {
      return res.status(403).json({ message: 'You must have an active subscription to file a dispute' });
    }
    
    // Check if dispute already exists
    const existingDispute = await Dispute.findOne({
      pick: pickId,
      subscriber: req.user._id,
      status: { $in: ['pending', 'under_review'] }
    });
    
    if (existingDispute) {
      return res.status(400).json({ message: 'You already have a pending dispute for this pick' });
    }
    
    // Create dispute
    const dispute = new Dispute({
      pick: pickId,
      subscriber: req.user._id,
      creator: pick.creator._id,
      reason,
      description: description || '',
      status: 'pending'
    });
    
    await dispute.save();
    
    // Create audit log
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      userId: req.user._id,
      action: 'dispute.create',
      resourceType: 'Dispute',
      resourceId: dispute._id,
      metadata: { pickId, reason },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.status(201).json(dispute);
  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/disputes
// @desc    Get disputes (admin: all, user: their own)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // Non-admins only see their own disputes
    if (!req.user.roles?.includes('admin')) {
      query.$or = [
        { subscriber: req.user._id },
        { creator: req.user._id }
      ];
    }
    
    const { status } = req.query;
    if (status) {
      query.status = status;
    }
    
    const disputes = await Dispute.find(query)
      .populate('pick', 'selection betType oddsAmerican result status')
      .populate('subscriber', 'username email')
      .populate('creator', 'username email')
      .populate('resolvedBy', 'username email')
      .sort({ createdAt: -1 });
    
    res.json(disputes);
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/disputes/:id
// @desc    Get dispute details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('pick')
      .populate('subscriber', 'username email')
      .populate('creator', 'username email')
      .populate('resolvedBy', 'username email');
    
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }
    
    // Check access
    if (!req.user.roles?.includes('admin') && 
        dispute.subscriber._id.toString() !== req.user._id.toString() &&
        dispute.creator._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(dispute);
  } catch (error) {
    console.error('Get dispute error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/disputes/:id/resolve
// @desc    Resolve a dispute (admin only)
// @access  Private (admin)
router.put('/:id/resolve', auth, adminAuth, async (req, res) => {
  try {
    const { resolution, resolutionNotes, refundAmount, creditAmount } = req.body;
    
    if (!resolution || !['refund', 'credit', 'pick_corrected', 'dispute_dismissed'].includes(resolution)) {
      return res.status(400).json({ message: 'Valid resolution is required' });
    }
    
    const dispute = await Dispute.findById(req.params.id).populate('pick');
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }
    
    if (dispute.status === 'resolved') {
      return res.status(400).json({ message: 'Dispute already resolved' });
    }
    
    // Update dispute
    dispute.status = 'resolved';
    dispute.resolution = resolution;
    dispute.resolutionNotes = resolutionNotes || '';
    dispute.resolvedBy = req.user._id;
    dispute.resolvedAt = new Date();
    
    if (refundAmount) dispute.refundAmount = refundAmount;
    if (creditAmount) dispute.creditAmount = creditAmount;
    
    await dispute.save();
    
    // TODO: Process refund/credit if applicable
    // This would integrate with payment system (Stripe, etc.)
    
    // Create audit log
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      userId: req.user._id,
      action: 'dispute.resolve',
      resourceType: 'Dispute',
      resourceId: dispute._id,
      metadata: { resolution, refundAmount, creditAmount },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
    
    res.json(dispute);
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

