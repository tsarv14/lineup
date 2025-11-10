const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  bio: { type: String, maxlength: 500 },
  avatar: { type: String, default: '' },

  // Roles: subscriber by default; creator can access storefront, plans, picks
  // admin: full access; moderator: content moderation access
  roles: {
    type: [String],
    enum: ['subscriber', 'creator', 'admin', 'moderator'],
    default: ['subscriber']
  },

  // Creator-related fields
  storefront: { type: mongoose.Schema.Types.ObjectId, ref: 'Storefront' },
  stripeAccountId: { type: String },
  unitValueDefault: { type: Number, min: 0 }, // Default $ per unit for creators (nullable)

  // Compliance & KYC fields
  country: { type: String, trim: true },
  dateOfBirth: { type: Date },
  dobVerified: { type: Boolean, default: false },
  kycStatus: { 
    type: String, 
    enum: ['none', 'pending', 'verified', 'failed'], 
    default: 'none' 
  },
  kycProviderId: { type: String }, // ID from KYC provider (Veriff, Onfido, etc.)
  taxInfoSubmitted: { type: Boolean, default: false },
  taxFormId: { type: String }, // Reference to tax form document

  connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  connectionRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  
  // Subscription & Purchase Tracking
  purchasedPicks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pick' }],
  
  // Account Status
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'banned', 'pending_verification'],
    default: 'active'
  },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Analytics
  totalSpent: { type: Number, default: 0 }, // in cents
  totalEarned: { type: Number, default: 0 }, // for creators, in cents
  
  // Creator Application
  creatorApplicationStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  creatorApplicationDate: Date,
  creatorApplicationNotes: String,
  
  // Preferences
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false },
    preferredSports: [{ type: String }],
    currency: { type: String, default: 'USD' }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  return userObject;
};

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ roles: 1 });
userSchema.index({ accountStatus: 1 });
userSchema.index({ creatorApplicationStatus: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);

