const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  verb: { type: String, required: true }, // e.g., 'created', 'purchased', 'subscribed', 'reviewed'
  objectType: { type: String, required: true }, // e.g., 'Pick', 'Plan', 'Subscription', 'Review'
  objectId: { type: mongoose.Schema.Types.ObjectId, required: true },
  data: { type: mongoose.Schema.Types.Mixed }, // JSON object for additional event data
  createdAt: { type: Date, default: Date.now }
});

eventSchema.index({ actor: 1, createdAt: -1 });
eventSchema.index({ objectType: 1, objectId: 1, createdAt: -1 });
eventSchema.index({ createdAt: -1 }); // For feed queries

module.exports = mongoose.model('Event', eventSchema);

