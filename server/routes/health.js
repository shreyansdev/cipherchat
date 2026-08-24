import express from 'express';
import rateLimit from 'express-rate-limit';
import redisClient from '../config/redis.js';

const router = express.Router();

// Readiness rate limiter: 1000 req/min
const readinessLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  message: { status: 'unavailable', reason: 'rate-limit' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Liveness check
 * Always returns 200 { status: 'ok', uptime: process.uptime() }
 * No I/O, no middleware.
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
  });
});

/**
 * Readiness check
 * Returns 200 if Redis is reachable
 * Returns 503 if Redis ping fails or times out (1000ms)
 */
router.get('/ready', readinessLimiter, async (req, res) => {
  let timeoutId;
  try {
    const pingPromise = redisClient.ping();
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Timeout')), 1000);
    });

    await Promise.race([pingPromise, timeoutPromise]);
    
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    res.status(503).json({
      status: 'unavailable',
      reason: 'redis',
    });
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
});

export default router;
