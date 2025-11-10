/**
 * Background Job for CreatorStats Computation
 * Phase A: Periodically recompute and cache creator statistics
 * 
 * This job should run periodically (e.g., every hour) to:
 * 1. Recalculate transparency scores
 * 2. Update cached stats for all creators
 * 3. Update fraud detection stats
 */

const User = require('../models/User');
const Pick = require('../models/Pick');
const { updateTransparencyScore } = require('../services/transparencyScore');
const { getCreatorStatsForFraud } = require('../services/antiFraud');

/**
 * Update stats for a single creator
 * @param {String} creatorId - Creator user ID
 * @returns {Promise<Object>} Updated stats
 */
async function updateCreatorStats(creatorId) {
  try {
    // Update transparency score
    await updateTransparencyScore(creatorId);
    
    // Update fraud detection stats (for outlier detection)
    const fraudStats = await getCreatorStatsForFraud(creatorId);
    
    // Store in user metadata
    const user = await User.findById(creatorId);
    if (user) {
      if (!user.metadata) user.metadata = {};
      user.metadata.fraudStats = {
        avgUnitsRisked: fraudStats.avgUnitsRisked,
        stdDevUnitsRisked: fraudStats.stdDevUnitsRisked,
        totalPicks: fraudStats.totalPicks,
        updatedAt: new Date()
      };
      await user.save();
    }
    
    return {
      creatorId,
      transparencyScore: user?.metadata?.transparencyScore || 0,
      fraudStats
    };
  } catch (error) {
    console.error(`Error updating stats for creator ${creatorId}:`, error);
    throw error;
  }
}

/**
 * Run stats computation job for all creators
 * @returns {Promise<Object>} Summary of updates
 */
async function runStatsComputationJob() {
  console.log('🔄 Running stats computation job...');
  
  try {
    // Get all creators
    const creators = await User.find({ roles: 'creator' });
    
    const summary = {
      totalCreators: creators.length,
      updated: 0,
      errors: 0,
      results: []
    };
    
    // Update stats for each creator
    for (const creator of creators) {
      try {
        const result = await updateCreatorStats(creator._id);
        summary.updated++;
        summary.results.push(result);
      } catch (error) {
        console.error(`Error updating stats for creator ${creator._id}:`, error);
        summary.errors++;
      }
    }
    
    console.log(`✅ Stats computation complete: ${summary.updated} updated, ${summary.errors} errors`);
    return summary;
  } catch (error) {
    console.error('Stats computation job error:', error);
    throw error;
  }
}

module.exports = {
  updateCreatorStats,
  runStatsComputationJob
};

