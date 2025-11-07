const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  subscriber: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  startedAt: { type: Date, default: Date.now },
  currentPeriodEnd: { type: Date, required: true },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'canceled', 'expired'], default: 'active' },
});

subscriptionSchema.index({ subscriber: 1, plan: 1, status: 1 });
subscriptionSchema.index({ subscriber: 1, status: 1 });
subscriptionSchema.index({ creator: 1, status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 }); // For expiration checks
subscriptionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
