/**
 * Grading Job
 * Phase B: Auto-grade picks when games finish
 * 
 * This job should be run periodically (e.g., every 5-10 minutes) to:
 * 1. Find finished games
 * 2. Grade all pending picks for those games
 * 3. Calculate CLV (Closing Line Value)
 * 4. Update pick status and results
 */

const Pick = require('../models/Pick');
const Game = require('../models/Game');
const { getGameScore, getClosingLines, getFinishedGames } = require('../services/sportsApi');
const { americanToDecimal } = require('../utils/oddsConverter');

/**
 * Grade a single pick based on game result
 * @param {Object} pick - Pick document
 * @param {Object} game - Game document with final score
 * @param {Object} closingLines - Closing lines for CLV calculation
 * @returns {Object} Graded pick result
 */
async function gradePick(pick, game, closingLines) {
  const result = determinePickResult(pick, game);
  const profit = calculateProfit(pick, result);
  const clvScore = calculateCLV(pick, closingLines);
  
  // Update pick
  pick.result = result.result;
  pick.profitUnits = profit.profitUnits;
  pick.profitAmount = profit.profitAmount;
  pick.status = 'graded';
  pick.resolvedAt = new Date();
  
  // Phase B: Set verification based on API grading
  if (pick.createdAt < new Date(pick.gameStartTime)) {
    pick.isVerified = true;
    pick.verificationSource = 'api';
    pick.verificationEvidence = {
      provider: game.provider,
      gameId: game.gameId,
      finalScore: game.score,
      gradedAt: new Date(),
      rawGameData: game.rawProviderData
    };
  }
  
  // Store closing lines and CLV
  if (closingLines) {
    pick.closingOdds = closingLines;
    pick.clvScore = clvScore;
  }
  
  await pick.save();
  
  // Phase D: Create ledger entry for grading
  try {
    const LedgerEntry = require('../models/LedgerEntry');
    await LedgerEntry.createEntry(pick, 'grade');
  } catch (ledgerError) {
    console.error('Ledger entry creation error (non-critical):', ledgerError);
  }
  
  return {
    pickId: pick._id,
    result: result.result,
    profitUnits: profit.profitUnits,
    profitAmount: profit.profitAmount,
    clvScore,
    isVerified: pick.isVerified,
    isParlay: pick.isParlay || false,
    parlayLegs: pick.isParlay ? pick.parlayLegs.map(leg => ({
      selection: leg.selection,
      result: leg.result
    })) : undefined
  };
}

/**
 * Determine if a pick won, lost, or pushed
 * @param {Object} pick - Pick document
 * @param {Object} game - Game document with final score
 * @returns {Object} { result: 'win'|'loss'|'push'|'void', reason: string }
 */
