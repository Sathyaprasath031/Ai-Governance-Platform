require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const modelRoutes = require('./routes/models');
const versionRoutes = require('./routes/versions');
const approvalRoutes = require('./routes/approvals');
const complianceRoutes = require('./routes/compliance');
const monitoringRoutes = require('./routes/monitoring');
const auditRoutes = require('./routes/audit');

const app = express();

app.use(express.json());

// CORS: localhost origins are always allowed (development).
// Extra production origins come from the CORS_ORIGINS env var (comma-separated).
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim().replace(/\/+$/, '')) // tolerate a trailing slash in the config
  .filter(Boolean);

console.log(`CORS origins enabled: ${allowedOrigins.join(', ') || '(none configured)'}`);

app.use(
  cors({
    origin: [
      ...allowedOrigins,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5180',
      'http://localhost:3000',
    ],
    credentials: true,
  })
);

const dbCheck = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database not connected. Check MONGODB_URI.' });
  }
  next();
};

app.use('/api/auth', dbCheck, authRoutes);
app.use('/api/models', dbCheck, modelRoutes);
app.use('/api/versions', dbCheck, versionRoutes);
app.use('/api/approvals', dbCheck, approvalRoutes);
app.use('/api/compliance', dbCheck, complianceRoutes);
app.use('/api/monitoring', dbCheck, monitoringRoutes);
app.use('/api/audit', dbCheck, auditRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ai-governance',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Root route: Express 404s on `/` by default, which reads as a broken deploy
// (and fails Render's default health check path of `/`).
app.get('/', (req, res) => {
  res.json({
    service: 'ai-governance-api',
    status: 'ok',
    health: '/api/health',
    endpoints: [
      '/api/auth',
      '/api/models',
      '/api/versions',
      '/api/approvals',
      '/api/compliance',
      '/api/monitoring',
      '/api/audit',
    ],
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Unknown routes get JSON instead of Express' HTML 404.
app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
});

// error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

// Fail fast rather than signing tokens with a known development secret.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET must be set in production. Refusing to start.');
  process.exit(1);
}

const PORT = parseInt(process.env.PORT) || 4010;
app.listen(PORT, () => console.log(`AI Governance backend running on port ${PORT}`));

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-governance', {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    console.error('Routes requiring the database will return 503 until it is reachable.');
  }
}
connectDB();
