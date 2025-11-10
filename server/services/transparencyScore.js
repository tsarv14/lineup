/**
 * Transparency Score Calculation Service
 * Phase C: Calculate creator transparency scores based on multiple factors
 * 
 * Score components (weighted):
 * - VerifiedRate: (verified picks / total picks) * 0.4
 * - WinConsistency: normalized win-rate stability * 0.25
 * - CLVscore: average CLV * 0.15
 * - EditPenalty: penalty for edits after lock * 0.1
 * - ComplaintScore: 1 - (complaints/totalSubs) * 0.1
 * 
 * Final score normalized to 0-100
 */

const Pick = require('../models/Pick');
const Subscription = require('../models/Subscription');

/**
 * Calculate transparency score for a creator
 * @param {String} creatorId - Creator user ID
 * @returns {Promise<Object>} { score: number (0-100), breakdown: object }
 */
async function calculateTransparencyScore(creatorId) {
  const picks = await Pick.find({ creator: creatorId });
  const subscriptions = await Subscription.find({ creator: creatorId });
  
  if (picks.length === 0) {
    return {
      score: 0,
      breakdown: {
        verifiedRate: 0,
        winConsistency: 0,
        clvScore: 0,
        editPenalty: 0,
        complaintScore: 0
      },
      message: 'No picks found'
    };
  }
  
  // 1. Verified Rate (40% weight)
  const verifiedPicks = picks.filter(p => p.isVerified).length;
  const verifiedRate = verifiedPicks / picks.length;
  const verifiedRateScore = verifiedRate * 0.4;
  
  // 2. Win Consistency (25% weight)
  // Include parlays: they have result at top level (parlayResult or result)
  const gradedPicks = picks.filter(p => p.status === 'graded');
  if (gradedPicks.length === 0) {
    var winConsistencyScore = 0;
  } else {
    const wins = gradedPicks.filter(p => p.result === 'win' || (p.isParlay && p.parlayResult === 'win')).length;
    const losses = gradedPicks.filter(p => p.result === 'loss' || (p.isParlay && p.parlayResult === 'loss')).length;
    const totalGraded = wins + losses;
    
    if (totalGraded === 0) {
      var winConsistencyScore = 0;
    } else {
      const winRate = wins / totalGraded;
      
      // Calculate consistency (lower variance = higher consistency)
      // For now, use win rate as proxy (higher win rate = better)
      // In future, could calculate variance across time periods
      const winConsistency = winRate; // Simplified - could be more sophisticated
      winConsistencyScore = winConsistency * 0.25;
    }
  }
  
  // 3. CLV Score (15% weight)
  const picksWithCLV = picks.filter(p => p.clvScore !== null && p.clvScore !== undefined);
  let clvScore = 0;
  if (picksWithCLV.length > 0) {
    const avgCLV = picksWithCLV.reduce((sum, p) => sum + (p.clvScore || 0), 0) / picksWithCLV.length;
    // Normalize CLV to 0-1 range (assuming CLV ranges from -0.5 to +0.5)
    const normalizedCLV = Math.max(0, Math.min(1, (avgCLV + 0.5) / 1.0));
    clvScore = normalizedCLV * 0.15;
  }
  
  // 4. Edit Penalty (10% weight)
  const picksWithEdits = picks.filter(p => p.editHistory && p.editHistory.length > 0);
  let editPenalty = 0;
  if (picksWithEdits.length > 0) {
    const editsAfterLock = picks.filter(p => {
      if (!p.editHistory || p.editHistory.length === 0) return false;
      const gameStart = new Date(p.gameStartTime);
      return p.editHistory.some(edit => {
        const editTime = new Date(edit.changedAt);
        return editTime >= gameStart && !edit.isAdminEdit;
      });
    }).length;
    
    const editPenaltyRate = editsAfterLock / picks.length;
    editPenalty = (1 - editPenaltyRate) * 0.1; // Inverse: fewer edits = higher score
  } else {
    editPenalty = 0.1; // No edits = full points
  }
  
  // 5. Complaint Score (10% weight)
  // For now, assume no complaints (would need Complaint model)
  // In future: complaints / totalSubs
  const totalSubs = subscriptions.length;
  const complaints = 0; // TODO: Get from Complaint model
  const complaintRate = totalSubs > 0 ? complaints / totalSubs : 0;
  const complaintScore = (1 - Math.min(complaintRate, 1)) * 0.1; // Inverse: fewer complaints = higher score
  
  // Calculate final score (0-100)
  const rawScore = (verifiedRateScore + winConsistencyScore + clvScore + editPenalty + complaintScore) * 100;
  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));
  
  return {
    score: finalScore,
    breakdown: {
      verifiedRate: Math.round(verifiedRate * 100),
      winConsistency: Math.round((winConsistencyScore / 0.25) * 100),
      clvScore: Math.round((clvScore / 0.15) * 100),
      editPenalty: Math.round((editPenalty / 0.1) * 100),
      complaintScore: Math.round((complaintScore / 0.1) * 100)
    },
    details: {
      totalPicks: picks.length,
      verifiedPicks,
      gradedPicks: gradedPicks.length,
      picksWithCLV: picksWithCLV.length,
      totalSubs,
      complaints
    }
  };
}

/**
 * Update transparency score for a creator (store in User or separate collection)
 * @param {String} creatorId - Creator user ID
 * @returns {Promise<Object>} Updated score
 */
async function updateTransparencyScore(creatorId) {
  const scoreData = await calculateTransparencyScore(creatorId);
  
  // Store in User model (could also use separate CreatorStats collection)
  const User = require('../models/User');
  const user = await User.findById(creatorId);
  if (user) {
    if (!user.metadata) user.metadata = {};
    user.metadata.transparencyScore = scoreData.score;
    user.metadata.transparencyScoreUpdatedAt = new Date();
    await user.save();
  }
  
  return scoreData;
}

/**
 * Get transparency score for a creator (cached or calculate)
 * @param {String} creatorId - Creator user ID
 * @param {Boolean} forceRecalculate - Force recalculation
 * @returns {Promise<Object>} Score data
 */
async function getTransparencyScore(creatorId, forceRecalculate = false) {
  if (!forceRecalculate) {
    const User = require('../models/User');
    const user = await User.findById(creatorId);
    if (user && user.metadata && user.metadata.transparencyScore !== undefined) {
      const lastUpdated = user.metadata.transparencyScoreUpdatedAt;
      const hoursSinceUpdate = (new Date() - new Date(lastUpdated)) / (1000 * 60 * 60);
      
      // Use cached score if updated within last 24 hours
      if (hoursSinceUpdate < 24) {
        return {
          score: user.metadata.transparencyScore,
          cached: true,
          lastUpdated
        };
      }
    }
  }
  
  // Recalculate
  return await updateTransparencyScore(creatorId);
}

module.exports = {
  calculateTransparencyScore,
  updateTransparencyScore,
  getTransparencyScore
};

