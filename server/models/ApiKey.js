const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * API Key Model
 * Phase D: API keys for public API access
 */

const apiKeySchema = new mongoose.Schema({
  // Key identifier
  keyName: { type: String, required: true, trim: true },
  
  // Hashed API key (for storage)
  keyHash: { type: String, required: true, unique: true, index: true },
  
  // API key prefix (first 8 chars for identification)
  keyPrefix: { type: String, required: true, index: true },
  
  // Owner
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ownerEmail: { type: String, trim: true },
  
  // Permissions
  permissions: {
    readPicks: { type: Boolean, default: true },
    readLeaderboards: { type: Boolean, default: true },
    readStats: { type: Boolean, default: true }
  },
  
  // Rate limiting
  rateLimit: {
    requestsPerMinute: { type: Number, default: 60 },
    requestsPerHour: { type: Number, default: 1000 },
    requestsPerDay: { type: Number, default: 10000 }
  },
  
  // Status
  isActive: { type: Boolean, default: true },
  lastUsedAt: { type: Date },
  usageCount: { type: Number, default: 0 },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  notes: { type: String, maxlength: 500 }
});

apiKeySchema.index({ keyHash: 1 });
apiKeySchema.index({ owner: 1 });
apiKeySchema.index({ isActive: 1 });

/**
 * Generate a new API key
 * @returns {String} API key (only shown once)
 */
apiKeySchema.statics.generateKey = function() {
  const randomBytes = crypto.randomBytes(32);
  return `lk_${randomBytes.toString('hex')}`; // lk = Lineup Key
};

/**
 * Hash an API key for storage
 * @param {String} key - API key
 * @returns {String} Hash
 */
apiKeySchema.statics.hashKey = function(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
};

/**
 * Create a new API key
 * @param {Object} data - Key data
 * @returns {Promise<Object>} { key, apiKeyDoc }
 */
apiKeySchema.statics.createKey = async function(data) {
  const key = this.generateKey();
  const keyHash = this.hashKey(key);
  const keyPrefix = key.substring(0, 8);
  
  const apiKey = new this({
    keyName: data.keyName,
    keyHash,
    keyPrefix,
    owner: data.owner,
    ownerEmail: data.ownerEmail,
    permissions: data.permissions || {},
    rateLimit: data.rateLimit || {},
    expiresAt: data.expiresAt,
    notes: data.notes
  });
  
  await apiKey.save();
  
  return { key, apiKey };
};

/**
 * Verify an API key
 * @param {String} key - API key to verify
 * @returns {Promise<Object|null>} API key document or null
 */
apiKeySchema.statics.verifyKey = async function(key) {
  const keyHash = this.hashKey(key);
  const apiKey = await this.findOne({ keyHash, isActive: true });
  
  if (!apiKey) {
    return null;
  }
  
  // Check expiration
  if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
    return null;
  }
  
  // Update usage
  apiKey.lastUsedAt = new Date();
  apiKey.usageCount = (apiKey.usageCount || 0) + 1;
  await apiKey.save();
  
  return apiKey;
};

module.exports = mongoose.model('ApiKey', apiKeySchema);

