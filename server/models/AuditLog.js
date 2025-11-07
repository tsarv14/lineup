const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true }, // e.g., 'user.login', 'pick.create', 'subscription.purchase'
  resourceType: { type: String }, // e.g., 'User', 'Pick', 'Subscription'
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  metadata: { type: mongoose.Schema.Types.Mixed }, // JSON object for additional data
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
});

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