function determinePickResult(pick, game) {
  const { betType, selection } = pick;
  const { home, away } = game.score;
  
  // Parse selection to extract team and line
  // Examples: "Lakers -5.5", "Over 225.5", "Lakers ML"
  const selectionLower = selection.toLowerCase();
  
  if (betType === 'moneyline') {
    // Moneyline: "Lakers ML" or "Lakers"
    const homeTeamWon = home > away;
    const awayTeamWon = away > home;
    
    // Determine which team was selected (simplified - would need team name matching)
    // For now, assume selection contains team name
    const isHomePick = selectionLower.includes(game.homeTeam?.name?.toLowerCase() || 'home');
    const isAwayPick = selectionLower.includes(game.awayTeam?.name?.toLowerCase() || 'away');
    
    if (home === away) {
      return { result: 'push', reason: 'Tie game' };
    }
    
    if ((isHomePick && homeTeamWon) || (isAwayPick && awayTeamWon)) {
      return { result: 'win', reason: 'Moneyline winner' };
    } else {
      return { result: 'loss', reason: 'Moneyline loser' };
    }
  } else if (betType === 'spread') {
    // Spread: "Lakers -5.5" means Lakers must win by more than 5.5
    const spreadMatch = selection.match(/(-?\d+\.?\d*)/);
    if (!spreadMatch) {
      return { result: 'void', reason: 'Invalid spread format' };
    }
    
    const spread = parseFloat(spreadMatch[1]);
    const isHomePick = selectionLower.includes(game.homeTeam?.name?.toLowerCase() || 'home');
    const isAwayPick = selectionLower.includes(game.awayTeam?.name?.toLowerCase() || 'away');
    
    let margin;
    if (isHomePick) {
      margin = home - away;
    } else if (isAwayPick) {
      margin = away - home;
    } else {
      return { result: 'void', reason: 'Could not determine team' };
    }
    
    if (margin > spread) {
      return { result: 'win', reason: `Won by ${margin} (needed ${spread})` };
    } else if (margin < spread) {
      return { result: 'loss', reason: `Lost by ${Math.abs(margin)} (needed ${spread})` };
    } else {
      return { result: 'push', reason: `Exact push (${margin})` };
    }
  } else if (betType === 'total') {
    // Total: "Over 225.5" or "Under 225.5"
    const totalMatch = selection.match(/(over|under)\s+(-?\d+\.?\d*)/i);
    if (!totalMatch) {
      return { result: 'void', reason: 'Invalid total format' };
    }
    
    const direction = totalMatch[1].toLowerCase();
    const total = parseFloat(totalMatch[2]);
    const combinedScore = home + away;
    
    if (direction === 'over') {
      if (combinedScore > total) {
        return { result: 'win', reason: `Total ${combinedScore} > ${total}` };
      } else if (combinedScore < total) {
        return { result: 'loss', reason: `Total ${combinedScore} < ${total}` };
      } else {
        return { result: 'push', reason: `Exact push (${combinedScore})` };
      }
    } else if (direction === 'under') {
      if (combinedScore < total) {
        return { result: 'win', reason: `Total ${combinedScore} < ${total}` };
      } else if (combinedScore > total) {
        return { result: 'loss', reason: `Total ${combinedScore} > ${total}` };
      } else {
        return { result: 'push', reason: `Exact push (${combinedScore})` };
      }
    }
  }
  
  // Default: void if we can't determine
  return { result: 'void', reason: 'Unknown bet type or format' };
}

/**
 * Calculate profit for a graded pick
 * @param {Object} pick - Pick document
 * @param {Object} result - Result from determinePickResult
 * @returns {Object} { profitUnits, profitAmount }
 */
function calculateProfit(pick, result) {
  if (result.result === 'win') {
    // Calculate profit based on odds
    const decimalOdds = pick.oddsDecimal;
    const profitUnits = (pick.unitsRisked * decimalOdds) - pick.unitsRisked;
    const profitAmount = (pick.amountRisked * decimalOdds) - pick.amountRisked;
    
    return {
      profitUnits: Math.round(profitUnits * 100) / 100, // Round to 2 decimals
      profitAmount: Math.round(profitAmount)
    };
  } else if (result.result === 'push') {
    // Push: return stake
    return {
      profitUnits: 0,
      profitAmount: 0
    };
  } else {
    // Loss: negative profit
    return {
      profitUnits: -pick.unitsRisked,
      profitAmount: -pick.amountRisked
    };
  }
}

/**
 * Calculate Closing Line Value (CLV)
 * @param {Object} pick - Pick document
 * @param {Object} closingLines - Closing lines from API
 * @returns {Number} CLV score (positive = beat closing line)
 */
function calculateCLV(pick, closingLines) {
  if (!closingLines || !pick.oddsDecimal) {
    return null;
  }
  
  // Get closing odds for the same bet type
  let closingDecimal = null;
  
  if (pick.betType === 'moneyline') {
    // Would need to determine which team's closing line to use
    // For now, return null (would need team matching logic)
    return null;
  } else if (pick.betType === 'spread' && closingLines.spread) {
    // Compare spread lines (would need to match team)
    // For now, simplified calculation
    return null;
  } else if (pick.betType === 'total' && closingLines.total) {
    // Compare total lines
    const selectionLower = pick.selection.toLowerCase();
    const isOver = selectionLower.includes('over');
    const isUnder = selectionLower.includes('under');
    
    if (isOver && closingLines.total.over) {
      closingDecimal = americanToDecimal(closingLines.total.over);
    } else if (isUnder && closingLines.total.under) {
      closingDecimal = americanToDecimal(closingLines.total.under);
    }
  }
  
  if (!closingDecimal) {
    return null;
  }
  
  // CLV = posted odds - closing odds (positive = better line)
  const clv = pick.oddsDecimal - closingDecimal;
  return Math.round(clv * 10000) / 10000; // Round to 4 decimals
}

