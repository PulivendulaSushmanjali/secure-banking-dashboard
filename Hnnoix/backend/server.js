const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const config = require('./config/env');
const { getDb, closeDb } = require('./config/db');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();

// Initialize Database
getDb();

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Permissive for local demo assets and Google Fonts
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching origin
      if (!origin || origin === config.corsOrigin || origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173') {
        callback(null, true);
      } else {
        callback(null, true); // For development flexibility
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser with payload limit to prevent DoS attacks
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Apply rate limiter to API routes
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Secure Banking Authentication and Account Dashboard API',
    version: '1.0.0',
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/transactions', transactionRoutes);

// Optional: Serve frontend build in production if dist exists
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    }
  });
}

// 404 handler for unmapped routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`,
  });
});

// Centralized error handler
app.use(errorHandler);

// Start server if executed directly
if (require.main === module) {
  const server = app.listen(config.port, () => {
    const url = `http://localhost:${config.port}`;
    console.log(`
\x1b[36m======================================================================\x1b[0m
\x1b[1m\x1b[32m  FORTIS VAULT - SECURE BANKING APPLICATION IS READY\x1b[0m
\x1b[36m======================================================================\x1b[0m

  \x1b[1m➜  Localhost App:\x1b[0m   \x1b[1m\x1b[36m${url}\x1b[0m  \x1b[90m(Ctrl + Click to open in browser)\x1b[0m
  \x1b[1m➜  API Endpoint:\x1b[0m    \x1b[36m${url}/api/health\x1b[0m
  \x1b[1m➜  Environment:\x1b[0m     \x1b[33m${config.nodeEnv}\x1b[0m
  \x1b[1m➜  Two-Factor 2FA:\x1b[0m  \x1b[32mActive (Cryptographic 6-digit OTP)\x1b[0m

\x1b[36m======================================================================\x1b[0m
    `);
  });

  const shutdown = () => {
    logger.info('Shutting down server gracefully...');
    server.close(() => {
      closeDb();
      logger.info('Server and Database connections closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = app;
