/**
 * Utility functions for odds conversion
 */

/**
 * Convert American odds to decimal odds
 * @param {number} americanOdds - American odds (e.g., -110, +135)
 * @returns {number} Decimal odds
 */
function americanToDecimal(americanOdds) {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
}

/**
 * Convert decimal odds to American odds
 * @param {number} decimalOdds - Decimal odds (e.g., 1.91, 2.35)
 * @returns {number} American odds
 */
function decimalToAmerican(decimalOdds) {
  if (decimalOdds >= 2) {
    return Math.round((decimalOdds - 1) * 100);
  } else {
    return Math.round(-100 / (decimalOdds - 1));
  }
}

/**
 * Validate American odds are in reasonable range
 * @param {number} americanOdds - American odds
 * @returns {boolean} True if valid
 */
function isValidAmericanOdds(americanOdds) {
  // Typical range: -10000 to +10000
  return americanOdds >= -10000 && americanOdds <= 10000 && americanOdds !== 0;
}

/**
 * Calculate profit from a winning bet
 * @param {number} unitsRisked - Units risked
 * @param {number} unitValue - Value per unit in USD cents
 * @param {number} decimalOdds - Decimal odds
 * @returns {object} { profitUnits, profitAmount }
 */
function calculateProfit(unitsRisked, unitValue, decimalOdds) {
  const profitUnits = unitsRisked * (decimalOdds - 1);
  const profitAmount = Math.round(profitUnits * unitValue);
  return { profitUnits, profitAmount };
}

module.exports = {
  americanToDecimal,
  decimalToAmerican,
  isValidAmericanOdds,
  calculateProfit
};

