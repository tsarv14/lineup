const express = require('express');
const Pick = require('../models/Pick');
const User = require('../models/User');
const Storefront = require('../models/Storefront');
const { getTransparencyScore } = require('../services/transparencyScore');

const router = express.Router();

/**
 * Get leaderboard by units won
 */
async function getUnitsWonLeaderboard(timeframe, sport, minUnits) {
  const now = new Date();
  let startDate;
  
  if (timeframe === '30d') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (timeframe === '90d') {
    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  } else if (timeframe === 'all-time') {
    startDate = null;
  } else {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default 30d
  }
  
  const query = {
    isVerified: true,
    status: 'graded',
    result: { $in: ['win', 'loss', 'push'] }
    // Note: Parlays are included automatically since they're Pick documents
    // with isParlay: true, but they have the same profitUnits, unitsRisked, result fields
  };
  
  if (startDate) {
    query.createdAt = { $gte: startDate };
  }
  
  if (sport && sport !== 'all') {
    query.sport = sport;
  }
  
  // Aggregate picks by creator (includes both single picks and parlays)
  // Parlays count as 1 pick, with their combined odds and units
  const pipeline = [
    { $match: query },
    {
      $group: {
        _id: '$creator',
        // Include parlays: they have profitUnits and unitsRisked at the top level
        totalUnitsWon: { $sum: { $ifNull: ['$profitUnits', 0] } },
        totalUnitsRisked: { $sum: { $ifNull: ['$unitsRisked', 0] } },
        // Count parlays as 1 pick (not counting individual legs)
        totalPicks: { $sum: 1 },
        // Count wins/losses: parlays have result at top level
        wins: { $sum: { $cond: [{ $eq: ['$result', 'win'] }, 1, 0] } },
        losses: { $sum: { $cond: [{ $eq: ['$result', 'loss'] }, 1, 0] } },
        pushes: { $sum: { $cond: [{ $eq: ['$result', 'push'] }, 1, 0] } },
        // Track parlay count separately for transparency
        totalParlays: { $sum: { $cond: [{ $eq: ['$isParlay', true] }, 1, 0] } }
      }
    },
    {
      $addFields: {
        winRate: {
          $cond: [
            { $gt: [{ $add: ['$wins', '$losses'] }, 0] },
            { $divide: ['$wins', { $add: ['$wins', '$losses'] }] },
            0
          ]
        },
        roi: {
          $cond: [
            { $gt: ['$totalUnitsRisked', 0] },
            { $multiply: [{ $divide: ['$totalUnitsWon', '$totalUnitsRisked'] }, 100] },
            0
          ]
        }
      }
    },
    {
      $match: {
        totalUnitsRisked: { $gte: minUnits || 0 }
      }
    },
    { $sort: { totalUnitsWon: -1 } },
    { $limit: 100 }
  ];
  
  const results = await Pick.aggregate(pipeline);
  
  // Populate creator info and add transparency scores
  const leaderboard = await Promise.all(
    results.map(async (item) => {
      const creator = await User.findById(item._id).select('username email metadata');
      const storefront = await Storefront.findOne({ owner: item._id }).select('handle displayName');
      const transparencyScore = await getTransparencyScore(item._id);
      
      return {
        creatorId: item._id,
        creator: {
          username: creator?.username,
          email: creator?.email
        },
        storefront: {
          handle: storefront?.handle,
          displayName: storefront?.displayName
        },
        stats: {
          totalUnitsWon: Math.round(item.totalUnitsWon * 100) / 100,
          totalUnitsRisked: Math.round(item.totalUnitsRisked * 100) / 100,
          totalPicks: item.totalPicks,
          wins: item.wins,
          losses: item.losses,
          pushes: item.pushes,
          winRate: Math.round(item.winRate * 10000) / 100,
          roi: Math.round(item.roi * 100) / 100
        },
        transparencyScore: transparencyScore.score || 0
      };
    })
  );
  
  return leaderboard;
}

/**
 * Get leaderboard by ROI
 */
async function getROILeaderboard(timeframe, sport, minUnits) {
  const leaderboard = await getUnitsWonLeaderboard(timeframe, sport, minUnits);
  return leaderboard.sort((a, b) => b.stats.roi - a.stats.roi);
}

/**
 * Get leaderboard by transparency score
 */
async function getTransparencyLeaderboard(timeframe, sport, minUnits) {
  const leaderboard = await getUnitsWonLeaderboard(timeframe, sport, minUnits);
  return leaderboard.sort((a, b) => b.transparencyScore - a.transparencyScore);
}

// @route   GET /api/leaderboards
// @desc    Get leaderboards (units won, ROI, transparency)
// @access  Public
router.get('/', async (req, res) => {
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
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/leaderboards/:type
// @desc    Get specific leaderboard type
// @access  Public
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { timeframe = '30d', sport, minUnits = 0 } = req.query;
    
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
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export router as default
module.exports = router;

// Export functions for use in public API
module.exports.getUnitsWonLeaderboard = getUnitsWonLeaderboard;
module.exports.getROILeaderboard = getROILeaderboard;
module.exports.getTransparencyLeaderboard = getTransparencyLeaderboard;

