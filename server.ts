import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// Load environment variables before database access
dotenv.config();

import { pool, db, checkDatabaseConnection } from './src/db/index.ts';
import { initializeDatabase } from './src/db/init.ts';
import { authMiddleware } from './server/middleware/auth.ts';
import { securityHeadersMiddleware } from './server/middleware/security.ts';
import { setupSocketIO } from './server/realtime/socket.ts';
import { centralizedErrorHandler } from './server/middleware/errorHandler.ts';
import authRoutes from './server/routes/authRoutes.ts';
import projectRoutes from './server/routes/projectRoutes.ts';
import transactionRoutes from './server/routes/transactionRoutes.ts';
import walletRoutes from './server/routes/walletRoutes.ts';
import ticketRoutes from './server/routes/ticketRoutes.ts';
import chatRoutes from './server/routes/chatRoutes.ts';
import userRoutes from './server/routes/userRoutes.ts';
import notificationRoutes from './server/routes/notificationRoutes.ts';
import dashboardRoutes from './server/routes/dashboardRoutes.ts';

async function startServer() {
  // Verify PostgreSQL database connection
  console.log('🔌 Connecting to PostgreSQL database (Single Source of Truth)...');
  const isDbConnected = await checkDatabaseConnection();
  if (isDbConnected) {
    // Initialize and verify database tables
    await initializeDatabase(pool);
    console.log('✅ PostgreSQL database connected and tables verified.');
  } else {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ FATAL ERROR: Cannot connect to PostgreSQL database in production environment.');
      process.exit(1);
    } else {
      console.warn('⚠️  [Notice] PostgreSQL database is not running or not reachable on 127.0.0.1:5432 / DATABASE_URL.');
      console.warn('💡 To enable backend database persistence in VS Code / Antigravity:');
      console.warn('   1. Run: docker compose up -d');
      console.warn('   2. Or set DATABASE_URL in .env (e.g. Supabase, Neon, or local Postgres)');
      console.warn('🚀 Dev server starting for frontend & UI testing...');
    }
  }

  const app = express();
  const httpServer = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize Socket.IO Real-time Synchronization Engine
  setupSocketIO(httpServer);

  // Global CORS Configuration (Restricted to trusted origins, Cloud Run, and Native Mobile clients)
  const allowedOriginPatterns = [
    /^http:\/\/localhost(:\d+)?$/,
    /^http:\/\/127\.0\.0\.1(:\d+)?$/,
    /^https:\/\/.*\.run\.app$/,
    /^https:\/\/.*\.lubpystudio\.vn$/,
  ];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. Flutter/React Native mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOriginPatterns.some(pattern => pattern.test(origin)) ||
        (process.env.APP_URL && origin === process.env.APP_URL);

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error(`CORS error: Origin ${origin} not allowed.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(securityHeadersMiddleware);
  app.use(authMiddleware);

  // Serve generated and static project assets
  app.use('/src/assets/images', express.static(path.join(process.cwd(), 'src', 'assets', 'images')));
  app.use('/assets/images', express.static(path.join(process.cwd(), 'src', 'assets', 'images')));

  // Health check endpoint
  app.get(['/api/health', '/api/v1/health'], (req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        service: 'LUBPY STUDIO Full-Stack & Mobile Sync Backend',
        timestamp: new Date().toISOString(),
        database: 'PostgreSQL Active',
        realtime: 'Socket.IO Engine Active',
        version: '1.0.0',
      },
      message: 'Hệ thống LUBPY Studio hoạt động bình thường.',
    });
  });

  // API v1 Versioned Routes (Primary Mobile-ready & Web REST API endpoints)
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/projects', projectRoutes);
  app.use('/api/v1/transactions', transactionRoutes);
  app.use('/api/v1/wallet', walletRoutes);
  app.use('/api/v1/tickets', ticketRoutes);
  app.use('/api/v1/chat', chatRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/dashboard', dashboardRoutes);

  // Mount API modules (Legacy /api routes for seamless backwards compatibility)
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/tickets', ticketRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // Legacy aliases
  app.use('/api/financial-summary', (req, res, next) => {
    req.url = '/summary';
    transactionRoutes(req, res, next);
  });
  app.use('/api/interviews', (req, res, next) => {
    req.url = '/interviews';
    userRoutes(req, res, next);
  });

  // Centralized Error Handling for API routes
  app.use('/api/*', centralizedErrorHandler);

  // Vite Middleware for Frontend Client SPA
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LUBPY Studio Full-Stack Server & Socket.IO running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
