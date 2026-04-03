require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Serve static HTML pages from admin/ root
app.use(express.static(path.join(__dirname, '..')));

// Export prisma for route files
app.locals.prisma = prisma;

// ── Mount API routes (no auth — admin panel is standalone) ───────────────────
app.use('/api/admin/stats', require('./routes/stats'));
app.use('/api/admin/content', require('./routes/content'));
app.use('/api/admin/users', require('./routes/users'));
app.use('/api/admin/analytics', require('./routes/analytics'));
app.use('/api/admin/check', require('./routes/admin-check'));

// Redirect root to dashboard
app.get('/', (req, res) => res.redirect('/dashboard.html'));

// ── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  🚀 Admin server running at http://localhost:${PORT}`);
  console.log(`  📄 Dashboard: http://localhost:${PORT}/dashboard.html\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = { prisma };
