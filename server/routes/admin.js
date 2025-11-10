const express = require('express');
const User = require('../models/User');
const Storefront = require('../models/Storefront');
const CreatorApplication = require('../models/CreatorApplication');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/admin');

const router = express.Router();

// @route   GET /api/admin/storefronts
// @desc    Get all storefronts (including those without creator role)
// @access  Private (admin)
router.get('/storefronts', auth, adminAuth, async (req, res) => {
  try {
    const storefronts = await Storefront.find()
      .populate('owner', 'email username firstName lastName roles')
      .sort({ createdAt: -1 });
    
    res.json(storefronts);
  } catch (error) {
    console.error('Get storefronts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/fix-creator/:handle
// @desc    Fix a specific creator by handle (add role, link storefront)
// @access  Private (admin)
router.post('/fix-creator/:handle', auth, adminAuth, async (req, res) => {
  try {
    const handle = req.params.handle.toLowerCase().trim();
    
    // Find storefront by handle
    const storefront = await Storefront.findOne({ handle });
    if (!storefront) {
      return res.status(404).json({ message: 'Storefront not found for this handle' });
    }

    // Find user by storefront owner
    const user = await User.findById(storefront.owner);
    if (!user) {
      return res.status(404).json({ message: 'User not found for this storefront' });
    }

    let fixed = false;

    // Initialize roles array if it doesn't exist
    if (!user.roles || !Array.isArray(user.roles)) {
      user.roles = ['subscriber'];
      fixed = true;
    }
    
    // Add creator role if not already present
    if (!user.roles.includes('creator')) {
      user.roles.push('creator');
      fixed = true;
    }
    
    // Link storefront if not already linked
    if (!user.storefront || user.storefront.toString() !== storefront._id.toString()) {
      user.storefront = storefront._id;
      fixed = true;
    }

    if (fixed) {
      await user.save();
      return res.json({ 
        message: 'Creator fixed successfully',
        user: {
          email: user.email,
          roles: user.roles,
          hasStorefront: !!user.storefront
        }
      });
    } else {
      return res.json({ 
        message: 'Creator already has correct setup',
        user: {
          email: user.email,
          roles: user.roles,
          hasStorefront: !!user.storefront
        }
      });
    }
  } catch (error) {
    console.error('Fix creator error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/manual-creator
// @desc    Manually create/fix a creator by email or handle
// @access  Private (admin)
router.post('/manual-creator', auth, adminAuth, async (req, res) => {
  try {
    const { email, handle, displayName } = req.body;
    
    if (!email && !handle) {
      return res.status(400).json({ message: 'Email or handle is required' });
    }

    let user = null;
    let storefront = null;

    // Find user by email if provided
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ message: 'User not found with this email' });
      }
    }

    // Find storefront by handle if provided
    if (handle) {
      const normalizedHandle = handle.toLowerCase().trim();
      storefront = await Storefront.findOne({ handle: normalizedHandle });
      
      if (storefront && !user) {
        user = await User.findById(storefront.owner);
      }
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found. Please provide email or handle of existing storefront.' });
    }

    // Initialize roles array if it doesn't exist
    if (!user.roles || !Array.isArray(user.roles)) {
      user.roles = ['subscriber'];
    }
    
    // Add creator role if not already present
    if (!user.roles.includes('creator')) {
      user.roles.push('creator');
    }

    // Create or update storefront
    if (!storefront) {
      if (!handle || !displayName) {
        return res.status(400).json({ message: 'Handle and displayName are required to create a new storefront' });
      }
      
      const normalizedHandle = handle.toLowerCase().trim();
      
      // Check if handle is taken
      const existingStorefront = await Storefront.findOne({ handle: normalizedHandle });
      if (existingStorefront) {
        return res.status(400).json({ message: 'Handle already taken' });
      }

      storefront = new Storefront({
        owner: user._id,
        handle: normalizedHandle,
        displayName: displayName,
        description: '',
        socialLinks: {},
        sports: []
      });
      await storefront.save();
    }

    // Link storefront to user
    user.storefront = storefront._id;
    await user.save();

    res.json({ 
      message: 'Creator created/fixed successfully',
      user: {
        email: user.email,
        roles: user.roles,
        hasStorefront: !!user.storefront
      },
      storefront: {
        handle: storefront.handle,
        displayName: storefront.displayName
      }
    });
  } catch (error) {
    console.error('Manual creator error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

