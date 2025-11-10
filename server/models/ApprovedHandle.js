const mongoose = require('mongoose');

const approvedHandleSchema = new mongoose.Schema({
  handle: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Handle can only contain lowercase letters, numbers, and hyphens']
  },
  storefrontId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Storefront',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for fast lookups
approvedHandleSchema.index({ handle: 1 }, { unique: true });
approvedHandleSchema.index({ storefrontId: 1 });
approvedHandleSchema.index({ userId: 1 });

module.exports = mongoose.model('ApprovedHandle', approvedHandleSchema);

