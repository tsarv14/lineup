const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  capper: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 1000 },
  moderated: { type: Boolean, default: false },
  flaggedCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

reviewSchema.index({ capper: 1, createdAt: -1 });
reviewSchema.index({ user: 1, capper: 1 }, { unique: true }); // One review per user per capper

module.exports = mongoose.model('Review', reviewSchema);

