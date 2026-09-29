const mongoose = require('mongoose');

const complianceItemSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      enum: [
        'model_card',
        'datasheet',
        'bias_assessment',
        'security_review',
        'human_oversight',
        'legal_signoff',
        'incident_response_plan',
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ['missing', 'pending', 'complete'],
      default: 'missing',
    },
    reference: { type: String, default: '' }, // link or doc ID
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const complianceSchema = new mongoose.Schema(
  {
    version: { type: mongoose.Schema.Types.ObjectId, ref: 'ModelVersion', required: true },
    items: [complianceItemSchema],
  },
  { timestamps: true }
);

complianceSchema.index({ version: 1 }, { unique: true });

module.exports = mongoose.model('Compliance', complianceSchema);
