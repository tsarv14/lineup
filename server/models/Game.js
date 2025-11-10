const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  // Canonical game ID from sports API provider
  gameId: { type: String, required: true, unique: true, index: true },
  
  // Provider information
  provider: { type: String, required: true }, // e.g., 'sportsdataio', 'theoddsapi', 'sportradar'
  providerGameId: { type: String, required: true }, // Original ID from provider
  
  // Game details
  sport: { type: String, required: true, trim: true },
  league: { type: String, required: true, trim: true },
  season: { type: String, trim: true }, // e.g., '2024-2025'
  seasonType: { type: String, trim: true }, // 'regular', 'playoffs', 'preseason'
  
  // Teams
  homeTeam: {
    id: String,
    name: String,
    abbreviation: String,
    logo: String
  },
  awayTeam: {
    id: String,
    name: String,
    abbreviation: String,
    logo: String
  },
  
  // Timing
  startTime: { type: Date, required: true, index: true },
  startTimeUTC: { type: Date },
  timezone: { type: String, default: 'UTC' },
  
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'delayed', 'postponed', 'cancelled', 'final', 'suspended'],
    default: 'scheduled',
    index: true
  },
  
  // Scores (updated as game progresses)
  score: {
    home: { type: Number, default: 0 },
    away: { type: Number, default: 0 },
    period: String, // e.g., 'Q4', 'OT', 'Final'
    updatedAt: Date
  },
  
  // Betting lines (snapshot at game start)
  openingLines: {
    moneyline: {
      home: Number,
      away: Number
    },
    spread: {
      home: Number,
      away: Number,
      line: Number // e.g., -5.5
    },
    total: {
      over: Number,
      under: Number,
      line: Number // e.g., 225.5
    }
  },
  
  // Closing lines (for CLV calculation)
  closingLines: {
    moneyline: {
      home: Number,
      away: Number
    },
    spread: {
      home: Number,
      away: Number,
      line: Number
    },
    total: {
      over: Number,
      under: Number,
      line: Number
    },
    updatedAt: Date
  },
  
  // Metadata from provider
  metadata: { type: mongoose.Schema.Types.Mixed },
  
  // Raw API response (for debugging/audit)
  rawProviderData: { type: mongoose.Schema.Types.Mixed },
  
  // Tracking
  lastFetchedAt: { type: Date, default: Date.now },
  fetchedCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for efficient queries
gameSchema.index({ sport: 1, startTime: 1 });
gameSchema.index({ league: 1, startTime: 1 });
gameSchema.index({ status: 1, startTime: 1 });
gameSchema.index({ provider: 1, providerGameId: 1 });

// Pre-save hook to update updatedAt
gameSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.fetchedCount = (this.fetchedCount || 0) + 1;
  next();
});

module.exports = mongoose.model('Game', gameSchema);

