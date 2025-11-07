const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 5000 },
  attachments: [{ url: String, type: { type: String, enum: ['image', 'video', 'file'] } }],
  readAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, readAt: 1 });

module.exports = mongoose.model('Message', messageSchema);

