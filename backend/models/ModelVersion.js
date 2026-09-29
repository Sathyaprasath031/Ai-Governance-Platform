const mongoose = require('mongoose');
const { evalFairnessItem } = require('../config');

const evaluationSchema = new mongoose.Schema(
  {
    dataset: { type: String, required: true },
    metric: { type: String, required: true },
    value: { type: Number, required: true },
    threshold: { type: Number },
  },
  { _id: false }
);

const versionSchema = new mongoose.Schema(
  {
    model: { type: mongoose.Schema.Types.ObjectId, ref: 'Model', required: true },
    version: { type: String, required: true },
    changelog: { type: String, default: '' },
    trainingDataset: { type: String, default: '' },
    algorithm: { type: String, default: '' },
    hyperparameters: { type: mongoose.Schema.Types.Mixed, default: {} },
    evaluations: [evaluationSchema],
    metrics: {
      type: Map,
      of: Number,
      default: {},
    },
    fairness: [
      {
        metric: {
          type: String,
          enum: [
            'demographic_parity_difference',
            'equal_opportunity_difference',
            'equalized_odds_difference',
            'disparate_impact_ratio',
            'selection_rate_ratio',
          ],
        },
        value: { type: Number },
        threshold: { type: Number },
        passed: { type: Boolean, default: false },
        group: { type: String, default: '' },
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'pending_review', 'approved', 'rejected', 'deployed', 'deprecated', 'retired'],
      default: 'draft',
    },
    approvals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Approval' }],
    deployedAt: { type: Date },
    baselineMetrics: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

// Keep `passed` consistent with the configured fairness rules on every save.
versionSchema.pre('save', function (next) {
  (this.fairness || []).forEach((f) => {
    f.passed = evalFairnessItem(f.metric, f.value, f.threshold);
  });
  next();
});

versionSchema.index({ model: 1, version: 1 }, { unique: true });

module.exports = mongoose.model('ModelVersion', versionSchema);
