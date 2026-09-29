import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import logger from './lib/logger.js';
import redisClient, { connectRedis } from './config/redis.js';
import { setupSocketHandlers, closeSocketServices } from './config/socket.js';
import roomRoutes from './routes/rooms.js';
import fileRoutes from './routes/files.js';
import healthRoutes from './routes/health.js';

// Load environment variables
dotenv.config();

// Global Exception Handlers
process.on('uncaughtException', (err) => {
  logger.fatal(err, 'Uncaught Exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled Rejection');
  process.exit(1);
});

const app = express();
const httpServer = createServer(app);

// Enable trust proxy for correct IP detection behind nginx/load balancers
app.set('trust proxy', 1);

// Health check and readiness endpoints (unauthenticated, no general rate limit)
app.use('/', healthRoutes);

// Structured Request Logging
app.use(pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => ['/health', '/ready'].includes(req.url),
  },
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
}));

const rawOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
].filter(Boolean).map((origin) => origin.trim());

const allowedOrigins = [...new Set(rawOrigins)];

const corsOriginHandler = (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
};

// Socket.IO setup with CORS and transport security
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket'], // Use only WebSockets for transport security and performance
  maxHttpBufferSize: 1e6, // 1MB limit for file uploads/messages
  perMessageDeflate: false, // Disable deflation for CPU efficiency at scale
  pingInterval: 25000, // Heartbeat frequency (25s)
  pingTimeout: 5000,   // Fail connection if no response in 5s (clean up dead sockets quickly)
  allowEIO3: false,    // Reject insecure Engine.IO v3 clients
});

// HTTP Security Headers
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    connectSrc: ["'self'", ...allowedOrigins],
    imgSrc: ["'self'", 'data:', ...allowedOrigins],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    upgradeInsecureRequests: [],
  },
}));
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}));

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const roomCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.ROOM_CREATION_MAX_REQUESTS) || (process.env.NODE_ENV === 'test' ? 50 : 15),
  message: { error: 'Too many room creations, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors({
  origin: corsOriginHandler,
  credentials: true,
}));
app.use(express.json());

// API Routes with rate limiting
app.use('/api/rooms/create', roomCreationLimiter);
app.use('/api/rooms', apiLimiter, roomRoutes);
app.use('/api/files', apiLimiter, fileRoutes);

export { app, httpServer, io };

// Start server
const PORT = process.env.PORT || 3001;

export const startServer = async () => {
  try {
    // Connect to Redis
    await connectRedis();
    
    // Setup Socket.IO event handlers after Redis is connected
    await setupSocketHandlers(io);
    
    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info({
        event: 'server_started',
        port: PORT,
        nodeEnv: process.env.NODE_ENV || 'development',
      }, 'CipherChat Server Started');
    });
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
};

// Handle graceful shutdown
let isShuttingDown = false;

export const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ event: 'shutdown_initiated', signal }, `Received ${signal}, starting graceful shutdown`);

  // 10-second hard timeout
  const hardTimeout = setTimeout(() => {
    logger.warn({ event: 'shutdown_timeout' }, 'Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 10000);
  hardTimeout.unref();

  try {
    // a. Stop accepting new HTTP connections
    httpServer.close((err) => {
      if (err) {
        logger.error(err, 'Error closing HTTP server');
      }
    });

    // Get active connections N before closing io
    const connectionsClosed = io.sockets.sockets.size;

    // b. Close Socket.IO server (sends disconnect to all clients)
    io.close();

    // c. Wait for in-flight Redis commands (closeSocketServices and redisClient.quit wait for commands)
    await closeSocketServices();

    // d. Close Redis connection
    await redisClient.quit();

    // e. Log: { event: 'graceful_shutdown', signal, connectionsClosed: N }
    logger.info({ event: 'graceful_shutdown', signal, connectionsClosed });

    // Clear timeout
    clearTimeout(hardTimeout);

    // f. Exit with code 0
    process.exit(0);
  } catch (error) {
    logger.error(error, 'Error during graceful shutdown');
    process.exit(1);
  }
};

// Listen for SIGTERM and SIGINT
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
