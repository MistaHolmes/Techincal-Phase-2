import dotenv from 'dotenv';
dotenv.config();

// Production URL of the DraftDock backend
const BE = (process.env.BE_URL || process.env.USER_BE_URL || 'https://draftdock-be.abhasbehera.in').replace(/\/$/, '');
// Production URL of the DraftDock frontend
const FE = (process.env.FE_URL || 'https://draftdock.abhasbehera.in').replace(/\/$/, '');

export const config = {
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  alertTo: process.env.ALERT_TO || '',

  // EC2 — comma-separated public IPs, e.g. EC2_INSTANCE_IPS=13.233.x.x
  ec2: {
    instanceIps: (process.env.EC2_INSTANCE_IPS || '').split(',').map(s => s.trim()).filter(Boolean),
  },

  // Postgres / NeonDB connection string (same as apps/backend/.env DATABASE_URL)
  neonDbUrl: (process.env.NEONDB_URL || process.env.DATABASE_URL || '').trim(),

  // Redis connection string (same as apps/backend/.env REDIS_URL)
  redisUrl: (process.env.REDIS_URL || '').trim(),

  // DraftDock service URLs
  urls: {
    be: BE,
    fe: FE,
  },

  // Dashboard port — use 4001 so it doesn't conflict with root monitoring on 4000
  dashboardPort: parseInt(process.env.DASHBOARD_PORT || '4001'),
  // How often to run checks (seconds). Default 90 min.
  checkIntervalSeconds: parseInt(process.env.CHECK_INTERVAL_SECONDS || '5400'),

  // Alert cooldown in ms (5 min)
  alertCooldownMs: 5 * 60 * 1000,
};
