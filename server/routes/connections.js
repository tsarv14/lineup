const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/connections
// @desc    Get user's connections
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('connections', 'username firstName lastName avatar bio')
      .select('connections');

    res.json(user.connections);
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/connections/request/:userId
// @desc    Send connection request
// @access  Private
router.post('/request/:userId', auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: 'Cannot send request to yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already connected
    if (targetUser.connections.includes(currentUserId)) {
      return res.status(400).json({ message: 'Already connected' });
    }

    // Check if request already sent
    if (targetUser.connectionRequests.includes(currentUserId)) {
      return res.status(400).json({ message: 'Request already sent' });
    }

    // Add to connection requests
    targetUser.connectionRequests.push(currentUserId);
    await targetUser.save();

    res.json({ message: 'Connection request sent' });
  } catch (error) {
    console.error('Send connection request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/connections/accept/:userId
// @desc    Accept connection request
// @access  Private
router.post('/accept/:userId', auth, async (req, res) => {
  try {
    const requesterUserId = req.params.userId;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser.connectionRequests.includes(requesterUserId)) {
      return res.status(400).json({ message: 'No pending request from this user' });
    }

    // Remove from connection requests
    currentUser.connectionRequests = currentUser.connectionRequests.filter(
      id => id.toString() !== requesterUserId
    );

    // Add to connections (both ways)
    if (!currentUser.connections.includes(requesterUserId)) {
      currentUser.connections.push(requesterUserId);
    }

    const requesterUser = await User.findById(requesterUserId);
    if (!requesterUser.connections.includes(currentUserId)) {
      requesterUser.connections.push(currentUserId);
    }

    await currentUser.save();
    await requesterUser.save();

    res.json({ message: 'Connection accepted' });
  } catch (error) {
    console.error('Accept connection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/connections/reject/:userId
// @desc    Reject connection request
// @access  Private
router.post('/reject/:userId', auth, async (req, res) => {
  try {
    const requesterUserId = req.params.userId;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    
    currentUser.connectionRequests = currentUser.connectionRequests.filter(
      id => id.toString() !== requesterUserId
    );

    await currentUser.save();

    res.json({ message: 'Connection request rejected' });
  } catch (error) {
    console.error('Reject connection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/connections/:userId
// @desc    Remove connection
// @access  Private
router.delete('/:userId', auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    // Remove from both users' connections
    currentUser.connections = currentUser.connections.filter(
      id => id.toString() !== targetUserId
    );
    targetUser.connections = targetUser.connections.filter(
      id => id.toString() !== currentUserId
    );

    await currentUser.save();
    await targetUser.save();

    res.json({ message: 'Connection removed' });
  } catch (error) {
    console.error('Remove connection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/connections/requests
// @desc    Get pending connection requests
// @access  Private
router.get('/requests', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('connectionRequests', 'username firstName lastName avatar bio')
      .select('connectionRequests');

    res.json(user.connectionRequests);
  } catch (error) {
    console.error('Get connection requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

