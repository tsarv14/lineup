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
// @desc    Create a new structured pick (Phase A: Verified Picks System)
// @access  Private (creator only)
router.post('/picks', async (req, res) => {
  try {
    const { 
      // Phase A structured fields
      sport, league, gameId, gameText, betType, selection, oddsAmerican,
      unitsRisked, amountRisked, unitValue, writeUp,
      // Legacy fields (for backward compatibility)
      title, description, marketType, odds, stake,
      isFree, plans, oneOffPriceCents, eventDate, scheduledAt, 
      tags, media,
      // Game timing
      gameStartTime
    } = req.body;

    // Phase A validation: require structured pick fields
    if (!sport || !betType || !selection || oddsAmerican === undefined || !unitsRisked) {
      return res.status(400).json({ 
        message: 'Missing required fields: sport, betType, selection, oddsAmerican, unitsRisked' 
      });
    }

    if (!gameStartTime) {
      return res.status(400).json({ message: 'gameStartTime is required' });
    }

    const gameStart = new Date(gameStartTime);
    const now = new Date();

    // Business rule: cannot create pick whose gameStartTime <= now
    if (gameStart <= now) {
      return res.status(400).json({ 
        message: 'Cannot create pick: game start time must be in the future' 
      });
    }

    const storefront = await Storefront.findOne({ owner: req.user._id });
    if (!storefront) {
      return res.status(400).json({ message: 'Please create a storefront first' });
    }

    // Get creator's unit value
    const creator = await User.findById(req.user._id);
    const unitValueAtPost = unitValue || creator.unitValueDefault || 100; // Default $100 per unit

    if (!unitValueAtPost || unitValueAtPost <= 0) {
      return res.status(400).json({ 
        message: 'Unit value must be set. Please set your default unit value in settings.' 
      });
    }

    // Validate American odds
    const { americanToDecimal, isValidAmericanOdds } = require('../utils/oddsConverter');
    if (!isValidAmericanOdds(oddsAmerican)) {
      return res.status(400).json({ message: 'Invalid American odds' });
    }

    const oddsDecimal = americanToDecimal(oddsAmerican);

    // Calculate amount risked if not provided
    const finalAmountRisked = amountRisked || Math.round(unitsRisked * unitValueAtPost);

    // Determine verification status (Phase A: verified if posted before game start)
    const isVerified = now < gameStart;
    const verificationSource = isVerified ? 'system' : 'manual';

    const pickData = {
      creator: req.user._id,
      storefront: storefront._id,
      
      // Phase A structured fields
      sport,
      league: league || sport, // Default league to sport if not provided
      gameId: gameId || null,
      gameText: gameText || null,
      selection,
      betType,
      oddsAmerican,
      oddsDecimal,
      unitsRisked,
      amountRisked: finalAmountRisked,
      unitValueAtPost,
      gameStartTime: gameStart,
      writeUp: writeUp || null,
      
      // Status and verification
      status: 'pending',
      result: 'pending',
      isVerified,
      verificationSource,
      
      // Legacy fields (for backward compatibility)
      title: title || `${selection} (${sport})`,
      description: writeUp || description || null,
      marketType: marketType || betType,
      odds: odds || oddsAmerican.toString(),
      stake: stake || `${unitsRisked} unit${unitsRisked !== 1 ? 's' : ''}`,
      isFree: isFree || false,
      plans: plans || [],
      oneOffPriceCents: oneOffPriceCents || 0,
      eventDate: eventDate ? new Date(eventDate) : gameStart,
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

    // Create audit log
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      userId: req.user._id,
      action: 'pick.create',
      resourceType: 'Pick',
      resourceId: pick._id,
      metadata: {
        sport,
        betType,
        selection,
        unitsRisked,
        isVerified
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json(pick);
  } catch (error) {
    console.error('Create pick error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/creator/picks/:id
// @route   PATCH /api/creator/picks/:id
// @desc    Update a pick (Phase A: with locking and audit trail)
// @access  Private (creator only, or admin with reason)
const updatePickHandler = async (req, res) => {
  try {
    const pick = await Pick.findById(req.params.id);
    if (!pick) {
      return res.status(404).json({ message: 'Pick not found' });
    }

    const isAdmin = req.user.roles && req.user.roles.includes('admin');
    const isCreator = pick.creator.toString() === req.user._id.toString();

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Phase A: Locking rule - no edits allowed after gameStartTime (except admins)
    const now = new Date();
    const isLocked = now >= new Date(pick.gameStartTime);

    if (isLocked && !isAdmin) {
      return res.status(403).json({ 
        message: 'Pick is locked. Edits are not allowed after game start time.' 
      });
    }

    // If admin editing locked pick, require reason
    if (isLocked && isAdmin && !req.body.reason) {
      return res.status(400).json({ 
        message: 'Admin edits to locked picks require a reason' 
      });
    }

    const { 
      // Phase A structured fields
      sport, league, gameText, betType, selection, oddsAmerican,
      unitsRisked, amountRisked, unitValue, writeUp, gameStartTime,
      // Legacy fields
      title, description, marketType, odds, stake, 
      isFree, plans, oneOffPriceCents, eventDate, scheduledAt, 
      tags, media, result,
      // Admin fields
      reason
    } = req.body;

    // Track changes for audit log
    const changes = [];
    const oldValues = {};

    // Update Phase A structured fields
    if (sport !== undefined && pick.sport !== sport) {
      oldValues.sport = pick.sport;
      pick.sport = sport;
      changes.push({ field: 'sport', oldValue: oldValues.sport, newValue: sport });
    }
    if (league !== undefined && pick.league !== league) {
      oldValues.league = pick.league;
      pick.league = league;
      changes.push({ field: 'league', oldValue: oldValues.league, newValue: league });
    }
    if (selection !== undefined && pick.selection !== selection) {
      oldValues.selection = pick.selection;
      pick.selection = selection;
      changes.push({ field: 'selection', oldValue: oldValues.selection, newValue: selection });
    }
    if (betType !== undefined && pick.betType !== betType) {
      oldValues.betType = pick.betType;
      pick.betType = betType;
      changes.push({ field: 'betType', oldValue: oldValues.betType, newValue: betType });
    }
    if (oddsAmerican !== undefined && pick.oddsAmerican !== oddsAmerican) {
      const { americanToDecimal, isValidAmericanOdds } = require('../utils/oddsConverter');
      if (!isValidAmericanOdds(oddsAmerican)) {
        return res.status(400).json({ message: 'Invalid American odds' });
      }
      oldValues.oddsAmerican = pick.oddsAmerican;
      pick.oddsAmerican = oddsAmerican;
      pick.oddsDecimal = americanToDecimal(oddsAmerican);
      changes.push({ field: 'oddsAmerican', oldValue: oldValues.oddsAmerican, newValue: oddsAmerican });
    }
    if (unitsRisked !== undefined && pick.unitsRisked !== unitsRisked) {
      oldValues.unitsRisked = pick.unitsRisked;
      pick.unitsRisked = unitsRisked;
      // Recalculate amount risked if unit value hasn't changed
      if (!unitValue) {
        pick.amountRisked = Math.round(unitsRisked * pick.unitValueAtPost);
      }
      changes.push({ field: 'unitsRisked', oldValue: oldValues.unitsRisked, newValue: unitsRisked });
    }
    if (amountRisked !== undefined && pick.amountRisked !== amountRisked) {
      oldValues.amountRisked = pick.amountRisked;
      pick.amountRisked = amountRisked;
      changes.push({ field: 'amountRisked', oldValue: oldValues.amountRisked, newValue: amountRisked });
    }
    if (writeUp !== undefined && pick.writeUp !== writeUp) {
      oldValues.writeUp = pick.writeUp;
      pick.writeUp = writeUp;
      changes.push({ field: 'writeUp', oldValue: oldValues.writeUp, newValue: writeUp });
    }

    // Update legacy fields
    if (title !== undefined) pick.title = title;
    if (description !== undefined) pick.description = description;
    if (marketType !== undefined) pick.marketType = marketType;
    if (odds !== undefined) pick.odds = odds;
    if (stake !== undefined) pick.stake = stake;
    if (isFree !== undefined) pick.isFree = isFree;
    if (plans) pick.plans = plans;
    if (oneOffPriceCents !== undefined) pick.oneOffPriceCents = oneOffPriceCents;
    if (eventDate) pick.eventDate = new Date(eventDate);
    if (tags !== undefined) pick.tags = tags;
    if (media !== undefined) pick.media = media;

    // If pick was edited after lock, mark as not verified and flag
    if (isLocked && changes.length > 0) {
      pick.isVerified = false;
      pick.flagged = true;
      if (!pick.flags) pick.flags = [];
      pick.flags.push({
        reason: `Edited after game start by ${isAdmin ? 'admin' : 'creator'}`,
        flaggedBy: req.user._id,
        flaggedAt: new Date()
      });
    }

    // Record edit history
    if (changes.length > 0) {
      if (!pick.editHistory) pick.editHistory = [];
      pick.editHistory.push({
        userId: req.user._id,
        oldValue: oldValues,
        newValue: req.body,
        changedAt: new Date(),
        reason: reason || (isAdmin ? 'Admin edit' : 'Creator edit'),
        isAdminEdit: isAdmin
      });
    }

    pick.updatedAt = new Date();

    await pick.save();

    // Create audit log
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      userId: req.user._id,
      action: isAdmin ? 'pick.admin_edit' : 'pick.update',
      resourceType: 'Pick',
      resourceId: pick._id,
      metadata: {
        changes,
        isLocked,
        reason: reason || null
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(pick);
  } catch (error) {
    console.error('Update pick error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/picks/:id', updatePickHandler)
router.patch('/picks/:id', updatePickHandler)

// @route   GET /api/creator/stats
// @desc    Get creator stats in units and USD (Phase A)
// @access  Private (creator only)
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Fetch user to get unitValueDefault
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    const picks = await Pick.find({ creator: userId });
    
    // Calculate stats
    const totalPicks = picks.length;
    const verifiedPicks = picks.filter(p => p.isVerified).length;
    const gradedPicks = picks.filter(p => p.status === 'graded');
    
    const totalUnitsRisked = picks.reduce((sum, p) => sum + (p.unitsRisked || 0), 0);
    const totalUnitsWon = picks.reduce((sum, p) => sum + (p.profitUnits || 0), 0);
    const totalAmountRisked = picks.reduce((sum, p) => sum + (p.amountRisked || 0), 0);
    const totalAmountWon = picks.reduce((sum, p) => sum + (p.profitAmount || 0), 0);
    
    const wins = picks.filter(p => p.result === 'win').length;
    const losses = picks.filter(p => p.result === 'loss').length;
    const pushes = picks.filter(p => p.result === 'push').length;
    const winRate = (wins + losses + pushes) > 0 ? (wins / (wins + losses + pushes)) * 100 : 0;
    
    const roi = totalUnitsRisked > 0 ? ((totalUnitsWon / totalUnitsRisked) * 100) : 0;
    
    res.json({
      totalPicks,
      verifiedPicks,
      gradedPicks,
      totalUnitsRisked,
      totalUnitsWon,
      totalAmountRisked,
      totalAmountWon,
      wins,
      losses,
      pushes,
      winRate,
      roi,
      unitValueDefault: user?.unitValueDefault || null
    });
  } catch (error) {
    console.error('Get creator stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/creator/settings/unit-value
// @desc    Update creator's default unit value
// @access  Private (creator only)
router.put('/settings/unit-value', async (req, res) => {
  try {
    const { unitValueDefault } = req.body;
    
    if (!unitValueDefault || unitValueDefault <= 0) {
      return res.status(400).json({ message: 'Unit value must be greater than 0' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.unitValueDefault = unitValueDefault;
    await user.save();
    
    res.json({ 
      message: 'Unit value updated successfully',
      unitValueDefault: user.unitValueDefault
    });
  } catch (error) {
    console.error('Update unit value error:', error);
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

