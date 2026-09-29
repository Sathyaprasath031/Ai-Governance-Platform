require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Model = require('./models/Model');
const ModelVersion = require('./models/ModelVersion');
const Approval = require('./models/Approval');
const Compliance = require('./models/Compliance');
const Monitoring = require('./models/Monitoring');
const Deployment = require('./models/Deployment');
const AuditLog = require('./models/AuditLog');
const { REQUIRED_COMPLIANCE, requiredApprovers } = require('./config');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-governance');
  console.log('Connected. Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Model.deleteMany({}),
    ModelVersion.deleteMany({}),
    Approval.deleteMany({}),
    Compliance.deleteMany({}),
    Monitoring.deleteMany({}),
    Deployment.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  const users = await User.create([
    { name: 'Ada Admin', email: 'admin@gov.io', password: 'password123', role: 'admin' },
    { name: 'Owen Owner', email: 'owner@gov.io', password: 'password123', role: 'model_owner' },
    { name: 'Rita Reviewer', email: 'reviewer@gov.io', password: 'password123', role: 'reviewer' },
    { name: 'Saul Auditor', email: 'auditor@gov.io', password: 'password123', role: 'auditor' },
    { name: 'Vera Viewer', email: 'viewer@gov.io', password: 'password123', role: 'viewer' },
  ]);
  const [admin, owner, reviewer, auditor] = users;

  const models = await Model.create([
    {
      name: 'Credit Risk Scorer',
      slug: 'credit-risk-scorer',
      description: 'Approves or declines loan applications using application + bureau data.',
      domain: 'credit_risk',
      riskTier: 'critical',
      intendedUse: 'Real-time approve/decline decisioning for unsecured personal loans.',
      regulated: true,
      owner: owner._id,
      ownerName: owner.name,
    },
    {
      name: 'Fraud Detector',
      slug: 'fraud-detector',
      description: 'Flags potentially fraudulent card transactions for analyst review.',
      domain: 'fraud',
      riskTier: 'high',
      intendedUse: 'Assist fraud analysts; a human confirms all account blocks.',
      regulated: true,
      owner: owner._id,
      ownerName: owner.name,
    },
    {
      name: 'Support Ticket Tagger',
      slug: 'support-ticket-tagger',
      description: 'Classifies inbound support tickets into product areas.',
      domain: 'nlp',
      riskTier: 'low',
      intendedUse: 'Internal routing of tickets; no customer-facing decisions.',
      owner: admin._id,
      ownerName: admin.name,
    },
  ]);

  const [credit, fraud, tagger] = models;

  // --- Credit Risk v2.1.0: deployed, fully governed -----------------------
  const creditV2 = await ModelVersion.create({
    model: credit._id,
    version: '2.1.0',
    changelog: 'Retrain with 2025Q2 data; switched to XGBoost with monotonic constraints.',
    trainingDataset: 'loan_applications_2019_2025 (12.4M rows)',
    algorithm: 'XGBoost',
    hyperparameters: { max_depth: 6, n_estimators: 800, learning_rate: 0.05 },
    metrics: { accuracy: 0.87, auc: 0.91 },
    fairness: [
      { metric: 'demographic_parity_difference', value: 0.03, threshold: 0.1, group: 'sex' },
      { metric: 'equal_opportunity_difference', value: 0.04, threshold: 0.1, group: 'race' },
    ],
    status: 'deployed',
    deployedAt: new Date(Date.now() - 86400000 * 21),
  });
  creditV2.baselineMetrics = creditV2.metrics;
  await creditV2.save();

  await Compliance.create({
    version: creditV2._id,
    items: REQUIRED_COMPLIANCE.critical.map((key) => ({
      key,
      status: 'complete',
      reference: 'DMS-2026-' + key.toUpperCase().slice(0, 4),
    })),
  });
  await Deployment.create({
    version: creditV2._id,
    model: credit._id,
    environment: 'production',
    deployedBy: admin._id,
    deployerName: admin.name,
  });

  // --- Credit Risk v2.2.0: pending review, one of two approvals done ------
  const creditV22 = await ModelVersion.create({
    model: credit._id,
    version: '2.2.0',
    changelog: 'Add alternative-data features; expected +1.2pt AUC.',
    trainingDataset: 'loan_applications_2019_2025 + open_banking_consents (14.9M rows)',
    algorithm: 'XGBoost',
    metrics: { accuracy: 0.878, auc: 0.922 },
    fairness: [
      { metric: 'demographic_parity_difference', value: 0.06, threshold: 0.1, group: 'sex' },
      { metric: 'equal_opportunity_difference', value: 0.12, threshold: 0.1, group: 'race' }, // FAILS
    ],
    status: 'pending_review',
  });
  const approval22 = await Approval.create({
    version: creditV22._id,
    model: credit._id,
    requestedBy: owner._id,
    riskTier: 'critical',
    requiredApprovals: requiredApprovers('critical'),
    approvals: [
      { reviewer: reviewer._id, reviewerName: reviewer.name, decision: 'approved', comment: 'Metrics look solid.', decidedAt: new Date() },
    ],
    status: 'pending',
  });
  creditV22.approvals = [approval22._id];
  await creditV22.save();
  await Compliance.create({
    version: creditV22._id,
    items: REQUIRED_COMPLIANCE.critical.map((key) => ({
      key,
      status: key === 'legal_signoff' ? 'pending' : 'complete',
    })),
  });

  // --- Fraud Detector v1.4.0: approved, awaiting deploy gate --------------
  const fraudV14 = await ModelVersion.create({
    model: fraud._id,
    version: '1.4.0',
    changelog: 'Graph features for mule-account detection.',
    trainingDataset: 'card_tx_2024_2026 (210M rows)',
    algorithm: 'LightGBM',
    metrics: { accuracy: 0.94, auc: 0.97 },
    fairness: [
      { metric: 'disparate_impact_ratio', value: 0.91, threshold: 0.8, group: 'age_band' },
    ],
    status: 'approved',
  });
  await Compliance.create({
    version: fraudV14._id,
    items: REQUIRED_COMPLIANCE.high.map((key) => ({
      key,
      status: key === 'security_review' ? 'pending' : 'complete',
    })),
  });

  // --- Support Tagger v0.3.0: draft ---------------------------------------
  await ModelVersion.create({
    model: tagger._id,
    version: '0.3.0',
    changelog: 'Switch to distilled transformer; halves latency.',
    trainingDataset: 'tickets_2025 (1.1M rows)',
    algorithm: 'DistilBERT',
    metrics: { accuracy: 0.89 },
    status: 'draft',
  });

  // --- Monitoring history for deployed credit model -----------------------
  const snaps = [
    { accuracy: 0.868, driftScore: 0.05, alert: 'none', d: 20 },
    { accuracy: 0.866, driftScore: 0.08, alert: 'none', d: 14 },
    { accuracy: 0.858, driftScore: 0.12, alert: 'none', d: 7 },
    { accuracy: 0.812, driftScore: 0.27, alert: 'accuracy_drop', d: 2 },
  ];
  await Monitoring.create(
    snaps.map((s) => ({
      version: creditV2._id,
      recordedAt: new Date(Date.now() - 86400000 * s.d),
      accuracy: s.accuracy,
      latencyMs: 85 + Math.round(Math.random() * 30),
      requestCount: 400000 + Math.round(Math.random() * 100000),
      driftScore: s.driftScore,
      alert: s.alert,
      note: s.alert === 'accuracy_drop' ? 'Accuracy below baseline - 5pt threshold' : '',
    }))
  );

  await AuditLog.create({
    actorName: 'system',
    action: 'seed.import',
    targetType: 'system',
    targetLabel: 'Demo dataset imported',
  });

  console.log('Seeded:');
  console.log('  users: admin@gov.io / owner@gov.io / reviewer@gov.io / auditor@gov.io / viewer@gov.io  (password123)');
  console.log('  models: Credit Risk Scorer (critical), Fraud Detector (high), Support Ticket Tagger (low)');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
