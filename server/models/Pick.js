const mongoose = require('mongoose');

const pickSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  storefront: { type: mongoose.Schema.Types.ObjectId, ref: 'Storefront', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, maxlength: 5000 },
  media: [{ url: String, type: { type: String, enum: ['image', 'video'] } }],
  sport: { type: String, trim: true },
  marketType: { 
    type: String, 
    enum: ['spread', 'moneyline', 'over-under', 'prop', 'parlay', 'other'],
    trim: true 
  },
  odds: { type: String, trim: true }, // e.g., "-110", "+150"
  stake: { type: String, trim: true }, // e.g., "1 unit", "2 units"
  result: { 
    type: String, 
    enum: ['pending', 'won', 'lost', 'pushed', 'void'], 
    default: 'pending' 
  },
  resolvedAt: { type: Date },
  isFree: { type: Boolean, default: false },
  plans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plan' }],
  oneOffPriceCents: { type: Number, min: 0 },
  eventDate: { type: Date },
  scheduledAt: { type: Date }, // when to publish
  publishedAt: { type: Date },
  unlockAt: { type: Date }, // when content becomes free/visible
  tags: [{ type: String, trim: true }],
  flaggedCount: { type: Number, default: 0 },
  moderated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

pickSchema.index({ storefront: 1, createdAt: -1 });
pickSchema.index({ creator: 1, createdAt: -1 });
pickSchema.index({ sport: 1 });
pickSchema.index({ isFree: 1 });
pickSchema.index({ publishedAt: 1 });
pickSchema.index({ result: 1 });

module.exports = mongoose.model('Pick', pickSchema);
