const express = require('express');
const { body, validationResult } = require('express-validator');
const CreatorApplication = require('../models/CreatorApplication');
const Storefront = require('../models/Storefront');
const User = require('../models/User');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/admin');

const router = express.Router();

// @route   POST /api/applications
// @desc    Submit a creator application
// @access  Public (but can be authenticated)
router.post('/', [
  body('handle')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Handle must be 3-30 characters and contain only lowercase letters, numbers, and hyphens'),
  body('displayName').trim().isLength({ min: 1, max: 100 }).withMessage('Display name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('experience').trim().isLength({ min: 10, max: 2000 }).withMessage('Experience must be 10-2000 characters'),
  body('whyCreator').trim().isLength({ min: 10, max: 2000 }).withMessage('Why creator must be 10-2000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { handle, displayName, email, phoneNumber, socialLinks, experience, whyCreator, sports } = req.body;

    // Normalize handle
    const normalizedHandle = handle.toLowerCase().trim();

    // Check if handle is already taken in Storefront
    const existingStorefront = await Storefront.findOne({ handle: normalizedHandle });
    if (existingStorefront) {
      return res.status(400).json({ message: 'This handle is already taken' });
    }

    // Check if handle is already in a pending or approved application
    const existingApplication = await CreatorApplication.findOne({
      handle: normalizedHandle,
      status: { $in: ['pending', 'approved'] }
    });
    if (existingApplication) {
      return res.status(400).json({ message: 'This handle is already taken or pending approval' });
    }

    // Check if user already has an application
    let userId = null;
    if (req.user) {
      userId = req.user._id;
      const existingUserApplication = await CreatorApplication.findOne({
        user: userId,
        status: { $in: ['pending', 'approved'] }
      });
      if (existingUserApplication) {
        return res.status(400).json({ message: 'You already have a pending or approved application' });
      }
    }

    // Create application
    const application = new CreatorApplication({
      user: userId,
      handle: normalizedHandle,
      displayName,
      email,
      phoneNumber,
      socialLinks: socialLinks || {},
      experience,
      whyCreator,
      sports: sports || [],
      status: 'pending'
    });

    await application.save();
    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (error) {
    console.error('Submit application error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This handle is already taken' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/applications/check-handle/:handle
// @desc    Check if a handle is available
// @access  Public
router.get('/check-handle/:handle', async (req, res) => {
  try {
    const normalizedHandle = req.params.handle.toLowerCase().trim();
    const excludeApplicationId = req.query.excludeApplicationId;

    // Check Storefront
    const existingStorefront = await Storefront.findOne({ handle: normalizedHandle });
    if (existingStorefront) {
      return res.json({ available: false, message: 'This handle is already taken by another creator' });
    }

    // Check applications (excluding current application if provided)
    const query = {
      handle: normalizedHandle,
      status: { $in: ['pending', 'approved'] }
    };
    if (excludeApplicationId) {
      query._id = { $ne: excludeApplicationId };
    }
    const existingApplication = await CreatorApplication.findOne(query);
    if (existingApplication) {
      return res.json({ available: false, message: 'This handle is already taken or pending approval' });
    }

    res.json({ available: true });
  } catch (error) {
    console.error('Check handle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/applications
// @desc    Get all applications (admin only)
// @access  Private (admin)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    
    const applications = await CreatorApplication.find(query)
      .populate('user', 'email firstName lastName')
      .populate('reviewedBy', 'email firstName lastName')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/applications/:id
// @desc    Get a single application (admin only)
// @access  Private (admin)
router.get('/:id', auth, adminAuth, async (req, res) => {
  try {
    const application = await CreatorApplication.findById(req.params.id)
      .populate('user', 'email firstName lastName')
      .populate('reviewedBy', 'email firstName lastName');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json(application);
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/applications/:id/approve
// @desc    Approve an application (admin only)
// @access  Private (admin)
router.put('/:id/approve', auth, adminAuth, [
  body('handle').optional().trim().isLength({ min: 3, max: 30 }).matches(/^[a-z0-9-]+$/).withMessage('Handle must be 3-30 characters and contain only lowercase letters, numbers, and hyphens')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const application = await CreatorApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Application is not pending' });
    }

    // Use provided handle or application handle
    let finalHandle = req.body.handle ? req.body.handle.toLowerCase().trim() : application.handle;
    
    // Validate handle format
    if (!/^[a-z0-9-]+$/.test(finalHandle)) {
      return res.status(400).json({ message: 'Handle can only contain lowercase letters, numbers, and hyphens' });
    }

    // Check if handle is available (excluding this application)
    const existingStorefront = await Storefront.findOne({ handle: finalHandle });
    if (existingStorefront) {
      return res.status(400).json({ message: 'This handle is already taken by another creator' });
    }

    // Check if handle is in another pending/approved application
    const existingApplication = await CreatorApplication.findOne({
      handle: finalHandle,
      status: { $in: ['pending', 'approved'] },
      _id: { $ne: application._id }
    });
    if (existingApplication) {
      return res.status(400).json({ message: 'This handle is already taken or pending in another application' });
    }

    // Update application with new handle if changed
    if (finalHandle !== application.handle) {
      application.handle = finalHandle;
    }

    // Update application status
    application.status = 'approved';
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    application.adminNotes = req.body.adminNotes || application.adminNotes;
    application.updatedAt = new Date();
    await application.save();

    // If user exists, grant creator role and create storefront
    if (application.user) {
      const user = await User.findById(application.user);
      if (user) {
        // Add creator role if not already present
        if (!user.roles.includes('creator')) {
          user.roles.push('creator');
          await user.save();
        }

        // Create storefront with the final handle
        const storefront = new Storefront({
          owner: user._id,
          handle: finalHandle,
          displayName: application.displayName,
          description: '',
          socialLinks: application.socialLinks || {},
          sports: application.sports || []
        });
        await storefront.save();

        // Link storefront to user
        user.storefront = storefront._id;
        await user.save();
      }
    }

    res.json({ message: 'Application approved successfully', application });
  } catch (error) {
    console.error('Approve application error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Handle is no longer available' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/applications/:id/reject
// @desc    Reject an application (admin only)
// @access  Private (admin)
router.put('/:id/reject', auth, adminAuth, [
  body('rejectionReason').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const application = await CreatorApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Application is not pending' });
    }

    application.status = 'rejected';
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    application.rejectionReason = req.body.rejectionReason || '';
    application.adminNotes = req.body.adminNotes || application.adminNotes;
    application.updatedAt = new Date();
    await application.save();

    res.json({ message: 'Application rejected', application });
  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

