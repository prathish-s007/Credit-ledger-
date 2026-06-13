/**
 * Digital Credit Ledger Management System — Express Server
 *
 * Production-ready setup with:
 *  - Helmet for HTTP security headers
 *  - Rate limiting on auth routes
 *  - Centralized error handling
 *  - 404 catch-all for unregistered routes
 *  - Structured environment variable usage
 */

import express     from 'express';
import cors        from 'cors';
import helmet      from 'helmet';
import dotenv      from 'dotenv';
import rateLimit   from 'express-rate-limit';

// Route imports
import authRoutes          from './routes/authRoutes.js';
import customerRoutes      from './routes/customerRoutes.js';
import productRoutes       from './routes/productRoutes.js';
import purchaseRoutes      from './routes/purchaseRoutes.js';
import paymentRoutes       from './routes/paymentRoutes.js';
import ledgerRoutes        from './routes/ledgerRoutes.js';
import dashboardRoutes     from './routes/dashboardRoutes.js';
import notificationRoutes  from './routes/notificationRoutes.js';
import customerPortalRoutes from './routes/customerPortalRoutes.js';
import settingsRoutes       from './routes/settingsRoutes.js';

// Middleware imports
import connectDB     from './config/db.js';
import notFound      from './middleware/notFound.js';
import errorHandler  from './middleware/errorHandler.js';

// ─── Load environment variables ────────────────────────────────────────────────
dotenv.config();

// ─── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ─── Create Express app ────────────────────────────────────────────────────────
const app = express();

// ─── Trusted proxy (required for rate limiter on Render/Heroku) ────────────────
app.set('trust proxy', 1);

// ─── Security headers via Helmet ───────────────────────────────────────────────
app.use(helmet({
  // Allow cross-origin requests for the frontend (CORS handles the rest)
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── CORS configuration ────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin '${origin}' is not allowed.`));
    }
  },
  credentials: true,
}));

// ─── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Rate limiting ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs:        parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max:             parseInt(process.env.RATE_LIMIT_MAX       || '20',     10), // max 20 attempts per window
  message: {
    status:  'error',
    message: 'Too many requests from this IP address. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
});

// Apply stricter rate limiting only to auth endpoints
app.use('/api/auth', authLimiter);

// ─── Application routes ────────────────────────────────────────────────────────
app.use('/api/auth',            authRoutes);
app.use('/api/customers',       customerRoutes);
app.use('/api/products',        productRoutes);
app.use('/api/purchases',       purchaseRoutes);
app.use('/api/payments',        paymentRoutes);
app.use('/api/ledgers',         ledgerRoutes);
app.use('/api/dashboard',       dashboardRoutes);
app.use('/api/notifications',   notificationRoutes);
app.use('/api/customer-portal', customerPortalRoutes);
app.use('/api/settings',        settingsRoutes);

// ─── Health check endpoint ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status:      'success',
    message:     'Digital Credit Ledger API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp:   new Date().toISOString(),
  });
});

// ─── 404 catch-all for unregistered routes ─────────────────────────────────────
app.use(notFound);

// ─── Centralized error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

// ─── Start server ──────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);
app.listen(PORT, () => {
  console.log(`\n✅  Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`🌐  Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log(`📡  API Health: http://localhost:${PORT}/api/health\n`);
});
