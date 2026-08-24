import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import healthRoutes from '../../server/routes/health.js';
import redisClient from '../../server/config/redis.js';

// Mock redis
vi.mock('../../server/config/redis.js', () => ({
  default: {
    ping: vi.fn(),
  },
}));

const app = express();
app.use('/', healthRoutes);

describe('Health Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /health', () => {
    it('always returns 200 { status: "ok", uptime: ... }', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(typeof response.body.uptime).toBe('number');
    });

    it('returns 200 even if Redis is down', async () => {
      vi.mocked(redisClient.ping).mockRejectedValue(new Error('Redis down'));
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    });
  });

  describe('GET /ready', () => {
    it('returns 200 if Redis is reachable', async () => {
      vi.mocked(redisClient.ping).mockResolvedValue('PONG');
      const response = await request(app).get('/ready');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });

    it('returns 503 if Redis ping fails', async () => {
      vi.mocked(redisClient.ping).mockRejectedValue(new Error('Connection failed'));
      const response = await request(app).get('/ready');
      expect(response.status).toBe(503);
      expect(response.body.status).toBe('unavailable');
      expect(response.body.reason).toBe('redis');
    });

    it('returns 503 if Redis ping times out', async () => {
      // Use real timers for this one or a different approach because advanceTimersByTime
      // can be tricky with supertest.
      // Actually, we can just mock redis.ping to take longer than 1s.
      vi.mocked(redisClient.ping).mockReturnValue(new Promise((resolve) => setTimeout(resolve, 2000)));
      
      const response = await request(app).get('/ready');
      expect(response.status).toBe(503);
      expect(response.body.status).toBe('unavailable');
      expect(response.body.reason).toBe('redis');
    });
  });
});
