const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema(
  {
    version: { type: mongoose.Schema.Types.ObjectId, ref: 'ModelVersion', required: true },
    model: { type: mongoose.Schema.Types.ObjectId, ref: 'Model', required: true },
    environment: {
      type: String,
      enum: ['staging', 'production'],
      required: true,
    },
    deployedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deployerName: String,
    active: { type: Boolean, default: true },
    rollbackOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Deployment' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Deployment', deploymentSchema);
