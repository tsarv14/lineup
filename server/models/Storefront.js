const mongoose = require('mongoose');

const storefrontSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  handle: { type: String, required: true, unique: true, trim: true, lowercase: true },
  displayName: { type: String, required: true, trim: true },
  description: { type: String, maxlength: 1000 },
  logoImage: { type: String },
  bannerImage: { type: String },
  aboutText: { type: String, maxlength: 2000 },
  aboutImage: { type: String },
  socialLinks: {
    twitter: String,
    instagram: String,
    website: String
  },
  sports: [{ type: String }], // Array of selected sports to display
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

storefrontSchema.index({ handle: 1 });
storefrontSchema.index({ owner: 1 });
storefrontSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Storefront', storefrontSchema);
