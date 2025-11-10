/**
 * Parlay Calculator Utility
 * Calculates parlay odds from multiple legs
 */

const { americanToDecimal, decimalToAmerican } = require('./oddsConverter');

/**
 * Calculate parlay odds from multiple legs
 * @param {Array} legs - Array of leg objects with oddsAmerican or oddsDecimal
 * @returns {Object} { oddsDecimal, oddsAmerican }
 */
function calculateParlayOdds(legs) {
  if (!legs || legs.length === 0) {
    throw new Error('Parlay must have at least one leg');
  }

  if (legs.length === 1) {
    // Single leg parlay is just the leg odds
    const leg = legs[0];
    const oddsDecimal = leg.oddsDecimal || americanToDecimal(leg.oddsAmerican);
    const oddsAmerican = leg.oddsAmerican || decimalToAmerican(oddsDecimal);
    return { oddsDecimal, oddsAmerican };
  }

  // Multiply all decimal odds together
  let parlayDecimal = 1;
  for (const leg of legs) {
    const legDecimal = leg.oddsDecimal || americanToDecimal(leg.oddsAmerican);
    if (!legDecimal || legDecimal <= 0) {
      throw new Error(`Invalid odds for leg: ${leg.selection || 'unknown'}`);
    }
    parlayDecimal *= legDecimal;
  }

  // Convert to American odds
  const parlayAmerican = decimalToAmerican(parlayDecimal);

  return {
    oddsDecimal: Math.round(parlayDecimal * 10000) / 10000, // Round to 4 decimals
    oddsAmerican: Math.round(parlayAmerican)
  };
}

/**
 * Calculate parlay result from leg results
 * @param {Array} legs - Array of leg objects with result field
 * @returns {String} 'win', 'loss', 'push', or 'void'
 */
function calculateParlayResult(legs) {
  if (!legs || legs.length === 0) {
    return 'void';
  }

  // Check if any leg is void
  const voidLegs = legs.filter(leg => leg.result === 'void');
  if (voidLegs.length > 0) {
    return 'void';
  }

  // Check if any leg is a loss
  const lossLegs = legs.filter(leg => leg.result === 'loss');
  if (lossLegs.length > 0) {
    return 'loss';
  }

  // Check if any leg is a push
  const pushLegs = legs.filter(leg => leg.result === 'push');
  if (pushLegs.length > 0) {
    // If all legs push, parlay pushes
    if (pushLegs.length === legs.length) {
      return 'push';
    }
    // If some legs push, recalculate parlay with remaining legs
    // For now, treat as push (can be customized)
    return 'push';
  }

  // Check if all legs are wins
  const winLegs = legs.filter(leg => leg.result === 'win');
  if (winLegs.length === legs.length) {
    return 'win';
  }

  // If any leg is still pending, parlay is pending
  const pendingLegs = legs.filter(leg => leg.result === 'pending');
  if (pendingLegs.length > 0) {
    return 'pending';
  }

  // Default to loss if we can't determine
  return 'loss';
}

/**
 * Calculate parlay profit from result
 * @param {Object} parlay - Parlay pick object
 * @param {String} result - 'win', 'loss', 'push', 'void'
 * @returns {Object} { profitUnits, profitAmount }
 */
function calculateParlayProfit(parlay, result) {
  if (result === 'win') {
    // Profit = (oddsDecimal - 1) * unitsRisked
    const profitUnits = (parlay.oddsDecimal - 1) * parlay.unitsRisked;
    const profitAmount = Math.round(profitUnits * parlay.unitValueAtPost);
    return {
      profitUnits: Math.round(profitUnits * 100) / 100,
      profitAmount
    };
  } else if (result === 'push' || result === 'void') {
    // Push/void returns stake
    return {
      profitUnits: 0,
      profitAmount: 0
    };
  } else {
    // Loss
    return {
      profitUnits: -parlay.unitsRisked,
      profitAmount: -parlay.amountRisked
    };
  }
}

module.exports = {
  calculateParlayOdds,
  calculateParlayResult,
  calculateParlayProfit
};

