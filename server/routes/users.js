const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/creators
// @desc    Get all creators (public endpoint)
// @access  Public
router.get('/creators', async (req, res) => {
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

// @route   GET /api/users
// @desc    Get all users (with pagination)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = search
      ? {
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } }
          ],
          _id: { $ne: req.user._id }
        }
      : { _id: { $ne: req.user._id } };

    const users = await User.find(query)
      .select('-password')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('connections', 'username firstName lastName avatar');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { firstName, lastName, bio, avatar } = req.body;
    const updateData = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;

    updateData.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

