const mongoose = require('mongoose');

const pickSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  storefront: { type: mongoose.Schema.Types.ObjectId, ref: 'Storefront', required: true },
  
  // Legacy fields (kept for backward compatibility)
  title: { type: String, trim: true },
  description: { type: String, maxlength: 5000 },
  media: [{ url: String, type: { type: String, enum: ['image', 'video'] } }],
  isFree: { type: Boolean, default: false },
  plans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plan' }],
  oneOffPriceCents: { type: Number, min: 0 },
  scheduledAt: { type: Date },
  publishedAt: { type: Date },
  unlockAt: { type: Date },
  tags: [{ type: String, trim: true }],
  flaggedCount: { type: Number, default: 0 },
  moderated: { type: Boolean, default: false },
  
  // Phase A: Structured pick fields
  sport: { type: String, required: true, trim: true },
  league: { type: String, trim: true },
  gameId: { type: String, trim: true }, // Optional in Phase A, required in Phase B
  gameText: { type: String, trim: true }, // For Phase A manual entry
  selection: { type: String, required: true, trim: true }, // e.g., "Lakers -5.5"
  betType: { 
    type: String, 
    enum: ['moneyline', 'spread', 'total', 'prop', 'parlay', 'other'],
    required: true
  },
  oddsAmerican: { type: Number, required: true }, // e.g., -110, +135
  oddsDecimal: { type: Number, required: true }, // Computed from American odds
  
  // Parlay system: if betType is 'parlay', this contains the legs
  isParlay: { type: Boolean, default: false },
  parlayLegs: [{
    // Each leg is a structured pick
    sport: { type: String, required: true },
    league: { type: String },
    gameId: { type: String },
    gameText: { type: String },
    selection: { type: String, required: true }, // e.g., "Lakers -5.5"
    betType: { 
      type: String, 
      enum: ['moneyline', 'spread', 'total', 'prop', 'other'],
      required: true
    },
    oddsAmerican: { type: Number, required: true },
    oddsDecimal: { type: Number, required: true },
    gameStartTime: { type: Date, required: true },
    // Leg result (set during grading)
    result: { 
      type: String, 
      enum: ['pending', 'win', 'loss', 'push', 'void'], 
      default: 'pending' 
    },
    // Reference to original pick if leg was created from existing pick
    originalPickId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pick' }
  }],
  // Parlay-specific fields
  parlayResult: { 
    type: String, 
    enum: ['pending', 'win', 'loss', 'push', 'void'], 
    default: 'pending' 
  }, // Overall parlay result
  
  // Unit system
  unitsRisked: { type: Number, required: true, min: 0 },
  amountRisked: { type: Number, required: true, min: 0 }, // USD in cents
  unitValueAtPost: { type: Number, required: true, min: 0 }, // Snapshot at creation time
  
  // Timestamps and locking
  createdAt: { type: Date, default: Date.now },
  postedAtTimezone: { type: String, default: 'UTC' },
  gameStartTime: { type: Date, required: true },
  
  // Status and results
  status: { 
    type: String, 
    enum: ['pending', 'locked', 'graded', 'disputed'], 
    default: 'pending' 
  },
  result: { 
    type: String, 
    enum: ['pending', 'win', 'loss', 'push', 'void'], 
    default: 'pending' 
  },
  resolvedAt: { type: Date },
  
  // Profit tracking
  profitUnits: { type: Number, default: 0 },
  profitAmount: { type: Number, default: 0 }, // USD in cents
  
  // Verification (Phase A)
  isVerified: { type: Boolean, default: false },
  verificationSource: { 
    type: String, 
    enum: ['manual', 'system', 'api'], 
    default: 'system' 
  },
  
  // Phase B fields (prepared but not used yet)
  apiOddsAtPost: { type: mongoose.Schema.Types.Mixed },
  closingOdds: { type: mongoose.Schema.Types.Mixed },
  verificationEvidence: { type: mongoose.Schema.Types.Mixed },
  clvScore: { type: Number },
  
  // Flagging and moderation
  flagged: { type: Boolean, default: false },
  flags: [{ 
    reason: String,
    flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    flaggedAt: { type: Date, default: Date.now }
  }],
  
  // Edit history (audit trail)
  editHistory: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    changedAt: { type: Date, default: Date.now },
    reason: String,
    isAdminEdit: { type: Boolean, default: false }
  }],
  
  // Optional write-up
  writeUp: { type: String, maxlength: 5000 },
  
  // Metadata for future use
  metadata: { type: mongoose.Schema.Types.Mixed },
  
  updatedAt: { type: Date, default: Date.now }
});

pickSchema.index({ storefront: 1, createdAt: -1 });
pickSchema.index({ creator: 1, createdAt: -1 });
pickSchema.index({ sport: 1 });
pickSchema.index({ isFree: 1 });
pickSchema.index({ publishedAt: 1 });
pickSchema.index({ result: 1 });
pickSchema.index({ gameStartTime: 1 });
pickSchema.index({ status: 1 });
pickSchema.index({ isVerified: 1 });
pickSchema.index({ flagged: 1 });
pickSchema.index({ gameId: 1 }); // For Phase B

// Pre-save hook: Auto-lock picks at gameStartTime
pickSchema.pre('save', function(next) {
  const now = new Date();
  const gameStart = new Date(this.gameStartTime);
  
  // Auto-update status to 'locked' if game has started
  if (this.status === 'pending' && now >= gameStart) {
    this.status = 'locked';
  }
  
  // Update verification status if pick was created before game start
  if (this.isNew && this.createdAt < gameStart) {
    this.isVerified = true;
    this.verificationSource = 'system';
  }
  
  next();
});

module.exports = mongoose.model('Pick', pickSchema);
