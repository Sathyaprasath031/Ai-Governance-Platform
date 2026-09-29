const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String, default: 'system' },
    action: { type: String, required: true }, // e.g. version.submit, approval.decide, model.create
    targetType: { type: String, required: true }, // model | version | approval | deployment | compliance | user
    targetId: { type: String, default: '' },
    targetLabel: { type: String, default: '' }, // human-readable, e.g. "fraud-scoring v2.1.0"
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

auditSchema.index({ createdAt: -1 });
auditSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('AuditLog', auditSchema);
