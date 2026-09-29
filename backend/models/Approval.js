const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema(
  {
    version: { type: mongoose.Schema.Types.ObjectId, ref: 'ModelVersion', required: true },
    model: { type: mongoose.Schema.Types.ObjectId, ref: 'Model', required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    riskTier: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    requiredApprovals: { type: Number, default: 1 },
    approvals: [
      {
        reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        reviewerName: String,
        decision: { type: String, enum: ['approved', 'rejected'], required: true },
        comment: { type: String, default: '' },
        decidedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    decidedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Approval', approvalSchema);
