const mongoose = require('mongoose');

const billingVariantSchema = new mongoose.Schema({
  interval: { type: String, enum: ['daily', 'weekly', 'two_weeks', 'monthly', 'yearly'], required: true },
  priceCents: { type: Number, required: true, min: 0 },
});

const planSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  storefront: { type: mongoose.Schema.Types.ObjectId, ref: 'Storefront', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, maxlength: 1000 },
  isFree: { type: Boolean, default: false },
  billingVariants: [billingVariantSchema],
  freeTrialDays: { type: Number, enum: [0, 1, 3, 7], default: 0 },
  promoCodes: [{
    code: { type: String, required: true, trim: true, uppercase: true },
    discountType: { type: String, enum: ['percent', 'dollar', 'free_trial'], required: true },
    discountValue: { type: Number, required: true, min: 0 }, // Percent (0-100), dollar amount in cents, or trial days
    singleUse: { type: Boolean, default: false },
    maxUses: { type: Number, default: null }, // null = unlimited
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null }, // null = never expires
    createdAt: { type: Date, default: Date.now }
  }],
  archived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

planSchema.index({ creator: 1, archived: 1 });
planSchema.index({ storefront: 1 });
planSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Plan', planSchema);
