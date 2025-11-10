const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Ledger Entry Model
 * Phase D: Immutable ledger for pick metadata hashes
 * 
 * This creates a tamper-proof audit trail by storing SHA256 hashes
 * of pick data at creation time. Can be extended to use AWS QLDB
 * or blockchain anchors in the future.
 */

const ledgerEntrySchema = new mongoose.Schema({
  // Resource being logged
  resourceType: {
    type: String,
    required: true,
    enum: ['Pick', 'PickEdit', 'PickGrade'],
    index: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  
  // Hash of the resource data
  hash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Previous hash (for chain verification)
  previousHash: {
    type: String,
    index: true
  },
  
  // Sequence number in the chain
  sequence: {
    type: Number,
    required: true,
    index: true
  },
  
  // Pick data snapshot (for verification)
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Metadata
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  
  // Creator info
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // Blockchain anchor (optional - for future integration)
  blockchainAnchor: {
    txId: String,
    blockNumber: Number,
    blockHash: String,
    anchorTime: Date,
    provider: String // e.g., 'ethereum', 'bitcoin', 'qldb'
  },
  
  // Verification proof
  proof: {
    type: String // Additional proof data
  }
});

// Index for chain verification
ledgerEntrySchema.index({ resourceType: 1, resourceId: 1, sequence: 1 });
ledgerEntrySchema.index({ timestamp: -1 });

/**
 * Generate hash from pick data
 * @param {Object} pickData - Pick data object
 * @returns {String} SHA256 hash
 */
ledgerEntrySchema.statics.generateHash = function(pickData) {
  // Create a canonical JSON string (sorted keys, no whitespace)
  const canonical = JSON.stringify(pickData, Object.keys(pickData).sort());
  return crypto.createHash('sha256').update(canonical).digest('hex');
};

/**
 * Create ledger entry for a pick
 * @param {Object} pick - Pick document
 * @param {String} action - Action type ('create', 'edit', 'grade')
 * @returns {Promise<Object>} Ledger entry
 */
ledgerEntrySchema.statics.createEntry = async function(pick, action = 'create') {
  // Get previous entry for this pick
  const previousEntry = await this.findOne({
    resourceType: 'Pick',
    resourceId: pick._id
  }).sort({ sequence: -1 });
  
  const sequence = previousEntry ? previousEntry.sequence + 1 : 1;
  
  // Create data snapshot
  const dataSnapshot = {
    pickId: pick._id.toString(),
    creatorId: pick.creator.toString(),
    sport: pick.sport,
    selection: pick.selection,
    betType: pick.betType,
    oddsAmerican: pick.oddsAmerican,
    oddsDecimal: pick.oddsDecimal,
    unitsRisked: pick.unitsRisked,
    amountRisked: pick.amountRisked,
    gameStartTime: pick.gameStartTime,
    createdAt: pick.createdAt,
    status: pick.status,
    result: pick.result,
    isVerified: pick.isVerified,
    action,
    timestamp: new Date()
  };
  
  // Generate hash
  const hash = this.generateHash(dataSnapshot);
  
  // Create entry
  const entry = new this({
    resourceType: 'Pick',
    resourceId: pick._id,
    hash,
    previousHash: previousEntry?.hash || null,
    sequence,
    data: dataSnapshot,
    timestamp: new Date(),
    creatorId: pick.creator
  });
  
  await entry.save();
  
  return entry;
};

/**
 * Verify ledger chain integrity
 * @param {String} resourceId - Resource ID to verify
 * @returns {Promise<Object>} Verification result
 */
ledgerEntrySchema.statics.verifyChain = async function(resourceId) {
  const entries = await this.find({
    resourceType: 'Pick',
    resourceId
  }).sort({ sequence: 1 });
  
  if (entries.length === 0) {
    return { valid: false, reason: 'No entries found' };
  }
  
  // Verify chain
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    
    // Verify hash matches data
    const expectedHash = this.generateHash(entry.data);
    if (entry.hash !== expectedHash) {
      return {
        valid: false,
        reason: `Hash mismatch at sequence ${entry.sequence}`,
        entry: entry._id
      };
    }
    
    // Verify previous hash (except first entry)
    if (i > 0) {
      const previousEntry = entries[i - 1];
      if (entry.previousHash !== previousEntry.hash) {
        return {
          valid: false,
          reason: `Previous hash mismatch at sequence ${entry.sequence}`,
          entry: entry._id
        };
      }
    }
  }
  
  return {
    valid: true,
    entryCount: entries.length,
    firstEntry: entries[0]._id,
    lastEntry: entries[entries.length - 1]._id
  };
};

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);

