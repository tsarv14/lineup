/**
 * Public API Routes
 * Phase D: Read-only API for third parties
 */

const express = require('express');
const Pick = require('../models/Pick');
const User = require('../models/User');
const Storefront = require('../models/Storefront');
const { apiAuth, checkPermission } = require('../middleware/apiAuth');
const { 
  getUnitsWonLeaderboard, 
  getROILeaderboard, 
  getTransparencyLeaderboard 
} = require('./leaderboards');

const router = express.Router();
const rateLimiter = require('../middleware/rateLimiter');

// All routes require API key authentication
router.use(apiAuth);
// Apply rate limiting
router.use(rateLimiter);

// @route   GET /api/public/picks
// @desc    Get verified picks (public API)
// @access  Public (API key required)
router.get('/picks', checkPermission('readPicks'), async (req, res) => {
  try {
    const { 
      creatorId, 
      sport, 
      status, 
      result, 
      isVerified, 
      startDate, 
      endDate,
      limit = 100,
      offset = 0
    } = req.query;
    
    const query = {
      isVerified: isVerified !== 'false' ? true : undefined, // Default to verified only
      status: status || { $in: ['graded', 'locked'] }
    };
    
    if (creatorId) query.creator = creatorId;
    if (sport) query.sport = sport;
    if (result) query.result = result;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Remove undefined values
    Object.keys(query).forEach(key => {
      if (query[key] === undefined) delete query[key];
    });
    
    const picks = await Pick.find(query)
      .select('sport league selection betType oddsAmerican oddsDecimal unitsRisked amountRisked gameStartTime createdAt status result profitUnits profitAmount isVerified clvScore')
      .populate('creator', 'username')
      .populate('storefront', 'handle displayName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await Pick.countDocuments(query);
    
    res.json({
      picks,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });
  } catch (error) {
    console.error('Get public picks error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @route   GET /api/public/picks/:id
// @desc    Get a specific verified pick (public API)
// @access  Public (API key required)
router.get('/picks/:id', checkPermission('readPicks'), async (req, res) => {
  try {
    const pick = await Pick.findById(req.params.id)
      .select('sport league selection betType oddsAmerican oddsDecimal unitsRisked amountRisked gameStartTime createdAt status result profitUnits profitAmount isVerified clvScore verificationEvidence')
      .populate('creator', 'username')
      .populate('storefront', 'handle displayName');
    
    if (!pick) {
      return res.status(404).json({ error: 'Not found', message: 'Pick not found' });
    }
    
    if (!pick.isVerified) {
      return res.status(403).json({ error: 'Forbidden', message: 'Pick is not verified' });
    }
    
    res.json(pick);
  } catch (error) {
    console.error('Get public pick error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @route   GET /api/public/creators/:handle/stats
// @desc    Get creator stats (public API)
// @access  Public (API key required)
router.get('/creators/:handle/stats', checkPermission('readStats'), async (req, res) => {
  try {
    const storefront = await Storefront.findOne({ handle: req.params.handle });
    if (!storefront) {
      return res.status(404).json({ error: 'Not found', message: 'Creator not found' });
    }
    
    const picks = await Pick.find({ 
      creator: storefront.owner,
      isVerified: true,
      status: 'graded'
    });
    
    const stats = {
      totalPicks: picks.length,
      wins: picks.filter(p => p.result === 'win').length,
      losses: picks.filter(p => p.result === 'loss').length,
      pushes: picks.filter(p => p.result === 'push').length,
      totalUnitsRisked: picks.reduce((sum, p) => sum + (p.unitsRisked || 0), 0),
      totalUnitsWon: picks.reduce((sum, p) => sum + (p.profitUnits || 0), 0),
      totalAmountRisked: picks.reduce((sum, p) => sum + (p.amountRisked || 0), 0),
      totalAmountWon: picks.reduce((sum, p) => sum + (p.profitAmount || 0), 0)
    };
    
    const winRate = (stats.wins + stats.losses) > 0 
      ? (stats.wins / (stats.wins + stats.losses)) * 100 
      : 0;
    
    const roi = stats.totalUnitsRisked > 0
      ? (stats.totalUnitsWon / stats.totalUnitsRisked) * 100
      : 0;
    
    // Get transparency score
    const { getTransparencyScore } = require('../services/transparencyScore');
    const transparencyData = await getTransparencyScore(storefront.owner);
    
    res.json({
      creator: {
        handle: storefront.handle,
        displayName: storefront.displayName
      },
      stats: {
        ...stats,
        winRate: Math.round(winRate * 100) / 100,
        roi: Math.round(roi * 100) / 100,
        transparencyScore: transparencyData.score || 0
      }
    });
  } catch (error) {
    console.error('Get creator stats error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @route   GET /api/public/leaderboards
// @desc    Get leaderboards (public API)
// @access  Public (API key required)
router.get('/leaderboards', checkPermission('readLeaderboards'), async (req, res) => {
  try {
    const { type = 'units', timeframe = '30d', sport, minUnits = 0 } = req.query;
    
    let leaderboard;
    
    if (type === 'roi') {
      leaderboard = await getROILeaderboard(timeframe, sport, parseFloat(minUnits));
    } else if (type === 'transparency') {
      leaderboard = await getTransparencyLeaderboard(timeframe, sport, parseFloat(minUnits));
    } else {
      leaderboard = await getUnitsWonLeaderboard(timeframe, sport, parseFloat(minUnits));
    }
    
    res.json({
      type,
      timeframe,
      sport: sport || 'all',
      minUnits: parseFloat(minUnits),
      leaderboard
    });
  } catch (error) {
    console.error('Get public leaderboard error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @route   GET /api/public/ledger/:pickId
// @desc    Get ledger proof for a pick (public API)
// @access  Public (API key required)
router.get('/ledger/:pickId', checkPermission('readPicks'), async (req, res) => {
  try {
    const LedgerEntry = require('../models/LedgerEntry');
    
    const entries = await LedgerEntry.find({
      resourceType: 'Pick',
      resourceId: req.params.pickId
    }).sort({ sequence: 1 });
    
    if (entries.length === 0) {
      return res.status(404).json({ error: 'Not found', message: 'No ledger entries found for this pick' });
    }
    
    // Verify chain
    const verification = await LedgerEntry.verifyChain(req.params.pickId);
    
    res.json({
      pickId: req.params.pickId,
      entryCount: entries.length,
      entries: entries.map(e => ({
        sequence: e.sequence,
        hash: e.hash,
        previousHash: e.previousHash,
        timestamp: e.timestamp,
        action: e.data.action
      })),
      verification,
      blockchainAnchor: entries[entries.length - 1].blockchainAnchor || null
    });
  } catch (error) {
    console.error('Get ledger proof error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

module.exports = router;

