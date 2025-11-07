const express = require('express');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const auditLog = require('../middleware/auditLog');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/messages
// @desc    Get user's messages (conversations)
// @access  Private
router.get('/', async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ]
    })
      .populate('sender', 'username firstName lastName avatar')
      .populate('receiver', 'username firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/conversation/:userId
// @desc    Get conversation with a specific user
// @access  Private
router.get('/conversation/:userId', async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id }
      ]
    })
      .populate('sender', 'username firstName lastName avatar')
      .populate('receiver', 'username firstName lastName avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', auditLog('message.create', 'Message'), async (req, res) => {
  try {
    const { receiverId, content, attachments } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver ID and content are required' });
    }

    const message = new Message({
      sender: req.user._id,
      receiver: receiverId,
      content,
      attachments: attachments || []
    });

    await message.save();
    await message.populate('sender', 'username firstName lastName avatar');
    await message.populate('receiver', 'username firstName lastName avatar');

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read', async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.readAt = new Date();
    await message.save();

    res.json(message);
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

