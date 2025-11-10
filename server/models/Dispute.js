const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  // Pick being disputed
  pick: { type: mongoose.Schema.Types.ObjectId, ref: 'Pick', required: true },
  
  // Subscriber who filed dispute
  subscriber: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Creator whose pick is disputed
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Dispute details
  reason: { type: String, required: true, maxlength: 1000 },
  description: { type: String, maxlength: 5000 },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'dismissed'],
    default: 'pending'
  },
  
  // Resolution
  resolution: {
    type: String,
    enum: ['refund', 'credit', 'pick_corrected', 'dispute_dismissed', null],
    default: null
  },
  resolutionNotes: { type: String, maxlength: 2000 },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  
  // Refund/Credit details
  refundAmount: { type: Number, min: 0 }, // In cents
  creditAmount: { type: Number, min: 0 }, // In cents
  
  // Admin review
  adminNotes: { type: String, maxlength: 2000 },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  
  // Tracking
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

disputeSchema.index({ pick: 1 });
disputeSchema.index({ subscriber: 1 });
disputeSchema.index({ creator: 1 });
disputeSchema.index({ status: 1 });
disputeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Dispute', disputeSchema);

