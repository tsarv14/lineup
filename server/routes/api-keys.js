/**
 * API Key Management Routes
 * Phase D: Create and manage API keys for public API access
 */

const express = require('express');
const ApiKey = require('../models/ApiKey');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/admin');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   POST /api/api-keys
// @desc    Create a new API key
// @access  Private (admin or creator)
router.post('/', async (req, res) => {
  try {
    const { keyName, permissions, rateLimit, expiresAt, notes } = req.body;
    
    if (!keyName) {
      return res.status(400).json({ message: 'Key name is required' });
    }
    
    // Only admins can create keys for others
    const owner = req.body.owner && req.user.roles?.includes('admin') 
      ? req.body.owner 
      : req.user._id;
    
    const { key, apiKey } = await ApiKey.createKey({
      keyName,
      owner,
      ownerEmail: req.user.email,
      permissions: permissions || {
        readPicks: true,
        readLeaderboards: true,
        readStats: true
      },
      rateLimit: rateLimit || {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 10000
      },
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      notes
    });
    
    // Return key only once (for security)
    res.status(201).json({
      message: 'API key created successfully. Save this key - it will not be shown again.',
      key,
      keyInfo: {
        id: apiKey._id,
        keyName: apiKey.keyName,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        createdAt: apiKey.createdAt,
        expiresAt: apiKey.expiresAt
      }
    });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/api-keys
// @desc    Get user's API keys (or all if admin)
// @access  Private
router.get('/', async (req, res) => {
  try {
    let query = {};
    
    // Non-admins only see their own keys
    if (!req.user.roles?.includes('admin')) {
      query.owner = req.user._id;
    }
    
    const keys = await ApiKey.find(query)
      .select('-keyHash') // Don't expose hash
      .sort({ createdAt: -1 });
    
    res.json(keys);
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/api-keys/:id
// @desc    Get API key details
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const key = await ApiKey.findById(req.params.id)
      .select('-keyHash');
    
    if (!key) {
      return res.status(404).json({ message: 'API key not found' });
    }
    
    // Check access
    if (!req.user.roles?.includes('admin') && key.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(key);
  } catch (error) {
    console.error('Get API key error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/api-keys/:id
// @desc    Update API key (deactivate, update permissions, etc.)
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const key = await ApiKey.findById(req.params.id);
    
    if (!key) {
      return res.status(404).json({ message: 'API key not found' });
    }
    
    // Check access
    if (!req.user.roles?.includes('admin') && key.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { isActive, permissions, rateLimit, notes } = req.body;
    
    if (isActive !== undefined) key.isActive = isActive;
    if (permissions) key.permissions = { ...key.permissions, ...permissions };
    if (rateLimit) key.rateLimit = { ...key.rateLimit, ...rateLimit };
    if (notes !== undefined) key.notes = notes;
    
    await key.save();
    
    res.json({
      message: 'API key updated successfully',
      key: await ApiKey.findById(req.params.id).select('-keyHash')
    });
  } catch (error) {
    console.error('Update API key error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/api-keys/:id
// @desc    Delete API key
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const key = await ApiKey.findById(req.params.id);
    
    if (!key) {
      return res.status(404).json({ message: 'API key not found' });
    }
    
    // Check access
    if (!req.user.roles?.includes('admin') && key.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await key.deleteOne();
    
    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

