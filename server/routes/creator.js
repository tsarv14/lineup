const express = require('express');
const Storefront = require('../models/Storefront');
const Plan = require('../models/Plan');
const Pick = require('../models/Pick');
const ApprovedHandle = require('../models/ApprovedHandle');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and creator role
router.use(auth);

// Middleware to check if user is a creator
const checkCreator = async (req, res, next) => {
  if (!req.user.roles || !req.user.roles.includes('creator')) {
    return res.status(403).json({ message: 'Access denied. Creator role required.' });
  }
  next();
};

router.use(checkCreator);

// ============ STOREFRONT ROUTES ============

// @route   GET /api/creator/storefront
// @desc    Get creator's storefront
// @access  Private (creator only)
router.get('/storefront', async (req, res) => {
  try {
    const storefront = await Storefront.findOne({ owner: req.user._id });
    if (!storefront) {
      return res.status(404).json({ message: 'Storefront not found. Please create one first.' });
    }
    res.json(storefront);
  } catch (error) {
    console.error('Get storefront error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/creator/storefront
// @desc    Update or create creator's storefront
// @access  Private (creator only)
router.put('/storefront', async (req, res) => {
  try {
    const { handle, displayName, description, logoImage, bannerImage, aboutText, aboutImage, socialLinks, sports } = req.body;

    let storefront = await Storefront.findOne({ owner: req.user._id });

    if (storefront) {
      // Update existing storefront
      if (handle && handle !== storefront.handle) {
        // Check if new handle is available (check ApprovedHandle collection - single source of truth)
        const normalizedHandle = handle.toLowerCase().trim();
        const existingApprovedHandle = await ApprovedHandle.findOne({ 
          handle: normalizedHandle,
          storefrontId: { $ne: storefront._id }
        });
        if (existingApprovedHandle) {
          return res.status(400).json({ message: 'Handle already taken' });
        }
        // Also check Storefront for consistency
        const existingStorefront = await Storefront.findOne({ 
          handle: normalizedHandle, 
          _id: { $ne: storefront._id } 
        });
        if (existingStorefront) {
          return res.status(400).json({ message: 'Handle already taken' });
        }
        storefront.handle = normalizedHandle;
        
        // Update ApprovedHandle collection if it exists
        const approvedHandle = await ApprovedHandle.findOne({ storefrontId: storefront._id });
        if (approvedHandle) {
          approvedHandle.handle = normalizedHandle;
          await approvedHandle.save();
        }
      }
      if (displayName !== undefined && displayName !== null) storefront.displayName = displayName;
      if (description !== undefined) storefront.description = description;
      if (logoImage !== undefined) storefront.logoImage = logoImage;
      if (bannerImage !== undefined) storefront.bannerImage = bannerImage;
      if (aboutText !== undefined) storefront.aboutText = aboutText;
      if (aboutImage !== undefined) storefront.aboutImage = aboutImage;
      if (socialLinks) {
        const updatedSocialLinks = { ...storefront.socialLinks };
        if (socialLinks.twitter !== undefined) updatedSocialLinks.twitter = socialLinks.twitter || '';
        if (socialLinks.instagram !== undefined) updatedSocialLinks.instagram = socialLinks.instagram || '';
        if (socialLinks.website !== undefined) updatedSocialLinks.website = socialLinks.website || '';
        storefront.socialLinks = updatedSocialLinks;
      }
      if (sports !== undefined) storefront.sports = sports || [];
      storefront.updatedAt = new Date();
      await storefront.save();
    } else {
      // Create new storefront
      if (!handle || !displayName) {
        return res.status(400).json({ message: 'Handle and display name are required' });
      }

      // Check if handle is available
      const existingHandle = await Storefront.findOne({ handle });
      if (existingHandle) {
        return res.status(400).json({ message: 'Handle already taken' });
      }

      storefront = new Storefront({
        owner: req.user._id,
        handle,
        displayName,
        description,
        logoImage,
        bannerImage,
        aboutText,
        aboutImage,
        socialLinks,
        sports: sports || []
      });
      await storefront.save();
    }

    res.json(storefront);
  } catch (error) {
    console.error('Update storefront error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Handle already taken' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ PLANS ROUTES ============

// @route   GET /api/creator/plans
// @desc    Get creator's plans
// @access  Private (creator only)
router.get('/plans', async (req, res) => {
  try {
    const storefront = await Storefront.findOne({ owner: req.user._id });
    if (!storefront) {
      return res.json([]);
    }

    const plans = await Plan.find({ creator: req.user._id })
      .sort({ createdAt: -1 });

    res.json(plans);
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/creator/plans/:id
// @desc    Get a single plan
// @access  Private (creator only)
router.get('/plans/:id', async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    if (plan.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(plan);
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/creator/plans
// @desc    Create a new plan
// @access  Private (creator only)
router.post('/plans', async (req, res) => {
  try {
    const { name, description, isFree, billingVariants, freeTrialDays, promoCodes } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Plan name is required' });
    }

    const storefront = await Storefront.findOne({ owner: req.user._id });
    if (!storefront) {
      return res.status(400).json({ message: 'Please create a storefront first' });
    }

    const plan = new Plan({
      creator: req.user._id,
      storefront: storefront._id,
      name,
      description,
      isFree: isFree || false,
      billingVariants: billingVariants || [],
      freeTrialDays: freeTrialDays || 0,
      promoCodes: promoCodes || [],
      archived: false
    });

    await plan.save();
    res.status(201).json(plan);
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/creator/plans/:id
// @desc    Update a plan
// @access  Private (creator only)
router.put('/plans/:id', async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    if (plan.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, description, isFree, billingVariants, freeTrialDays, archived, promoCodes } = req.body;

    if (name) plan.name = name;
    if (description !== undefined) plan.description = description;
    if (isFree !== undefined) plan.isFree = isFree;
    if (billingVariants) plan.billingVariants = billingVariants;
    if (promoCodes !== undefined) plan.promoCodes = promoCodes;
    if (freeTrialDays !== undefined) plan.freeTrialDays = freeTrialDays;
    if (archived !== undefined) plan.archived = archived;
    plan.updatedAt = new Date();

    await plan.save();
    res.json(plan);
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/creator/plans/:id
// @desc    Delete a plan (or archive it)
// @access  Private (creator only)
router.delete('/plans/:id', async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    if (plan.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Archive instead of delete
    plan.archived = true;
    plan.updatedAt = new Date();
    await plan.save();

    res.json({ message: 'Plan archived successfully' });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ PICKS ROUTES ============

// @route   GET /api/creator/picks
// @desc    Get creator's picks
// @access  Private (creator only)
router.get('/picks', async (req, res) => {
  try {
    const picks = await Pick.find({ creator: req.user._id })
      .populate('storefront', 'handle displayName')
      .populate('plans', 'name')
      .sort({ createdAt: -1 });

    res.json(picks);
  } catch (error) {
    console.error('Get picks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/creator/picks
// @desc    Create a new pick
// @access  Private (creator only)
router.post('/picks', async (req, res) => {
  try {
    const { 
      title, description, sport, marketType, odds, stake, 
      isFree, plans, oneOffPriceCents, eventDate, scheduledAt, 
      tags, media 
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Pick title is required' });
    }

    const storefront = await Storefront.findOne({ owner: req.user._id });
    if (!storefront) {
      return res.status(400).json({ message: 'Please create a storefront first' });
    }

    const pickData = {
      creator: req.user._id,
      storefront: storefront._id,
      title,
      description,
      sport,
      marketType,
      odds,
      stake,
      isFree: isFree || false,
      plans: plans || [],
      oneOffPriceCents: oneOffPriceCents || 0,
      eventDate: eventDate ? new Date(eventDate) : undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      tags: tags || [],
      media: media || []
    };

    // If scheduled, don't set publishedAt yet; otherwise publish immediately
    if (!scheduledAt) {
      pickData.publishedAt = new Date();
    }

    const pick = new Pick(pickData);
    await pick.save();
    res.status(201).json(pick);
  } catch (error) {
    console.error('Create pick error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/creator/picks/:id
// @desc    Update a pick
// @access  Private (creator only)
router.put('/picks/:id', async (req, res) => {
  try {
    const pick = await Pick.findById(req.params.id);
    if (!pick) {
      return res.status(404).json({ message: 'Pick not found' });
    }

    if (pick.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { 
      title, description, sport, marketType, odds, stake, 
      isFree, plans, oneOffPriceCents, eventDate, scheduledAt, 
      tags, media, result 
    } = req.body;

    if (title) pick.title = title;
    if (description !== undefined) pick.description = description;
    if (sport !== undefined) pick.sport = sport;
    if (marketType !== undefined) pick.marketType = marketType;
    if (odds !== undefined) pick.odds = odds;
    if (stake !== undefined) pick.stake = stake;
    if (isFree !== undefined) pick.isFree = isFree;
    if (plans) pick.plans = plans;
    if (oneOffPriceCents !== undefined) pick.oneOffPriceCents = oneOffPriceCents;
    if (eventDate) pick.eventDate = new Date(eventDate);
    if (scheduledAt !== undefined) {
      pick.scheduledAt = scheduledAt ? new Date(scheduledAt) : undefined;
      // If scheduled time has passed and not published, publish now
      if (!pick.publishedAt && (!scheduledAt || new Date(scheduledAt) <= new Date())) {
        pick.publishedAt = new Date();
      }
    }
    if (tags !== undefined) pick.tags = tags;
    if (media !== undefined) pick.media = media;
    if (result !== undefined) {
      pick.result = result;
      if (result !== 'pending' && !pick.resolvedAt) {
        pick.resolvedAt = new Date();
      }
    }
    pick.updatedAt = new Date();

    await pick.save();
    res.json(pick);
  } catch (error) {
    console.error('Update pick error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/creator/picks/:id
// @desc    Delete a pick
// @access  Private (creator only)
router.delete('/picks/:id', async (req, res) => {
  try {
    const pick = await Pick.findById(req.params.id);
    if (!pick) {
      return res.status(404).json({ message: 'Pick not found' });
    }

    if (pick.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await pick.deleteOne();
    res.json({ message: 'Pick deleted successfully' });
  } catch (error) {
    console.error('Delete pick error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

