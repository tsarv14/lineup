/**
 * Anti-Fraud Detection Service
 * Phase C: Detect suspicious patterns and flag picks/creators
 */

const Pick = require('../models/Pick');
const User = require('../models/User');

/**
 * Check for outlier units (unitsRisked > mean + 4σ)
 * @param {Object} pick - Pick document
 * @param {Object} creatorStats - Creator's historical stats
 * @returns {Object} { isOutlier: boolean, reason: string, severity: 'low'|'medium'|'high' }
 */
function detectOutlierUnits(pick, creatorStats) {
  if (!creatorStats || !creatorStats.avgUnitsRisked || !creatorStats.stdDevUnitsRisked) {
    return { isOutlier: false, reason: null, severity: null };
  }
  
  const mean = creatorStats.avgUnitsRisked;
  const stdDev = creatorStats.stdDevUnitsRisked;
  const threshold = mean + (4 * stdDev); // 4 standard deviations
  
  if (pick.unitsRisked > threshold) {
    const zScore = (pick.unitsRisked - mean) / stdDev;
    let severity = 'low';
    if (zScore > 6) severity = 'high';
    else if (zScore > 5) severity = 'medium';
    
    return {
      isOutlier: true,
      reason: `Units risked (${pick.unitsRisked}) exceeds normal range (mean: ${mean.toFixed(2)}, threshold: ${threshold.toFixed(2)})`,
      severity,
      zScore: zScore.toFixed(2)
    };
  }
  
  return { isOutlier: false, reason: null, severity: null };
}

/**
 * Check for suspicious post timing (posted < 1 minute before game start)
 * @param {Object} pick - Pick document
 * @param {Array} recentPicks - Creator's recent picks
 * @returns {Object} { isSuspicious: boolean, reason: string, pattern: string }
 */
function detectSuspiciousTiming(pick, recentPicks) {
  const gameStart = new Date(pick.gameStartTime);
  const postedAt = new Date(pick.createdAt);
  const minutesBeforeStart = (gameStart - postedAt) / (1000 * 60);
  
  // Flag if posted less than 1 minute before start
  if (minutesBeforeStart < 1 && minutesBeforeStart >= 0) {
    // Check if this is a pattern
    const suspiciousCount = recentPicks.filter(p => {
      const pGameStart = new Date(p.gameStartTime);
      const pPostedAt = new Date(p.createdAt);
      const pMinutesBefore = (pGameStart - pPostedAt) / (1000 * 60);
      return pMinutesBefore < 1 && pMinutesBefore >= 0;
    }).length;
    
    const pattern = suspiciousCount > 3 ? 'frequent' : 'occasional';
    
    return {
      isSuspicious: true,
      reason: `Posted ${minutesBeforeStart.toFixed(1)} minutes before game start`,
      pattern,
      suspiciousCount
    };
  }
  
  return { isSuspicious: false, reason: null, pattern: null };
}

/**
 * Check for odds mismatch (posted odds differ > X% from market)
 * @param {Object} pick - Pick document
 * @param {Object} marketOdds - Market odds from API at post time
 * @param {Number} thresholdPercent - Threshold percentage (default: 10%)
 * @returns {Object} { isMismatch: boolean, reason: string, difference: number }
 */
function detectOddsMismatch(pick, marketOdds, thresholdPercent = 10) {
  if (!marketOdds || !pick.apiOddsAtPost) {
    return { isMismatch: false, reason: null, difference: null };
  }
  
  // Get market odds for the same bet type
  let marketOddsDecimal = null;
  
  if (pick.betType === 'moneyline') {
    // Would need to match team - simplified for now
    return { isMismatch: false, reason: null, difference: null };
  } else if (pick.betType === 'spread' && marketOdds.spread) {
    // Compare spread odds
    const { americanToDecimal } = require('../utils/oddsConverter');
    // Simplified - would need to match team and line
    return { isMismatch: false, reason: null, difference: null };
  } else if (pick.betType === 'total' && marketOdds.total) {
    const { americanToDecimal } = require('../utils/oddsConverter');
    const selectionLower = pick.selection.toLowerCase();
    const isOver = selectionLower.includes('over');
    
    if (isOver && marketOdds.total.over) {
      marketOddsDecimal = americanToDecimal(marketOdds.total.over);
    } else if (!isOver && marketOdds.total.under) {
      marketOddsDecimal = americanToDecimal(marketOdds.total.under);
    }
  }
  
  if (!marketOddsDecimal) {
    return { isMismatch: false, reason: null, difference: null };
  }
  
  // Calculate percentage difference
  const difference = Math.abs(pick.oddsDecimal - marketOddsDecimal) / marketOddsDecimal * 100;
  
  if (difference > thresholdPercent) {
    return {
      isMismatch: true,
      reason: `Posted odds (${pick.oddsDecimal.toFixed(2)}) differ ${difference.toFixed(1)}% from market (${marketOddsDecimal.toFixed(2)})`,
      difference: difference.toFixed(1)
    };
  }
  
  return { isMismatch: false, reason: null, difference: difference.toFixed(1) };
}

