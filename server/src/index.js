require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const authRoutes = require('./routes/auth');
const requestRoutes = require('./routes/requests');
const auditRoutes = require('./routes/audit');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/audit', auditRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ── Database & Start ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

console.log('PORT:', PORT);
console.log('MONGODB_URI exists:', !!MONGODB_URI);

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set!');
  process.exit(1);
}

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
})
.catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});