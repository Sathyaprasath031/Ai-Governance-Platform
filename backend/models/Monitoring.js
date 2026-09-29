const mongoose = require('mongoose');

const monitoringSchema = new mongoose.Schema(
  {
    version: { type: mongoose.Schema.Types.ObjectId, ref: 'ModelVersion', required: true },
    recordedAt: { type: Date, default: Date.now },
    accuracy: { type: Number },
    latencyMs: { type: Number },
    requestCount: { type: Number, default: 0 },
    driftScore: { type: Number }, // 0..1, higher = more drift
    alert: { type: String, enum: ['none', 'accuracy_drop', 'data_drift'], default: 'none' },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

monitoringSchema.index({ version: 1, recordedAt: -1 });

module.exports = mongoose.model('Monitoring', monitoringSchema);
