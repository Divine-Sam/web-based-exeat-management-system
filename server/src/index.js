require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const mongoose = require('mongoose');
const path    = require('path');

const authRoutes       = require('./routes/auth');
const requestRoutes    = require('./routes/requests');
const auditRoutes      = require('./routes/audit');
const superadminRoutes = require('./routes/superadmin');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://web-based-exeat-management-system.vercel.app',
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/requests',   requestRoutes);
app.use('/api/audit',      auditRoutes);
app.use('/api/superadmin', superadminRoutes); // ✅ moved here after app is defined

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ── Database & Start ───────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
})
.catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});