/**
 * Grade all picks for a finished game
 * @param {String} gameId - Game ID
 * @returns {Promise<Array>} Array of graded pick results
 */
async function gradeGamePicks(gameId) {
  try {
    // Find game
    const game = await Game.findOne({ gameId });
    if (!game) {
      console.log(`Game ${gameId} not found in database`);
      return [];
    }
    
    // Check if game is finished
    if (game.status !== 'final') {
      console.log(`Game ${gameId} is not final yet (status: ${game.status})`);
      return [];
    }
    
    // Find all pending/locked picks for this game
    const picks = await Pick.find({
      gameId,
      status: { $in: ['pending', 'locked'] }
    });
    
    if (picks.length === 0) {
      console.log(`No picks found for game ${gameId}`);
      return [];
    }
    
    // Get closing lines if available
    let closingLines = null;
    try {
      closingLines = await getClosingLines(gameId);
      if (closingLines) {
        game.closingLines = closingLines;
        game.updatedAt = new Date();
        await game.save();
      }
    } catch (err) {
      console.log(`Could not fetch closing lines for ${gameId}:`, err.message);
    }
    
    // Grade each pick
    const results = [];
    for (const pick of picks) {
      try {
        const result = await gradePick(pick, game, closingLines);
        results.push(result);
        console.log(`Graded pick ${pick._id}: ${result.result}`);
      } catch (error) {
        console.error(`Error grading pick ${pick._id}:`, error);
        results.push({
          pickId: pick._id,
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error(`Error grading game ${gameId}:`, error);
    return [];
  }
}

/**
 * Main grading job: Find finished games and grade their picks
 * @param {Date} startDate - Start date to check (default: last 24 hours)
 * @param {Date} endDate - End date to check (default: now)
 * @returns {Promise<Object>} Summary of grading results
 */
async function runGradingJob(startDate, endDate) {
  const start = startDate || new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
  const end = endDate || new Date();
  
  console.log(`Running grading job from ${start} to ${end}`);
  
  try {
    // Find finished games in database
    const finishedGames = await Game.find({
      status: 'final',
      startTime: { $gte: start, $lte: end }
    });
    
    // Also try to fetch from API if configured
    let apiFinishedGames = [];
    if (process.env.SPORTS_API_KEY) {
      try {
        apiFinishedGames = await getFinishedGames(start, end);
        // Store in database
        for (const gameId of apiFinishedGames) {
          const game = await Game.findOne({ gameId });
          if (game && game.status !== 'final') {
            game.status = 'final';
            await game.save();
          }
        }
      } catch (err) {
        console.log('Could not fetch finished games from API:', err.message);
      }
    }
    
    // Combine and deduplicate
    const allGameIds = new Set();
    finishedGames.forEach(g => allGameIds.add(g.gameId));
    apiFinishedGames.forEach(id => allGameIds.add(id));
    
    // Grade picks for each game
    const summary = {
      gamesProcessed: 0,
      picksGraded: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
      errors: 0
    };
    
    for (const gameId of allGameIds) {
      const results = await gradeGamePicks(gameId);
      summary.gamesProcessed++;
      
      for (const result of results) {
        if (result.error) {
          summary.errors++;
        } else {
          summary.picksGraded++;
          if (result.result === 'win') summary.wins++;
          else if (result.result === 'loss') summary.losses++;
          else if (result.result === 'push') summary.pushes++;
        }
      }
    }
    
    console.log('Grading job complete:', summary);
    return summary;
  } catch (error) {
    console.error('Grading job error:', error);
    throw error;
  }
}

module.exports = {
  gradePick,
  determinePickResult,
  calculateProfit,
  calculateCLV,
  gradeGamePicks,
  runGradingJob
};

