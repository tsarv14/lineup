const mongoose = require('mongoose');

const creatorApplicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  handle: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Handle can only contain lowercase letters, numbers, and hyphens']
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  socialLinks: {
    twitter: String,
    instagram: String,
    website: String,
    tiktok: String,
    youtube: String
  },
  experience: {
    type: String,
    required: true,
    maxlength: 2000
  },
  whyCreator: {
    type: String,
    required: true,
    maxlength: 2000
  },
  sports: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    maxlength: 1000
  },
  rejectionReason: {
    type: String,
    maxlength: 500
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for handle uniqueness check (only for pending/approved)
creatorApplicationSchema.index({ handle: 1, status: 1 });
creatorApplicationSchema.index({ user: 1 });
creatorApplicationSchema.index({ status: 1 });
creatorApplicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CreatorApplication', creatorApplicationSchema);