/**
 * Check if pick was edited after lock (already handled in Phase A, but add to fraud detection)
 * @param {Object} pick - Pick document
 * @returns {Object} { wasEditedAfterLock: boolean, reason: string }
 */
function detectEditAfterLock(pick) {
  if (!pick.editHistory || pick.editHistory.length === 0) {
    return { wasEditedAfterLock: false, reason: null };
  }
  
  const gameStart = new Date(pick.gameStartTime);
  const editsAfterLock = pick.editHistory.filter(edit => {
    const editTime = new Date(edit.changedAt);
    return editTime >= gameStart && !edit.isAdminEdit;
  });
  
  if (editsAfterLock.length > 0) {
    return {
      wasEditedAfterLock: true,
      reason: `Pick was edited ${editsAfterLock.length} time(s) after game start`,
      editCount: editsAfterLock.length
    };
  }
  
  return { wasEditedAfterLock: false, reason: null };
}

/**
 * Run all fraud detection checks on a pick
 * @param {Object} pick - Pick document
 * @param {Object} creatorStats - Creator's historical stats
 * @param {Array} recentPicks - Creator's recent picks
 * @param {Object} marketOdds - Market odds from API
 * @returns {Object} Fraud detection results
 */
async function runFraudChecks(pick, creatorStats, recentPicks, marketOdds) {
  const checks = {
    outlierUnits: detectOutlierUnits(pick, creatorStats),
    suspiciousTiming: detectSuspiciousTiming(pick, recentPicks),
    oddsMismatch: detectOddsMismatch(pick, marketOdds),
    editAfterLock: detectEditAfterLock(pick)
  };
  
  // Determine overall fraud score
  let fraudScore = 0;
  const flags = [];
  
  if (checks.outlierUnits.isOutlier) {
    fraudScore += checks.outlierUnits.severity === 'high' ? 3 : checks.outlierUnits.severity === 'medium' ? 2 : 1;
    flags.push({
      type: 'outlier_units',
      severity: checks.outlierUnits.severity,
      reason: checks.outlierUnits.reason
    });
  }
  
  if (checks.suspiciousTiming.isSuspicious) {
    fraudScore += checks.suspiciousTiming.pattern === 'frequent' ? 3 : 1;
    flags.push({
      type: 'suspicious_timing',
      pattern: checks.suspiciousTiming.pattern,
      reason: checks.suspiciousTiming.reason
    });
  }
  
  if (checks.oddsMismatch.isMismatch) {
    fraudScore += 2;
    flags.push({
      type: 'odds_mismatch',
      reason: checks.oddsMismatch.reason,
      difference: checks.oddsMismatch.difference
    });
  }
  
  if (checks.editAfterLock.wasEditedAfterLock) {
    fraudScore += 5; // High penalty for editing after lock
    flags.push({
      type: 'edit_after_lock',
      reason: checks.editAfterLock.reason,
      editCount: checks.editAfterLock.editCount
    });
  }
  
  // Determine if pick should be flagged
  const shouldFlag = fraudScore >= 3;
  const shouldExcludeFromLeaderboards = fraudScore >= 5;
  
  return {
    fraudScore,
    shouldFlag,
    shouldExcludeFromLeaderboards,
    flags,
    checks
  };
}

/**
 * Get creator stats for fraud detection
 * @param {String} creatorId - Creator user ID
 * @returns {Promise<Object>} Creator stats
 */
async function getCreatorStatsForFraud(creatorId) {
  const picks = await Pick.find({ creator: creatorId });
  
  if (picks.length === 0) {
    return {
      avgUnitsRisked: 0,
      stdDevUnitsRisked: 0,
      totalPicks: 0
    };
  }
  
  const unitsArray = picks.map(p => p.unitsRisked || 0);
  const mean = unitsArray.reduce((a, b) => a + b, 0) / unitsArray.length;
  const variance = unitsArray.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / unitsArray.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    avgUnitsRisked: mean,
    stdDevUnitsRisked: stdDev,
    totalPicks: picks.length
  };
}

module.exports = {
  detectOutlierUnits,
  detectSuspiciousTiming,
  detectOddsMismatch,
  detectEditAfterLock,
  runFraudChecks,
  getCreatorStatsForFraud
};

