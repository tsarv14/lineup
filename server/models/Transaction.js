const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['subscription', 'oneoff', 'payout', 'refund'], required: true },
  amountCents: { type: Number, required: true },
  feeCents: { type: Number, default: 0 }, // platform fee
  stripePaymentId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

transactionSchema.index({ creator: 1, createdAt: -1 });
transactionSchema.index({ buyer: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });
transactionSchema.index({ stripePaymentId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
